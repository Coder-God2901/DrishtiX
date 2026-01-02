import { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Award,
  Briefcase,
  UserPlus,
} from 'lucide-react';

interface VolunteerManagementPageProps {
  onBack: () => void;
}

interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'waitlisted';
  appliedAt: string;
}

export function VolunteerManagementPage({ onBack }: VolunteerManagementPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [applications] = useState<VolunteerApplication[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      role: 'Security',
      status: 'pending',
      appliedAt: '2024-12-05T10:30:00',
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      role: 'Medical',
      status: 'approved',
      appliedAt: '2024-12-04T14:20:00',
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      email: 'emma.r@example.com',
      role: 'Coordination',
      status: 'under-review',
      appliedAt: '2024-12-06T09:15:00',
    },
  ]);

  const filtered = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      app.name.toLowerCase().includes(q) || app.role.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statusClasses: Record<VolunteerApplication['status'], string> = {
    pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    'under-review': 'bg-blue-50 text-blue-800 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-50 text-red-800 border-red-200',
    waitlisted: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const statusLabel: Record<VolunteerApplication['status'], string> = {
    pending: 'Pending review',
    'under-review': 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
    waitlisted: 'Waitlisted',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Volunteer Management
            </h1>
            <p className="text-slate-600 text-sm">
              Track applications, manage roles, and approve volunteers for this event.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create volunteer role
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-7 h-7 text-indigo-600" />
              <span className="text-2xl text-slate-900">{applications.length}</span>
            </div>
            <p className="text-slate-600 text-sm">Total applications</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
              <span className="text-2xl text-slate-900">
                {applications.filter((a) => a.status === 'approved').length}
              </span>
            </div>
            <p className="text-slate-600 text-sm">Approved volunteers</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-7 h-7 text-amber-600" />
              <span className="text-2xl text-slate-900">
                {applications.filter((a) => a.status === 'pending' || a.status === 'under-review').length}
              </span>
            </div>
            <p className="text-slate-600 text-sm">Awaiting decision</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-7 h-7 text-purple-600" />
              <span className="text-2xl text-slate-900">4</span>
            </div>
            <p className="text-slate-600 text-sm">Roles in high demand</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, or email"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg flex items-center gap-2 text-slate-600 hover:bg-slate-50"
            >
              <Filter className="w-4 h-4" />
              Advanced filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            {['all', 'pending', 'under-review', 'approved', 'rejected', 'waitlisted'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Applications table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Volunteer</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Applied at</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b last:border-b-0 border-slate-100">
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-medium">{app.name}</span>
                      <span className="text-slate-500 text-xs">{app.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{app.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 text-xs">
                    {new Date(app.appliedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${
                        statusClasses[app.status]
                      }`}
                    >
                      {app.status === 'pending' && <Clock className="w-3 h-3" />}
                      {app.status === 'under-review' && <AlertCircle className="w-3 h-3" />}
                      {app.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {app.status === 'waitlisted' && <Clock className="w-3 h-3" />}
                      {statusLabel[app.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-slate-500 text-sm" colSpan={5}>
                    No applications match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
