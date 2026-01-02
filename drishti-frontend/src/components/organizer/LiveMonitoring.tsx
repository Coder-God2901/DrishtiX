import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Users, 
  Ambulance,
  Clock,
  Radio,
  DoorOpen,
  Boxes,
  Flame,
  Bell,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Eye,
  ChevronRight,
  Navigation,
  Cloud,
  CloudRain,
  ArrowUp,
  ArrowDown,
  UserCheck
} from 'lucide-react';
import { useIncidents } from '../../services/incidentContext';
import { LeafletMap } from '../shared/LeafletMap';
import { IncidentDrawer } from '../shared/IncidentDrawer';
import { Incident } from '../../services/incidentManagementService';

interface LiveMonitoringProps {
  onBack: () => void;
  setCurrentView?: (view: string) => void;
}

interface LiveKPI {
  criticalIncidents: number;
  warnings: number;
  safeZones: number;
  currentAttendance: number;
  activeTeams: number;
}

interface ActivityLogEntry {
  id: string;
  type: 'incident' | 'team-dispatch' | 'gate' | 'alert';
  message: string;
  timestamp: Date;
  icon: React.ElementType;
}

interface TeamMarker {
  id: string;
  name: string;
  position: [number, number];
  status: 'active' | 'idle';
  type: 'medical' | 'security' | 'operations';
}

// Mock hook for live monitoring data
function useLiveMonitoringMock() {
  const [kpis, setKpis] = useState<LiveKPI>({
    criticalIncidents: 3,
    warnings: 7,
    safeZones: 12,
    currentAttendance: 12847,
    activeTeams: 8
  });

  const [attendanceFlow, setAttendanceFlow] = useState({ inflow: 142, outflow: -87 });
  const [gateStatus] = useState({ closed: 1, congested: 2, normal: 5 });
  const [teamBreakdown] = useState({
    medical: { active: 5, idle: 2 },
    security: { active: 8, idle: 1 },
    volunteers: { active: 12, idle: 0 }
  });
  const [weather] = useState({
    condition: 'Partly cloudy',
    temperature: 72,
    rainProbability: 20
  });

  const [teams, setTeams] = useState<TeamMarker[]>([
    { id: 't1', name: 'Medical Alpha', position: [19.075, 72.876], status: 'active', type: 'medical' },
    { id: 't2', name: 'Security Delta', position: [19.077, 72.875], status: 'active', type: 'security' },
    { id: 't3', name: 'Ops Team 1', position: [19.079, 72.878], status: 'idle', type: 'operations' }
  ]);

  // Simulate KPI updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const inflowChange = Math.floor(Math.random() * 30 + 120);
      const outflowChange = Math.floor(Math.random() * 30 + 70);
      setAttendanceFlow({ inflow: inflowChange, outflow: -outflowChange });
      
      setKpis(prev => ({
        ...prev,
        criticalIncidents: Math.max(0, prev.criticalIncidents + (Math.random() > 0.7 ? 1 : -1)),
        warnings: Math.max(0, prev.warnings + (Math.random() > 0.5 ? 1 : -1)),
        currentAttendance: Math.max(10000, prev.currentAttendance + inflowChange - outflowChange)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate team movement every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTeams(prev => prev.map(team => ({
        ...team,
        position: [
          team.position[0] + (Math.random() - 0.5) * 0.0005,
          team.position[1] + (Math.random() - 0.5) * 0.0005
        ] as [number, number]
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { kpis, teams, attendanceFlow, gateStatus, teamBreakdown, weather };
}

// Helper to convert incident percentage coords to lat/lng
const percentageToLatLng = (x?: number, y?: number): [number, number] => {
  const baseLat = 19.076;
  const baseLng = 72.8777;
  const latRange = 0.009;
  const lngRange = 0.009;
  
  if (x === undefined || y === undefined) {
    return [baseLat, baseLng];
  }
  
  const lat = baseLat + (y / 100) * latRange - (latRange / 2);
  const lng = baseLng + (x / 100) * lngRange - (lngRange / 2);
  
  return [lat, lng];
};

export function LiveMonitoring({ onBack, setCurrentView }: LiveMonitoringProps) {
  const { incidents } = useIncidents();
  const { kpis, teams, attendanceFlow, gateStatus, teamBreakdown, weather } = useLiveMonitoringMock();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [showIncidentDrawer, setShowIncidentDrawer] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([
    {
      id: 'log-1',
      type: 'incident',
      message: 'Critical incident reported at Main Stage Area',
      timestamp: new Date(Date.now() - 120000),
      icon: AlertTriangle
    },
    {
      id: 'log-2',
      type: 'team-dispatch',
      message: 'Medical Alpha dispatched to Zone A',
      timestamp: new Date(Date.now() - 60000),
      icon: Ambulance
    }
  ]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new incidents every 30-60 seconds
  // TODO: Replace with WebSocket subscription to /ws/live-events
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5 && incidents.length > 0) {
        const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];
        const newEntry: ActivityLogEntry = {
          id: `log-${Date.now()}`,
          type: 'incident',
          message: `New ${randomIncident.severity} incident: ${randomIncident.type}`,
          timestamp: new Date(),
          icon: AlertTriangle
        };
        setActivityLog(prev => [newEntry, ...prev].slice(0, 10));
      }
    }, 40000);

    return () => clearInterval(interval);
  }, [incidents]);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  // Sort incidents by severity
  const sortedIncidents = useMemo(() => {
    return [...incidents]
      .filter(i => i.status !== 'resolved')
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }, [incidents]);

  // Map markers
  const mapMarkers = useMemo(() => {
    const incidentMarkers = incidents
      .filter(i => i.status !== 'resolved')
      .map(incident => ({
        id: incident.id,
        position: percentageToLatLng(incident.x, incident.y),
        label: incident.type,
        color: incident.severity === 'critical' ? 'red' :
               incident.severity === 'high' ? 'orange' :
               incident.severity === 'medium' ? 'yellow' : 'blue'
      }));

    const teamMarkers = teams.map(team => ({
      id: team.id,
      position: team.position,
      label: team.name,
      color: team.type === 'medical' ? 'pink' :
             team.type === 'security' ? 'blue' : 'green'
    }));

    return [...incidentMarkers, ...teamMarkers];
  }, [incidents, teams]);

  const handleIncidentClick = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      // Navigate to Alerts Center to view full incident details
      if (setCurrentView) {
        setCurrentView('alerts');
      }
      
      const newEntry: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        type: 'incident',
        message: `Navigated to Alerts: ${incident.type} at ${incident.location}`,
        timestamp: new Date(),
        icon: Navigation
      };
      setActivityLog(prev => [newEntry, ...prev].slice(0, 10));
    }
  };

  const handleQuickAction = (action: string, route: string) => {
    // Navigate to the control module
    if (setCurrentView) {
      setCurrentView(route as any);
    }
    
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      type: 'alert',
      message: `Navigated to ${action}`,
      timestamp: new Date(),
      icon: Navigation
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 10));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
      {/* 1️⃣ Header Section - Sticky */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">Live Monitoring</h1>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-red-200">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                      LIVE
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">Observe live conditions, incidents, and teams. Take action via dedicated control modules.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700">Live Feed Active</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* 2️⃣ Live Status KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-red-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Critical Incidents</span>
            </div>
            <p className="text-4xl font-bold text-red-600">{kpis.criticalIncidents}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Flame className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Warnings</span>
            </div>
            <p className="text-4xl font-bold text-amber-600">{kpis.warnings}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-emerald-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Safe Zones</span>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{kpis.safeZones}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Attendance</span>
            </div>
            <p className="text-4xl font-bold text-blue-600">{kpis.currentAttendance.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Live count • updates every 5s</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-purple-200 p-4 shadow-sm hover:shadow-md transition-all" title="Teams currently deployed or on standby">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Ambulance className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Active Teams</span>
            </div>
            <p className="text-4xl font-bold text-purple-600">{kpis.activeTeams}</p>
            <p className="text-xs text-slate-500 mt-1">Deployed or on standby</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Map + Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3️⃣ Central Live Map */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Live Venue Map</h2>
                    <p className="text-xs text-blue-100">Click markers to view incident or team details</p>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded text-white">Incidents</span>
                  <span className="bg-white/20 px-2 py-1 rounded text-white">Teams</span>
                  <span className="bg-white/20 px-2 py-1 rounded text-white">Density</span>
                </div>
              </div>
              <div className="h-[500px]">
                <LeafletMap 
                  markers={mapMarkers}
                  zoom={15}
                  onMarkerClick={handleIncidentClick}
                  height="500px"
                />
              </div>
            </div>

            {/* 5️⃣ Quick Live Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickAction('Incident Center', 'alerts')}
                  className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Bell className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">Incident Center</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleQuickAction('Dispatch Center', 'dispatch-center')}
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Radio className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">Dispatch Center</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleQuickAction('Heatmap View', 'live-heatmap')}
                  className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Flame className="w-6 h-6 text-amber-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">Heatmap View</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleQuickAction('Gate Control', 'gate-control')}
                  className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <DoorOpen className="w-6 h-6 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">Gate Control</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleQuickAction('Digital Twin Live', 'digital-twin-live')}
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Boxes className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">Digital Twin</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleQuickAction('AI Command', 'ai-command')}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <Shield className="w-6 h-6 text-indigo-600 mb-2" />
                  <p className="text-sm font-bold text-slate-900">AI Command</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Team Status Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ambulance className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Medical Teams</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-600">{teamBreakdown.medical.active}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-400">{teamBreakdown.medical.idle}</span>
                    <span className="text-xs text-slate-500">Idle</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Security Teams</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-600">{teamBreakdown.security.active}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-400">{teamBreakdown.security.idle}</span>
                    <span className="text-xs text-slate-500">Idle</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Volunteers</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-600">{teamBreakdown.volunteers.active}</span>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gate Status & Attendance Analytics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <DoorOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Gate Status Overview</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">🔴 Closed</span>
                    <span className="text-lg font-bold text-red-600">{gateStatus.closed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">🟠 Congested</span>
                    <span className="text-lg font-bold text-amber-600">{gateStatus.congested}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">🟢 Normal</span>
                    <span className="text-lg font-bold text-emerald-600">{gateStatus.normal}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Attendance Analytics</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Current</span>
                    <span className="text-lg font-bold text-blue-600">{kpis.currentAttendance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-slate-600">Inflow</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">+{attendanceFlow.inflow}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-slate-600">Outflow</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{attendanceFlow.outflow}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Incident Feed + Weather + Activity Log */}
          <div className="space-y-6">{/* 4️⃣ Live Incident Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Live Incidents</h2>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white font-bold">
                  {sortedIncidents.length} Active
                </span>
              </div>
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {sortedIncidents.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                    <p className="text-sm font-semibold">No active incidents</p>
                    <p className="text-xs">All clear at this moment</p>
                  </div>
                )}
                {sortedIncidents.map((incident, idx) => {
                  // Add severity group headers
                  const prevIncident = sortedIncidents[idx - 1];
                  const showGroupHeader = !prevIncident || prevIncident.severity !== incident.severity;
                  const groupLabel = incident.severity === 'critical' ? '🔴 Critical Incidents' :
                                     incident.severity === 'high' ? '🟠 High Priority' :
                                     incident.severity === 'medium' ? '🟡 Medium Priority' : '🟢 Low Priority';
                  
                  return (
                    <React.Fragment key={incident.id}>
                      {showGroupHeader && (
                        <div className="pt-3 pb-2 -mx-4 px-4 border-t border-slate-200 first:border-t-0 first:pt-0">
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">{groupLabel}</h4>
                        </div>
                      )}
                      <div 
                        onClick={() => handleIncidentClick(incident.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      selectedIncidentId === incident.id
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{incident.type}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{incident.location}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      incident.status === 'active' ? 'bg-red-100 text-red-700' :
                      incident.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {incident.status.replace('-', ' ')}
                    </span>
                  </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Weather Conditions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Cloud className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">Weather Conditions</h3>
                  <p className="text-xl font-bold text-blue-900">{weather.condition}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-blue-900">{weather.temperature}°F</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                    <CloudRain className="w-4 h-4" />
                    <span>{weather.rainProbability}% rain probability</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6️⃣ Live Activity Log */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Log
                </h2>
              </div>
              <div className="h-[300px] overflow-y-auto p-4 space-y-2">
                {activityLog.map(entry => {
                  const Icon = entry.icon;
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{entry.message}</p>
                        <p className="text-xs text-slate-500">
                          {entry.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
