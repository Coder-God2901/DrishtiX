import { useState } from 'react';
import {
  ArrowLeft,
  Rocket,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Activity,
  Users,
  MapPin,
  Shield,
  Radio,
  Wifi,
  Database,
  Server,
  Eye,
  Bell
} from 'lucide-react';

interface GoLiveViewProps {
  onBack: () => void;
}

interface SystemCheck {
  id: string;
  name: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  icon: any;
  details?: string;
}

export function GoLiveView({ onBack }: GoLiveViewProps) {
  const [isLive, setIsLive] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    {
      id: '1',
      name: 'Venue Mapping',
      description: 'Venue boundaries and zones configured',
      status: 'success',
      icon: MapPin,
      details: '12 zones mapped, 8 gates configured'
    },
    {
      id: '2',
      name: 'Team Assignment',
      description: 'Staff and volunteers assigned',
      status: 'warning',
      icon: Users,
      details: '85% staffing complete (3 positions vacant)'
    },
    {
      id: '3',
      name: 'Safety Systems',
      description: 'Emergency protocols enabled',
      status: 'success',
      icon: Shield,
      details: 'Medical response, evacuation routes active'
    },
    {
      id: '4',
      name: 'Analytics Dashboard',
      description: 'Monitoring systems configured',
      status: 'success',
      icon: Activity,
      details: '8 metrics tracking, 3 dashboards ready'
    },
    {
      id: '5',
      name: 'Communication Systems',
      description: 'Notification channels active',
      status: 'success',
      icon: Radio,
      details: 'SMS, Push, Email alerts configured'
    },
    {
      id: '6',
      name: 'Network Connectivity',
      description: 'Internet and local network status',
      status: 'success',
      icon: Wifi,
      details: 'All access points operational'
    },
    {
      id: '7',
      name: 'Database Systems',
      description: 'Data storage and backup systems',
      status: 'success',
      icon: Database,
      details: 'Primary and backup databases synced'
    },
    {
      id: '8',
      name: 'Live Monitoring',
      description: 'Real-time tracking systems',
      status: 'success',
      icon: Eye,
      details: 'Heatmap, crowd analytics ready'
    }
  ]);

  const handleGoLive = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setIsLive(true);
    }, 3000);
  };

  const handleStopEvent = () => {
    if (confirm('Are you sure you want to stop the live event? This will deactivate all real-time monitoring.')) {
      setIsLive(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400 animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const successCount = systemChecks.filter(c => c.status === 'success').length;
  const warningCount = systemChecks.filter(c => c.status === 'warning').length;
  const errorCount = systemChecks.filter(c => c.status === 'error').length;
  const readiness = Math.round((successCount / systemChecks.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-indigo-600" />
                Go Live
              </h1>
              <p className="text-slate-600 text-sm">Launch your event and activate real-time monitoring</p>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span>Event is Live</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Launch Status */}
        {isLaunching && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-12 mb-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Rocket className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-slate-900 text-3xl mb-3">Launching Event...</h2>
            <p className="text-slate-600 text-lg mb-6">Activating all systems and starting real-time monitoring</p>
            <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-3">
              <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        )}

        {/* Live Status */}
        {isLive && !isLaunching && (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Activity className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-3xl mb-1">Event is Live!</h2>
                    <p className="text-green-100">All systems operational • Real-time monitoring active</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>8,432 attendees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span>12 active sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>All safety systems active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleStopEvent}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all flex items-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Stop Event
              </button>
            </div>
          </div>
        )}

        {/* Readiness Score */}
        {!isLive && !isLaunching && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-slate-900 text-2xl mb-2">System Readiness</h2>
                <p className="text-slate-600">Pre-launch system checks and validation</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-2">
                  <span className={`${
                    readiness >= 90 ? 'text-green-600' :
                    readiness >= 70 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{readiness}%</span>
                </div>
                <p className="text-slate-600 text-sm">Ready to Launch</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl text-green-700 mb-1">{successCount}</p>
                <p className="text-green-600 text-sm">Ready</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl text-amber-700 mb-1">{warningCount}</p>
                <p className="text-amber-600 text-sm">Warnings</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl text-red-700 mb-1">{errorCount}</p>
                <p className="text-red-600 text-sm">Errors</p>
              </div>
            </div>

            {readiness < 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-900 mb-1">Some systems require attention</p>
                    <p className="text-amber-700 text-sm">
                      Please review warnings below. You can launch with warnings, but it&apos;s recommended to resolve them first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleGoLive}
              disabled={errorCount > 0}
              className={`w-full py-4 rounded-xl text-white text-lg transition-all flex items-center justify-center gap-3 ${
                errorCount > 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              <Play className="w-6 h-6" />
              {errorCount > 0 ? 'Fix Errors to Launch' : 'Launch Event Live'}
            </button>
          </div>
        )}

        {/* System Checks */}
        <div className="space-y-4">
          <h3 className="text-slate-900 text-xl mb-4">System Status Checks</h3>
          
          {systemChecks.map(check => {
            const Icon = check.icon;
            return (
              <div
                key={check.id}
                className={`bg-white rounded-xl shadow-sm border-2 ${getStatusColor(check.status)} p-6 transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-slate-900 text-lg">{check.name}</h4>
                        {getStatusIcon(check.status)}
                      </div>
                      <p className="text-slate-600 mb-2">{check.description}</p>
                      {check.details && (
                        <p className="text-slate-500 text-sm">{check.details}</p>
                      )}
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm px-3 py-1 hover:bg-blue-50 rounded-lg transition-all">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Monitoring Preview */}
        {isLive && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-slate-900 text-xl mb-2">Live Monitoring Dashboard</h3>
                <p className="text-slate-600">Real-time event metrics and analytics</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Open Full Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">8,432</p>
                <p className="text-slate-600 text-sm">Total Attendees</p>
                <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
                  <Activity className="w-3 h-3" />
                  <span>+127 in last 5 min</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <Activity className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">12</p>
                <p className="text-slate-600 text-sm">Active Sessions</p>
                <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
                  <CheckCircle className="w-3 h-3" />
                  <span>All on schedule</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <MapPin className="w-8 h-8 text-amber-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">65%</p>
                <p className="text-slate-600 text-sm">Crowd Density</p>
                <div className="flex items-center gap-1 text-amber-600 text-xs mt-2">
                  <Activity className="w-3 h-3" />
                  <span>Moderate levels</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4">
                <Shield className="w-8 h-8 text-rose-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">2</p>
                <p className="text-slate-600 text-sm">Active Alerts</p>
                <div className="flex items-center gap-1 text-slate-600 text-xs mt-2">
                  <Bell className="w-3 h-3" />
                  <span>Low priority</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
