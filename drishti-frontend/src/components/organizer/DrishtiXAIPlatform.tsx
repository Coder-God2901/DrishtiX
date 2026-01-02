import { useState } from 'react';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  Eye,
  Zap,
  BarChart3,
  Shield,
  Target,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

interface DrishtiXAIPlatformProps {
  onBack: () => void;
}

interface AIModel {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'training' | 'inactive';
  accuracy: number;
  predictions: number;
}

interface Insight {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

export function DrishtiXAIPlatform({ onBack }: DrishtiXAIPlatformProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'insights' | 'predictions'>('insights');
  const [isLiveMode, setIsLiveMode] = useState(true);

  const [models, setModels] = useState<AIModel[]>([
    { id: '1', name: 'Crowd Density Predictor', type: 'Regression', status: 'active', accuracy: 94.5, predictions: 15420 },
    { id: '2', name: 'Safety Risk Classifier', type: 'Classification', status: 'active', accuracy: 96.8, predictions: 8932 },
    { id: '3', name: 'Queue Time Forecaster', type: 'Time Series', status: 'active', accuracy: 92.3, predictions: 12450 },
    { id: '4', name: 'Anomaly Detector', type: 'Unsupervised', status: 'active', accuracy: 89.7, predictions: 3215 },
    { id: '5', name: 'Attendance Predictor', type: 'Regression', status: 'training', accuracy: 0, predictions: 0 }
  ]);

  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      category: 'Crowd Management',
      title: 'High crowd density predicted at Main Stage',
      description: 'AI models predict 85% capacity at main stage area between 6-8 PM. Consider opening overflow zones.',
      confidence: 94,
      priority: 'high',
      icon: Users
    },
    {
      id: '2',
      category: 'Safety',
      title: 'Low medical staff coverage in Zone C',
      description: 'Current staffing may be insufficient for predicted attendance. Recommend 2 additional medical volunteers.',
      confidence: 88,
      priority: 'medium',
      icon: Shield
    },
    {
      id: '3',
      category: 'Operations',
      title: 'Queue times optimized at entry gates',
      description: 'Current gate configuration performing 12% better than historical average. No action needed.',
      confidence: 96,
      priority: 'low',
      icon: Target
    },
    {
      id: '4',
      category: 'Predictions',
      title: 'Peak attendance expected at 7:30 PM',
      description: 'Models predict maximum concurrent attendance of 9,200 visitors. All systems ready.',
      confidence: 92,
      priority: 'medium',
      icon: TrendingUp
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'training':
        return 'bg-blue-100 text-blue-700';
      case 'inactive':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                DrishtiX AI Platform
              </h1>
              <p className="text-slate-600 text-sm">AI-powered insights and predictive analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isLiveMode
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isLiveMode ? <Activity className="w-4 h-4 animate-pulse" /> : <Pause className="w-4 h-4" />}
                {isLiveMode ? 'Live Mode' : 'Paused'}
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Stats Banner */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl mb-2">AI Intelligence Layer</h2>
              <p className="text-purple-100">Real-time predictions and automated insights</p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-purple-100 text-sm mb-1">Active Models</p>
              <p className="text-3xl">{models.filter(m => m.status === 'active').length}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Predictions</p>
              <p className="text-3xl">{models.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Avg Accuracy</p>
              <p className="text-3xl">{Math.round(models.filter(m => m.status === 'active').reduce((sum, m) => sum + m.accuracy, 0) / models.filter(m => m.status === 'active').length)}%</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm mb-1">Insights Generated</p>
              <p className="text-3xl">{insights.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            AI Insights
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'models'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            AI Models
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'predictions'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Predictions
          </button>
        </div>

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-slate-900 text-xl">AI-Generated Insights</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Activity className="w-4 h-4 animate-pulse text-green-600" />
                <span>Updating in real-time</span>
              </div>
            </div>

            <div className="space-y-4">
              {insights.map(insight => {
                const Icon = insight.icon;
                return (
                  <div
                    key={insight.id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-6 ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-600 uppercase tracking-wider">{insight.category}</span>
                              <span className={`px-2 py-1 rounded-full text-xs uppercase ${
                                insight.priority === 'high' ? 'bg-red-200 text-red-800' :
                                insight.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {insight.priority}
                              </span>
                            </div>
                            <h4 className="text-slate-900 text-lg mb-2">{insight.title}</h4>
                            <p className="text-slate-600">{insight.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Confidence:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-slate-200 rounded-full h-2">
                                <div
                                  className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                                  style={{ width: `${insight.confidence}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-900">{insight.confidence}%</span>
                            </div>
                          </div>
                          <button className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <h3 className="text-slate-900 text-xl">Machine Learning Models</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {models.map(model => (
                <div
                  key={model.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-slate-900 mb-1">{model.name}</h4>
                      <p className="text-slate-600 text-sm">{model.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(model.status)}`}>
                      {model.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Model Accuracy</span>
                        <span className="text-sm text-slate-900">{model.accuracy}%</span>
                      </div>
                      {model.status === 'active' && (
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                            style={{ width: `${model.accuracy}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Predictions Made</span>
                      <span className="text-slate-900">{model.predictions.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                    <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all text-sm text-slate-700">
                      Configure
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                      View Metrics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <h3 className="text-slate-900 text-xl">Real-Time Predictions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-slate-900 mb-2">Next Hour Attendance</h4>
                <p className="text-3xl text-slate-900 mb-2">1,245</p>
                <p className="text-green-600 text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12% from current
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-slate-900 mb-2">Peak Crowd Density</h4>
                <p className="text-3xl text-slate-900 mb-2">82%</p>
                <p className="text-amber-600 text-sm">Expected at 7:30 PM</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-slate-900 mb-2">Queue Wait Time</h4>
                <p className="text-3xl text-slate-900 mb-2">8 min</p>
                <p className="text-green-600 text-sm">Optimal performance</p>
              </div>
            </div>

            {/* Prediction Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-slate-900 mb-4">Attendance Forecast - Next 6 Hours</h4>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                  <p className="text-slate-600">Interactive prediction chart</p>
                  <p className="text-slate-500 text-sm">Showing AI-powered attendance forecasts</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
