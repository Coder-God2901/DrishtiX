/**
 * Enhanced Event Creator
 * Combines template-based event creation with API integration and real-time validation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  Plus,
  X,
  Music,
  PartyPopper,
  Briefcase,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { eventTypes, metaFormFields } from '../../data/event-metadata';
import { apiClient } from '@/lib/api-client';

// Toast fallback if hook doesn't exist
const useToast = () => ({
  toast: ({ title, description, variant }: { title?: string; description?: string; variant?: string }) => {
    console.log(`[${variant || 'info'}] ${title}: ${description}`);
    alert(`${title}\n${description}`);
  },
});

interface EventTemplate {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  fields: FormField[];
  defaultConfig?: Record<string, any>;
}

interface FormField {
  id?: string;
  name?: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'date' | 'datetime-local' | 'select' | 'list';
  required: boolean;
  help?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

const iconMap: Record<string, any> = {
  Music,
  Users,
  Calendar,
  PartyPopper,
  Briefcase,
  GraduationCap,
};

export function EventCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [listValues, setListValues] = useState<Record<string, string[]>>({});
  const [currentListInput, setCurrentListInput] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [apiTemplates, setApiTemplates] = useState<EventTemplate[]>([]);

  const organizerId = localStorage.getItem('userId') || '';
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const location = { lat: 18.5204, lng: 73.8567 };
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');

  useEffect(() => {
    loadTemplatesFromAPI();
  }, []);

  const loadTemplatesFromAPI = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: EventTemplate[] }>('/events/templates');
      setApiTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates from API:', error);
      // Fallback to local templates if API fails
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setFormData({});
    setListValues({});
    setCurrentListInput({});
    setValidationErrors([]);
    setEventName('');
    setVenue('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setExpectedAttendees('');
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation errors for this field
    setValidationErrors((prev) => prev.filter((err) => !err.toLowerCase().includes(name.toLowerCase())));
  };

  const handleListAdd = (name: string, value?: string) => {
    const inputValue = value || currentListInput[name];
    if (inputValue && inputValue.trim()) {
      setListValues((prev) => ({
        ...prev,
        [name]: [...(prev[name] || []), inputValue.trim()],
      }));
      setCurrentListInput((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleListRemove = (name: string, index: number) => {
    setListValues((prev) => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate basic info
    if (!eventName.trim()) errors.push('Event name is required');
    if (!venue.trim()) errors.push('Venue is required');
    if (!startTime) errors.push('Start time is required');
    if (!endTime) errors.push('End time is required');
    if (!expectedAttendees || parseInt(expectedAttendees) <= 0) {
      errors.push('Expected attendees must be greater than 0');
    }

    // Validate start time is before end time
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      errors.push('End time must be after start time');
    }

    // Validate template fields
    const fields = getFieldsForSelectedType();
    fields.forEach((field) => {
      const fieldName = field.id || field.name || '';
      const value = formData[fieldName] || listValues[fieldName];

      if (
        field.required &&
        (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))
      ) {
        errors.push(`${field.label} is required`);
      }

      // Number validation
      if (field.type === 'number' && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
        } else if (field.validation) {
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            errors.push(`${field.label} must be at least ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            errors.push(`${field.label} must not exceed ${field.validation.max}`);
          }
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare dynamic fields
      const dynamicFields = { ...formData };

      // Add list values to dynamic fields
      Object.keys(listValues).forEach((key) => {
        dynamicFields[key] = listValues[key];
      });

      // Create event
      const response = await apiClient.post<{ success: boolean; data: { id: string } }>('/events', {
        organizerId,
        name: eventName,
        description,
        venue,
        location,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        expectedAttendees: parseInt(expectedAttendees),
        eventTypeId: selectedType,
        dynamicFields,
      });

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      // Navigate to event details or venue mapping
      const eventId = response.data.id;
      navigate(`/organizer/events/${eventId}/venue-mapping`);
    } catch (error: any) {
      console.error('Event creation error:', error);
      const errorMessage =
        error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'Failed to create event';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldsForSelectedType = (): FormField[] => {
    if (!selectedType) return [];

    // Try to get fields from API templates first
    const apiTemplate = apiTemplates.find((t) => t.id === selectedType);
    if (apiTemplate) return apiTemplate.fields;

    // Fallback to local meta fields
    return metaFormFields[selectedType] || [];
  };

  const renderField = (field: FormField) => {
    const fieldName = field.id || field.name || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldName}
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldName}
            type="number"
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldName}
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              id={fieldName}
              type="checkbox"
              checked={formData[fieldName] || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor={fieldName} className="font-normal cursor-pointer">
              Yes
            </Label>
          </div>
        );

      case 'date':
      case 'datetime-local':
        return (
          <Input
            id={fieldName}
            type={field.type}
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={formData[fieldName] || ''}
            onValueChange={(value: string) => handleInputChange(fieldName, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'list':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id={`${fieldName}-input`}
                value={currentListInput[fieldName] || ''}
                onChange={(e) =>
                  setCurrentListInput((prev) => ({
                    ...prev,
                    [fieldName]: e.target.value,
                  }))
                }
                placeholder={`Add ${field.label.toLowerCase()}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleListAdd(fieldName);
                  }
                }}
              />
              <Button type="button" size="icon" onClick={() => handleListAdd(fieldName)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(listValues[fieldName] || []).map((item, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {item}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleListRemove(fieldName, index)} />
                </Badge>
              ))}
            </div>
          </div>
        );

      default:
        return <Input disabled value="Unsupported field type" />;
    }
  };

  // Template selection view
  if (!selectedType) {
    // Combine API templates with local templates
    const allTemplates = apiTemplates.length > 0 ? apiTemplates : eventTypes;

    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Event</h1>
            <p className="text-muted-foreground mt-2">
              Select your event type to get started with a customized creation flow
            </p>
          </div>

          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTemplates.map((type: any) => {
                const Icon = iconMap[type.icon] || type.icon || Calendar;
                const displayName = type.displayName || type.name;
                const desc = type.description || type.subtitle;

                return (
                  <Card
                    key={type.id}
                    className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{displayName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        Select
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get selected template info
  const apiTemplate = apiTemplates.find((t) => t.id === selectedType);
  const localTemplate = eventTypes.find((t) => t.id === selectedType);
  const fields = getFieldsForSelectedType();
  const displayName = apiTemplate?.displayName || (localTemplate as any)?.name || 'Event';
  const displayDesc = apiTemplate?.description || (localTemplate as any)?.subtitle || '';
  const iconKey = apiTemplate?.icon || (localTemplate as any)?.icon;
  const Icon = (typeof iconKey === 'string' ? iconMap[iconKey] : iconKey) || Calendar;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Create {displayName}</h1>
              <Badge variant="outline">{displayName}</Badge>
            </div>
            <p className="text-muted-foreground mt-2">{displayDesc}</p>
          </div>
          <Button variant="ghost" onClick={() => setSelectedType(null)}>
            Back to Event Types
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">
                    Event Name <span className="text-[#E02D2D] ml-1">*</span>
                  </Label>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">
                    Venue <span className="text-[#E02D2D] ml-1">*</span>
                  </Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Enter venue location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">
                      Start Date & Time <span className="text-[#E02D2D] ml-1">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">
                      End Date & Time <span className="text-[#E02D2D] ml-1">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedAttendees">
                    Expected Attendees <span className="text-[#E02D2D] ml-1">*</span>
                  </Label>
                  <Input
                    id="expectedAttendees"
                    type="number"
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(e.target.value)}
                    placeholder="Enter expected number of attendees"
                    min="1"
                  />
                </div>
              </div>
            </Card>

            {/* Template-specific Fields */}
            {fields.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Event Details</h2>
                <div className="space-y-4">
                  {fields.map((field) => {
                    const fieldName = field.id || field.name || '';
                    return (
                      <div key={fieldName} className="space-y-2">
                        <Label htmlFor={fieldName}>
                          {field.label}
                          {field.required && <span className="text-[#E02D2D] ml-1">*</span>}
                        </Label>
                        {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
                        {renderField(field)}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Preview Column */}
          <div className="space-y-4">
            <Card className="p-6 sticky top-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-4">Event Preview</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Event Details</span>
                  </div>
                  <p className="text-foreground font-medium">{eventName || 'Untitled Event'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Location</span>
                  </div>
                  <p className="text-foreground">{venue || formData.location || 'Not specified'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Expected Attendees</span>
                  </div>
                  <p className="text-foreground">{expectedAttendees || formData.expectedParticipants || '0'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <p className="text-foreground">
                    {startTime && endTime
                      ? `${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}`
                      : formData.duration
                        ? `${formData.duration} hours`
                        : 'Not specified'}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-semibold">Safety Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-[#16A34A] transition-all" style={{ width: '75%' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Estimated based on event parameters</p>
                </div>
              </div>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Card className="p-4 border-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive mb-2">Validation Errors</h4>
                    <ul className="text-sm space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-destructive">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            <div className="sticky top-[calc(100vh-8rem)] space-y-2">
              <Button
                className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish Event
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedType(null)}
                disabled={isSubmitting}
              >
                Save Draft
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                After creating the event, you'll be able to define the venue layout and zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
