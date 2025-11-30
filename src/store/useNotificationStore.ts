import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  sound: boolean;
  vibration: boolean;
  criticalOnly: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    immer((set) => ({
      notifications: [],
      unreadCount: 0,
      preferences: {
        inApp: true,
        push: true,
        email: true,
        sms: false,
        sound: true,
        vibration: true,
        criticalOnly: false,
      },

      addNotification: (notification) => {
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString() + Math.random(),
            timestamp: Date.now(),
            read: false,
          };

          state.notifications.unshift(newNotification);
          state.unreadCount += 1;

          // Keep only last 100 notifications
          if (state.notifications.length > 100) {
            state.notifications = state.notifications.slice(0, 100);
          }
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      },

      markAllAsRead: () => {
        set((state) => {
          state.notifications.forEach(n => n.read = true);
          state.unreadCount = 0;
        });
      },

      deleteNotification: (id) => {
        set((state) => {
          const index = state.notifications.findIndex(n => n.id === id);
          if (index !== -1) {
            const wasUnread = !state.notifications[index].read;
            state.notifications.splice(index, 1);
            if (wasUnread) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          }
        });
      },

      clearAll: () => {
        set((state) => {
          state.notifications = [];
          state.unreadCount = 0;
        });
      },

      updatePreferences: (prefs) => {
        set((state) => {
          state.preferences = { ...state.preferences, ...prefs };
        });
      },
    })),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
);
