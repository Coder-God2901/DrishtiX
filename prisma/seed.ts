import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users with different roles
  const users = await Promise.all([
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_admin_001',
        email: 'admin@drishtix.com',
        name: 'System Administrator',
        phone: '+91-9876543210',
        role: 'ADMIN',
        permissions: ['manage_all', 'view_all', 'edit_all', 'delete_all'],
        mfaEnabled: true,
        mfaMethod: 'totp',
        organizationId: 'org_drishtix_hq',
        isActive: true,
        lastLogin: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_organizer_001',
        email: 'organizer@techconf.com',
        name: 'John Organizer',
        phone: '+91-9876543211',
        role: 'ORGANIZER',
        permissions: ['manage_events', 'view_reports', 'manage_teams'],
        mfaEnabled: false,
        organizationId: 'org_techconf',
        isActive: true,
        lastLogin: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_security_001',
        email: 'security.chief@venue.com',
        name: 'Sarah Security',
        phone: '+91-9876543212',
        role: 'SECURITY',
        permissions: ['view_incidents', 'manage_responders', 'dispatch_teams'],
        mfaEnabled: true,
        mfaMethod: 'sms',
        organizationId: 'org_venue_security',
        isActive: true,
        lastLogin: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_medical_001',
        email: 'medical.lead@healthteam.com',
        name: 'Dr. Medical Lead',
        phone: '+91-9876543213',
        role: 'MEDICAL',
        permissions: ['view_incidents', 'manage_medical_response'],
        organizationId: 'org_medical_services',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_attendee_001',
        email: 'attendee1@example.com',
        name: 'Alice Attendee',
        phone: '+91-9876543214',
        role: 'ATTENDEE',
        permissions: ['submit_reports', 'view_alerts'],
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        firebaseUid: 'firebase_attendee_002',
        email: 'attendee2@example.com',
        name: 'Bob Attendee',
        phone: '+91-9876543215',
        role: 'ATTENDEE',
        permissions: ['submit_reports', 'view_alerts'],
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create multiple events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Tech Conference 2024',
        description: 'Annual technology conference with 10,000 expected attendees featuring AI, Cloud, and IoT tracks',
        venue: 'Convention Center, New Delhi',
        location: {
          lat: 28.6139,
          lon: 77.2090,
          address: 'Pragati Maidan, New Delhi, 110001'
        },
        startTime: new Date('2024-12-01T09:00:00Z'),
        endTime: new Date('2024-12-01T18:00:00Z'),
        expectedAttendees: 10000,
        actualAttendees: 8750,
        status: 'ACTIVE',
        organizerId: users[1].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Music Festival 2024',
        description: 'Three-day outdoor music festival with multiple stages and 50,000+ attendees',
        venue: 'Open Ground Stadium, Mumbai',
        location: {
          lat: 19.0760,
          lon: 72.8777,
          address: 'Bandra Kurla Complex, Mumbai, 400051'
        },
        startTime: new Date('2024-12-15T16:00:00Z'),
        endTime: new Date('2024-12-18T01:00:00Z'),
        expectedAttendees: 50000,
        status: 'UPCOMING',
        organizerId: users[1].id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Marathon 2024',
        description: 'City-wide marathon with 25,000 participants across multiple routes',
        venue: 'City Center, Bangalore',
        location: {
          lat: 12.9716,
          lon: 77.5946,
          address: 'MG Road, Bangalore, 560001'
        },
        startTime: new Date('2024-11-20T06:00:00Z'),
        endTime: new Date('2024-11-20T12:00:00Z'),
        expectedAttendees: 25000,
        actualAttendees: 23450,
        status: 'COMPLETED',
        organizerId: users[1].id,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Create comprehensive predictions for multiple events
  const predictions = await Promise.all([
    // Tech Conference Predictions
    prisma.prediction.create({
      data: {
        eventId: events[0].id,
        timestamp: new Date('2024-12-01T09:30:00Z'),
        forecastTime: new Date('2024-12-01T10:00:00Z'),
        forecastHorizon: 30,
        predictedCount: 3500,
        predictedDensity: 0.35,
        densityLevel: 'MEDIUM',
        confidence: 0.82,
        gridPredictions: [
          { gridId: 'G001', lat: 28.6140, lon: 77.2091, density: 0.45, count: 450 },
          { gridId: 'G002', lat: 28.6138, lon: 77.2089, density: 0.35, count: 350 },
          { gridId: 'G003', lat: 28.6142, lon: 77.2093, density: 0.28, count: 280 },
        ],
        hotspots: [
          { location: { lat: 28.6140, lon: 77.2091 }, intensity: 0.7, radius: 50, type: 'BOTTLENECK', predictedTime: new Date('2024-12-01T10:00:00Z') },
          { location: { lat: 28.6138, lon: 77.2089 }, intensity: 0.5, radius: 40, type: 'CONVERGENCE', predictedTime: new Date('2024-12-01T10:15:00Z') },
        ],
        riskLevel: 'MEDIUM',
        riskFactors: ['High foot traffic', 'Entry bottleneck', 'Limited parking'],
        signals: { earthEngine: true, social: true, weather: true, mobility: true, video: true, historical: true },
        anomalies: [
          { type: 'unusual_movement', confidence: 0.75, location: { lat: 28.6140, lon: 77.2091 }, severity: 'MEDIUM' },
        ],
        violenceDetected: false,
        fireDetected: false,
        panicDetected: false,
        surgDetected: false,
        panicLevel: 0.15,
        socialSentiment: 'POSITIVE',
        weatherConditions: { temp: 22, humidity: 55, windSpeed: 8, condition: 'clear' },
        heatStressIndex: 0.3,
        alerts: [],
        modelVersion: 'v1.2',
        modelType: 'ConvLSTM',
        accuracy: 0.78,
      },
    }),
    prisma.prediction.create({
      data: {
        eventId: events[0].id,
        timestamp: new Date('2024-12-01T11:30:00Z'),
        forecastTime: new Date('2024-12-01T12:00:00Z'),
        forecastHorizon: 30,
        predictedCount: 8500,
        predictedDensity: 0.85,
        densityLevel: 'HIGH',
        confidence: 0.79,
        gridPredictions: [
          { gridId: 'G001', lat: 28.6140, lon: 77.2091, density: 0.95, count: 950 },
          { gridId: 'G002', lat: 28.6142, lon: 77.2093, density: 0.88, count: 880 },
          { gridId: 'G003', lat: 28.6136, lon: 77.2087, density: 0.72, count: 720 },
          { gridId: 'G004', lat: 28.6141, lon: 77.2092, density: 0.81, count: 810 },
        ],
        hotspots: [
          { location: { lat: 28.6140, lon: 77.2091 }, intensity: 0.95, radius: 60, type: 'SURGE', predictedTime: new Date('2024-12-01T12:00:00Z') },
          { location: { lat: 28.6142, lon: 77.2093 }, intensity: 0.88, radius: 55, type: 'CONVERGENCE', predictedTime: new Date('2024-12-01T12:10:00Z') },
          { location: { lat: 28.6136, lon: 77.2087 }, intensity: 0.72, radius: 45, type: 'BOTTLENECK', predictedTime: new Date('2024-12-01T12:05:00Z') },
        ],
        riskLevel: 'HIGH',
        riskFactors: ['Peak crowd density', 'Limited exits', 'Food court congestion', 'Keynote session rush'],
        signals: { earthEngine: true, social: true, weather: true, mobility: true, video: true, historical: true },
        anomalies: [
          { type: 'crowd_surge', confidence: 0.82, location: { lat: 28.6140, lon: 77.2091 }, severity: 'HIGH' },
          { type: 'bottleneck_formation', confidence: 0.76, location: { lat: 28.6136, lon: 77.2087 }, severity: 'MEDIUM' },
        ],
        violenceDetected: false,
        fireDetected: false,
        panicDetected: false,
        surgDetected: true,
        panicLevel: 0.32,
        socialSentiment: 'NEUTRAL',
        weatherConditions: { temp: 25, humidity: 60, windSpeed: 10, condition: 'cloudy' },
        heatStressIndex: 0.45,
        alerts: [
          { type: 'crowd_density', severity: 'HIGH', message: 'Peak density predicted at main hall' },
        ],
        modelVersion: 'v1.2',
        modelType: 'Ensemble',
        accuracy: 0.80,
      },
    }),
    // Music Festival Predictions
    prisma.prediction.create({
      data: {
        eventId: events[1].id,
        timestamp: new Date('2024-12-15T18:00:00Z'),
        forecastTime: new Date('2024-12-15T18:30:00Z'),
        forecastHorizon: 30,
        predictedCount: 32000,
        predictedDensity: 0.64,
        densityLevel: 'HIGH',
        confidence: 0.85,
        gridPredictions: [
          { gridId: 'MF001', lat: 19.0761, lon: 72.8778, density: 0.72, count: 7200 },
          { gridId: 'MF002', lat: 19.0759, lon: 72.8776, density: 0.68, count: 6800 },
          { gridId: 'MF003', lat: 19.0763, lon: 72.8779, density: 0.55, count: 5500 },
        ],
        hotspots: [
          { location: { lat: 19.0761, lon: 72.8778 }, intensity: 0.85, radius: 80, type: 'CONVERGENCE', predictedTime: new Date('2024-12-15T18:30:00Z') },
        ],
        riskLevel: 'HIGH',
        riskFactors: ['Main stage headliner', 'Multiple entry points congestion', 'Limited restroom facilities'],
        signals: { earthEngine: true, social: true, weather: true, mobility: true, video: false, historical: true },
        anomalies: [],
        violenceDetected: false,
        fireDetected: false,
        panicDetected: false,
        surgDetected: true,
        panicLevel: 0.22,
        socialSentiment: 'POSITIVE',
        weatherConditions: { temp: 28, humidity: 75, windSpeed: 12, condition: 'clear' },
        heatStressIndex: 0.65,
        alerts: [],
        modelVersion: 'v1.2',
        modelType: 'VertexForecasting',
        accuracy: 0.83,
      },
    }),
    // Marathon Predictions
    prisma.prediction.create({
      data: {
        eventId: events[2].id,
        timestamp: new Date('2024-11-20T07:00:00Z'),
        forecastTime: new Date('2024-11-20T07:30:00Z'),
        forecastHorizon: 30,
        predictedCount: 18000,
        predictedDensity: 0.72,
        densityLevel: 'HIGH',
        confidence: 0.88,
        gridPredictions: [
          { gridId: 'M001', lat: 12.9717, lon: 77.5947, density: 0.85, count: 4250 },
          { gridId: 'M002', lat: 12.9715, lon: 77.5945, density: 0.68, count: 3400 },
        ],
        hotspots: [
          { location: { lat: 12.9717, lon: 77.5947 }, intensity: 0.88, radius: 100, type: 'SURGE', predictedTime: new Date('2024-11-20T07:30:00Z') },
        ],
        riskLevel: 'MEDIUM',
        riskFactors: ['Starting line congestion', 'Narrow route section ahead'],
        signals: { earthEngine: false, social: true, weather: true, mobility: true, video: true, historical: true },
        anomalies: [],
        violenceDetected: false,
        fireDetected: false,
        panicDetected: false,
        surgDetected: false,
        panicLevel: 0.08,
        socialSentiment: 'POSITIVE',
        weatherConditions: { temp: 18, humidity: 65, windSpeed: 6, condition: 'clear' },
        heatStressIndex: 0.25,
        alerts: [],
        modelVersion: 'v1.2',
        modelType: 'ConvLSTM',
        accuracy: 0.86,
      },
    }),
  ]);

  console.log(`✅ Created ${predictions.length} predictions`);

  // Create comprehensive responders
  const responders = await Promise.all([
    // Tech Conference Responders
    prisma.responder.create({
      data: {
        name: 'Medical Team Alpha',
        type: 'MEDICAL',
        status: 'AVAILABLE',
        location: { lat: 28.6145, lon: 77.2095 },
        skills: ['Emergency Medicine', 'CPR', 'First Aid', 'Trauma Care'],
        equipment: ['Defibrillator', 'First Aid Kit', 'Oxygen Cylinder', 'Stretcher'],
        phone: '+91-9876543210',
        email: 'medical.alpha@response.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Medical Team Beta',
        type: 'MEDICAL',
        status: 'AVAILABLE',
        location: { lat: 28.6135, lon: 77.2085 },
        skills: ['Emergency Medicine', 'First Aid', 'Pediatric Care'],
        equipment: ['First Aid Kit', 'Medical Supplies'],
        phone: '+91-9876543216',
        email: 'medical.beta@response.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Security Team 1',
        type: 'SECURITY',
        status: 'ON_SCENE',
        location: { lat: 28.6139, lon: 77.2090 },
        skills: ['Crowd Control', 'Emergency Response', 'Conflict Resolution'],
        equipment: ['Radio', 'First Aid Kit', 'Crowd Barriers'],
        phone: '+91-9876543211',
        email: 'security.team1@venue.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Security Team 2',
        type: 'SECURITY',
        status: 'AVAILABLE',
        location: { lat: 28.6143, lon: 77.2095 },
        skills: ['Crowd Control', 'Patrol', 'Access Control'],
        equipment: ['Radio', 'Barriers'],
        phone: '+91-9876543217',
        email: 'security.team2@venue.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Fire Brigade Unit',
        type: 'FIRE',
        status: 'AVAILABLE',
        location: { lat: 28.6155, lon: 77.2105 },
        skills: ['Fire Fighting', 'Rescue Operations', 'Hazmat Response'],
        equipment: ['Fire Truck', 'Hose', 'Breathing Apparatus', 'Fire Extinguishers'],
        phone: '+91-9876543212',
        email: 'fire.unit@brigade.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Police Patrol Unit 1',
        type: 'POLICE',
        status: 'AVAILABLE',
        location: { lat: 28.6130, lon: 77.2080 },
        skills: ['Law Enforcement', 'Traffic Control', 'Emergency Response'],
        equipment: ['Vehicle', 'Radio', 'First Aid'],
        phone: '+91-9876543218',
        email: 'police.unit1@dept.gov',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Evacuation Coordinator Team',
        type: 'EVACUATION',
        status: 'AVAILABLE',
        location: { lat: 28.6140, lon: 77.2088 },
        skills: ['Evacuation Planning', 'Crowd Management', 'Route Coordination'],
        equipment: ['Megaphone', 'Maps', 'Radio'],
        phone: '+91-9876543219',
        email: 'evacuation@coord.com',
      },
    }),
    prisma.responder.create({
      data: {
        name: 'Event Coordinator Lead',
        type: 'COORDINATOR',
        status: 'ON_SCENE',
        location: { lat: 28.6139, lon: 77.2090 },
        skills: ['Event Management', 'Crisis Management', 'Communication'],
        equipment: ['Radio', 'Tablet', 'Communication Hub'],
        phone: '+91-9876543220',
        email: 'coordinator@event.com',
      },
    }),
  ]);

  console.log(`✅ Created ${responders.length} responders`);

  // Create multiple incidents
  const incidents = await Promise.all([
    prisma.incident.create({
      data: {
        eventId: events[0].id,
        type: 'BOTTLENECK',
        severity: 'HIGH',
        status: 'RESPONDING',
        location: { lat: 28.6139, lon: 77.2090 },
        zone: 'Main Entrance',
        description: 'High crowd density detected at main entrance causing bottleneck. Approximately 500+ people queued.',
        detectedBy: 'ai',
        confidence: 0.87,
        assignedResponders: [responders[2].id, responders[3].id],
        dispatchedAt: new Date('2024-12-01T10:15:00Z'),
        escalated: false,
        aiSummary: 'AI detected unusual crowd accumulation at main entrance. Security teams dispatched to manage flow.',
      },
    }),
    prisma.incident.create({
      data: {
        eventId: events[0].id,
        type: 'MEDICAL',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        location: { lat: 28.6142, lon: 77.2093 },
        zone: 'Exhibition Hall A',
        description: 'Attendee experiencing chest pain, medical assistance required.',
        detectedBy: 'manual',
        confidence: 1.0,
        assignedResponders: [responders[0].id],
        dispatchedAt: new Date('2024-12-01T11:05:00Z'),
        respondedAt: new Date('2024-12-01T11:08:00Z'),
        resolvedAt: new Date('2024-12-01T11:35:00Z'),
        escalated: false,
        aiSummary: 'Medical emergency handled successfully. Patient stabilized and transported to medical room.',
      },
    }),
    prisma.incident.create({
      data: {
        eventId: events[0].id,
        type: 'CROWD_SURGE',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        location: { lat: 28.6140, lon: 77.2091 },
        zone: 'Main Stage Area',
        description: 'Sudden crowd surge detected during keynote announcement. Immediate response required.',
        detectedBy: 'ai',
        confidence: 0.92,
        assignedResponders: [responders[2].id, responders[3].id, responders[6].id],
        dispatchedAt: new Date('2024-12-01T12:02:00Z'),
        escalated: true,
        escalatedTo: users[0].id,
        escalationReason: 'Critical severity with potential crush risk',
        aiSummary: 'Critical crowd surge detected. Multiple response teams deployed. Evacuation protocols on standby.',
      },
    }),
    prisma.incident.create({
      data: {
        eventId: events[1].id,
        type: 'HAZARD',
        severity: 'MEDIUM',
        status: 'ACTIVE',
        location: { lat: 19.0762, lon: 72.8780 },
        zone: 'Stage 2 Barrier',
        description: 'Damaged barrier detected near Stage 2, potential safety hazard.',
        detectedBy: 'camera',
        confidence: 0.78,
        assignedResponders: [responders[3].id],
        escalated: false,
      },
    }),
    prisma.incident.create({
      data: {
        eventId: events[2].id,
        type: 'ACCIDENT',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        location: { lat: 12.9718, lon: 77.5948 },
        zone: 'Route KM 5',
        description: 'Runner collapsed at kilometer 5. Medical assistance provided.',
        detectedBy: 'manual',
        confidence: 1.0,
        assignedResponders: [responders[1].id],
        dispatchedAt: new Date('2024-11-20T07:25:00Z'),
        respondedAt: new Date('2024-11-20T07:27:00Z'),
        resolvedAt: new Date('2024-11-20T07:45:00Z'),
        escalated: false,
      },
    }),
  ]);

  console.log(`✅ Created ${incidents.length} incidents`);

  // Create multiple alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        eventId: events[0].id,
        type: 'CROWD_DENSITY',
        priority: 'HIGH',
        status: 'ACTIVE',
        title: 'High Crowd Density Alert',
        summary: 'Critical crowd density predicted at 12:00 PM in main hall area',
        description: 'AI models predict crowd density will reach 85% capacity in main hall at noon.',
        zone: 'Main Hall',
        location: { lat: 28.6140, lon: 77.2091 },
        confidence: 0.82,
        suggestedActions: [
          'Deploy additional security personnel',
          'Open secondary entrance',
          'Activate crowd diversion protocols',
        ],
        assignedTo: [users[2].id],
      },
    }),
    prisma.alert.create({
      data: {
        eventId: events[0].id,
        type: 'WEATHER',
        priority: 'MEDIUM',
        status: 'ACKNOWLEDGED',
        title: 'Heat Stress Warning',
        summary: 'Rising temperatures may cause heat stress',
        confidence: 0.91,
        suggestedActions: [
          'Increase water station availability',
          'Activate cooling zones',
        ],
        assignedTo: [users[3].id],
        acknowledgedAt: new Date('2024-12-01T10:30:00Z'),
      },
    }),
    prisma.alert.create({
      data: {
        eventId: events[1].id,
        type: 'CAPACITY',
        priority: 'HIGH',
        status: 'ACTIVE',
        title: 'Approaching Maximum Capacity',
        summary: 'Event nearing 90% of expected capacity',
        confidence: 0.88,
        suggestedActions: [
          'Slow entry rate at main gates',
          'Monitor exit availability',
        ],
        assignedTo: [users[1].id],
      },
    }),
  ]);

  console.log(`✅ Created ${alerts.length} alerts`);

  // Create crowd density records
  const crowdDensityRecords = await Promise.all([
    prisma.crowdDensity.create({
      data: {
        eventId: events[0].id,
        timestamp: new Date('2024-12-01T10:00:00Z'),
        totalCount: 5200,
        averageDensity: 0.52,
        zones: [
          { zoneId: 'Z001', name: 'Main Hall', count: 2800, density: 0.70 },
          { zoneId: 'Z002', name: 'Food Court', count: 1200, density: 0.60 },
          { zoneId: 'Z003', name: 'Exhibition Area', count: 1200, density: 0.40 },
        ],
        cameraData: [
          { cameraId: 'CAM-01', peopleCount: 284, densityLevel: 'MEDIUM' },
          { cameraId: 'CAM-02', peopleCount: 156, densityLevel: 'LOW' },
          { cameraId: 'CAM-03', peopleCount: 512, densityLevel: 'HIGH' },
        ],
        source: 'video_analytics',
      },
    }),
    prisma.crowdDensity.create({
      data: {
        eventId: events[0].id,
        timestamp: new Date('2024-12-01T12:00:00Z'),
        totalCount: 8750,
        averageDensity: 0.875,
        zones: [
          { zoneId: 'Z001', name: 'Main Hall', count: 5200, density: 0.92 },
          { zoneId: 'Z002', name: 'Food Court', count: 2100, density: 0.85 },
          { zoneId: 'Z003', name: 'Exhibition Area', count: 1450, density: 0.58 },
        ],
        cameraData: [
          { cameraId: 'CAM-01', peopleCount: 567, densityLevel: 'CRITICAL' },
          { cameraId: 'CAM-02', peopleCount: 423, densityLevel: 'HIGH' },
          { cameraId: 'CAM-03', peopleCount: 892, densityLevel: 'CRITICAL' },
        ],
        source: 'video_analytics',
      },
    }),
    prisma.crowdDensity.create({
      data: {
        eventId: events[1].id,
        timestamp: new Date('2024-12-15T18:30:00Z'),
        totalCount: 32000,
        averageDensity: 0.64,
        zones: [
          { zoneId: 'MF001', name: 'Main Stage', count: 12000, density: 0.80 },
          { zoneId: 'MF002', name: 'Stage 2', count: 8500, density: 0.68 },
          { zoneId: 'MF003', name: 'Food Area', count: 7200, density: 0.58 },
          { zoneId: 'MF004', name: 'Camping Zone', count: 4300, density: 0.35 },
        ],
        cameraData: [],
        source: 'earth_engine',
      },
    }),
  ]);

  console.log(`✅ Created ${crowdDensityRecords.length} crowd density records`);

  // Create traffic incidents
  const trafficIncidents = await Promise.all([
    prisma.trafficIncident.create({
      data: {
        source: 'WAZE',
        sourceId: 'waze_12345',
        type: 'ACCIDENT',
        severity: 'HIGH',
        location: { lat: 28.6130, lon: 77.2085 },
        affectedRoads: ['NH-48', 'Ring Road'],
        description: 'Vehicle collision blocking 2 lanes',
        startTime: new Date('2024-12-01T09:30:00Z'),
        confidence: 0.92,
      },
    }),
    prisma.trafficIncident.create({
      data: {
        source: 'GOOGLE_MAPS',
        sourceId: 'gmaps_67890',
        type: 'JAM',
        severity: 'MEDIUM',
        location: { lat: 28.6150, lon: 77.2110 },
        affectedRoads: ['Main Street'],
        description: 'Heavy traffic due to event',
        startTime: new Date('2024-12-01T10:00:00Z'),
        confidence: 0.85,
      },
    }),
    prisma.trafficIncident.create({
      data: {
        source: 'WAZE',
        sourceId: 'waze_54321',
        type: 'ROADWORK',
        severity: 'LOW',
        location: { lat: 19.0750, lon: 72.8765 },
        affectedRoads: ['Western Express Highway'],
        description: 'Lane closure for road maintenance',
        startTime: new Date('2024-12-15T16:00:00Z'),
        endTime: new Date('2024-12-15T22:00:00Z'),
        confidence: 0.95,
      },
    }),
  ]);

  console.log(`✅ Created ${trafficIncidents.length} traffic incidents`);

  // Create social signals
  const socialSignals = await Promise.all([
    prisma.socialSignal.create({
      data: {
        eventId: events[0].id,
        platform: 'twitter',
        timestamp: new Date('2024-12-01T10:00:00Z'),
        postCount: 145,
        sentiment: 'POSITIVE',
        panicLevel: 0.12,
        keywords: ['tech conference', 'amazing speakers', 'crowded but fun', 'networking'],
        hashtags: ['#TechConf2024', '#AI', '#Cloud'],
        location: { lat: 28.6139, lon: 77.2090 },
        samplePosts: [
          { text: 'Amazing tech conference! Learned so much today.', engagement: 234, sentiment: 'POSITIVE' },
          { text: 'Bit crowded at the entrance but totally worth it.', engagement: 156, sentiment: 'NEUTRAL' },
        ],
      },
    }),
    prisma.socialSignal.create({
      data: {
        eventId: events[0].id,
        platform: 'instagram',
        timestamp: new Date('2024-12-01T12:00:00Z'),
        postCount: 89,
        sentiment: 'POSITIVE',
        panicLevel: 0.08,
        keywords: ['great event', 'inspiring', 'tech innovation'],
        hashtags: ['#TechConf2024', '#Innovation'],
        samplePosts: [
          { text: 'Loving the keynote presentation! 🚀', engagement: 567, sentiment: 'POSITIVE' },
        ],
      },
    }),
    prisma.socialSignal.create({
      data: {
        eventId: events[1].id,
        platform: 'twitter',
        timestamp: new Date('2024-12-15T18:00:00Z'),
        postCount: 823,
        sentiment: 'POSITIVE',
        panicLevel: 0.25,
        keywords: ['music festival', 'best lineup', 'amazing crowd', 'packed venue'],
        hashtags: ['#MusicFest2024', '#LiveMusic'],
        location: { lat: 19.0760, lon: 72.8777 },
        samplePosts: [
          { text: 'This is THE best music festival ever! 🎵🔥', engagement: 1234, sentiment: 'POSITIVE' },
          { text: 'Getting a bit crowded near the main stage', engagement: 432, sentiment: 'NEUTRAL' },
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${socialSignals.length} social signals`);

  // Create video frames
  const videoFrames = await Promise.all([
    prisma.videoFrame.create({
      data: {
        eventId: events[0].id,
        cameraId: 'CAM-01',
        timestamp: new Date('2024-12-01T10:00:00Z'),
        frameUrl: 'https://storage.example.com/frames/cam01_100000.jpg',
        peopleCount: 284,
        densityLevel: 'MEDIUM',
        anomalies: [
          { type: 'queue_formation', confidence: 0.82, bbox: { x: 120, y: 80, w: 200, h: 150 } },
        ],
        heatmap: { data: 'base64_encoded_heatmap_data', width: 1920, height: 1080 },
        isFlagged: false,
      },
    }),
    prisma.videoFrame.create({
      data: {
        eventId: events[0].id,
        cameraId: 'CAM-02',
        timestamp: new Date('2024-12-01T12:00:00Z'),
        frameUrl: 'https://storage.example.com/frames/cam02_120000.jpg',
        peopleCount: 567,
        densityLevel: 'HIGH',
        anomalies: [
          { type: 'crowd_surge', confidence: 0.88, bbox: { x: 200, y: 150, w: 400, h: 300 } },
          { type: 'unusual_movement', confidence: 0.75 },
        ],
        heatmap: { data: 'base64_encoded_heatmap_data', width: 1920, height: 1080 },
        isFlagged: true,
        flagReason: 'High density with potential surge detected',
      },
    }),
    prisma.videoFrame.create({
      data: {
        eventId: events[1].id,
        cameraId: 'CAM-MF-01',
        timestamp: new Date('2024-12-15T18:30:00Z'),
        frameUrl: 'https://storage.example.com/frames/cammf01_183000.jpg',
        peopleCount: 1243,
        densityLevel: 'CRITICAL',
        anomalies: [
          { type: 'extreme_density', confidence: 0.94 },
        ],
        isFlagged: true,
        flagReason: 'Critical density level reached',
      },
    }),
  ]);

  console.log(`✅ Created ${videoFrames.length} video frames`);

  // Create AI summaries
  const aiSummaries = await Promise.all([
    prisma.aISummary.create({
      data: {
        eventId: events[0].id,
        type: 'PERIODIC',
        briefing:
          'Morning briefing: Event proceeding normally. 2,453 attendees checked in. Main entrance experiencing moderate queuing (wait time ~8 min). Parking at 67% capacity. Weather favorable. No security incidents reported.',
        keyPoints: [
          'Attendance tracking on pace with projections',
          'Registration desk performing efficiently',
          'Food court traffic increasing as lunch approaches',
          'All critical systems operational',
        ],
        recommendations: [
          'Consider opening additional registration lane by 11:00 AM',
          'Alert food vendors to prepare for lunch rush',
          'Monitor temperature in Main Hall (trending high)',
        ],
        timeline: [
          { time: '09:00', event: 'Doors opened', status: 'normal' },
          { time: '09:30', event: '1,000 attendees checked in', status: 'normal' },
          { time: '10:00', event: '2,453 attendees - pace normal', status: 'normal' },
        ],
        riskAssessment: {
          overall: 'LOW',
          factors: ['Stable crowd flow', 'Good weather', 'Efficient entry processing'],
          mitigations: [],
        },
        confidence: 0.91,
        generatedAt: new Date('2024-12-01T10:00:00Z'),
      },
    }),
    prisma.aISummary.create({
      data: {
        eventId: events[0].id,
        type: 'INCIDENT',
        briefing:
          'Incident resolved: Medical emergency at Main Hall (14:12-14:28). Patient treated on-site for minor heat exhaustion, declined transport. Crowd management protocols activated successfully. Area cleared and reopened at 14:30.',
        keyPoints: [
          'Response time: 2 minutes from alert to medical arrival',
          'Crowd cleared efficiently with minimal disruption',
          'Temperature and humidity levels elevated in Main Hall',
          'Patient condition stable - refused hospital transport',
        ],
        recommendations: [
          'Increase air conditioning in Main Hall immediately',
          'Post hydration reminders on digital signage',
          'Station water distribution at high-traffic zones',
          'Medical team to remain on standby in Main Hall area',
        ],
        timeline: [
          { time: '14:12', event: 'Medical alert received', status: 'alert' },
          { time: '14:14', event: 'Medical team arrived on scene', status: 'responding' },
          { time: '14:20', event: 'Patient stabilized, treatment in progress', status: 'responding' },
          { time: '14:28', event: 'Treatment complete, patient stable', status: 'resolved' },
          { time: '14:30', event: 'Area reopened to attendees', status: 'normal' },
        ],
        riskAssessment: {
          overall: 'MEDIUM',
          factors: ['Elevated temperature in Main Hall', 'High occupancy'],
          mitigations: ['HVAC adjustment requested', 'Water stations deployed', 'Medical team on alert'],
        },
        confidence: 0.96,
        generatedAt: new Date('2024-12-01T14:30:00Z'),
      },
    }),
    prisma.aISummary.create({
      data: {
        eventId: events[1].id,
        type: 'EXECUTIVE',
        briefing:
          'Evening executive summary: Peak attendance reached 18,724 (98% capacity). Three main stage performances completed successfully. 12 minor incidents handled (4 medical, 8 lost persons). All critical systems operational. Weather monitoring active (40% rain probability after 22:00).',
        keyPoints: [
          'Crowd flow patterns matching simulation models',
          'Social media sentiment overwhelmingly positive (87% positive mentions)',
          'Traffic incidents minimal despite high volume',
          'Security screening maintaining 3-minute average',
          'Revenue tracking: F&B sales 15% above projections',
        ],
        recommendations: [
          'Activate rain contingency plan by 21:30',
          'Pre-position additional medical staff for headliner set',
          'Coordinate with traffic management for post-event dispersal',
          'Prepare covered areas for attendee shelter if needed',
        ],
        timeline: [
          { time: '16:00', event: 'Gates opened', status: 'normal' },
          { time: '17:30', event: '10,000 attendees - entry smooth', status: 'normal' },
          { time: '18:45', event: 'Peak attendance 18,724', status: 'normal' },
          { time: '19:30', event: 'Main stage performance #2 completed', status: 'normal' },
          { time: '20:00', event: 'Weather alert issued (rain possible)', status: 'alert' },
        ],
        riskAssessment: {
          overall: 'MEDIUM',
          factors: ['Near capacity crowd', 'Potential weather event', 'Headliner set upcoming (crowd surge risk)'],
          mitigations: ['Rain plan ready', 'Crowd control staff doubled for headliner', 'Traffic coordination confirmed'],
        },
        confidence: 0.93,
        generatedAt: new Date('2024-12-15T20:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${aiSummaries.length} AI summaries`);

  // Create attendee reports
  const attendeeReports = await Promise.all([
    prisma.attendeeReport.create({
      data: {
        eventId: events[0].id,
        userId: users[4].id,
        reportType: 'SAFETY_CONCERN',
        description: 'Slippery floor near the main entrance due to water leak. Multiple people almost slipped.',
        location: { lat: 28.6139, lon: 77.2090 },
        priority: 'HIGH',
        status: 'PENDING',
        mediaUrls: ['https://storage.example.com/reports/floor_hazard_001.jpg'],
        isAnonymous: false,
        metadata: { floor: 'Ground', area: 'Main Entrance', nearLandmark: 'Registration Desk A' },
      },
    }),
    prisma.attendeeReport.create({
      data: {
        eventId: events[0].id,
        userId: users[5].id,
        reportType: 'LOST_PERSON',
        description: 'Lost contact with my friend. Last seen near the food court around 11:30 AM. Wearing blue jacket.',
        location: { lat: 28.6142, lon: 77.2095 },
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        metadata: { friendName: 'Alex Johnson', lastSeenTime: '11:30 AM', clothing: 'blue jacket, jeans' },
      },
    }),
    prisma.attendeeReport.create({
      data: {
        eventId: events[1].id,
        userId: users[4].id,
        reportType: 'CROWD_ISSUE',
        description: 'Extremely overcrowded near the main stage. Difficult to breathe, people pushing aggressively.',
        location: { lat: 19.0760, lon: 72.8777 },
        priority: 'CRITICAL',
        status: 'RESOLVED',
        resolution: 'Crowd control team deployed. Barriers repositioned. Density reduced to safe levels.',
        resolvedAt: new Date('2024-12-15T19:15:00Z'),
        isAnonymous: true,
      },
    }),
    prisma.attendeeReport.create({
      data: {
        eventId: events[0].id,
        userId: users[5].id,
        reportType: 'MEDICAL_EMERGENCY',
        description: 'Person collapsed near the exhibition hall. Appears unconscious.',
        location: { lat: 28.6145, lon: 77.2100 },
        priority: 'CRITICAL',
        status: 'RESOLVED',
        resolution: 'Medical team responded in 2 minutes. Patient treated for dehydration and heat exhaustion.',
        resolvedAt: new Date('2024-12-01T14:28:00Z'),
        metadata: { medicalTeamId: responders[0].id, responseTime: '2 minutes' },
      },
    }),
    prisma.attendeeReport.create({
      data: {
        eventId: events[1].id,
        userId: users[4].id,
        reportType: 'FACILITY_ISSUE',
        description: 'Restrooms near Gate C are out of order. Long lines forming at other facilities.',
        location: { lat: 19.0765, lon: 72.8785 },
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        metadata: { facility: 'Restrooms', gate: 'Gate C', alternativesAvailable: 'Gates A, B' },
      },
    }),
  ]);

  console.log(`✅ Created ${attendeeReports.length} attendee reports`);

  // Create report validations
  const reportValidations = await Promise.all([
    prisma.reportValidation.create({
      data: {
        reportId: attendeeReports[0].id,
        validatorId: users[2].id,
        validationType: 'STAFF',
        isValid: true,
        confidence: 0.95,
        notes: 'Confirmed water leak. Maintenance team dispatched. Wet floor signs placed.',
        validatedAt: new Date('2024-12-01T10:45:00Z'),
      },
    }),
    prisma.reportValidation.create({
      data: {
        reportId: attendeeReports[2].id,
        validatorId: users[2].id,
        validationType: 'STAFF',
        isValid: true,
        confidence: 0.88,
        notes: 'Confirmed high density near main stage. Crowd control measures activated.',
        validatedAt: new Date('2024-12-15T19:00:00Z'),
      },
    }),
    prisma.reportValidation.create({
      data: {
        reportId: attendeeReports[0].id,
        validatorId: users[5].id,
        validationType: 'ATTENDEE',
        isValid: true,
        confidence: 0.90,
        notes: 'I also saw this. Almost slipped myself. Floor was very wet.',
        validatedAt: new Date('2024-12-01T10:50:00Z'),
        distanceFromReport: 15.5,
      },
    }),
    prisma.reportValidation.create({
      data: {
        reportId: attendeeReports[3].id,
        validatorId: users[3].id,
        validationType: 'STAFF',
        isValid: true,
        confidence: 1.0,
        notes: 'Medical emergency confirmed and resolved. Patient treated for heat exhaustion.',
        validatedAt: new Date('2024-12-01T14:30:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${reportValidations.length} report validations`);

  // Create event configs
  const eventConfigs = await Promise.all([
    prisma.eventConfig.create({
      data: {
        eventId: events[0].id,
        maxCapacity: 10000,
        crowdThresholds: {
          low: 0.4,
          medium: 0.6,
          high: 0.8,
          critical: 0.95,
        },
        checkInEnabled: true,
        ticketingEnabled: true,
        emergencyProtocols: {
          evacuation: {
            routes: ['Route A via Main Exit', 'Route B via Emergency Exit 1', 'Route C via Emergency Exit 2'],
            assemblyPoints: ['North Parking Lot', 'South Garden Area'],
            estimatedTime: '15 minutes for full evacuation',
          },
          medical: {
            stations: ['Main Hall Medical Station', 'Gate B First Aid'],
            ambulanceAccess: 'Gate C Service Entrance',
          },
          communication: {
            publicAddress: true,
            smsAlerts: true,
            appNotifications: true,
          },
        },
        customFields: {
          wifi: { ssid: 'TechConf2024', password: 'Innovation2024' },
          parkingCost: '$10',
          foodVendors: 15,
          sponsorBooths: 25,
        },
      },
    }),
    prisma.eventConfig.create({
      data: {
        eventId: events[1].id,
        maxCapacity: 20000,
        crowdThresholds: {
          low: 0.5,
          medium: 0.7,
          high: 0.85,
          critical: 0.98,
        },
        checkInEnabled: true,
        ticketingEnabled: true,
        emergencyProtocols: {
          evacuation: {
            routes: ['Main Gate Exit', 'East Exit', 'West Exit', 'South Emergency Exit'],
            assemblyPoints: ['West Parking Area', 'East Field', 'North Plaza'],
            estimatedTime: '25 minutes for full evacuation',
          },
          medical: {
            stations: ['Main Stage Medical', 'Gate A First Aid', 'VIP Area Medical'],
            ambulanceAccess: 'Service Road via Gate D',
          },
          weatherContingency: {
            rainPlan: 'Move to covered pavilion areas',
            severePlan: 'Activate full evacuation protocol',
          },
        },
        customFields: {
          stages: 3,
          soundCheck: '14:00 - 16:00',
          vendorCount: 40,
          atmLocations: ['Main Gate', 'Food Court', 'VIP Area'],
        },
      },
    }),
    prisma.eventConfig.create({
      data: {
        eventId: events[2].id,
        maxCapacity: 5000,
        crowdThresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
          critical: 0.95,
        },
        checkInEnabled: true,
        ticketingEnabled: false,
        emergencyProtocols: {
          medical: {
            stations: ['Start Line Medical', 'Mile 5 Aid Station', 'Mile 10 Aid Station', 'Finish Line Medical'],
            ambulanceAccess: 'Multiple access points along route',
            mobileUnits: 3,
          },
          communication: {
            runnerTracking: true,
            emergencyContact: '911',
            raceControl: 'Radio Channel 7',
          },
        },
        customFields: {
          raceStart: '07:00 AM',
          aidStations: 8,
          waterStops: 12,
          timing: 'ChipTiming Pro System',
        },
      },
    }),
  ]);

  console.log(`✅ Created ${eventConfigs.length} event configs`);

  // Create venue layouts
  const venueLayouts = await Promise.all([
    prisma.venueLayout.create({
      data: {
        eventId: events[0].id,
        venueName: 'Tech Conference Center',
        totalArea: 25000,
        boundaries: {
          type: 'Polygon',
          coordinates: [
            [
              [77.2080, 28.6130],
              [77.2100, 28.6130],
              [77.2100, 28.6150],
              [77.2080, 28.6150],
              [77.2080, 28.6130],
            ],
          ],
        },
        zones: [
          {
            id: 'main-hall',
            name: 'Main Hall',
            type: 'conference',
            capacity: 3000,
            coordinates: [[77.2082, 28.6132], [77.2092, 28.6132], [77.2092, 28.6142], [77.2082, 28.6142]],
          },
          {
            id: 'exhibition',
            name: 'Exhibition Area',
            type: 'expo',
            capacity: 2500,
            coordinates: [[77.2093, 28.6132], [77.2098, 28.6132], [77.2098, 28.6142], [77.2093, 28.6142]],
          },
          {
            id: 'food-court',
            name: 'Food Court',
            type: 'dining',
            capacity: 1200,
            coordinates: [[77.2082, 28.6143], [77.2092, 28.6143], [77.2092, 28.6148], [77.2082, 28.6148]],
          },
        ],
        entrances: [
          { id: 'main-entrance', name: 'Main Entrance', location: { lat: 28.6139, lon: 77.2090 }, capacity: 500 },
          { id: 'gate-b', name: 'Gate B', location: { lat: 28.6135, lon: 77.2095 }, capacity: 300 },
        ],
        exits: [
          { id: 'main-exit', name: 'Main Exit', location: { lat: 28.6142, lon: 77.2088 }, capacity: 600 },
          { id: 'emergency-1', name: 'Emergency Exit 1', location: { lat: 28.6148, lon: 77.2092 }, capacity: 400 },
          { id: 'emergency-2', name: 'Emergency Exit 2', location: { lat: 28.6132, lon: 77.2098 }, capacity: 400 },
        ],
        emergencyRoutes: [
          {
            from: 'main-hall',
            to: 'main-exit',
            path: [[77.2087, 28.6137], [77.2088, 28.6142]],
            estimatedTime: 5,
          },
          {
            from: 'exhibition',
            to: 'emergency-1',
            path: [[77.2095, 28.6137], [77.2092, 28.6148]],
            estimatedTime: 6,
          },
        ],
        amenities: [
          { type: 'restroom', location: { lat: 28.6140, lon: 77.2085 }, capacity: 50 },
          { type: 'medical', location: { lat: 28.6145, lon: 77.2095 }, name: 'Medical Station' },
          { type: 'parking', location: { lat: 28.6130, lon: 77.2075 }, capacity: 500 },
        ],
      },
    }),
    prisma.venueLayout.create({
      data: {
        eventId: events[1].id,
        venueName: 'City Music Festival Grounds',
        totalArea: 80000,
        boundaries: {
          type: 'Polygon',
          coordinates: [
            [
              [72.8750, 19.0740],
              [72.8800, 19.0740],
              [72.8800, 19.0790],
              [72.8750, 19.0790],
              [72.8750, 19.0740],
            ],
          ],
        },
        zones: [
          {
            id: 'main-stage',
            name: 'Main Stage Area',
            type: 'performance',
            capacity: 10000,
            coordinates: [[72.8760, 72.8770], [19.0765, 19.0765], [72.8770, 19.0775], [72.8760, 19.0775]],
          },
          {
            id: 'secondary-stage',
            name: 'Secondary Stage',
            type: 'performance',
            capacity: 5000,
            coordinates: [[72.8780, 19.0760], [72.8790, 19.0760], [72.8790, 19.0770], [72.8780, 19.0770]],
          },
          {
            id: 'vip-area',
            name: 'VIP Lounge',
            type: 'vip',
            capacity: 500,
            coordinates: [[72.8765, 19.0778], [72.8772, 19.0778], [72.8772, 19.0785], [72.8765, 19.0785]],
          },
        ],
        entrances: [
          { id: 'main-gate', name: 'Main Gate', location: { lat: 19.0755, lon: 72.8775 }, capacity: 1000 },
          { id: 'gate-a', name: 'Gate A', location: { lat: 19.0760, lon: 72.8755 }, capacity: 600 },
          { id: 'vip-entrance', name: 'VIP Entrance', location: { lat: 19.0780, lon: 72.8770 }, capacity: 200 },
        ],
        exits: [
          { id: 'exit-1', name: 'North Exit', location: { lat: 19.0788, lon: 72.8775 }, capacity: 800 },
          { id: 'exit-2', name: 'East Exit', location: { lat: 19.0765, lon: 72.8798 }, capacity: 800 },
          { id: 'exit-3', name: 'West Exit', location: { lat: 19.0765, lon: 72.8752 }, capacity: 600 },
        ],
        emergencyRoutes: [
          {
            from: 'main-stage',
            to: 'exit-1',
            path: [[72.8765, 19.0770], [72.8775, 19.0788]],
            estimatedTime: 8,
          },
        ],
        amenities: [
          { type: 'restroom', location: { lat: 19.0758, lon: 72.8782 }, capacity: 100 },
          { type: 'medical', location: { lat: 19.0762, lon: 72.8777 }, name: 'Main Medical Station' },
          { type: 'atm', location: { lat: 19.0760, lon: 72.8775 } },
        ],
        navigationGraph: {
          nodes: ['main-stage', 'secondary-stage', 'vip-area', 'food-court', 'exit-1', 'exit-2'],
          edges: [
            { from: 'main-stage', to: 'exit-1', weight: 150 },
            { from: 'main-stage', to: 'food-court', weight: 100 },
            { from: 'secondary-stage', to: 'exit-2', weight: 120 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${venueLayouts.length} venue layouts`);

  // Create comprehensive audit logs
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: 'EVENT_CREATED',
        resource: 'EVENT',
        resourceId: events[0].id,
        details: {
          eventName: events[0].name,
          eventType: events[0].type,
          capacity: 10000,
          createdBy: 'Admin User',
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[2].id,
        action: 'INCIDENT_RESOLVED',
        resource: 'INCIDENT',
        resourceId: incidents[3].id,
        details: {
          incidentType: 'MEDICAL',
          status: 'RESOLVED',
          responseTime: '2 minutes',
          resolvedBy: 'Dr. Sarah Medical',
        },
        ipAddress: '192.168.1.105',
        userAgent: 'DrishtiX Mobile App v2.1',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[1].id,
        action: 'ALERT_CREATED',
        resource: 'ALERT',
        resourceId: alerts[0].id,
        details: {
          alertType: 'CROWD_DENSITY',
          priority: 'HIGH',
          affectedZone: 'Main Entrance',
          recipientCount: 15,
        },
        ipAddress: '192.168.1.102',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[2].id,
        action: 'REPORT_VALIDATED',
        resource: 'ATTENDEE_REPORT',
        resourceId: attendeeReports[0].id,
        details: {
          reportType: 'SAFETY_CONCERN',
          validationType: 'STAFF',
          validationResult: 'CONFIRMED',
          actionTaken: 'Maintenance dispatched',
        },
        ipAddress: '192.168.1.105',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'AI_PREDICTION_GENERATED',
        resource: 'PREDICTION',
        resourceId: predictions[0].id,
        details: {
          predictionType: 'CROWD_DENSITY',
          confidence: 0.85,
          modelVersion: 'v2.3.1',
          dataPointsAnalyzed: 1247,
        },
        ipAddress: '10.0.0.1',
        userAgent: 'DrishtiX AI Service',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'DATABASE_SEED',
        resource: 'DATABASE',
        details: {
          message: 'Comprehensive database seeding completed',
          recordsCreated: {
            users: 6,
            events: 3,
            predictions: 4,
            responders: 8,
            incidents: 5,
            alerts: 3,
            crowdDensity: 3,
            trafficIncidents: 3,
            socialSignals: 3,
            videoFrames: 3,
            aiSummaries: 3,
            attendeeReports: 5,
            reportValidations: 4,
            eventConfigs: 3,
            venueLayouts: 2,
          },
          timestamp: new Date(),
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Prisma Seed Script',
      },
    }),
  ]);

  console.log(`✅ Created ${auditLogs.length} audit log entries`);

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📊 Comprehensive Data Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Users: ${users.length} (Admin, Organizer, Security, Medical, Attendees)`);
  console.log(`🎫 Events: ${events.length} (Conference, Festival, Marathon)`);
  console.log(`🔮 Predictions: ${predictions.length} (with multi-signal analysis)`);
  console.log(`🚨 Responders: ${responders.length} (Medical, Security, Fire, Police)`);
  console.log(`⚠️  Incidents: ${incidents.length} (Bottleneck, Medical, Surge, Hazard)`);
  console.log(`📢 Alerts: ${alerts.length} (Crowd, Weather, Capacity)`);
  console.log(`👫 Crowd Density: ${crowdDensityRecords.length} (time-series data)`);
  console.log(`🚗 Traffic Incidents: ${trafficIncidents.length} (Waze, Google Maps)`);
  console.log(`💬 Social Signals: ${socialSignals.length} (Twitter, Instagram)`);
  console.log(`📹 Video Frames: ${videoFrames.length} (with anomaly detection)`);
  console.log(`🤖 AI Summaries: ${aiSummaries.length} (Periodic, Incident, Executive)`);
  console.log(`📝 Attendee Reports: ${attendeeReports.length} (Safety, Medical, Crowd)`);
  console.log(`✅ Report Validations: ${reportValidations.length} (Staff & Attendee)`);
  console.log(`⚙️  Event Configs: ${eventConfigs.length} (with emergency protocols)`);
  console.log(`🗺️  Venue Layouts: ${venueLayouts.length} (with GeoJSON & routes)`);
  console.log(`📋 Audit Logs: ${auditLogs.length} (comprehensive activity tracking)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ Your DrishtiX database is fully populated and ready!\n');
  console.log('💡 Features included:');
  console.log('  • Multi-event scenarios (active, upcoming, completed)');
  console.log('  • AI-powered predictions with confidence scores');
  console.log('  • Emergency response workflows');
  console.log('  • Attendee reporting & validation system');
  console.log('  • Real-time crowd & traffic monitoring');
  console.log('  • Social media sentiment analysis');
  console.log('  • Video analytics with anomaly detection');
  console.log('  • Comprehensive venue layouts with emergency routes');
  console.log('  • Detailed audit trails for compliance\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
