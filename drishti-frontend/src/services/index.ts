/**
 * Services Index
 * Central export point for all services
 */

// Core services
export * from './api.client';
export * from './websocket.service';

// Feature services
export * from './event.service';
export * from './incident.service';
export * from './alert.service';
export { dispatchService, type Team, type DispatchAssignment } from './dispatch.service';
export * from './prediction.service';
export * from './navigation.service';
export * from './help.service';

// New services (Phase 1)
export { volunteerService, type Volunteer, type VolunteerTask, type VolunteerStats } from './volunteer.service';
export { recommendationService, type AIRecommendation } from './recommendation.service';
export * from './analytics.service';
export * from './camera.service';
export * from './ticket.service';
