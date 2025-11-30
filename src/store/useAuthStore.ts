import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/lib/api-client';
import { socketClient } from '@/lib/socket-client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled?: boolean; // Added for MFA support
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  loginWithGithub: (accessToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              user: User;
              token: string;
              refreshToken: string;
            };
          }>('/auth/login', { email, password });

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            // Connect Socket.IO after successful login
            socketClient.connect();
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              user: User;
              token: string;
              refreshToken: string;
            };
          }>('/auth/oauth/google', { idToken });

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            socketClient.connect();
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Google login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithFacebook: async (accessToken: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              user: User;
              token: string;
              refreshToken: string;
            };
          }>('/auth/oauth/facebook', { accessToken });

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            socketClient.connect();
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Facebook login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGithub: async (accessToken: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              user: User;
              token: string;
              refreshToken: string;
            };
          }>('/auth/oauth/github', { accessToken });

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            socketClient.connect();
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'GitHub login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: {
              user: User;
              token: string;
              refreshToken: string;
            };
          }>('/auth/register', data);

          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            // Connect Socket.IO after successful registration
            socketClient.connect();
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Disconnect Socket.IO
        socketClient.disconnect();

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await apiClient.post<{
            success: boolean;
            data: { token: string };
          }>('/auth/refresh', { refreshToken });

          if (response.success && response.data) {
            set({ token: response.data.token });
          } else {
            throw new Error('Failed to refresh token');
          }
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...userData };
          }
        });
      },

      clearError: () => {
        set({ error: null });
      },
    })),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
