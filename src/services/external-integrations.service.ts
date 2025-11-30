import { apiClient } from '@/lib/api-client';

// Weather API Integration
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  precipitation: number;
  visibility: number;
  uvIndex: number;
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  event: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  description: string;
  start: Date;
  end: Date;
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  description: string;
  icon: string;
  precipitationChance: number;
}

// Calendar Integration
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  source: 'google' | 'outlook' | 'internal';
}

// Webhook Configuration
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  service: 'slack' | 'teams' | 'discord' | 'custom';
  events: string[];
  active: boolean;
  secret?: string;
}

// Cloud Storage
export interface StorageFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  provider: 'aws-s3' | 'azure-blob' | 'google-cloud' | 'local';
}

export const externalIntegrationsService = {
  // Weather API
  async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        precipitation: data.rain?.['1h'] || 0,
        visibility: data.visibility,
        uvIndex: 0, // Requires separate API call
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  },

  async getWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<WeatherForecast[]> {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Group by day and get daily forecast
      const dailyForecasts: WeatherForecast[] = [];
      const grouped = new Map<string, any[]>();

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!grouped.has(date)) {
          grouped.set(date, []);
        }
        grouped.get(date)!.push(item);
      });

      Array.from(grouped.entries()).slice(0, days).forEach(([date, items]) => {
        const temps = items.map(i => i.main.temp);
        dailyForecasts.push({
          date: new Date(date),
          high: Math.max(...temps),
          low: Math.min(...temps),
          description: items[0].weather[0].description,
          icon: items[0].weather[0].icon,
          precipitationChance: items[0].pop * 100,
        });
      });

      return dailyForecasts;
    } catch (error) {
      console.error('Weather forecast error:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  },

  async getWeatherAlerts(
    latitude: number,
    longitude: number
  ): Promise<WeatherAlert[]> {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&exclude=current,minutely,hourly,daily`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return (data.alerts || []).map((alert: any) => ({
        event: alert.event,
        severity: alert.tags?.[0] || 'moderate',
        description: alert.description,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
      }));
    } catch (error) {
      console.error('Weather alerts error:', error);
      return [];
    }
  },

  // Calendar Integration
  async syncGoogleCalendar(
    accessToken: string,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent[]> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.summary,
        description: item.description,
        start: new Date(item.start.dateTime || item.start.date),
        end: new Date(item.end.dateTime || item.end.date),
        location: item.location,
        attendees: item.attendees?.map((a: any) => a.email),
        source: 'google' as const,
      }));
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      throw new Error('Failed to sync Google Calendar');
    }
  },

  async createGoogleCalendarEvent(
    accessToken: string,
    event: Omit<CalendarEvent, 'id' | 'source'>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start.toISOString() },
          end: { dateTime: event.end.toISOString() },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
        }),
      });
      const data = await response.json();

      return {
        id: data.id,
        title: data.summary,
        description: data.description,
        start: new Date(data.start.dateTime),
        end: new Date(data.end.dateTime),
        location: data.location,
        attendees: data.attendees?.map((a: any) => a.email),
        source: 'google',
      };
    } catch (error) {
      console.error('Create Google Calendar event error:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  },

  // Webhook Management
  async sendWebhook(
    webhookUrl: string,
    payload: any,
    service: 'slack' | 'teams' | 'discord' | 'custom' = 'custom'
  ): Promise<void> {
    let formattedPayload = payload;

    // Format for specific services
    if (service === 'slack') {
      formattedPayload = {
        text: payload.text || payload.message,
        blocks: payload.blocks,
        attachments: payload.attachments,
      };
    } else if (service === 'teams') {
      formattedPayload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        summary: payload.summary || payload.title,
        sections: payload.sections || [{ text: payload.text || payload.message }],
      };
    } else if (service === 'discord') {
      formattedPayload = {
        content: payload.content || payload.message,
        embeds: payload.embeds,
      };
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedPayload),
      });
    } catch (error) {
      console.error('Webhook send error:', error);
      throw new Error('Failed to send webhook');
    }
  },

  async getWebhooks(): Promise<WebhookConfig[]> {
    const response = await apiClient.get<WebhookConfig[]>('/integrations/webhooks');
    return response;
  },

  async createWebhook(config: Omit<WebhookConfig, 'id'>): Promise<WebhookConfig> {
    const response = await apiClient.post<WebhookConfig>('/integrations/webhooks', config);
    return response;
  },

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> {
    const response = await apiClient.patch<WebhookConfig>(`/integrations/webhooks/${id}`, updates);
    return response;
  },

  async deleteWebhook(id: string): Promise<void> {
    await apiClient.delete(`/integrations/webhooks/${id}`);
  },

  async testWebhook(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>(`/integrations/webhooks/${id}/test`);
      return response.success;
    } catch (error) {
      return false;
    }
  },

  // Cloud Storage
  async uploadToCloud(
    file: File,
    path: string,
    provider: 'aws-s3' | 'azure-blob' | 'google-cloud' = 'aws-s3'
  ): Promise<StorageFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    formData.append('provider', provider);

    const response = await apiClient.post<StorageFile>('/integrations/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  async listCloudFiles(path: string = '/', provider?: string): Promise<StorageFile[]> {
    const response = await apiClient.get<StorageFile[]>('/integrations/storage/list', {
      params: { path, provider },
    });
    return response;
  },

  async deleteCloudFile(fileId: string): Promise<void> {
    await apiClient.delete(`/integrations/storage/${fileId}`);
  },

  async getCloudFileUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/integrations/storage/${fileId}/url`, {
      params: { expiresIn },
    });
    return response.url;
  },
};
