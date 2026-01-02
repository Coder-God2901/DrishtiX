/**
 * Weather Service
 * Provides weather data and climate monitoring for events
 */

import { APIResponse, apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

// Type alias for convenience
type ApiResponse<T> = APIResponse<T>;

// ==================== Types & Interfaces ====================

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: string;
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number;
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  conditionDescription: string;
  timestamp: string | Date;
}

export interface WeatherForecast {
  datetime: string | Date;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  precipitation: {
    probability: number; // percentage
    amount?: number; // mm
  };
  wind: {
    speed: number;
    direction: string;
    gusts?: number;
  };
  humidity: number;
  condition: WeatherData['condition'];
  conditionDescription: string;
  uvIndex: number;
}

export interface WeatherAlert {
  id: string;
  type: 'heat' | 'cold' | 'storm' | 'rain' | 'wind' | 'fog' | 'uv';
  severity: 'watch' | 'warning' | 'critical';
  title: string;
  description: string;
  startTime: string | Date;
  endTime: string | Date;
  recommendations: string[];
}

export interface ClimateMonitoring {
  heatIndex: number;
  dewPoint: number;
  airQuality?: {
    index: number;
    level: 'good' | 'moderate' | 'unhealthy' | 'hazardous';
    pollutants?: string[];
  };
  alerts: WeatherAlert[];
  safetyRecommendations: string[];
}

// ==================== Weather Service ====================

class WeatherService {
  /**
   * Get current weather for event location
   */
  async getCurrentWeather(eventId?: string): Promise<ApiResponse<WeatherData>> {
    const endpoint = eventId
      ? `${API_ENDPOINTS.weather.current}?eventId=${eventId}`
      : API_ENDPOINTS.weather.current;

    return await apiClient.get<WeatherData>(endpoint);
  }

  /**
   * Get weather forecast
   */
  async getForecast(
    eventId?: string,
    days: number = 7
  ): Promise<ApiResponse<WeatherForecast[]>> {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    params.append('days', days.toString());

    return await apiClient.get<WeatherForecast[]>(
      `${API_ENDPOINTS.weather.forecast}?${params.toString()}`
    );
  }

  /**
   * Get weather by coordinates
   */
  async getWeatherByCoordinates(
    lat: number,
    lng: number
  ): Promise<ApiResponse<WeatherData>> {
    return await apiClient.get<WeatherData>(
      `${API_ENDPOINTS.weather.current}?lat=${lat}&lng=${lng}`
    );
  }

  /**
   * Get hourly weather forecast
   */
  async getHourlyForecast(
    eventId?: string,
    hours: number = 24
  ): Promise<ApiResponse<WeatherForecast[]>> {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    params.append('hours', hours.toString());

    return await apiClient.get<WeatherForecast[]>(
      `/weather/hourly?${params.toString()}`
    );
  }

  /**
   * Get weather alerts
   */
  async getAlerts(eventId?: string): Promise<ApiResponse<WeatherAlert[]>> {
    const endpoint = eventId
      ? `/weather/alerts?eventId=${eventId}`
      : '/weather/alerts';

    return await apiClient.get<WeatherAlert[]>(endpoint);
  }

  /**
   * Get climate monitoring data
   */
  async getClimateMonitoring(eventId?: string): Promise<ApiResponse<ClimateMonitoring>> {
    const endpoint = eventId
      ? `/weather/climate?eventId=${eventId}`
      : '/weather/climate';

    return await apiClient.get<ClimateMonitoring>(endpoint);
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(
    eventId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<WeatherData[]>> {
    return await apiClient.get<WeatherData[]>(
      `/weather/historical?eventId=${eventId}&startDate=${startDate}&endDate=${endDate}`
    );
  }

  /**
   * Check if weather conditions are safe for event
   */
  async checkSafety(eventId: string): Promise<ApiResponse<{
    isSafe: boolean;
    concerns: string[];
    recommendations: string[];
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  }>> {
    return await apiClient.get(
      `/weather/safety-check?eventId=${eventId}`
    );
  }

  /**
   * Get weather-based recommendations
   */
  async getRecommendations(eventId: string): Promise<ApiResponse<{
    category: string;
    recommendations: string[];
    priority: 'low' | 'medium' | 'high';
  }[]>> {
    return await apiClient.get(
      `/weather/recommendations?eventId=${eventId}`
    );
  }

  /**
   * Subscribe to weather updates
   */
  async subscribeToUpdates(
    eventId: string,
    email?: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.post(
      '/weather/subscribe',
      { eventId, email }
    );
  }

  /**
   * Get weather impact analysis on crowd behavior
   */
  async getWeatherImpactAnalysis(eventId: string): Promise<ApiResponse<{
    temperature: {
      impact: 'positive' | 'neutral' | 'negative';
      crowdBehavior: string;
    };
    precipitation: {
      impact: 'positive' | 'neutral' | 'negative';
      crowdBehavior: string;
    };
    overallImpact: {
      rating: number; // 1-10
      description: string;
      suggestions: string[];
    };
  }>> {
    return await apiClient.get(
      `/weather/impact-analysis?eventId=${eventId}`
    );
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
