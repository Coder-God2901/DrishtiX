import { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  Edit2, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Copy,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { EventTypeSelection } from './EventTypeSelection';

interface MyEventsViewProps {
  // props if needed
}

export function MyEventsView(props: MyEventsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEventTypeSelection, setShowEventTypeSelection] = useState(false);

  const events = [
    {
      title: 'Summer Music Festival 2023',
      date: 'Jun 20, 2025',
      location: 'Bayfront Berch, USA',
      capacity: '10,000',
      ticketsSold: 9485,
      status: 'In Progress',
      progress: 95,
      color: 'emerald',
    },
    {
      title: 'Tech Conference 2025',
      date: 'Nov 15, 2025',
      location: 'Innovation Convention Center',
      capacity: '3,000',
      ticketsSold: 2340,
      status: 'Confirmed',
      progress: 78,
      color: 'blue',
    },
    {
      title: 'City Marathon',
      date: 'Jun 10, 2025',
      location: '',
      capacity: '5,000',
      ticketsSold: 1650,
      status: 'Waitlist',
      progress: 33,
      color: 'red',
    },
    {
      title: 'Food & Wine Expo',
      date: 'Nov 25, 2025',
      location: 'Event Plaza Center',
      capacity: '2,500',
      ticketsSold: 1725,
      status: 'Edit',
      progress: 69,
      color: 'amber',
    },
  ];

  const statCards = [
    { icon: <Calendar className="w-5 h-5" />, label: 'Total Events', value: '4', color: 'blue' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Venues Mapped', value: '3', color: 'indigo' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Avg Completion', value: '70%', color: 'emerald' },
  ];

  const tabs = [
    { label: 'My Events', active: true },
    { label: 'Event Workflow', active: false },
    { label: 'Management Tools', active: false },
  ];

  const filterTabs = ['Draft', 'Scheduled', 'Live'];

  if (showEventTypeSelection) {
    return <EventTypeSelection onSelectType={(type) => {
      console.log('Selected event type:', type);
      // Handle event type selection - could navigate to event creation form
      setShowEventTypeSelection(false);
    }} onBack={() => setShowEventTypeSelection(false)} />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-slate-900 text-xl">My Events</h3>
          <p className="text-slate-600 text-sm mt-1">Manage all your events in one place</p>
        </div>
        <button
          onClick={() => setShowEventTypeSelection(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-lg ${
              stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              stat.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
              'bg-emerald-100 text-emerald-600'
            } flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
            <p className="text-slate-900 text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex gap-2 mb-6 border-b border-slate-200 -mx-6 px-6 pb-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                tab.active
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search events by title..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex gap-2">
              {filterTabs.map((filter, index) => (
                <button
                  key={index}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all duration-200"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-slate-900">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      event.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      event.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      event.color === 'red' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Date</p>
                      <p className="text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {event.date}
                      </p>
                    </div>
                    {event.location && (
                      <div>
                        <p className="text-slate-500 mb-1">Location</p>
                        <p className="text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {event.location}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500 mb-1">Capacity</p>
                      <p className="text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        {event.capacity}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Venue Progress</p>
                      <p className="text-slate-900">{event.progress}%</p>
                    </div>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  event.progress >= 80 ? 'bg-emerald-100' :
                  event.progress >= 50 ? 'bg-blue-100' :
                  event.progress >= 30 ? 'bg-amber-100' :
                  'bg-red-100'
                }`}>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className={`${
                        event.progress >= 80 ? 'stroke-emerald-200' :
                        event.progress >= 50 ? 'stroke-blue-200' :
                        event.progress >= 30 ? 'stroke-amber-200' :
                        'stroke-red-200'
                      }`}
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className={`${
                        event.progress >= 80 ? 'stroke-emerald-600' :
                        event.progress >= 50 ? 'stroke-blue-600' :
                        event.progress >= 30 ? 'stroke-amber-600' :
                        'stroke-red-600'
                      }`}
                      strokeWidth="3"
                      strokeDasharray={`${event.progress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex-1" />
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}