/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

export const API_CONFIG = {
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api',
  wsURL: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    verify: '/auth/verify',
    refresh: '/auth/refresh',
  },

  // Events
  events: {
    list: '/events',
    get: (id: string) => `/events/${id}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    active: '/events/active',
    metrics: (id: string) => `/events/${id}/metrics`,
    heatmap: (id: string) => `/events/${id}/heatmap`,
  },

  // Incidents
  incidents: {
    list: '/incidents',
    get: (id: string) => `/incidents/${id}`,
    create: '/incidents',
    update: (id: string) => `/incidents/${id}`,
    delete: (id: string) => `/incidents/${id}`,
    byEvent: (eventId: string) => `/incidents?eventId=${eventId}`,
    assign: (id: string) => `/incidents/${id}/assign`,
    resolve: (id: string) => `/incidents/${id}/resolve`,
  },

  // Alerts
  alerts: {
    list: '/alerts',
    get: (id: string) => `/alerts/${id}`,
    create: '/alerts',
    update: (id: string) => `/alerts/${id}`,
    delete: (id: string) => `/alerts/${id}`,
    byEvent: (eventId: string) => `/alerts?eventId=${eventId}`,
    dismiss: (id: string) => `/alerts/${id}/dismiss`,
  },

  // Predictions
  predictions: {
    list: '/predictions',
    get: (id: string) => `/predictions/${id}`,
    crowdDensity: (eventId: string) => `/predictions/crowd-density/${eventId}`,
    riskAnalysis: (eventId: string) => `/predictions/risk-analysis/${eventId}`,
  },

  // Attendees
  attendees: {
    list: '/attendees',
    get: (id: string) => `/attendees/${id}`,
    checkIn: '/attendees/check-in',
    profile: '/attendees/profile',
    tickets: '/attendees/tickets',
    help: '/attendees/help',
  },

  // Responders
  responders: {
    list: '/responders',
    get: (id: string) => `/responders/${id}`,
    create: '/responders',
    update: (id: string) => `/responders/${id}`,
    available: '/responders/available',
    assign: (id: string) => `/responders/${id}/assign`,
  },

  // Dispatch
  dispatch: {
    teams: '/dispatch/teams',
    volunteers: '/dispatch/volunteers',
    assign: '/dispatch/assign',
    status: '/dispatch/status',
  },

  // Navigation
  navigation: {
    route: '/navigation/route',
    accessible: '/navigation/accessible',
    emergency: '/navigation/emergency',
    waypoints: '/navigation/waypoints',
  },

  // Help
  help: {
    request: '/help/request',
    faq: '/help/faq',
    chat: '/help/chat',
    emergency: '/help/emergency',
  },

  // Volunteers
  volunteers: {
    list: '/volunteers',
    get: (id: string) => `/volunteers/${id}`,
    byEvent: (eventId: string) => `/volunteers/event/${eventId}`,
    create: '/volunteers',
    update: (id: string) => `/volunteers/${id}`,
    delete: (id: string) => `/volunteers/${id}`,
    schedule: '/volunteers/schedule',
    assignTask: (id: string) => `/volunteers/${id}/assign-task`,
    updateTask: (id: string, taskId: string) => `/volunteers/${id}/task/${taskId}`,
    checkIn: (id: string) => `/volunteers/${id}/check-in`,
    checkOut: (id: string) => `/volunteers/${id}/check-out`,
    location: (id: string) => `/volunteers/${id}/location`,
    stats: (eventId: string) => `/volunteers/event/${eventId}/stats`,
  },

  // Tickets
  tickets: {
    list: '/tickets',
    get: (id: string) => `/tickets/${id}`,
    byUser: (userId: string) => `/tickets/user/${userId}`,
    byEvent: (eventId: string) => `/tickets/event/${eventId}`,
    validate: '/tickets/validate',
    purchase: '/tickets/purchase',
    cancel: (id: string) => `/tickets/${id}/cancel`,
    refund: (id: string) => `/tickets/${id}/refund`,
    transfer: (id: string) => `/tickets/${id}/transfer`,
    checkIn: '/tickets/check-in',
    stats: (eventId: string) => `/tickets/event/${eventId}/stats`,
  },

  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
  },

  // Analytics
  analytics: {
    dashboard: '/gcp/dashboard',
    metrics: '/gcp/metrics',
    reports: '/gcp/reports',
  },

  // BigQuery
  bigQuery: {
    query: '/bigquery/query',
    predictions: '/bigquery/predictions',
    incidents: '/bigquery/incidents',
    analytics: '/bigquery/analytics',
  },

  // Cameras
  cameras: {
    list: '/cameras',
    get: (id: string) => `/cameras/${id}`,
    stream: (id: string) => `/cameras/${id}/stream`,
    analytics: (id: string) => `/cameras/${id}/analytics`,
  },

  // Weather
  weather: {
    current: '/weather/current',
    forecast: '/weather/forecast',
  },

  // Recommendations
  recommendations: {
    list: '/recommendations',
    get: (id: string) => `/recommendations/${id}`,
    generate: '/recommendations/generate',
    approve: (id: string) => `/recommendations/${id}/approve`,
    reject: (id: string) => `/recommendations/${id}/reject`,
    history: '/recommendations/history',
    stats: '/recommendations/stats',
  },

  // Anomalies
  anomalies: {
    list: '/anomalies',
    get: (id: string) => `/anomalies/${id}`,
    detect: '/anomalies/detect',
    byEvent: (eventId: string) => `/anomalies/${eventId}`,
    current: (eventId: string) => `/anomalies/${eventId}/current`,
    metrics: (eventId: string) => `/anomalies/${eventId}/metrics`,
    ingest: '/anomalies/ingest-feature',
  },

  // Cameras (extended)
  cameraExtended: {
    start: '/cameras/start',
    stop: (id: string) => `/cameras/stop/${id}`,
    status: '/cameras/status',
    statusById: (id: string) => `/cameras/status/${id}`,
    thumbnail: (id: string) => `/cameras/${id}/thumbnail`,
    analyze: (id: string) => `/cameras/${id}/analyze`,
  },

  // Automation (NEW)
  automation: {
    policies: (eventId: string) => `/events/${eventId}/automation-policies`,
    createPolicy: '/automation/policies',
    updatePolicy: (id: string) => `/automation/policies/${id}`,
    deletePolicy: (id: string) => `/automation/policies/${id}`,
  },

  // Gate Control (COMPLETE)
  gates: {
    list: (eventId: string) => `/events/${eventId}/gates`,
    details: (gateId: string) => `/gates/${gateId}`,
    metrics: (eventId: string) => `/events/${eventId}/gate-metrics`,
    activity: (gateId: string) => `/gates/${gateId}/activity`,
    control: (gateId: string) => `/gates/${gateId}/control`,
    accessRules: (eventId: string) => `/events/${eventId}/access-rules`,
    accessRuleDetails: (ruleId: string) => `/access-rules/${ruleId}`,
    alerts: (eventId: string) => `/events/${eventId}/gate-alerts`,
    alertDetails: (alertId: string) => `/gate-alerts/${alertId}`,
    realtimeStats: (eventId: string) => `/events/${eventId}/gate-stats/realtime`,
    emergency: (eventId: string) => `/events/${eventId}/gates/emergency`,
    analytics: (gateId: string) => `/gates/${gateId}/analytics`,
  },

  // Operations (NEW)
  operations: {
    log: (eventId: string) => `/events/${eventId}/operations-log`,
    createEntry: '/operations/log',
  },

  // Post-Event Analysis (NEW)
  postEvent: {
    report: (eventId: string) => `/events/${eventId}/post-analysis`,
    generate: '/post-analysis/generate',
  },

  // Voice AI (NEW)
  voice: {
    synthesize: '/voice/synthesize',
    broadcast: '/voice/broadcast',
    commands: '/voice/commands',
  },

  // Simulation (NEW)
  simulation: {
    run: '/simulation/run',
    scenarios: '/simulation/scenarios',
    results: (simulationId: string) => `/simulation/${simulationId}/results`,
  },
};
