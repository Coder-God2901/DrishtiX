import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Flame, 
  Activity, 
  Users, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  Ambulance, 
  HardHat, 
  Radio,
  User,
  Navigation,
  ArrowLeft,
  Send,
  RefreshCw
} from 'lucide-react';
import { useIncidents } from '../../services/incidentContext';
import { Incident } from '../../services/incidentManagementService';
import { LeafletMap } from '../shared/LeafletMap';
import { IncidentDrawer } from '../shared/IncidentDrawer';
import { dispatchService, Team as APITeam } from '../../services/dispatch.service';
import { volunteerService, Volunteer as APIVolunteer } from '../../services/volunteer.service';
import { wsService } from '../../services/websocket.service';

// --- Types ---

interface DispatchCenterPageProps {
  onBack?: () => void;
  eventId?: string;
}

// UI-specific types with extended properties for display
interface Team extends APITeam {
  activeCount?: number;
  idleCount?: number;
  location?: [number, number]; // [lat, lng]
  currentAssignment?: string; // Incident ID
}

interface Volunteer extends Omit<APIVolunteer, 'location'> {
  distance?: string;
  location?: { lat: number; lng: number } | [number, number]; // Support both formats
}

// --- Real-time dispatch data from backend ---

// --- Helper Functions ---

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getSeverityMarkerColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'blue';
    default: return 'gray';
  }
};

const getRecommendedResources = (incidentType: string) => {
  const type = incidentType.toLowerCase();
  if (type.includes('fire')) return ['Security', 'Medical', 'External Fire Brigade'];
  if (type.includes('medical')) return ['Medical Team'];
  if (type.includes('crowd')) return ['Security', 'Volunteers'];
  if (type.includes('lost')) return ['Volunteers'];
  if (type.includes('violence')) return ['Security'];
  return ['Operations'];
};

// Convert percentage-based coordinates (0-100) to lat/lng
const percentageToLatLng = (x?: number, y?: number): [number, number] => {
  // Base coordinates for Mumbai venue area
  const baseLat = 19.076;
  const baseLng = 72.8777;
  
  // Define a small area (approximately 1km x 1km)
  const latRange = 0.009; // ~1km
  const lngRange = 0.009; // ~1km
  
  if (x === undefined || y === undefined) {
    return [baseLat, baseLng];
  }
  
  // Convert percentage to lat/lng offset
  const lat = baseLat + (y / 100) * latRange - (latRange / 2);
  const lng = baseLng + (x / 100) * lngRange - (lngRange / 2);
  
  return [lat, lng];
};

export function DispatchCenterPage({ onBack, eventId = 'default-event-id' }: DispatchCenterPageProps) {
  const { incidents } = useIncidents();
  
  // State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showIncidentDrawer, setShowIncidentDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load real dispatch data
  const loadDispatchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load teams data
      const teamsResponse = await dispatchService.getTeams(eventId);
      if (teamsResponse.success && teamsResponse.data) {
        setTeams(teamsResponse.data);
      }

      // Load volunteers data
      const volunteersResponse = await volunteerService.getVolunteers({ eventId });
      if (volunteersResponse.success && volunteersResponse.data) {
        setVolunteers(volunteersResponse.data);
      }

      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load dispatch data');
      console.error('Error loading dispatch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket: Real-time dispatch updates
  useEffect(() => {
    loadDispatchData();

    const handleDispatchUpdate = (data: any) => {
      console.log('Dispatch update:', data);
      if (data.teams) setTeams(data.teams);
      setLastUpdate(new Date());
    };

    const handleVolunteerUpdate = (data: any) => {
      console.log('Volunteer update:', data);
      if (data.volunteers) setVolunteers(data.volunteers);
      setLastUpdate(new Date());
    };

    wsService.on('dispatch:update', handleDispatchUpdate);
    wsService.on('volunteer:status', handleVolunteerUpdate);
    wsService.emit('subscribe:dispatch', eventId);

    return () => {
      wsService.off('dispatch:update', handleDispatchUpdate);
      wsService.off('volunteer:status', handleVolunteerUpdate);
    };
  }, [eventId]);

  // Derived State
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
  
  // Sort incidents: Critical -> High -> Medium -> Low
  const sortedIncidents = [...incidents].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Handlers
  const handleIncidentSelect = (id: string) => {
    if (selectedIncidentId === id) {
      setSelectedIncidentId(null);
      setSelectedResourceIds([]);
    } else {
      const incident = incidents.find(i => i.id === id);
      if (incident && incident.status !== 'resolved') {
        setSelectedIncidentId(id);
        setSelectedResourceIds([]); // Reset resources when switching incidents
      }
    }
  };

  const handleResourceToggle = (id: string, type: 'team' | 'volunteer') => {
    if (!selectedIncidentId) return; // Cannot select resources without an incident

    setSelectedResourceIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(rId => rId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDispatch = () => {
    if (!selectedIncident || selectedResourceIds.length === 0) return;
    setShowDispatchModal(true);
  };

  const confirmDispatch = () => {
    // Update teams with dispatched status
    const updatedTeams = teams.map(t => {
      if (selectedResourceIds.includes(t.id)) {
        return { ...t, status: 'DEPLOYED' as const, currentAssignment: selectedIncidentId! };
      }
      return t;
    });
    setTeams(updatedTeams);

    const updatedVolunteers = volunteers.map(v => {
      if (selectedResourceIds.includes(v.id)) {
        return { ...v, status: 'assigned' as const };
      }
      return v;
    });
    setVolunteers(updatedVolunteers);

    // In a real app, we would update the incident status via API here
    // For now, we just show the toast
    
    const resourceNames = [
      ...teams.filter(t => selectedResourceIds.includes(t.id)).map(t => t.name),
      ...volunteers.filter(v => selectedResourceIds.includes(v.id)).map(v => v.name)
    ];

    setToastMessage(`${resourceNames.join(', ')} dispatched to ${selectedIncident?.location}`);
    setShowDispatchModal(false);
    setSelectedIncidentId(null);
    setSelectedResourceIds([]);

    setTimeout(() => setToastMessage(null), 3000);
  };

  // Map Markers - Incidents, Teams, and Volunteers
  const mapMarkers = useMemo(() => {
    const incidentMarkers = incidents.map(incident => ({
      id: incident.id,
      position: percentageToLatLng(incident.x, incident.y),
      label: incident.type,
      color: getSeverityMarkerColor(incident.severity)
    }));

    const teamMarkers = teams
      .filter(team => team.location) // Only show teams with locations
      .map(team => ({
        id: team.id,
        position: team.location as [number, number],
        label: team.name,
        color: selectedResourceIds.includes(team.id) ? 'purple' : 
               team.type === 'MEDICAL' ? 'pink' :
               team.type === 'SECURITY' ? 'blue' : 'green'
      }));

    const volunteerMarkers = volunteers
      .filter(volunteer => volunteer.location) // Only show volunteers with locations
      .map(volunteer => {
        // Convert location to array format if needed
        const loc = volunteer.location!;
        const position: [number, number] = Array.isArray(loc)
          ? loc as [number, number]
          : [loc.lat, loc.lng];
        
        return {
          id: volunteer.id,
          position,
          label: volunteer.name,
          color: selectedResourceIds.includes(volunteer.id) ? 'purple' : 'teal'
        };
      });

    return [...incidentMarkers, ...teamMarkers, ...volunteerMarkers];
  }, [incidents, teams, volunteers, selectedResourceIds]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* 1. Header Section */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Dispatch Center</h1>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                LIVE
              </span>
            </div>
            <p className="text-slate-500 text-sm">Central command for incident response</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 2. Top Panel - Incident Map */}
        <div className="h-[400px] shrink-0 relative bg-slate-100 border-b border-slate-200 z-0">
          <LeafletMap 
            markers={mapMarkers}
            zoom={15}
            onMarkerClick={handleIncidentSelect}
            style={{ borderRadius: 0, boxShadow: 'none' }}
            height="400px"
          />
          
          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-2 z-[1000]">
            <div className="font-semibold mb-1 text-slate-700">Incidents</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Critical</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> High</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Low</div>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="font-semibold mb-1 text-slate-700">Resources</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500"></span> Medical</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Security</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Operations</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500"></span> Volunteers</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-300"></span> Selected</div>
          </div>
        </div>

        {/* 3. Middle Panel - Incident Queue */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-b border-slate-200">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Incident Queue ({incidents.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sortedIncidents.map(incident => (
              <div 
                key={incident.id}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-4 ${
                  selectedIncidentId === incident.id 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${incident.status === 'resolved' ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input 
                    type="checkbox"
                    checked={selectedIncidentId === incident.id}
                    onChange={() => handleIncidentSelect(incident.id)}
                    disabled={incident.status === 'resolved'}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase shadow-sm ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{incident.type}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium">{incident.location}</span>
                      {incident.zone && <span className="text-slate-400">• {incident.zone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-bold shadow-sm ${
                    incident.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    incident.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {incident.status.replace('-', ' ')}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncidentId(incident.id);
                      setShowIncidentDrawer(true);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                  >
                    View <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No active incidents</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Bottom Panel - Resource Availability */}
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-50 to-white">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <span>Available Resources</span>
            </h2>
            {selectedIncident && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs text-slate-700 font-semibold">AI Recommends:</span>
                <div className="flex gap-1.5">
                  {getRecommendedResources(selectedIncident.type).map(rec => (
                    <span key={rec} className="text-[10px] bg-white text-indigo-700 border border-indigo-300 px-2 py-1 rounded-md font-bold shadow-sm">
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedIncidentId && (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">Select an incident first</p>
                <p className="text-sm mt-1">Choose an incident from the queue above to view and select available resources</p>
              </div>
            )}
            {selectedIncidentId && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Teams */}
              {teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => team.status === 'AVAILABLE' && selectedIncidentId && handleResourceToggle(team.id, 'team')}
                  className={`p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    selectedResourceIds.includes(team.id)
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-200/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5'
                  } ${
                    team.status !== 'AVAILABLE' ? 'opacity-60' : 
                    selectedIncidentId ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedResourceIds.includes(team.id)}
                      onChange={() => handleResourceToggle(team.id, 'team')}
                      disabled={team.status !== 'AVAILABLE' || !selectedIncidentId}
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{team.name}</h4>
                        <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold shrink-0 shadow-sm border ${
                          team.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          team.status === 'DEPLOYED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {team.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg">
                        {team.type === 'MEDICAL' && <Ambulance className="w-3.5 h-3.5 text-red-500" />}
                        {team.type === 'SECURITY' && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                        {team.type === 'EMERGENCY' && <HardHat className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="font-semibold">{team.activeCount || team.members?.length || 0} Active</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold">{team.idleCount || 0} Idle</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Volunteers */}
              {volunteers.map(volunteer => (
                <div 
                  key={volunteer.id}
                  onClick={() => volunteer.status === 'available' && selectedIncidentId && handleResourceToggle(volunteer.id, 'volunteer')}
                  className={`p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    selectedResourceIds.includes(volunteer.id)
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-200/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-0.5'
                  } ${
                    volunteer.status !== 'available' ? 'opacity-60' : 
                    selectedIncidentId ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedResourceIds.includes(volunteer.id)}
                      onChange={() => handleResourceToggle(volunteer.id, 'volunteer')}
                      disabled={volunteer.status !== 'available' || !selectedIncidentId}
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{volunteer.name}</h4>
                        <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold shrink-0 shadow-sm border ${
                          volunteer.status === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          volunteer.status === 'assigned' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {volunteer.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold">{volunteer.role}</span>
                        </div>
                        {volunteer.distance && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg">
                            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-semibold">{volunteer.distance} away</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Dispatch Action Bar */}
      {selectedIncidentId && selectedResourceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-t-2 border-indigo-500/50 backdrop-blur-sm z-30 animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-400/30">
                  <Flame className="w-5 h-5 text-indigo-400" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">Incident:</span>
                    <span className="font-bold text-base">{selectedIncident?.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2.5 rounded-xl border border-emerald-400/30">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-base">{selectedResourceIds.length}</span>
                  <span className="text-sm text-slate-300">Resource{selectedResourceIds.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setSelectedIncidentId(null);
                    setSelectedResourceIds([]);
                  }}
                  className="px-5 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl font-medium transition-all duration-200 border border-slate-600/30 hover:border-slate-500/50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDispatch}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-indigo-900/60 flex items-center gap-3 border border-indigo-400/30"
                >
                  <Radio className="w-5 h-5" />
                  Dispatch Resources
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Dispatch</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to dispatch <strong>{selectedResourceIds.length} resources</strong> to <strong>{selectedIncident?.type}</strong> at {selectedIncident?.location}?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDispatch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Drawer */}
      {showIncidentDrawer && selectedIncident && (
        <IncidentDrawer 
          incident={{
            ...selectedIncident,
            time: new Date(selectedIncident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: selectedIncident.severity === 'critical' ? 'Critical' : 
                    selectedIncident.severity === 'high' ? 'Critical' :
                    selectedIncident.severity === 'medium' ? 'Warning' : 
                    selectedIncident.status === 'resolved' ? 'Resolved' : 'In Progress'
          }} 
          onClose={() => setShowIncidentDrawer(false)} 
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
