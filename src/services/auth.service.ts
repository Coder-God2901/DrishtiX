import { apiClient } from '@/lib/api-client';
import type { User, RegisterData } from '@/store/useAuthStore';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface LoginResponse {
  success: boolean;
  requiresMfa?: boolean;
  mfaMethod?: string;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    token: string;
  };
}

class AuthServiceClass {
  private socket: Socket | null = null;

  async login(email: string, password: string, mfaCode?: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
      mfaCode,
    });

    // Store token if login successful
    if (response && response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
      this.connectSocket();
    }

    return response;
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/oauth/google', {
      idToken,
    });

    if (response && response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
      this.connectSocket();
    }

    return response;
  }

  /**
   * Login with Facebook OAuth
   */
  async loginWithFacebook(accessToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/oauth/facebook', {
      accessToken,
    });

    if (response && response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
      this.connectSocket();
    }

    return response;
  }

  /**
   * Login with GitHub OAuth
   */
  async loginWithGithub(accessToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/oauth/github', {
      accessToken,
    });

    if (response && response.success && response.data) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
      this.connectSocket();
    }

    return response;
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    this.clearAuth();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh');
      if (response && response.success && response.data?.token) {
        this.setToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
      if (response && response.success && response.data) {
        this.setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  forgotPassword = async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  };

  resetPassword = async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  };

  verifyEmail = async (token: string): Promise<void> => {
    await apiClient.post('/auth/verify-email', { token });
  };

  // MFA Management
  async setupMFA(): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const response = await apiClient.post<{ success: boolean; data: { secret: string; qrCode: string; backupCodes: string[] }; error?: string }>('/auth/mfa/setup');
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error(response?.error || 'Failed to setup MFA');
  }

  async enableMFA(code: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>('/auth/mfa/enable', { code });
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to enable MFA');
    }

    // Update local user object
    const user = this.getUser();
    if (user) {
      user.mfaEnabled = true;
      this.setUser(user);
    }
  }

  async disableMFA(password: string): Promise<void> {
    const response = await apiClient.post<{ success: boolean; error?: string }>('/auth/mfa/disable', { password });
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to disable MFA');
    }

    // Update local user object
    const user = this.getUser();
    if (user) {
      user.mfaEnabled = false;
      this.setUser(user);
    }
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    // Token will be automatically added by apiClient interceptors
  }

  getUser(): User | null {
    const userJson = localStorage.getItem('auth_user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Failed to parse user from storage:', error);
        return null;
      }
    }
    return null;
  }

  setUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Token will be automatically removed by apiClient interceptors

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.roles?.includes(r));
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
  }

  // Socket.IO management
  getSocket(): Socket | null {
    if (!this.socket && this.getToken()) {
      this.connectSocket();
    }
    return this.socket;
  }

  private connectSocket(): void {
    if (this.socket?.connected) return;

    const token = this.getToken();
    if (!token) return;

    this.socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });
  }
}

export const authService = new AuthServiceClass();

// Token will be automatically added by apiClient interceptors on each request
