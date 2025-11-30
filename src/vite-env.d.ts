/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;

  // Google Cloud Platform
  readonly VITE_GOOGLE_CLOUD_PROJECT_ID: string;
  readonly VITE_GCP_PROJECT_ID: string;

  // Google Maps & Earth Engine
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
  readonly VITE_GOOGLE_STREET_VIEW_API_KEY: string;
  readonly VITE_EARTH_ENGINE_ENABLED: string;

  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Third-Party APIs
  readonly VITE_WAZE_API_KEY: string;

  // Google Cloud Services
  readonly VITE_PUBSUB_TOPIC: string;
  readonly VITE_ENABLE_PUBSUB: string;
  readonly VITE_CLOUD_RUN_ENDPOINT: string;
  readonly VITE_VERTEX_AI_VISION_ENDPOINT: string;
  readonly VITE_VERTEX_AI_FORECASTING_ENDPOINT: string;
  readonly VITE_VERTEX_AI_AGENT_ENDPOINT: string;
  readonly VITE_VERTEX_AI_AGENT_ID: string;
  readonly VITE_GCP_ACCESS_TOKEN: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ENABLE_GEMINI_SUMMARIES: string;
  readonly VITE_GEMINI_VISION_ENABLED: string;

  // Analytics & Monitoring
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ANALYTICS_ID: string;

  // Feature Flags
  readonly VITE_ENABLE_WEBSOCKET: string;
  readonly VITE_ENABLE_GEOLOCATION: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_ENABLE_PREDICTIVE_ANALYTICS: string;
  readonly VITE_ENABLE_SYNTHETIC_FEEDS: string;
  readonly VITE_ENABLE_SOCIAL_MONITORING: string;
  readonly VITE_ENABLE_AUTOMATED_ROUTING: string;
  readonly VITE_ENABLE_VIDEO_ANALYTICS: string;
  readonly VITE_ENABLE_TRAFFIC_FEEDS: string;
  readonly VITE_ENABLE_AGENT_ORCHESTRATION: string;
  readonly VITE_ENABLE_GEMINI_SUMMARIES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
