import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/event.service';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Ambulance,
  UserCheck,
  DoorOpen,
  Grid3x3,
  Map,
  Radio,
  Activity,
  Clock,
  ArrowRight,
  MapPinned,
  Layers,
  Navigation,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface EventOverviewProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

interface KPICard {
  id: string;
  label: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ElementType;
  onClick?: () => void;
}

interface ReadinessItem {
  id: string;
  label: string;
  status: 'complete' | 'incomplete';
  route?: string;
  description: string;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'edit' | 'assignment' | 'schedule' | 'approval';
  icon: React.ElementType;
}

// API data
function useEventOverviewData(eventId?: string) {
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState({
    name: '',
    status: 'draft' as 'draft' | 'scheduled' | 'live',
    date: '',
    time: '',
    venue: '',
    city: '',
  });

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await eventService.getEvent(eventId);
      const e = response.data;
      const startDate = new Date(e.startTime);
      const endDate = new Date(e.endTime);
      setEventData({
        name: e.name,
        status: e.status === 'ACTIVE' ? 'live' : e.status === 'SCHEDULED' ? 'scheduled' : 'draft',
        date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        venue: e.venue || '',
        city: e.location || '',
      });
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  const [kpis] = useState<KPICard[]>([
    {
      id: 'attendees',
      label: 'Total Registered',
      value: '12,847',
      status: 'healthy',
      icon: Users,
    },
    {
      id: 'peak',
      label: 'Expected Peak',
      value: '15,000',
      status: 'healthy',
      icon: TrendingUp,
    },
    {
      id: 'zones',
      label: 'Zones Configured',
      value: '15',
      status: 'healthy',
      icon: Grid3x3,
    },
    {
      id: 'gates',
      label: 'Gates Setup',
      value: '8',
      status: 'healthy',
      icon: DoorOpen,
    },
    {
      id: 'teams',
      label: 'Teams Assigned',
      value: '12',
      status: 'healthy',
      icon: Shield,
    },
    {
      id: 'volunteers',
      label: 'Volunteers Active',
      value: '45',
      status: 'warning',
      icon: UserCheck,
    },
  ]);

  const [readinessChecklist] = useState<ReadinessItem[]>([
    {
      id: 'venue',
      label: 'Venue Mapped',
      status: 'complete',
      route: 'venue-mapping',
      description: 'Venue layout and zones configured',
    },
    {
      id: 'teams',
      label: 'Teams Assigned',
      status: 'complete',
      route: 'teams-setup',
      description: 'Security, medical, and support teams deployed',
    },
    {
      id: 'volunteers',
      label: 'Volunteers Approved',
      status: 'incomplete',
      route: 'volunteer-management',
      description: '5 volunteers pending approval',
    },
    {
      id: 'routes',
      label: 'Emergency Routes Defined',
      status: 'complete',
      route: 'venue-mapping',
      description: 'Evacuation paths and exits marked',
    },
    {
      id: 'digital-twin',
      label: 'Digital Twin Configured',
      status: 'incomplete',
      route: 'digital-twin',
      description: 'Digital twin simulation not yet set up',
    },
    {
      id: 'analytics',
      label: 'Analytics Setup',
      status: 'complete',
      route: 'analytics-setup',
      description: 'Crowd analytics and monitoring configured',
    },
  ]);

  const [activityLog] = useState<ActivityLog[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      message: 'Updated venue capacity to 20,000',
      type: 'edit',
      icon: MapPin,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      message: 'Assigned 3 medical teams to Zone A',
      type: 'assignment',
      icon: Ambulance,
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      message: 'Schedule updated: Gates open at 5:00 PM',
      type: 'schedule',
      icon: Clock,
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      message: 'Approved 12 volunteers for food zone',
      type: 'approval',
      icon: CheckCircle2,
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 240),
      message: 'Added emergency exit route via Gate D',
      type: 'edit',
      icon: Navigation,
    },
  ]);

  return { eventData, kpis, readinessChecklist, activityLog };
}

export function EventOverview({ onBack, onNavigate }: EventOverviewProps) {
  const { eventData, kpis, readinessChecklist, activityLog } = useEventOverviewData();

  const getStatusColor = (status: 'draft' | 'scheduled' | 'live') => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'draft':
        return 'bg-slate-400 text-white';
    }
  };

  const getKPIColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'border-emerald-200 bg-emerald-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
    }
  };

  const getKPIIconColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-100 text-emerald-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'critical':
        return 'bg-red-100 text-red-600';
    }
  };

  const incompleteItems = readinessChecklist.filter((item) => item.status === 'incomplete').length;
  const isReadyToLaunch = incompleteItems === 0;

  const handleGoLive = () => {
    onNavigate('go-live');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-1">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-slate-900">{eventData.name}</h1>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${getStatusColor(eventData.status)}`}
                  >
                    {eventData.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{eventData.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{eventData.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{eventData.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Go Live Button */}
            <button
              onClick={handleGoLive}
              disabled={eventData.status === 'live'}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                eventData.status === 'live'
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : !isReadyToLaunch
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
              }`}
              title={
                eventData.status === 'live'
                  ? 'Event already live'
                  : !isReadyToLaunch
                    ? `Warning: ${incompleteItems} checklist item${incompleteItems > 1 ? 's' : ''} incomplete`
                    : 'Start live monitoring & operations'
              }
            >
              <Radio className="w-5 h-5" />
              {eventData.status === 'live' ? 'LIVE NOW' : 'Go Live'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Key Metrics Grid */}
        <div>
          <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-3">Key Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const isWarning = kpi.status === 'warning';
              return (
                <div
                  key={kpi.id}
                  className="bg-white rounded-lg border border-slate-200 p-5 cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
                  onClick={kpi.onClick}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${isWarning ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      <Icon className={`w-5 h-5 ${isWarning ? 'text-amber-600' : 'text-slate-600'}`} />
                    </div>
                    {isWarning && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        Attention
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-semibold text-slate-900 mb-1">{kpi.value}</p>
                  <p className="text-sm text-slate-600">{kpi.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Readiness Checklist - High Priority Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide">Event Readiness</h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{
                    width: `${(readinessChecklist.filter((i) => i.status === 'complete').length / readinessChecklist.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {readinessChecklist.filter((i) => i.status === 'complete').length} / {readinessChecklist.length}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {readinessChecklist.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {item.status === 'complete' ? (
                        <div className="p-1 bg-emerald-50 rounded-full mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="p-1 bg-amber-50 rounded-full mt-0.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-slate-900">{item.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    {item.status === 'incomplete' && item.route && (
                      <button
                        onClick={() => onNavigate(item.route!)}
                        className="text-xs border border-amber-500 text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap"
                      >
                        Fix Now
                      </button>
                    )}
                    {item.status === 'complete' && (
                      <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">Complete</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left - Venue Snapshot */}
          <div>
            <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-3">Venue Overview</h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Venue Snapshot
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 rounded-lg border border-slate-200 h-[240px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-8 left-8 w-20 h-20 bg-emerald-500 rounded"></div>
                    <div className="absolute top-8 right-8 w-24 h-24 bg-amber-500 rounded"></div>
                    <div className="absolute bottom-8 left-16 w-22 h-22 bg-blue-500 rounded"></div>
                    <div className="absolute bottom-8 right-12 w-16 h-16 bg-red-500 rounded"></div>
                  </div>
                  <div className="relative text-center z-10">
                    <MapPinned className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-900 font-medium mb-1">15 Zones Configured</p>
                    <p className="text-xs text-slate-500">8 Gates • 12 Teams • 45 Volunteers</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('venue-mapping')}
                  className="mt-4 w-full text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 py-2 rounded-md font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  View Full Map
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right - Recent Activity */}
          <div>
            <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-3">Recent Activity</h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-5 py-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity Log
                </h3>
              </div>
              <div className="h-[340px] overflow-y-auto divide-y divide-slate-100">
                {activityLog.map((log) => {
                  const Icon = log.icon;
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-slate-100 rounded-md mt-0.5 flex-shrink-0">
                          <Icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 leading-snug">{log.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {log.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            •{' '}
                            {log.timestamp.toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
