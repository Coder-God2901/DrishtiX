// Dashboard Components Index
// Professional UI components for DrishtiX Predictive Crowd Safety Platform

// Existing components - now with GCP real-time integration
export { PredictionTimeline } from './PredictionTimeline';
export { HotspotMap } from './HotspotMap';
export { AlertPanel } from './AlertPanel';
export { ResponderStatus } from './ResponderStatus';
export { VideoFeedGrid } from './VideoFeedGrid';
export { TrafficOverlay } from './TrafficOverlay';

// New GCP-integrated components
export { SocialSentimentPanel } from './SocialSentimentPanel';
export { ServiceHealthDashboard } from './ServiceHealthDashboard';

// Type exports
export type { PredictionDataPoint } from './PredictionTimeline';

// GCP Real-time hook exports
export { useGCPRealtime } from '@/hooks/useGCPRealtime';
export type {
  UseGCPRealtimeOptions,
  UseGCPRealtimeReturn,
  RealtimePrediction,
  RealtimeVideoFrame,
  RealtimeSocialSignal,
  RealtimeAnomaly,
  RealtimeAlert,
  RealtimeIncident,
  RealtimeResponderUpdate,
} from '@/hooks/useGCPRealtime';
