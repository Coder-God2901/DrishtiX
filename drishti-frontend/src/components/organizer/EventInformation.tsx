import { 
  ArrowLeft, 
  Calendar, 
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Activity,
  BarChart3,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface EventInformationProps {
  onBack: () => void;
}

export function EventInformation({ onBack }: EventInformationProps) {
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
                <h1 className="text-slate-900">Event Information</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <Activity className="w-4 h-4" />
                  <span>Live event details and statistics</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Event Header */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
            <h2 className="text-3xl mb-3">Summer Music Festival 2025</h2>
            <div className="flex items-center gap-2 text-purple-100 mb-6">
              <MapPin className="w-4 h-4" />
              <span>Vagator Beach, Goa</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Start Date</span>
                </div>
                <p className="text-xl">15/02/2025, 10:30 PM</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <Clock className="w-4 h-4" />
                  <span>End Date</span>
                </div>
                <p className="text-xl">16/02/2025, 05:00 AM</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <p className="text-xl">Currently Live</p>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div>
            <h3 className="text-slate-900 mb-4">Live Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Current Attendance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Current Attendance</p>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2">38,618</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <span>of 50,000 expected</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '77%' }} />
                </div>
                <p className="text-blue-600 text-sm mt-2">77% capacity</p>
              </div>

              {/* Peak Attendance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Peak Attendance</p>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2">46,000</p>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">92.0% capacity</span>
                </div>
                <p className="text-slate-600 text-sm">All-time high for this event</p>
              </div>

              {/* Check-in Rate */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Check-in Rate</p>
                  <Zap className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2">164/min</p>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-slate-600">Entry throughput</span>
                </div>
                <p className="text-green-600 text-sm">Avg dwell time: 248min</p>
              </div>

              {/* Venue Capacity */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Venue Capacity</p>
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2">50,000</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="px-2 py-1 bg-blue-50 rounded text-center">
                    <p className="text-blue-600">6 Zones</p>
                  </div>
                  <div className="px-2 py-1 bg-purple-50 rounded text-center">
                    <p className="text-purple-600">5 Gates</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3">Maximum venue capacity</p>
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Event Timeline
            </h3>
            <div className="space-y-6">
              {[
                { time: 'Feb 15, 10:30 PM', title: 'Event Start', status: 'completed', icon: <CheckCircle2 className="w-5 h-5" /> },
                { time: 'Feb 15, 11:00 PM', title: 'Opening Performance', status: 'completed', icon: <CheckCircle2 className="w-5 h-5" /> },
                { time: 'Feb 16, 12:30 AM', title: 'Headliner Performance', status: 'live', icon: <Activity className="w-5 h-5" /> },
                { time: 'Feb 16, 02:00 AM', title: 'DJ Set Begins', status: 'upcoming', icon: <Clock className="w-5 h-5" /> },
                { time: 'Feb 16, 05:00 AM', title: 'Event End', status: 'upcoming', icon: <Clock className="w-5 h-5" /> },
              ].map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    event.status === 'completed' ? 'bg-green-100 text-green-600' :
                    event.status === 'live' ? 'bg-purple-100 text-purple-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {event.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-slate-900">{event.title}</p>
                      {event.status === 'live' && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Flow Metrics
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Entry Rate</p>
                    <p className="text-slate-600 text-sm">People per minute</p>
                  </div>
                  <p className="text-3xl text-slate-900">164</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Exit Rate</p>
                    <p className="text-slate-600 text-sm">People per minute</p>
                  </div>
                  <p className="text-3xl text-slate-900">44</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" style={{ width: '44%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Avg Dwell Time</p>
                    <p className="text-slate-600 text-sm">Minutes average</p>
                  </div>
                  <p className="text-3xl text-slate-900">262</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-slate-600">
            <p>Last updated: Just now</p>
            <p className="text-xs text-slate-500 mt-1">Auto-refreshing every 3 seconds • Master Data v2.0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
