import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Building2,
  Mail,
  Phone,
  Globe,
  Edit3,
  Save,
  X,
  Radio,
  Clock,
  CloudRain,
  Shield,
  Zap,
  Eye,
  EyeOff,
  UserCog,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface EventDetailsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

interface EventMetadata {
  name: string;
  description: string;
  type: string;
  organizer: string;
  email: string;
  phone: string;
  visibility: 'private' | 'public';
}

interface DateTimeConfig {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
}

interface LocationDetails {
  venueName: string;
  city: string;
  country: string;
  indoor: boolean;
  capacity: number;
  weatherSensitive: boolean;
}

interface OperationalSettings {
  crowdForecasting: boolean;
  incidentDetection: boolean;
  attendeeNavigation: boolean;
  volunteerSystem: boolean;
  digitalTwin: boolean;
}

interface AccessPermission {
  id: string;
  name: string;
  role: string;
  canGoLive: boolean;
  emergencyOverride: boolean;
}

// Mock data hook
function useEventDetailsData() {
  const [metadata, setMetadata] = useState<EventMetadata>({
    name: 'Mumbai Music Festival 2025',
    description: 'A grand music festival featuring international and local artists, food stalls, and entertainment zones.',
    type: 'Festival',
    organizer: 'DrishtiX Events Pvt. Ltd.',
    email: 'contact@drishti-events.com',
    phone: '+91 22 1234 5678',
    visibility: 'public'
  });

  const [dateTime, setDateTime] = useState<DateTimeConfig>({
    startDate: '2025-01-15',
    startTime: '18:00',
    endDate: '2025-01-15',
    endTime: '23:00',
    timezone: 'Asia/Kolkata (IST)'
  });

  const [location, setLocation] = useState<LocationDetails>({
    venueName: 'MMRDA Grounds',
    city: 'Mumbai',
    country: 'India',
    indoor: false,
    capacity: 20000,
    weatherSensitive: true
  });

  const [operations, setOperations] = useState<OperationalSettings>({
    crowdForecasting: true,
    incidentDetection: true,
    attendeeNavigation: true,
    volunteerSystem: true,
    digitalTwin: false
  });

  const [permissions] = useState<AccessPermission[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      role: 'Event Manager',
      canGoLive: true,
      emergencyOverride: true
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Operations Lead',
      canGoLive: true,
      emergencyOverride: false
    },
    {
      id: '3',
      name: 'Amit Patel',
      role: 'Safety Coordinator',
      canGoLive: false,
      emergencyOverride: true
    },
    {
      id: '4',
      name: 'Sarah Johnson',
      role: 'Viewer',
      canGoLive: false,
      emergencyOverride: false
    }
  ]);

  return {
    metadata,
    setMetadata,
    dateTime,
    setDateTime,
    location,
    setLocation,
    operations,
    setOperations,
    permissions
  };
}

export function EventDetails({ onBack, onNavigate }: EventDetailsProps) {
  const {
    metadata,
    setMetadata,
    dateTime,
    setDateTime,
    location,
    setLocation,
    operations,
    setOperations,
    permissions
  } = useEventDetailsData();

  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calculate duration
  const calculateDuration = () => {
    const start = new Date(`${dateTime.startDate}T${dateTime.startTime}`);
    const end = new Date(`${dateTime.endDate}T${dateTime.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSaveChanges = () => {
    // In real app, save to backend
    setHasUnsavedChanges(false);
    setIsEditingMetadata(false);
    setIsEditingDateTime(false);
    setIsEditingLocation(false);
  };

  const handleReset = () => {
    // Reset to initial values
    setHasUnsavedChanges(false);
    setIsEditingMetadata(false);
    setIsEditingDateTime(false);
    setIsEditingLocation(false);
  };

  const handleGoLive = () => {
    onNavigate('go-live');
  };

  const operationDescriptions = {
    crowdForecasting: {
      description: 'Predict crowd density and flow patterns using AI',
      impact: 'Enables proactive crowd management'
    },
    incidentDetection: {
      description: 'Automatic detection of safety incidents and anomalies',
      impact: 'Reduces response time for emergencies'
    },
    attendeeNavigation: {
      description: 'Provide real-time navigation to attendees via app',
      impact: 'Improves attendee experience and reduces congestion'
    },
    volunteerSystem: {
      description: 'Manage volunteer assignments and communications',
      impact: 'Streamlines volunteer coordination'
    },
    digitalTwin: {
      description: 'Create virtual replica for simulations and planning',
      impact: 'Allows scenario testing before event'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-1">Event Details</h1>
              <p className="text-purple-100 text-sm">
                Configure event metadata, settings, and permissions
              </p>
            </div>
          </div>

          {/* Go Live Button */}
          <button
            onClick={handleGoLive}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl text-white"
            title="Start live monitoring & operations"
          >
            <Radio className="w-5 h-5" />
            Go Live
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-900 font-medium">You have unsaved changes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-sm text-amber-700 hover:text-amber-900 font-medium px-3 py-1"
              >
                Discard
              </button>
              <button
                onClick={handleSaveChanges}
                className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Event Metadata Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Event Metadata
            </h2>
            <button
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isEditingMetadata ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Edit3 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Event Name</label>
              {isEditingMetadata ? (
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => {
                    setMetadata({ ...metadata, name: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{metadata.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Event Type</label>
              {isEditingMetadata ? (
                <select
                  value={metadata.type}
                  onChange={(e) => {
                    setMetadata({ ...metadata, type: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Festival">Festival</option>
                  <option value="Concert">Concert</option>
                  <option value="Marathon">Marathon</option>
                  <option value="Conference">Conference</option>
                  <option value="Exhibition">Exhibition</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium">{metadata.type}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Description</label>
              {isEditingMetadata ? (
                <textarea
                  value={metadata.description}
                  onChange={(e) => {
                    setMetadata({ ...metadata, description: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-slate-700 text-sm">{metadata.description}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Organizer</label>
              {isEditingMetadata ? (
                <input
                  type="text"
                  value={metadata.organizer}
                  onChange={(e) => {
                    setMetadata({ ...metadata, organizer: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  {metadata.organizer}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Visibility</label>
              {isEditingMetadata ? (
                <select
                  value={metadata.visibility}
                  onChange={(e) => {
                    setMetadata({ ...metadata, visibility: e.target.value as 'private' | 'public' });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  {metadata.visibility === 'public' ? (
                    <><Eye className="w-4 h-4 text-emerald-600" /> Public</>
                  ) : (
                    <><EyeOff className="w-4 h-4 text-amber-600" /> Private</>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Contact Email</label>
              {isEditingMetadata ? (
                <input
                  type="email"
                  value={metadata.email}
                  onChange={(e) => {
                    setMetadata({ ...metadata, email: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {metadata.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Contact Phone</label>
              {isEditingMetadata ? (
                <input
                  type="tel"
                  value={metadata.phone}
                  onChange={(e) => {
                    setMetadata({ ...metadata, phone: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {metadata.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Date & Time Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date & Time Configuration
            </h2>
            <button
              onClick={() => setIsEditingDateTime(!isEditingDateTime)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isEditingDateTime ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Edit3 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Start Date</label>
              {isEditingDateTime ? (
                <input
                  type="date"
                  value={dateTime.startDate}
                  onChange={(e) => {
                    setDateTime({ ...dateTime, startDate: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{new Date(dateTime.startDate).toLocaleDateString()}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Start Time</label>
              {isEditingDateTime ? (
                <input
                  type="time"
                  value={dateTime.startTime}
                  onChange={(e) => {
                    setDateTime({ ...dateTime, startTime: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {dateTime.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Timezone</label>
              {isEditingDateTime ? (
                <select
                  value={dateTime.timezone}
                  onChange={(e) => {
                    setDateTime({ ...dateTime, timezone: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  {dateTime.timezone}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">End Date</label>
              {isEditingDateTime ? (
                <input
                  type="date"
                  value={dateTime.endDate}
                  onChange={(e) => {
                    setDateTime({ ...dateTime, endDate: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{new Date(dateTime.endDate).toLocaleDateString()}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">End Time</label>
              {isEditingDateTime ? (
                <input
                  type="time"
                  value={dateTime.endTime}
                  onChange={(e) => {
                    setDateTime({ ...dateTime, endTime: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {dateTime.endTime}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Duration</label>
              <p className="text-slate-900 font-medium text-lg">{calculateDuration()}</p>
            </div>
          </div>
        </div>

        {/* Location & Venue Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location & Venue Details
            </h2>
            <button
              onClick={() => setIsEditingLocation(!isEditingLocation)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isEditingLocation ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Edit3 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Venue Name</label>
              {isEditingLocation ? (
                <input
                  type="text"
                  value={location.venueName}
                  onChange={(e) => {
                    setLocation({ ...location, venueName: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{location.venueName}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">City</label>
              {isEditingLocation ? (
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => {
                    setLocation({ ...location, city: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{location.city}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Country</label>
              {isEditingLocation ? (
                <input
                  type="text"
                  value={location.country}
                  onChange={(e) => {
                    setLocation({ ...location, country: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-slate-900 font-medium">{location.country}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Venue Type</label>
              {isEditingLocation ? (
                <select
                  value={location.indoor ? 'indoor' : 'outdoor'}
                  onChange={(e) => {
                    setLocation({ ...location, indoor: e.target.value === 'indoor' });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium">{location.indoor ? 'Indoor' : 'Outdoor'}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Capacity</label>
              {isEditingLocation ? (
                <input
                  type="number"
                  value={location.capacity}
                  onChange={(e) => {
                    setLocation({ ...location, capacity: parseInt(e.target.value) });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  {location.capacity.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Weather Sensitive</label>
              {isEditingLocation ? (
                <select
                  value={location.weatherSensitive ? 'yes' : 'no'}
                  onChange={(e) => {
                    setLocation({ ...location, weatherSensitive: e.target.value === 'yes' });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  {location.weatherSensitive ? (
                    <><CloudRain className="w-4 h-4 text-amber-600" /> Yes</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> No</>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Operational Settings
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(operations).map(([key, value]) => {
              const info = operationDescriptions[key as keyof OperationalSettings];
              return (
                <div
                  key={key}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setOperations({ ...operations, [key]: e.target.checked });
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <h3 className="font-bold text-slate-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{info.description}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {info.impact}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Access & Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Access & Permissions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Can Go Live</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Emergency Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map(person => (
                  <tr key={person.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-900">{person.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{person.role}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {person.canGoLive ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {person.emergencyOverride ? (
                        <Shield className="w-5 h-5 text-amber-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            onClick={handleReset}
            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => onBack()}
            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className={`px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
