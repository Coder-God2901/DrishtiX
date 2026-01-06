import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Eye,
  Heart,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  // Settings,
  Plus,
  Trash2,
  Save,
  Play,
  Pause
} from 'lucide-react';

interface AnalyticsSetupViewProps {
  onBack: () => void;
}

interface Metric {
  id: string;
  name: string;
  type: 'count' | 'gauge' | 'trend';
  icon: any;
  color: string;
  enabled: boolean;
  threshold?: number;
  currentValue?: number;
}

interface Dashboard {
  id: string;
  name: string;
  metrics: string[];
  refreshRate: number;
  isDefault: boolean;
}

export function AnalyticsSetupView({ onBack }: AnalyticsSetupViewProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'dashboards' | 'alerts'>('metrics');
  const [isLivePreview, setIsLivePreview] = useState(false);

  const [metrics, setMetrics] = useState<Metric[]>([
    { id: '1', name: 'Total Attendees', type: 'count', icon: Users, color: 'blue', enabled: true, currentValue: 8432 },
    { id: '2', name: 'Active Sessions', type: 'count', icon: Activity, color: 'green', enabled: true, currentValue: 12 },
    { id: '3', name: 'Crowd Density', type: 'gauge', icon: TrendingUp, color: 'amber', enabled: true, threshold: 80, currentValue: 65 },
    { id: '4', name: 'Medical Alerts', type: 'count', icon: Heart, color: 'red', enabled: true, currentValue: 3 },
    { id: '5', name: 'Check-in Rate', type: 'trend', icon: CheckCircle, color: 'emerald', enabled: true, currentValue: 94 },
    { id: '6', name: 'Popular Zones', type: 'count', icon: MapPin, color: 'purple', enabled: true, currentValue: 5 },
    { id: '7', name: 'Avg Wait Time', type: 'gauge', icon: Clock, color: 'orange', enabled: false, threshold: 15, currentValue: 8 },
    { id: '8', name: 'Safety Alerts', type: 'count', icon: AlertTriangle, color: 'rose', enabled: true, currentValue: 2 }
  ]);

  const [dashboards, setDashboards] = useState<Dashboard[]>([
    { id: '1', name: 'Main Operations', metrics: ['1', '2', '3', '4'], refreshRate: 5, isDefault: true },
    { id: '2', name: 'Safety Monitor', metrics: ['3', '4', '8'], refreshRate: 3, isDefault: false },
    { id: '3', name: 'Guest Experience', metrics: ['1', '5', '6', '7'], refreshRate: 10, isDefault: false }
  ]);

  const toggleMetric = (id: string) => {
    setMetrics(metrics.map((m: Metric) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const getMetricColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; gradient: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-500 to-green-600' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', gradient: 'from-amber-500 to-amber-600' },
      red: { bg: 'bg-red-100', text: 'text-red-700', gradient: 'from-red-500 to-red-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', gradient: 'from-emerald-500 to-emerald-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-500 to-orange-600' },
      rose: { bg: 'bg-rose-100', text: 'text-rose-700', gradient: 'from-rose-500 to-rose-600' }
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
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Analytics Setup
              </h1>
              <p className="text-slate-600 text-sm">Configure monitoring dashboards and real-time analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLivePreview(!isLivePreview)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isLivePreview
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isLivePreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isLivePreview ? 'Live Preview' : 'Start Preview'}
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'metrics'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Metrics Configuration
          </button>
          <button
            onClick={() => setActiveTab('dashboards')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'dashboards'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Dashboards
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Alert Rules
          </button>
        </div>

        {/* Metrics Configuration */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl text-slate-900">{metrics.length}</span>
                </div>
                <p className="text-slate-600 text-sm">Total Metrics</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-2xl text-slate-900">{metrics.filter((m: Metric) => m.enabled).length}</span>
                </div>
                <p className="text-slate-600 text-sm">Active Metrics</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl text-slate-900">{dashboards.length}</span>
                </div>
                <p className="text-slate-600 text-sm">Dashboards</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                  <span className="text-2xl text-slate-900">{metrics.filter((m: Metric) => m.threshold).length}</span>
                </div>
                <p className="text-slate-600 text-sm">Alert Rules</p>
              </div>
            </div>

            {/* Metrics List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-slate-900 text-xl">Available Metrics</h2>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Custom Metric
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric: Metric) => {
                  const Icon = metric.icon;
                  const colors = getMetricColor(metric.color);
                  return (
                    <div
                      key={metric.id}
                      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                        metric.enabled ? 'border-blue-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-slate-900">{metric.name}</h3>
                              <p className="text-slate-600 text-sm capitalize">{metric.type}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={metric.enabled}
                              onChange={() => toggleMetric(metric.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {metric.enabled && isLivePreview && (
                          <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-slate-600">Current Value</span>
                              <span className={`text-2xl ${colors.text}`}>{metric.currentValue}{metric.type === 'gauge' ? '%' : ''}</span>
                            </div>
                            {metric.type === 'gauge' && metric.threshold && (
                              <>
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full bg-gradient-to-r ${colors.gradient} transition-all`}
                                    style={{ width: `${metric.currentValue}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-600">Threshold: {metric.threshold}%</p>
                              </>
                            )}
                          </div>
                        )}

                        {metric.threshold && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <label className="text-sm text-slate-600 block mb-2">Alert Threshold</label>
                            <input
                              type="number"
                              value={metric.threshold}
                              onChange={(e) => {
                                const newThreshold = parseInt(e.target.value) || 0;
                                setMetrics(metrics.map((m: Metric) => 
                                  m.id === metric.id ? { ...m, threshold: newThreshold } : m
                                ));
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Set threshold"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dashboards */}
        {activeTab === 'dashboards' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-slate-900 text-xl">Analytics Dashboards</h2>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard: Dashboard) => (
                <div
                  key={dashboard.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-slate-900 mb-1">{dashboard.name}</h3>
                      {dashboard.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Default</span>
                      )}
                    </div>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BarChart3 className="w-4 h-4" />
                      {dashboard.metrics.length} metrics
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Activity className="w-4 h-4" />
                      Refreshes every {dashboard.refreshRate}s
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all text-sm text-slate-700">
                        Configure
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                        View Live
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Rules */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-slate-900 text-xl">Alert Configuration</h2>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Alert Rule
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-slate-900 text-xl mb-2">Alert Rules</h3>
                <p className="text-slate-600 mb-6">
                  Configure automated alerts when metrics exceed thresholds or anomalies are detected
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <span className="text-slate-900">Medical Alert Threshold</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Notify when medical alerts exceed 5 per hour</p>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-amber-600" />
                      <span className="text-slate-900">Crowd Density Warning</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Alert when density reaches 80% capacity</p>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
