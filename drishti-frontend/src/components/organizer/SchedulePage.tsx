import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  Download,
  Upload,
  Sparkles,
  RefreshCw,
  ChevronDown,
  TrendingUp
} from 'lucide-react';

interface SchedulePageProps {
  onBack: () => void;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  team: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  assignedStaff: number;
  requiredStaff: number;
  description?: string;
  priority: 'high' | 'medium' | 'low';
}

export function SchedulePage({ onBack }: SchedulePageProps) {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAIOptimizer, setShowAIOptimizer] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2025-06-20');
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Setup & Registration',
      startTime: '08:00',
      endTime: '10:00',
      location: 'Main Entrance',
      team: 'Registration Team',
      status: 'scheduled',
      assignedStaff: 8,
      requiredStaff: 10,
      description: 'Setup registration booths and welcome attendees',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Opening Ceremony',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Main Stage',
      team: 'Event Coordination',
      status: 'scheduled',
      assignedStaff: 5,
      requiredStaff: 5,
      description: 'Welcome speech and event kickoff',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Main Concert Performance',
      startTime: '15:00',
      endTime: '18:00',
      location: 'Main Stage',
      team: 'Stage Management',
      status: 'scheduled',
      assignedStaff: 12,
      requiredStaff: 15,
      description: 'Headline act performance',
      priority: 'high'
    },
    {
      id: '4',
      title: 'Food & Beverage Service',
      startTime: '12:00',
      endTime: '20:00',
      location: 'Food Court',
      team: 'Hospitality Team',
      status: 'in-progress',
      assignedStaff: 20,
      requiredStaff: 20,
      description: 'Continuous food and beverage service',
      priority: 'medium'
    },
    {
      id: '5',
      title: 'Security Patrol',
      startTime: '08:00',
      endTime: '22:00',
      location: 'All Zones',
      team: 'Security Team',
      status: 'in-progress',
      assignedStaff: 25,
      requiredStaff: 30,
      description: 'Continuous security monitoring',
      priority: 'high'
    },
    {
      id: '6',
      title: 'Medical Standby',
      startTime: '09:00',
      endTime: '21:00',
      location: 'Medical Tent',
      team: 'Medical Team',
      status: 'scheduled',
      assignedStaff: 10,
      requiredStaff: 10,
      description: 'Medical assistance and first aid',
      priority: 'high'
    }
  ]);

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
    'in-progress': 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-green-100 text-green-700 border-green-300'
  };

  const statusIcons = {
    scheduled: Clock,
    'in-progress': AlertCircle,
    completed: CheckCircle
  };

  const handleAIOptimize = () => {
    alert('AI Schedule Optimizer analyzing patterns and generating optimal schedules...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl mb-1 flex items-center gap-2">
                  Schedule Management
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-sm flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered
                  </span>
                </h1>
                <p className="text-blue-100">Summer Music Festival 2025</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAIOptimizer(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                AI Optimize
              </button>
              <button
                onClick={() => setShowAddSchedule(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Events</p>
                <p className="text-2xl text-slate-900">{schedules.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl text-slate-900">
                  {schedules.filter(s => s.status === 'in-progress').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Staff Assigned</p>
                <p className="text-2xl text-slate-900">
                  {schedules.reduce((sum, s) => sum + s.assignedStaff, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Staffing Rate</p>
                <p className="text-2xl text-slate-900">
                  {Math.round(
                    (schedules.reduce((sum, s) => sum + s.assignedStaff, 0) /
                      schedules.reduce((sum, s) => sum + s.requiredStaff, 0)) *
                      100
                  )}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2.5 rounded-xl transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Timeline View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 rounded-xl transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl hover:border-blue-300 transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl hover:border-blue-300 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'timeline' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-6">
              <h3 className="text-slate-900 text-xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Timeline View - {new Date(selectedDate).toLocaleDateString()}
              </h3>

              {/* Timeline */}
              <div className="space-y-4">
                {schedules.map((schedule) => {
                  const StatusIcon = statusIcons[schedule.status];
                  const isUnderStaffed = schedule.assignedStaff < schedule.requiredStaff;

                  return (
                    <div
                      key={schedule.id}
                      className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="h-full w-0.5 bg-slate-200 mt-2 mb-2" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-lg text-slate-900 mb-1">{schedule.title}</h4>
                                  <p className="text-sm text-slate-600 mb-2">{schedule.description}</p>
                                  <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {schedule.startTime} - {schedule.endTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {schedule.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {schedule.team}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1.5 rounded-lg text-xs border ${statusColors[schedule.status]} flex items-center gap-1.5`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {schedule.status}
                                  </span>
                                  <span className={`px-3 py-1.5 rounded-lg text-xs border ${priorityColors[schedule.priority]}`}>
                                    {schedule.priority}
                                  </span>
                                </div>
                              </div>

                              {/* Staff Status */}
                              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-700">Staffing</span>
                                    <span className={`text-sm ${isUnderStaffed ? 'text-red-600' : 'text-green-600'}`}>
                                      {schedule.assignedStaff} / {schedule.requiredStaff}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        isUnderStaffed ? 'bg-red-500' : 'bg-green-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          (schedule.assignedStaff / schedule.requiredStaff) * 100,
                                          100
                                        )}%`
                                      }}
                                    />
                                  </div>
                                </div>
                                {isUnderStaffed && (
                                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all">
                                    Request Staff
                                  </button>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 mt-3">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-all text-sm flex items-center gap-2">
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-red-300 transition-all text-sm flex items-center gap-2 text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => {
              const StatusIcon = statusIcons[schedule.status];
              const isUnderStaffed = schedule.assignedStaff < schedule.requiredStaff;

              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl text-slate-900 mb-1">{schedule.title}</h4>
                      <p className="text-sm text-slate-600">{schedule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs border ${statusColors[schedule.status]} flex items-center gap-1.5`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {schedule.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs border ${priorityColors[schedule.priority]}`}>
                        {schedule.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Time</p>
                      <p className="text-slate-900">{schedule.startTime} - {schedule.endTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Location</p>
                      <p className="text-slate-900">{schedule.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Team</p>
                      <p className="text-slate-900">{schedule.team}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Staff</p>
                      <p className={`${isUnderStaffed ? 'text-red-600' : 'text-green-600'}`}>
                        {schedule.assignedStaff} / {schedule.requiredStaff}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-red-300 transition-all text-sm flex items-center gap-2 text-red-600">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Optimizer Modal */}
      {showAIOptimizer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  AI Schedule Optimizer
                </h2>
                <button
                  onClick={() => setShowAIOptimizer(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 mb-2">AI-Powered Optimization</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Our AI will analyze your event requirements, staff availability, and historical data
                        to generate an optimized schedule that maximizes efficiency and minimizes conflicts.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Automatically resolves scheduling conflicts
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Optimizes staff allocation based on skills
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Suggests break times and shift rotations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Predicts potential bottlenecks
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAIOptimize}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate Optimized Schedule
                  </button>
                  <button
                    onClick={() => setShowAIOptimizer(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
