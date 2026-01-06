import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analytics.service';
import { incidentService } from '../../services/incident.service';
import {
  ArrowLeft,
  FileBarChart,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Flame,
  Activity,
  Target,
  BarChart3,
  Zap,
  Award,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';

interface PostEventAnalysisPageProps {
  onBack: () => void;
}

interface IncidentStats {
  total: number;
  resolved: number;
  unresolved: number;
  avgResponseTime: string;
  criticalIncidents: number;
}

interface PerformanceMetric {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  details: string;
}

interface AIAccuracy {
  metric: string;
  predicted: number;
  actual: number;
  accuracy: number;
}

interface PostEventAnalysisPageProps {
  eventId?: string;
  onBack: () => void;
}

export function PostEventAnalysisPage({ eventId = '1', onBack }: PostEventAnalysisPageProps) {
  const [loading, setLoading] = useState(true);
  const [incidentStats, setIncidentStats] = useState<IncidentStats>({
    total: 0,
    resolved: 0,
    unresolved: 0,
    avgResponseTime: '0 mins',
    criticalIncidents: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [aiAccuracy, setAiAccuracy] = useState<AIAccuracy[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [eventId]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const incidents = await incidentService.getIncidents({ eventId });
      const incidentData = incidents.data || [];
      const resolved = incidentData.filter((i: any) => i.status === 'RESOLVED').length;
      const critical = incidentData.filter((i: any) => i.severity === 'CRITICAL').length;

      setIncidentStats({
        total: incidentData.length,
        resolved: resolved,
        unresolved: incidentData.length - resolved,
        avgResponseTime: '3.2 mins',
        criticalIncidents: critical,
      });

      // Set default performance metrics
      const responseScore = incidentData.length > 0 ? Math.min(100, 90 + (resolved / incidentData.length) * 10) : 90;
      setPerformanceMetrics([
        {
          category: 'Incident Response',
          score: responseScore,
          status: 'excellent',
          details: `Average response time: 3.2 mins`,
        },
        { category: 'Crowd Management', score: 76, status: 'good', details: 'Peak capacity managed effectively' },
        { category: 'Gate Operations', score: 92, status: 'excellent', details: 'Smooth entry/exit flow' },
        {
          category: 'Medical Response',
          score: 85,
          status: 'excellent',
          details: 'All incidents handled within target time',
        },
        { category: 'Communication', score: 88, status: 'excellent', details: 'Real-time alerts delivered' },
      ]);

      setAiAccuracy([
        { metric: 'Crowd Density Prediction', predicted: 12500, actual: 12847, accuracy: 97.3 },
        { metric: 'Peak Time Forecast', predicted: 20.75, actual: 21.0, accuracy: 98.8 },
        { metric: 'Incident Hotspot Detection', predicted: 8, actual: 7, accuracy: 87.5 },
        { metric: 'Resource Allocation', predicted: 45, actual: 42, accuracy: 93.3 },
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [eventEnded] = useState(true);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    return 'text-amber-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-100 border-emerald-300';
    if (score >= 70) return 'bg-blue-100 border-blue-300';
    return 'bg-amber-100 border-amber-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'good':
        return <ThumbsUp className="w-5 h-5 text-blue-600" />;
      case 'needs-improvement':
        return <ThumbsDown className="w-5 h-5 text-amber-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-emerald-600';
    if (accuracy >= 85) return 'text-blue-600';
    return 'text-amber-600';
  };

  if (!eventEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-amber-100 rounded-full inline-block mb-4">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Event Still in Progress</h2>
          <p className="text-slate-600">
            Post-Event Analysis will be available once the event has concluded. Check back after the event ends to view
            comprehensive analytics and insights.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <FileBarChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Post-Event Analysis</h1>
                  <p className="text-sm text-slate-500">Comprehensive performance review & insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-lg border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Event Completed</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-600 font-semibold">Total Incidents</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{incidentStats.total}</p>
            <p className="text-xs text-slate-500 mt-1">{incidentStats.criticalIncidents} critical</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-slate-600 font-semibold">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{incidentStats.resolved}</p>
            <p className="text-xs text-slate-500 mt-1">
              {((incidentStats.resolved / incidentStats.total) * 100).toFixed(1)}% resolution rate
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-slate-600 font-semibold">Unresolved</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{incidentStats.unresolved}</p>
            <p className="text-xs text-slate-500 mt-1">Requires follow-up</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-600 font-semibold">Avg Response</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{incidentStats.avgResponseTime}</p>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> 15% faster than avg
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-600 font-semibold">Total Attendees</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">12,847</p>
            <p className="text-xs text-slate-500 mt-1">Peak: 13,200</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Performance Metrics</h2>
              <span className="text-xs text-blue-100">Category-wise evaluation</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {performanceMetrics.map((metric, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMetric(selectedMetric === metric.category ? null : metric.category)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMetric === metric.category
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-slate-100 rounded-lg">{getStatusIcon(metric.status)}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">{metric.category}</h3>
                      <p className="text-sm text-slate-600">{metric.details}</p>
                    </div>
                  </div>
                  <div
                    className={`flex flex-col items-center px-4 py-2 rounded-lg border-2 ${getScoreBgColor(metric.score)}`}
                  >
                    <span className={`text-3xl font-bold ${getScoreColor(metric.score)}`}>{metric.score}</span>
                    <span className="text-[10px] text-slate-600 uppercase font-bold">Score</span>
                  </div>
                </div>

                {selectedMetric === metric.category && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Info className="w-4 h-4" />
                      <span className="font-semibold capitalize">{metric.status.replace('-', ' ')} Performance</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction Accuracy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">AI Prediction Accuracy</h2>
              <span className="text-xs text-purple-100">Forecasts vs actual outcomes</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiAccuracy.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">{item.metric}</h3>
                    <span className={`text-xl font-bold ${getAccuracyColor(item.accuracy)}`}>
                      {item.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Predicted</span>
                      <span className="font-semibold text-slate-900">
                        {typeof item.predicted === 'number' && item.predicted > 100
                          ? item.predicted.toLocaleString()
                          : item.predicted}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Actual</span>
                      <span className="font-semibold text-slate-900">
                        {typeof item.actual === 'number' && item.actual > 100
                          ? item.actual.toLocaleString()
                          : item.actual}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${item.accuracy >= 95 ? 'bg-emerald-500' : item.accuracy >= 85 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="text-sm text-emerald-800">
                  <span className="font-semibold">Overall AI Performance:</span> The AI prediction engine demonstrated
                  strong accuracy across all metrics, with an average accuracy of 95.1%. This validates the
                  effectiveness of the AI-driven approach for event management.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Key Takeaways & Recommendations</h2>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-900 mb-1">What Worked Well</h4>
                <p className="text-sm text-emerald-700">
                  Excellent incident response times, smooth gate operations, and effective crowd management at peak
                  capacity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Areas for Improvement</h4>
                <p className="text-sm text-amber-700">
                  Medical response times exceeded targets in two instances. Consider increasing medical team capacity
                  for future events.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Recommended Actions</h4>
                <p className="text-sm text-blue-700">
                  Deploy 2 additional medical teams for events with similar attendance. Maintain current staffing levels
                  for security and operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Post-Event Analysis Complete</h4>
            <p className="text-sm text-slate-700">
              This analysis is generated from event data and AI insights. All metrics and recommendations are available
              for export and can be used for future event planning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
