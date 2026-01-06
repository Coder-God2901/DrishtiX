/**
 * API Client
 * Core HTTP client for making API requests with error handling
 */

import { API_CONFIG } from '../config/api.config';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  public setToken(token: string, refreshToken?: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  public clearToken(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAuthToken(): Promise<void> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        if (data.success && data.data?.token) {
          this.setToken(data.data.token, data.data.refreshToken);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (error) {
        // Clear tokens on refresh failure and redirect to login
        this.clearToken();
        window.location.href = '/login';
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAuthToken();
        // Retry the original request with new token
        const retryResponse = await fetch(response.url, {
          method: response.redirected ? 'GET' : 'POST',
          headers: this.getHeaders(),
        });
        response = retryResponse;
      } catch (error) {
        // Token refresh failed, let it propagate
        console.error('Token refresh failed:', error);
      }
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new APIError(
        data?.error || data?.message || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  }

  public async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<APIResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  public async post<T = any>(
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  public async put<T = any>(
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  public async patch<T = any>(
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  public async delete<T = any>(endpoint: string): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new APIClient();
