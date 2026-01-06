import { useState } from 'react';
import { 
  Calendar, 
  Activity, 
  Clock, 
  MapPin, 
  BarChart3,
  Plus,
  ChevronRight,
  AlertTriangle,
  Map,
  Users,
  LineChart,
  Radio
} from 'lucide-react';
import { VenueMapperView } from './VenueMapperView';

interface EventWorkflowViewProps {
  onNavigate?: (step: number) => void;
}

export function EventWorkflowView({ onNavigate }: EventWorkflowViewProps = {}) {
  const [showVenueMapper, setShowVenueMapper] = useState(false);
  const statCards = [
    { icon: <Calendar className="w-5 h-5" />, label: 'Total Events', value: '4', color: 'blue' },
    { icon: <Activity className="w-5 h-5" />, label: 'Live Now', value: '1', color: 'green' },
    { icon: <Clock className="w-5 h-5" />, label: 'Scheduled', value: '2', color: 'purple' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Venues Mapped', value: '3', color: 'indigo' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Avg Completion', value: '70%', color: 'emerald' },
  ];

  const tabs = [
    { label: 'My Events', active: false },
    { label: 'Event Workflow', active: true },
    { label: 'Management Tools', active: false },
  ];

  const workflowSteps = [
    {
      step: 1,
      status: 'Next Step',
      title: 'Create Event',
      description: 'Set up event details, type, and basic info',
      action: 'Start Now',
      icon: <Calendar className="w-6 h-6" />,
      color: 'blue',
    },
    {
      step: 2,
      status: 'Pending',
      title: 'Venue Mapper & Canvas',
      description: 'Design venue layout with zones, gates, and interactive canvas',
      action: 'Begin Setup',
      icon: <Map className="w-6 h-6" />,
      color: 'indigo',
    },
    {
      step: 3,
      status: 'Pending',
      title: 'Schedule & Teams',
      description: 'Create schedule and assign teams',
      action: 'Begin Setup',
      icon: <Users className="w-6 h-6" />,
      color: 'emerald',
    },
    {
      step: 4,
      status: 'Pending',
      title: 'Analytics Setup',
      description: 'Configure monitoring and analytics',
      action: 'Begin Setup',
      icon: <LineChart className="w-6 h-6" />,
      color: 'amber',
    },
    {
      step: 5,
      status: 'Final Step',
      title: 'Go Live',
      description: 'Launch event and monitor operations',
      action: 'Begin Setup',
      icon: <Radio className="w-6 h-6" />,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-900">Event Workflow</h2>
          <p className="text-slate-600 mt-1">Follow the steps to create a production-ready event</p>
        </div>
        <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg">
          <Plus className="w-4 h-4" />
          Create New Event
          <ChevronRight className="w-4 h-4" />
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
              stat.color === 'green' ? 'bg-green-100 text-green-600' :
              stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
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

        {/* Workflow Section */}
        <div className="mb-6">
          <h3 className="text-slate-900 mb-2">Event Creation Workflow</h3>
          <p className="text-slate-600 text-sm">Follow these steps to create a complete, production-ready event with DrishtiX intelligence</p>
        </div>

        {/* No Event Selected Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-slate-900">No Event Selected</p>
            <p className="text-slate-600 text-sm mt-1">Select an event from the "My Events" tab to see workflow progress</p>
          </div>
        </div>

        {/* Workflow Steps Grid */}
        {!showVenueMapper ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${
                    step.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    step.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                    step.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    step.color === 'amber' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    'bg-gradient-to-br from-red-500 to-red-600'
                  } flex items-center justify-center text-white shadow-lg`}>
                    {step.icon}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs ${
                    step.status === 'Next Step' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'Final Step' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {step.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-500 text-sm">STEP {step.step}</span>
                  </div>
                  <h4 className="text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </div>

                <button 
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(step.step);
                    } else if (step.step === 2) {
                      setShowVenueMapper(true);
                    }
                  }}
                  className="group w-full flex items-center justify-between text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>{step.action}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowVenueMapper(false)}
              className="mb-4 text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
            >
              ← Back to Workflow
            </button>
            <VenueMapperView />
          </div>
        )}
      </div>
    </div>
  );
}