export const CLIENT_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? window.location.origin,
  features: {
    maps: true,
    charts: true,
    voice: true,
    venueEditor: true,
  },
}
