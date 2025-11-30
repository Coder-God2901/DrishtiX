/**
 * Weather Service - OpenWeatherMap Integration
 * Real-time weather data for ML predictions and dashboard display
 */

import axios from 'axios';
import { pubSubService } from './pubsub.service';
import { bigQueryAnalyticsService } from './bigquery-analytics.service';
import { io } from '../index';

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees
  condition: string; // Clear, Clouds, Rain, etc.
  description: string; // detailed description
  cloudiness: number; // percentage
  visibility: number; // meters
  uvIndex?: number;
  dewPoint?: number;
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
}

export interface WeatherForecast {
  time: Date;
  temperature: number;
  condition: string;
  rainProbability: number;
  windSpeed: number;
}

export interface HeatStressIndex {
  value: number; // 0-1 scale
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  recommendation: string;
}

class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheDuration = 10 * 60 * 1000; // 10 minutes
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[Weather Service] API key not configured. Set OPENWEATHER_API_KEY environment variable.');
    }
  }

  /**
   * Start real-time weather monitoring for an event
   */
  async startMonitoring(eventId: string, location: { lat: number; lon: number; name: string }): Promise<void> {
    console.log(`[Weather Service] Starting monitoring for event ${eventId} at ${location.name}`);

    // Initial fetch
    await this.fetchAndPublishWeather(eventId, location);

    // Update every 10 minutes
    this.updateInterval = setInterval(async () => {
      await this.fetchAndPublishWeather(eventId, location);
    }, this.cacheDuration);

    console.log(`✓ Weather monitoring active for event ${eventId}`);
  }

  /**
   * Stop weather monitoring
   */
  stopMonitoring(eventId: string): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
      console.log(`[Weather Service] Monitoring stopped for event ${eventId}`);
    }
  }

  /**
   * Get current weather data
   */
  async getCurrentWeather(lat: number, lon: number, locationName?: string): Promise<WeatherData> {
    const cacheKey = `${lat},${lon}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      if (!this.apiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric', // Celsius
        },
        timeout: 10000,
      });

      const data = response.data;

      const weatherData: WeatherData = {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        cloudiness: data.clouds.all,
        visibility: data.visibility,
        timestamp: new Date(data.dt * 1000),
        location: {
          lat,
          lon,
          name: locationName || data.name,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error) {
      console.error('[Weather Service] Error fetching weather:', error);

      // Return cached data even if expired, or throw error
      if (cached) {
        console.warn('[Weather Service] Using expired cache data');
        return cached.data;
      }

      throw new Error(`Failed to fetch weather data: ${error}`);
    }
  }

  /**
   * Get weather forecast (3-hour intervals, 5 days)
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
        },
        timeout: 10000,
      });

      return response.data.list.map((item: any) => ({
        time: new Date(item.dt * 1000),
        temperature: item.main.temp,
        condition: item.weather[0].main,
        rainProbability: item.pop * 100, // probability of precipitation
        windSpeed: item.wind.speed,
      }));
    } catch (error) {
      console.error('[Weather Service] Error fetching forecast:', error);
      throw new Error(`Failed to fetch weather forecast: ${error}`);
    }
  }

  /**
   * Get UV Index data
   */
  async getUVIndex(lat: number, lon: number): Promise<number> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/uvi`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
        },
        timeout: 10000,
      });

      return response.data.value;
    } catch (error) {
      console.error('[Weather Service] Error fetching UV index:', error);
      return 0; // Default to 0 if unavailable
    }
  }

  /**
   * Calculate Heat Stress Index
   * Combines temperature, humidity, and solar radiation
   */
  calculateHeatStressIndex(weather: WeatherData, uvIndex: number = 0): HeatStressIndex {
    const { temperature, humidity } = weather;

    // Heat index calculation (simplified)
    let heatIndex = temperature;

    if (temperature >= 27) {
      // Rothfusz regression
      const T = temperature;
      const RH = humidity;

      heatIndex = -8.78469475556 +
        1.61139411 * T +
        2.33854883889 * RH +
        -0.14611605 * T * RH +
        -0.012308094 * T * T +
        -0.0164248277778 * RH * RH +
        0.002211732 * T * T * RH +
        0.00072546 * T * RH * RH +
        -0.000003582 * T * T * RH * RH;
    }

    // Add UV impact (0-11+ scale)
    const uvImpact = uvIndex * 0.5; // UV contributes up to 5.5°C equivalent
    const effectiveTemp = heatIndex + uvImpact;

    // Normalize to 0-1 scale (assuming max dangerous temp is 50°C)
    const normalizedIndex = Math.min(effectiveTemp / 50, 1);

    // Determine level
    let level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
    let recommendation: string;

    if (normalizedIndex < 0.4) {
      level = 'LOW';
      recommendation = 'Comfortable conditions for outdoor activities.';
    } else if (normalizedIndex < 0.6) {
      level = 'MODERATE';
      recommendation = 'Stay hydrated. Take breaks in shade.';
    } else if (normalizedIndex < 0.8) {
      level = 'HIGH';
      recommendation = 'Heat stress possible. Provide cooling stations and water.';
    } else {
      level = 'EXTREME';
      recommendation = 'DANGER: Extreme heat stress risk. Consider event postponement.';
    }

    return {
      value: normalizedIndex,
      level,
      recommendation,
    };
  }

  /**
   * Fetch weather and publish to Pub/Sub, WebSocket, and BigQuery
   */
  private async fetchAndPublishWeather(
    eventId: string,
    location: { lat: number; lon: number; name: string }
  ): Promise<void> {
    try {
      const weather = await this.getCurrentWeather(location.lat, location.lon, location.name);
      const uvIndex = await this.getUVIndex(location.lat, location.lon);
      const heatStress = this.calculateHeatStressIndex(weather, uvIndex);

      const weatherData = {
        ...weather,
        uvIndex,
        heatStressIndex: heatStress.value,
        heatStressLevel: heatStress.level,
      };

      // Publish to Pub/Sub for ML and dashboard
      await pubSubService.publishMessage('weather-updates', {
        eventId,
        weather: weatherData,
        timestamp: new Date().toISOString(),
      });

      // Stream to BigQuery for historical analytics
      await bigQueryAnalyticsService.streamWeatherData({
        eventId,
        timestamp: new Date(),
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        weatherCondition: weather.condition,
        heatIndex: heatStress.value,
        heatStressLevel: heatStress.level,
      });

      // Broadcast to WebSocket clients in real-time
      io.to(`event:${eventId}`).emit('weather:update', weatherData);
      io.to(`weather:${eventId}`).emit('weather:data', weatherData);

      console.log(`[Weather Service] Published weather update for ${location.name}: ${weather.temperature}°C, ${weather.condition}`);
    } catch (error) {
      console.error('[Weather Service] Error in fetch and publish:', error);
    }
  }

  /**
   * Get weather impact on crowd behavior
   */
  getWeatherImpact(weather: WeatherData): {
    crowdMultiplier: number;
    alertLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  } {
    const factors: string[] = [];
    let multiplier = 1.0;
    let alertLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';

    // Extreme heat
    if (weather.temperature > 35) {
      multiplier *= 0.7; // People seek shelter
      factors.push('Extreme heat - reduced attendance expected');
      alertLevel = 'HIGH';
    } else if (weather.temperature > 30) {
      multiplier *= 0.85;
      factors.push('High temperature - medical risk increased');
      alertLevel = 'MEDIUM';
    }

    // Cold weather
    if (weather.temperature < 5) {
      multiplier *= 0.8;
      factors.push('Cold weather - reduced attendance');
      alertLevel = 'MEDIUM';
    }

    // Rain
    if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
      multiplier *= 0.6;
      factors.push('Rain - significant attendance drop expected');
      alertLevel = 'HIGH';
    }

    // High wind
    if (weather.windSpeed > 10) {
      multiplier *= 0.9;
      factors.push('High winds - structural safety concern');
      alertLevel = 'MEDIUM';
    }

    // Poor visibility
    if (weather.visibility < 1000) {
      factors.push('Low visibility - navigation issues');
      alertLevel = alertLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
    }

    return {
      crowdMultiplier: multiplier,
      alertLevel,
      factors,
    };
  }

  /**
   * Check if weather conditions are safe for event
   */
  isWeatherSafe(weather: WeatherData, uvIndex: number): {
    safe: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let safe = true;

    // Extreme temperature
    if (weather.temperature > 40) {
      safe = false;
      warnings.push('CRITICAL: Extreme heat danger');
      recommendations.push('Consider postponing event or adding extensive cooling facilities');
    } else if (weather.temperature < 0) {
      safe = false;
      warnings.push('CRITICAL: Freezing temperatures');
      recommendations.push('Ensure adequate heating and shelter');
    }

    // Severe weather
    if (weather.condition === 'Thunderstorm') {
      safe = false;
      warnings.push('CRITICAL: Thunderstorm - lightning danger');
      recommendations.push('Evacuate outdoor areas immediately');
    }

    // High winds
    if (weather.windSpeed > 15) {
      safe = false;
      warnings.push('CRITICAL: Dangerous wind speeds');
      recommendations.push('Secure all temporary structures');
    }

    // UV radiation
    if (uvIndex >= 8) {
      warnings.push('WARNING: Very high UV radiation');
      recommendations.push('Provide shade and sunscreen stations');
    }

    // Heat stress
    const heatStress = this.calculateHeatStressIndex(weather, uvIndex);
    if (heatStress.level === 'EXTREME') {
      warnings.push('WARNING: Extreme heat stress risk');
      recommendations.push(heatStress.recommendation);
    }

    return { safe, warnings, recommendations };
  }
}

export const weatherService = new WeatherService();
