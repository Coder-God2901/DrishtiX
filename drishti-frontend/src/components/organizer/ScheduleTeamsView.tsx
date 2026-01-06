import { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  CheckCircle,
  Save,
  Download,
  Upload,
  
} from 'lucide-react';

interface ScheduleTeamsViewProps {
  onBack: () => void;
}

interface Team {
  id: string;
  name: string;
  members: number;
  role: string;
  status: 'active' | 'inactive';
  color: string;
}

export function ScheduleTeamsView({ onBack }: ScheduleTeamsViewProps) {
  const [showAddTeam, setShowAddTeam] = useState(false);

  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Registration Team', members: 10, role: 'Guest Services', status: 'active', color: 'blue' },
    { id: '2', name: 'Event Coordination', members: 5, role: 'Management', status: 'active', color: 'purple' },
    { id: '3', name: 'Stage Management', members: 15, role: 'Production', status: 'active', color: 'indigo' },
    { id: '4', name: 'Hospitality Team', members: 20, role: 'F&B Services', status: 'active', color: 'emerald' },
    { id: '5', name: 'Security Team', members: 25, role: 'Safety & Security', status: 'active', color: 'red' },
    { id: '6', name: 'Medical Response', members: 8, role: 'Health Services', status: 'active', color: 'rose' }
  ]);

  const getTeamColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600',
      emerald: 'from-emerald-500 to-emerald-600',
      red: 'from-red-500 to-red-600',
      rose: 'from-rose-500 to-rose-600'
    };
    return colors[color] || colors.blue;
  };

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
                <Users className="w-6 h-6 text-indigo-600" />
                Teams Setup
              </h1>
              <p className="text-slate-600 text-sm">Manage event teams and member assignments</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl text-slate-900">{teams.length}</span>
                </div>
                <p className="text-slate-600 text-sm">Total Teams</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <UserPlus className="w-8 h-8 text-green-600" />
                  <span className="text-2xl text-slate-900">
                    {teams.reduce((sum, t) => sum + t.members, 0)}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">Total Members</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                  <span className="text-2xl text-slate-900">
                    {teams.filter(t => t.status === 'active').length}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">Active Teams</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl text-slate-900">
                    {Math.round(teams.reduce((sum, t) => sum + t.members, 0) / teams.length)}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">Avg Team Size</p>
              </div>
            </div>

            {/* Add Team Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-slate-900 text-xl">Event Teams</h2>
              <button
                onClick={() => setShowAddTeam(!showAddTeam)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Team
              </button>
            </div>

            {/* Add Team Form */}
            {showAddTeam && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 animate-in fade-in slide-in-from-top duration-300">
                <h3 className="text-slate-900 mb-4">Create New Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Team Name"
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Role/Department"
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Number of Members"
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select Color</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="red">Red</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowAddTeam(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all">
                    Create Team
                  </button>
                </div>
              </div>
            )}

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div
                  key={team.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getTeamColor(team.color)} rounded-xl flex items-center justify-center`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {team.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-slate-900 mb-1">{team.name}</h3>
                  <p className="text-slate-600 text-sm mb-4">{team.role}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{team.members} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}
