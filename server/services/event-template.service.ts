/**
 * Event Type Templates Service
 * Manages event type metadata and dynamic form field validation
 */

import { prisma, io } from '../index';

export interface EventTypeTemplate {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  fields: FormField[];
  defaultConfig?: Record<string, any>;
  validationRules?: Record<string, any>;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'date' | 'datetime-local' | 'select' | 'list';
  required: boolean;
  help?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
}

class EventTemplateService {
  private templates: Map<string, EventTypeTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default event type templates
   */
  private initializeDefaultTemplates() {
    const defaultTemplates: EventTypeTemplate[] = [
      {
        id: 'concert',
        displayName: 'Concert / Music Festival',
        description: 'Live music events with high crowd density',
        icon: 'Music',
        fields: [
          { id: 'eventName', label: 'Event Name', type: 'text', required: true },
          { id: 'artist', label: 'Artist/Performer', type: 'text', required: true },
          { id: 'venue', label: 'Venue Location', type: 'text', required: true },
          {
            id: 'expectedAttendees',
            label: 'Expected Attendees',
            type: 'number',
            required: true,
            help: 'Helps estimate crowd density',
            validation: { min: 1, max: 1000000 }
          },
          { id: 'startDateTime', label: 'Start Date & Time', type: 'datetime-local', required: true },
          {
            id: 'duration',
            label: 'Duration (hours)',
            type: 'number',
            required: true,
            validation: { min: 0.5, max: 24 }
          },
          { id: 'ticketTypes', label: 'Ticket Types', type: 'list', required: false, help: 'VIP, General, Standing, etc.' },
          { id: 'hasAlcohol', label: 'Alcohol Served', type: 'boolean', required: false },
          { id: 'stages', label: 'Number of Stages', type: 'number', required: false },
          { id: 'hasVIP', label: 'VIP Area Available', type: 'boolean', required: false }
        ],
        defaultConfig: {
          mlMode: 'CONCERT',
          riskProfile: 'high',
          crowdDensityThreshold: 0.8
        }
      },
      {
        id: 'marathon',
        displayName: 'Marathon / Running Event',
        description: 'Running events with distributed attendees along routes',
        icon: 'Users',
        fields: [
          { id: 'eventName', label: 'Event Name', type: 'text', required: true },
          { id: 'route', label: 'Route Description', type: 'textarea', required: true },
          {
            id: 'expectedParticipants',
            label: 'Expected Participants',
            type: 'number',
            required: true,
            validation: { min: 10, max: 100000 }
          },
          { id: 'startDateTime', label: 'Start Date & Time', type: 'datetime-local', required: true },
          {
            id: 'distance',
            label: 'Distance (km)',
            type: 'number',
            required: true,
            validation: { min: 1, max: 200 }
          },
          { id: 'aidStations', label: 'Aid Station Locations', type: 'list', required: false },
          { id: 'medicalTeams', label: 'Medical Teams Count', type: 'number', required: false },
          { id: 'checkpoints', label: 'Checkpoints', type: 'list', required: false }
        ],
        defaultConfig: {
          mlMode: 'SPORTS',
          riskProfile: 'medium',
          requiresRouteMapping: true
        }
      },
      {
        id: 'festival',
        displayName: 'Festival',
        description: 'Multi-day outdoor celebrations with diverse attractions',
        icon: 'PartyPopper',
        fields: [
          { id: 'eventName', label: 'Festival Name', type: 'text', required: true },
          { id: 'venue', label: 'Venue Location', type: 'text', required: true },
          {
            id: 'expectedAttendees',
            label: 'Expected Daily Attendees',
            type: 'number',
            required: true,
            validation: { min: 100, max: 500000 }
          },
          { id: 'startDate', label: 'Start Date', type: 'date', required: true },
          { id: 'endDate', label: 'End Date', type: 'date', required: true },
          { id: 'stages', label: 'Stage Names', type: 'list', required: false, help: 'Main Stage, Side Stage, etc.' },
          { id: 'camping', label: 'Camping Available', type: 'boolean', required: false },
          { id: 'foodVendors', label: 'Food Vendor Count', type: 'number', required: false }
        ],
        defaultConfig: {
          mlMode: 'GENERIC',
          riskProfile: 'high',
          multiDay: true
        }
      },
      {
        id: 'rally',
        displayName: 'Rally / Public Gathering',
        description: 'Political or awareness gatherings with security considerations',
        icon: 'Calendar',
        fields: [
          { id: 'eventName', label: 'Rally Name', type: 'text', required: true },
          { id: 'location', label: 'Rally Location', type: 'text', required: true },
          {
            id: 'expectedAttendees',
            label: 'Expected Attendees',
            type: 'number',
            required: true,
            validation: { min: 50, max: 1000000 }
          },
          { id: 'startDateTime', label: 'Start Date & Time', type: 'datetime-local', required: true },
          {
            id: 'duration',
            label: 'Duration (hours)',
            type: 'number',
            required: true,
            validation: { min: 0.5, max: 12 }
          },
          { id: 'speakers', label: 'Speakers', type: 'list', required: false },
          {
            id: 'securityLevel',
            label: 'Security Level',
            type: 'select',
            required: true,
            options: ['Low', 'Medium', 'High', 'Critical']
          }
        ],
        defaultConfig: {
          mlMode: 'RALLY',
          riskProfile: 'high',
          enhancedSecurity: true
        }
      },
      {
        id: 'conference',
        displayName: 'Conference',
        description: 'Professional business events with structured schedules',
        icon: 'Briefcase',
        fields: [
          { id: 'eventName', label: 'Conference Name', type: 'text', required: true },
          { id: 'venue', label: 'Venue', type: 'text', required: true },
          {
            id: 'expectedAttendees',
            label: 'Expected Attendees',
            type: 'number',
            required: true,
            validation: { min: 10, max: 50000 }
          },
          { id: 'startDate', label: 'Start Date', type: 'date', required: true },
          { id: 'endDate', label: 'End Date', type: 'date', required: true },
          { id: 'tracks', label: 'Conference Tracks', type: 'list', required: false },
          { id: 'sponsors', label: 'Sponsors', type: 'list', required: false }
        ],
        defaultConfig: {
          mlMode: 'GENERIC',
          riskProfile: 'low',
          indoorEvent: true
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all event type templates
   */
  getAllTemplates(): EventTypeTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get specific template by ID
   */
  getTemplate(templateId: string): EventTypeTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Validate dynamic fields against template
   */
  validateDynamicFields(
    templateId: string,
    dynamicFields: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, errors: ['Invalid event type template'] };
    }

    const errors: string[] = [];

    template.fields.forEach(field => {
      const value = dynamicFields[field.id];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
        return;
      }

      // Skip validation if field is not provided and not required
      if (!field.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validation
      if (field.type === 'number' && field.validation) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
        } else {
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            errors.push(`${field.label} must be at least ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            errors.push(`${field.label} must not exceed ${field.validation.max}`);
          }
        }
      }

      // Date validation
      if ((field.type === 'date' || field.type === 'datetime-local') && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field.label} must be a valid date`);
        }
      }

      // Select validation
      if (field.type === 'select' && field.options && value) {
        if (!field.options.includes(value)) {
          errors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create event with template validation
   */
  async createEventFromTemplate(
    templateId: string,
    basicInfo: {
      organizerId: string;
      name: string;
      description?: string;
      venue: string;
      location: any;
      startTime: Date;
      endTime: Date;
      expectedAttendees: number;
    },
    dynamicFields: Record<string, any>
  ): Promise<{ success: boolean; event?: any; errors?: string[] }> {
    try {
      // Validate dynamic fields
      const validation = this.validateDynamicFields(templateId, dynamicFields);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      const template = this.templates.get(templateId);
      if (!template) {
        return { success: false, errors: ['Invalid event template'] };
      }

      // Create event
      const event = await prisma.event.create({
        data: {
          name: basicInfo.name,
          description: basicInfo.description || template.description,
          venue: basicInfo.venue,
          location: basicInfo.location,
          startTime: basicInfo.startTime,
          endTime: basicInfo.endTime,
          expectedAttendees: basicInfo.expectedAttendees,
          organizerId: basicInfo.organizerId,
          status: 'UPCOMING'
        }
      });

      // Create event config with dynamic fields and template defaults
      await prisma.eventConfig.create({
        data: {
          eventId: event.id,
          dynamicFields: {
            ...template.defaultConfig,
            ...dynamicFields,
            eventType: templateId,
            templateVersion: '1.0'
          }
        }
      });

      // Emit real-time event creation
      io.to(`organizer:${basicInfo.organizerId}`).emit('event:created', event);

      return { success: true, event };
    } catch (error: any) {
      console.error('Create event from template error:', error);
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * Update event dynamic fields with validation
   */
  async updateEventDynamicFields(
    eventId: string,
    dynamicFields: Record<string, any>
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const eventConfig = await prisma.eventConfig.findUnique({
        where: { eventId }
      });

      if (!eventConfig) {
        return { success: false, errors: ['Event configuration not found'] };
      }

      const currentFields = eventConfig.dynamicFields as Record<string, any>;
      const templateId = currentFields.eventType;

      // Validate updated fields
      const validation = this.validateDynamicFields(templateId, {
        ...currentFields,
        ...dynamicFields
      });

      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Update config
      await prisma.eventConfig.update({
        where: { eventId },
        data: {
          dynamicFields: {
            ...currentFields,
            ...dynamicFields
          }
        }
      });

      // Emit real-time update
      io.to(`event:${eventId}`).emit('event:config:updated', {
        eventId,
        dynamicFields: {
          ...currentFields,
          ...dynamicFields
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Update event dynamic fields error:', error);
      return { success: false, errors: [error.message] };
    }
  }
}

export const eventTemplateService = new EventTemplateService();
