import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  theme: 'light' | 'dark' | 'system';
  commandPaletteOpen: boolean;
  notificationsPanelOpen: boolean;
  isOnline: boolean;
}

interface UIActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentView: (view: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  toggleNotificationsPanel: () => void;
  setOnlineStatus: (online: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        sidebarOpen: true,
        currentView: 'landing',
        theme: 'system',
        commandPaletteOpen: false,
        notificationsPanelOpen: false,
        isOnline: true,

        // Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setCurrentView: (view) => set({ currentView: view }),
        setTheme: (theme) => set({ theme }),
        setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
        toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
        setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
        toggleNotificationsPanel: () => set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
        setOnlineStatus: (online) => set({ isOnline: online }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
