import { apiClient } from '@/lib/api-client';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  pressure: number;
  condition: string;
  description: string;
  icon: string;
  alerts?: WeatherAlert[];
  heatIndex?: number;
  heatStressLevel?: 'NONE' | 'CAUTION' | 'EXTREME_CAUTION' | 'DANGER' | 'EXTREME_DANGER';
}

interface WeatherAlert {
  event: string;
  severity: string;
  description: string;
  start: Date;
  end: Date;
}

interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
}

interface UVData {
  uv: number;
  uvMax: number;
  uvMaxTime: string;
  safeExposureTime: number;
  ozone: number;
}

interface WeatherImpact {
  overallImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impacts: Array<{
    factor: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

interface SafetyRecommendations {
  level: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
  recommendations: string[];
  heatStress: string;
  hydrationAdvice: string;
  restrictions?: string[];
}

class WeatherService {
  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number, eventId?: string): Promise<WeatherData> {
    const response = await apiClient.get<{ success: boolean; data: WeatherData }>(
      `/weather/current?lat=${lat}&lon=${lon}${eventId ? `&eventId=${eventId}` : ''}`
    );
    return response.data;
  }

  /**
   * Get weather forecast
   */
  async getForecast(lat: number, lon: number, hours: number = 24): Promise<WeatherForecast[]> {
    const response = await apiClient.get<{ success: boolean; data: WeatherForecast[] }>(
      `/weather/forecast?lat=${lat}&lon=${lon}&hours=${hours}`
    );
    return response.data;
  }

  /**
   * Get UV index data
   */
  async getUVData(lat: number, lon: number): Promise<UVData> {
    const response = await apiClient.get<{ success: boolean; data: UVData }>(
      `/weather/uv?lat=${lat}&lon=${lon}`
    );
    return response.data;
  }

  /**
   * Start weather monitoring for an event
   */
  async startMonitoring(eventId: string, location: { lat: number; lon: number }): Promise<void> {
    await apiClient.post('/weather/monitor/start', {
      eventId,
      location,
    });
  }

  /**
   * Stop weather monitoring
   */
  async stopMonitoring(eventId: string): Promise<void> {
    await apiClient.post('/weather/monitor/stop', { eventId });
  }

  /**
   * Get weather impact analysis
   */
  async getWeatherImpact(eventId: string): Promise<WeatherImpact> {
    const response = await apiClient.get<{ success: boolean; data: WeatherImpact }>(
      `/weather/impact?eventId=${eventId}`
    );
    return response.data;
  }

  /**
   * Get safety recommendations
   */
  async getSafetyRecommendations(
    lat: number,
    lon: number,
    eventId?: string
  ): Promise<SafetyRecommendations> {
    const response = await apiClient.get<{ success: boolean; data: SafetyRecommendations }>(
      `/weather/safety?lat=${lat}&lon=${lon}${eventId ? `&eventId=${eventId}` : ''}`
    );
    return response.data;
  }
}

export const weatherService = new WeatherService();
export type {
  WeatherData,
  WeatherAlert,
  WeatherForecast,
  UVData,
  WeatherImpact,
  SafetyRecommendations,
};
