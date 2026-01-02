import { useState } from 'react';
import { 
  Calendar, 
  Activity, 
  Clock, 
  MapPin, 
  BarChart3,
  Plus,
  ChevronRight,
  Database,
  Workflow,
  Map as MapIcon,
  Cpu,
  Thermometer,
  BarChart,
  Zap,
  Bell
} from 'lucide-react';
import { LiveHeatmapView } from './LiveHeatmapView';

interface ManagementToolsViewProps {
  onNavigate?: (toolName: string) => void;
}

export function ManagementToolsView({ onNavigate }: ManagementToolsViewProps = {}) {
  const [showLiveHeatmap, setShowLiveHeatmap] = useState(false);
  const statCards = [
    { icon: <Calendar className="w-5 h-5" />, label: 'Total Events', value: '4', color: 'blue' },
    { icon: <Activity className="w-5 h-5" />, label: 'Live Now', value: '1', color: 'green' },
    { icon: <Clock className="w-5 h-5" />, label: 'Scheduled', value: '2', color: 'purple' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Venues Mapped', value: '3', color: 'indigo' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Avg Completion', value: '70%', color: 'emerald' },
  ];

  const tabs = [
    { label: 'My Events', active: false },
    { label: 'Event Workflow', active: false },
    { label: 'Management Tools', active: true },
  ];

  const managementTools = [
    {
      title: 'Event CRUD Manager',
      description: 'Create, edit, and manage all event details',
      icon: <Database className="w-6 h-6" />,
      color: 'blue',
    },
    {
      title: 'Venue Data Pipeline',
      description: 'Import and transform venue data',
      icon: <Workflow className="w-6 h-6" />,
      color: 'indigo',
    },
    {
      title: 'Master Data Hub',
      description: 'Central data management system',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'purple',
    },
    {
      title: 'DrishtiX AI Platform',
      description: 'Predictive crowd safety monitoring',
      icon: <Cpu className="w-6 h-6" />,
      color: 'emerald',
    },
    {
      title: 'Live Heatmap',
      description: 'Real-time crowd flow visualization',
      icon: <Thermometer className="w-6 h-6" />,
      color: 'amber',
    },
  ];

  const quickActions = [
    { label: 'Analytics', icon: <BarChart className="w-5 h-5" /> },
    { label: 'Digital Twin', icon: <MapIcon className="w-5 h-5" /> },
    { label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { label: 'Teams', icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-900">Management Tools</h2>
          <p className="text-slate-600 mt-1">Powerful tools for complete event lifecycle management</p>
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

        {/* Management Tools Section */}
        {!showLiveHeatmap ? (
          <>
            <div className="mb-8">
              <h3 className="text-slate-900 mb-2">Advanced Management Tools</h3>
              <p className="text-slate-600 text-sm">Powerful tools for complete event lifecycle management and data operations</p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {managementTools.map((tool, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-xl ${
                    tool.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    tool.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                    tool.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    tool.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    'bg-gradient-to-br from-amber-500 to-amber-600'
                  } flex items-center justify-center text-white shadow-lg mb-4`}>
                    {tool.icon}
                  </div>
                  
                  <h4 className="text-slate-900 mb-2">{tool.title}</h4>
                  <p className="text-slate-600 text-sm mb-4">{tool.description}</p>

                  <button 
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(tool.title);
                      } else if (tool.title === 'Live Heatmap') {
                        setShowLiveHeatmap(true);
                      }
                    }}
                    className={`group flex items-center gap-2 transition-colors ${
                      tool.color === 'blue' ? 'text-blue-600 hover:text-blue-700' :
                      tool.color === 'indigo' ? 'text-indigo-600 hover:text-indigo-700' :
                      tool.color === 'purple' ? 'text-purple-600 hover:text-purple-700' :
                      tool.color === 'emerald' ? 'text-emerald-600 hover:text-emerald-700' :
                      'text-amber-600 hover:text-amber-700'
                    }`}
                  >
                    <span>Launch</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setShowLiveHeatmap(false)}
              className="mb-4 text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
            >
              ← Back to Management Tools
            </button>
            <LiveHeatmapView />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-slate-900">Quick Actions</h4>
              <p className="text-slate-600 text-sm">Fast access to frequently used tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-200">
                  {action.icon}
                </div>
                <span className="text-sm text-slate-700 group-hover:text-blue-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}