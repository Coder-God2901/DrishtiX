import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Users,
  Clock,
  Music,
  Info,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  DollarSign,
  Ticket,
  Shield,
  Sparkles
} from 'lucide-react';
import { VolunteerRequestBuilder } from './VolunteerRequestBuilder';

interface EventCreationFormProps {
  eventType: {
    id: string;
    name: string;
    subtitle: string;
    icon: any;
    color: string;
    defaultCapacity: number;
    riskLevel: string;
  };
  onBack: () => void;
  onSave: (eventData: any) => void;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export function EventCreationForm({ eventType, onBack, onSave }: EventCreationFormProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    eventName: '',
    description: '',
    venueName: 'Vagator Beach',
    venueAddress: '',
    
    // Common fields for all events
    startDateTime: '',
    endDateTime: '',
    expectedAttendance: eventType.defaultCapacity,
    
    // Event-specific fields
    // Concert/Festival
    artistPerformer: '',
    numberOfStages: 1,
    vipAreaAvailable: false,
    alcoholServed: false,
    
    // Conference
    conferenceTheme: '',
    numberOfSessions: 0,
    keynoteeSpeaker: '',
    registrationRequired: true,
    
    // Marathon
    raceCategories: [] as string[],
    startingPoint: '',
    finishLine: '',
    waterStations: 0,
    
    // Workshop
    instructor: '',
    maxParticipants: 0,
    prerequisites: '',
    materialsProvided: '',
    
    // Rally
    rallyPurpose: '',
    securityLevel: 'medium',
    speakersList: [] as string[],
    
    // Organizer Info
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    
    // Ticketing
    ticketTypes: [] as TicketType[],
    freeEvent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [volunteerRequirements, setVolunteerRequirements] = useState<any[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    price: 0,
    quantity: 0,
    description: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Start date and time is required';
    }
    if (!formData.endDateTime) {
      newErrors.endDateTime = 'End date and time is required';
    }
    if (formData.expectedAttendance <= 0) {
      newErrors.expectedAttendance = 'Expected attendance must be greater than 0';
    }
    
    // Event-specific validations
    if ((eventType.id === 'concert' || eventType.id === 'festival') && !formData.artistPerformer.trim()) {
      newErrors.artistPerformer = 'Artist/Performer is required';
    }
    if (eventType.id === 'conference' && !formData.conferenceTheme.trim()) {
      newErrors.conferenceTheme = 'Conference theme is required';
    }
    if (eventType.id === 'marathon' && formData.raceCategories.length === 0) {
      newErrors.raceCategories = 'At least one race category is required';
    }
    if (eventType.id === 'workshop' && !formData.instructor.trim()) {
      newErrors.instructor = 'Instructor name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    const eventData = {
      ...formData,
      eventType: eventType.id,
      createdAt: new Date().toISOString()
    };

    onSave(eventData);
  };

  const addTicketType = () => {
    if (!newTicket.name.trim() || newTicket.quantity <= 0) {
      alert('Please enter ticket name and quantity');
      return;
    }

    const ticket: TicketType = {
      id: `ticket-${Date.now()}`,
      ...newTicket
    };

    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, ticket]
    }));

    setNewTicket({ name: '', price: 0, quantity: 0, description: '' });
    setShowTicketForm(false);
  };

  const removeTicketType = (ticketId: string) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter(t => t.id !== ticketId)
    }));
  };

  const addArrayItem = (field: 'raceCategories' | 'speakersList', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  const removeArrayItem = (field: 'raceCategories' | 'speakersList', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <div className="flex items-center gap-3 text-sm text-slate-600 mb-1">
                  <span>Events</span>
                  <span>›</span>
                  <span>Create New Event</span>
                  <span>›</span>
                  <span className="text-slate-900">{eventType.name}</span>
                </div>
                <h1 className="text-slate-900 text-2xl">Create {eventType.name}</h1>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
              Organizer Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Event Type Banner */}
          <div 
            className="rounded-2xl p-6 text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${eventType.color} 0%, ${eventType.color}dd 100%)` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                {/* Dynamic icon based on event type */}
                {eventType.id === 'concert' && <Music className="w-8 h-8" />}
                {eventType.id === 'festival' && <Sparkles className="w-8 h-8" />}
                {eventType.id === 'conference' && <Users className="w-8 h-8" />}
                {eventType.id === 'marathon' && <Users className="w-8 h-8" />}
                {eventType.id === 'rally' && <Users className="w-8 h-8" />}
                {eventType.id === 'workshop' && <Users className="w-8 h-8" />}
                {eventType.id === 'custom' && <Plus className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl mb-1">{eventType.name} Configuration</h2>
                <p className="text-white/90">{eventType.subtitle}</p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-1">
                  {eventType.riskLevel} risk
                </div>
                <p className="text-sm text-white/90">Capacity: {eventType.defaultCapacity.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm mb-2">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  placeholder="e.g., Sunburn Festival 2025"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.eventName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.eventName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.eventName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 text-sm mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the event..."
                  rows={3}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.description ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.venueName}
                      onChange={(e) => handleInputChange('venueName', e.target.value)}
                      placeholder="e.g., Vagator Beach"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    value={formData.venueAddress}
                    onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                    placeholder="Full address"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event-Specific Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 text-lg mb-4">
              {eventType.name} Details
            </h3>
            <div className="space-y-4">
              {/* Concert/Festival Fields */}
              {(eventType.id === 'concert' || eventType.id === 'festival') && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Artist/Performer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.artistPerformer}
                      onChange={(e) => handleInputChange('artistPerformer', e.target.value)}
                      placeholder="Featured artist or headliner"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.artistPerformer ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 text-sm mb-2">
                        Number of Stages
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.numberOfStages}
                        onChange={(e) => handleInputChange('numberOfStages', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.vipAreaAvailable}
                          onChange={(e) => handleInputChange('vipAreaAvailable', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-700 text-sm">VIP Area Available</span>
                      </label>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.alcoholServed}
                      onChange={(e) => handleInputChange('alcoholServed', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700 text-sm">Alcohol Served</span>
                  </label>
                </>
              )}

              {/* Conference Fields */}
              {eventType.id === 'conference' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Conference Theme <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.conferenceTheme}
                      onChange={(e) => handleInputChange('conferenceTheme', e.target.value)}
                      placeholder="e.g., Future of AI & Technology"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.conferenceTheme ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 text-sm mb-2">
                        Number of Sessions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.numberOfSessions}
                        onChange={(e) => handleInputChange('numberOfSessions', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm mb-2">
                        Keynote Speaker
                      </label>
                      <input
                        type="text"
                        value={formData.keynoteeSpeaker}
                        onChange={(e) => handleInputChange('keynoteeSpeaker', e.target.value)}
                        placeholder="Speaker name"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.registrationRequired}
                      onChange={(e) => handleInputChange('registrationRequired', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700 text-sm">Registration Required</span>
                  </label>
                </>
              )}

              {/* Marathon Fields */}
              {eventType.id === 'marathon' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Race Categories <span className="text-red-500">*</span>
                    </label>
                    <ArrayInput
                      items={formData.raceCategories}
                      onAdd={(value) => addArrayItem('raceCategories', value)}
                      onRemove={(index) => removeArrayItem('raceCategories', index)}
                      placeholder="e.g., Full Marathon, Half Marathon, 10K"
                      error={errors.raceCategories}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 text-sm mb-2">
                        Starting Point
                      </label>
                      <input
                        type="text"
                        value={formData.startingPoint}
                        onChange={(e) => handleInputChange('startingPoint', e.target.value)}
                        placeholder="Start location"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm mb-2">
                        Finish Line
                      </label>
                      <input
                        type="text"
                        value={formData.finishLine}
                        onChange={(e) => handleInputChange('finishLine', e.target.value)}
                        placeholder="End location"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Number of Water Stations
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.waterStations}
                      onChange={(e) => handleInputChange('waterStations', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Workshop Fields */}
              {eventType.id === 'workshop' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Instructor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => handleInputChange('instructor', e.target.value)}
                      placeholder="Lead instructor"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.instructor ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Maximum Participants
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Prerequisites
                    </label>
                    <textarea
                      value={formData.prerequisites}
                      onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                      placeholder="Required knowledge or skills..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Materials Provided
                    </label>
                    <input
                      type="text"
                      value={formData.materialsProvided}
                      onChange={(e) => handleInputChange('materialsProvided', e.target.value)}
                      placeholder="e.g., Workbook, Tools, Software"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Rally Fields */}
              {eventType.id === 'rally' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Rally Purpose
                    </label>
                    <textarea
                      value={formData.rallyPurpose}
                      onChange={(e) => handleInputChange('rallyPurpose', e.target.value)}
                      placeholder="Purpose of the rally..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Security Level
                    </label>
                    <select
                      value={formData.securityLevel}
                      onChange={(e) => handleInputChange('securityLevel', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Speakers List
                    </label>
                    <ArrayInput
                      items={formData.speakersList}
                      onAdd={(value) => addArrayItem('speakersList', value)}
                      onRemove={(index) => removeArrayItem('speakersList', index)}
                      placeholder="Add speaker name"
                    />
                  </div>
                </>
              )}

              {/* Common Fields for All Events */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={formData.startDateTime}
                      onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.startDateTime ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={formData.endDateTime}
                      onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.endDateTime ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-sm mb-2 flex items-center gap-2">
                  Expected Number of Attendees <span className="text-red-500">*</span>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      This helps us configure safety thresholds
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.expectedAttendance}
                    onChange={(e) => handleInputChange('expectedAttendance', parseInt(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expectedAttendance ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Types Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                Ticket Types
              </h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.freeEvent}
                  onChange={(e) => handleInputChange('freeEvent', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">Free Event</span>
              </label>
            </div>

            {!formData.freeEvent && (
              <>
                {formData.ticketTypes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.ticketTypes.map(ticket => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-slate-900">{ticket.name}</p>
                          <p className="text-sm text-slate-600">
                            ${ticket.price} • {ticket.quantity} tickets
                            {ticket.description && ` • ${ticket.description}`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeTicketType(ticket.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!showTicketForm ? (
                  <button
                    onClick={() => setShowTicketForm(true)}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Ticket Type
                  </button>
                ) : (
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newTicket.name}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ticket name (e.g., General, VIP)"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        value={newTicket.price}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="Price"
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={newTicket.quantity}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="Quantity available"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addTicketType}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowTicketForm(false);
                          setNewTicket({ name: '', price: 0, quantity: 0, description: '' });
                        }}
                        className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Organizer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Organizer Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 text-sm mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.organizerName}
                  onChange={(e) => handleInputChange('organizerName', e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.organizerEmail}
                  onChange={(e) => handleInputChange('organizerEmail', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.organizerPhone}
                  onChange={(e) => handleInputChange('organizerPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Volunteer Requirements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Volunteer Requirements (Optional)
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              You can add volunteer requirements after creating the event from the event management dashboard.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <Info className="w-4 h-4 inline mr-2" />
                Volunteer management will be available in the next step
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              Create Event
            </button>
            <button
              onClick={onBack}
              className="px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper component for array inputs
function ArrayInput({ 
  items, 
  onAdd, 
  onRemove, 
  placeholder,
  error 
}: { 
  items: string[]; 
  onAdd: (value: string) => void; 
  onRemove: (index: number) => void; 
  placeholder: string;
  error?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {items.length > 0 && (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-700 text-sm">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}