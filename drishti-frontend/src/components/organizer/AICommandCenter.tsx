import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Target,
  Route,
  DoorOpen,
  UserPlus,
  Activity,
  BarChart3
} from 'lucide-react';

interface AICommandCenterProps {
  onBack: () => void;
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  likelihood: 'high' | 'medium' | 'low';
  timeframe: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
}

interface AIRecommendation {
  id: string;
  type: 'rerouting' | 'gate-control' | 'staffing' | 'security';
  title: string;
  description: string;
  confidence: number;
  signals: string[];
  actionRequired: boolean;
}

// Mock data - reusing existing AI logic patterns
const MOCK_INSIGHTS: PredictiveInsight[] = [
  {
    id: 'ins-1',
    title: 'Crowd Surge Expected at Main Stage',
    description: 'Crowd density projected to reach 85% capacity in next 15 minutes based on current movement patterns',
    likelihood: 'high',
    timeframe: '10-15 mins',
    impact: 'high',
    location: 'Main Stage Area - Zone A'
  },
  {
    id: 'ins-2',
    title: 'Food Court Congestion Building',
    description: 'Wait times at food vendors increasing. Overflow to secondary food area predicted',
    likelihood: 'medium',
    timeframe: '20-30 mins',
    impact: 'medium',
    location: 'Food Court - Zone C'
  },
  {
    id: 'ins-3',
    title: 'Exit Route Optimization Needed',
    description: 'Current exit patterns may cause bottleneck at Gate 3 during event conclusion',
    likelihood: 'medium',
    timeframe: '2-3 hours',
    impact: 'high',
    location: 'Exit Gates'
  }
];

const MOCK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-1',
    type: 'rerouting',
    title: 'Activate Alternative Pathways',
    description: 'Open secondary routes to Main Stage to distribute crowd flow more evenly',
    confidence: 87,
    signals: ['Crowd density: 78%', 'Movement velocity: Decreasing', 'Historical pattern match: 92%'],
    actionRequired: true
  },
  {
    id: 'rec-2',
    type: 'gate-control',
    title: 'Temporarily Close Gate 2',
    description: 'Reduce inflow at Gate 2 to prevent overcrowding in adjacent zones',
    confidence: 75,
    signals: ['Zone capacity: 82%', 'Entry rate: 15 persons/min', 'Weather: Clear (no rush factor)'],
    actionRequired: true
  },
  {
    id: 'rec-3',
    type: 'staffing',
    title: 'Deploy Additional Medical Team',
    description: 'Increase medical presence near Main Stage due to high crowd density',
    confidence: 92,
    signals: ['Crowd energy index: High', 'Temperature: 32°C', 'Past incident correlation: 88%'],
    actionRequired: false
  }
];

export function AICommandCenter({ onBack }: AICommandCenterProps) {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'rerouting': return Route;
      case 'gate-control': return DoorOpen;
      case 'staffing': return UserPlus;
      case 'security': return Target;
      default: return Zap;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AI Command Center</h1>
                  <p className="text-sm text-slate-500">Predictive insights & intelligent recommendations</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">AI Engine Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Section 1: Predictive Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Predictive Insights</h2>
              <span className="text-xs text-indigo-100">What is likely to happen next?</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {MOCK_INSIGHTS.map(insight => (
              <div 
                key={insight.id}
                onClick={() => setSelectedInsight(insight.id === selectedInsight ? null : insight.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedInsight === insight.id
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-4 h-4 ${getImpactColor(insight.impact)}`} />
                      <h3 className="font-bold text-slate-900">{insight.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{insight.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md border font-bold uppercase ${getLikelihoodColor(insight.likelihood)}`}>
                      {insight.likelihood} likelihood
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-semibold">{insight.timeframe}</span>
                  </div>
                  {insight.location && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-semibold">{insight.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: AI Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">AI Recommendations</h2>
              <span className="text-xs text-emerald-100">Suggested actions based on analysis</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {MOCK_RECOMMENDATIONS.map(rec => {
              const Icon = getRecommendationIcon(rec.type);
              return (
                <div 
                  key={rec.id}
                  onClick={() => setSelectedRecommendation(rec.id === selectedRecommendation ? null : rec.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRecommendation === rec.id
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{rec.title}</h3>
                        {rec.actionRequired && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{rec.description}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-slate-50 px-3 py-2 rounded-lg">
                      <span className="text-2xl font-bold text-emerald-600">{rec.confidence}%</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Confidence</span>
                    </div>
                  </div>

                  {/* Section 3: Confidence & Explanation (shown when expanded) */}
                  {selectedRecommendation === rec.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Input Signals Used
                        </h4>
                        <div className="space-y-1.5">
                          {rec.signals.map((signal, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
                          Approve & Execute
                        </button>
                        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Read & Approve Interface</h4>
            <p className="text-sm text-blue-700">
              This is a decision support page. AI recommendations require human approval before execution. 
              All actions are logged and can be reviewed in Post-Event Analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
