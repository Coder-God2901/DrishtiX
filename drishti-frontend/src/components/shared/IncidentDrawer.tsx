import { X, Zap, Heart, Shield, Send, Bell, MapPin, Clock, Activity, CheckCircle2 } from 'lucide-react';

interface IncidentDrawerProps {
  incident: any;
  onClose: () => void;
}

export function IncidentDrawer({ incident, onClose }: IncidentDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-slate-900 text-lg">Incident Details</h2>
            <p className="text-slate-600 text-sm mt-0.5">{incident.time}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6">
          {/* Incident Header */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${
                incident.color === 'red' ? 'bg-red-500' :
                incident.color === 'amber' ? 'bg-amber-500' :
                incident.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <h3 className="text-slate-900">{incident.type}</h3>
                <p className="text-slate-600 text-sm mt-1">{incident.location}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                  incident.status === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                  incident.status === 'Warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  incident.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                  'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {incident.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-slate-900 mb-2">Description</h4>
            <p className="text-slate-600 text-sm bg-slate-50 rounded-lg p-3 border border-slate-200">
              {incident.description}
            </p>
          </div>

          {/* AI Analysis */}
          <div>
            <h4 className="text-slate-900 mb-2">AI Analysis</h4>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-700 mt-0.5" />
                <div>
                  <p className="text-blue-900 text-sm">{incident.aiAnalysis}</p>
                  <p className="text-blue-700 text-xs mt-2">Prediction: {incident.prediction}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-slate-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {incident.status === 'Critical' && incident.type.includes('Medical') && (
                <button className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2 justify-center">
                  <Heart className="w-4 h-4" />
                  Dispatch Medical Team
                </button>
              )}
              {incident.type.includes('Security') && (
                <button className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4" />
                  Dispatch Security Team
                </button>
              )}
              {incident.type.includes('Crowd') && (
                <button className="w-full px-4 py-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-2 justify-center">
                  <Send className="w-4 h-4" />
                  Reroute Attendees
                </button>
              )}
              <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2 justify-center">
                <Bell className="w-4 h-4" />
                Broadcast Alert
              </button>
            </div>
          </div>

          {/* Mini Map Preview */}
          <div>
            <h4 className="text-slate-900 mb-2">Location</h4>
            <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <div 
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ 
                  left: `${incident.x}%`, 
                  top: `${incident.y}%`,
                  backgroundColor: incident.color === 'red' ? '#ef4444' :
                                 incident.color === 'amber' ? '#f59e0b' :
                                 incident.color === 'blue' ? '#3b82f6' : '#10b981'
                }}
              />
            </div>
          </div>

          {/* Incident Action Log */}
          <div>
            <h4 className="text-slate-900 mb-3">Action Log</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-900">Incident reported</p>
                  <p className="text-slate-600 text-xs mt-0.5">{incident.time}</p>
                </div>
              </div>
              {incident.status !== 'Resolved' && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                  <Activity className="w-4 h-4 text-blue-700 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-blue-900">AI monitoring active</p>
                    <p className="text-blue-700 text-xs mt-0.5">Real-time analysis in progress</p>
                  </div>
                </div>
              )}
              {incident.status === 'Resolved' && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg text-sm border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-emerald-900">Incident resolved</p>
                    <p className="text-emerald-700 text-xs mt-0.5">No further action required</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
