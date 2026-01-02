import React, { useState, useEffect } from 'react';
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
  BarChart3,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { recommendationService, AIRecommendation } from '../../services/recommendation.service';
import { predictionService } from '../../services/prediction.service';
import { wsService } from '../../services/websocket.service';

interface AICommandCenterProps {
  onBack: () => void;
  eventId?: string;
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

export function AICommandCenter({ onBack, eventId = 'default-event-id' }: AICommandCenterProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    console.log('🧠 AICommandCenter: Loading for event:', eventId);
    loadRecommendations();
    loadPredictiveInsights();

    // Subscribe to real-time recommendation updates
    wsService.on('recommendation:new', handleNewRecommendation);
    wsService.on('insight:predictive', handleNewInsight);
    wsService.emit('subscribe:recommendations', eventId);

    return () => {
      wsService.off('recommendation:new', handleNewRecommendation);
      wsService.off('insight:predictive', handleNewInsight);
    };
  }, [eventId]);

  const handleNewRecommendation = (recommendation: AIRecommendation) => {
    console.log('📥 New recommendation received:', recommendation);
    setRecommendations(prev => [recommendation, ...prev]);
    setLastUpdate(new Date());
  };

  const handleNewInsight = (insight: PredictiveInsight) => {
    console.log('💡 New insight received:', insight);
    setInsights(prev => [insight, ...prev]);
    setLastUpdate(new Date());
  };

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await recommendationService.getRecommendations(eventId);
      if (response.success && response.data) {
        setRecommendations(response.data);
        console.log(`✅ Loaded ${response.data.length} recommendations`);
      } else {
        setError(response.error || 'Failed to load recommendations');
        console.error('❌ Failed to load recommendations:', response.error);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('❌ Error loading recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPredictiveInsights = async () => {
    try {
      const response = await predictionService.getCrowdDensity(eventId);
      if (response.success && response.data) {
        // Transform prediction data to insights
        const transformedInsights = transformPredictionsToInsights(response.data);
        setInsights(transformedInsights);
      }
    } catch (err: any) {
      console.error('❌ Error loading insights:', err);
    }
  };

  const transformPredictionsToInsights = (predictions: any): PredictiveInsight[] => {
    // Transform prediction data to insight format
    if (!predictions || !predictions.riskLevel) return [];
    
    return [{
      id: `insight-${Date.now()}`,
      title: `${predictions.riskLevel} Risk Level Detected`,
      description: `Current density: ${predictions.currentDensity}%. Predicted: ${predictions.predictedDensity}%`,
      likelihood: predictions.confidence > 0.8 ? 'high' : predictions.confidence > 0.5 ? 'medium' : 'low',
      timeframe: `${predictions.forecastHorizon || 15} mins`,
      impact: predictions.riskLevel.toLowerCase() as any,
      location: predictions.zoneId || 'Multiple zones'
    }];
  };

  const handleApprove = async (recommendationId: string) => {
    setIsLoading(true);
    try {
      const response = await recommendationService.approveRecommendation(
        recommendationId,
        eventId,
        undefined,
        'approved_by_operator'
      );

      if (response.success) {
        // Update UI to show approved status
        setRecommendations(prev => 
          prev.map(r => r.id === recommendationId ? { ...r, status: 'approved' } : r)
        );
        console.log('✅ Recommendation approved');
      } else {
        alert(response.error || 'Failed to approve recommendation');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (recommendationId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    setIsLoading(true);
    try {
      const response = await recommendationService.rejectRecommendation(
        recommendationId,
        eventId,
        reason || undefined
      );

      if (response.success) {
        // Update UI to show rejected status
        setRecommendations(prev => 
          prev.map(r => r.id === recommendationId ? { ...r, status: 'rejected' } : r)
        );
        console.log('✅ Recommendation rejected');
      } else {
        alert(response.error || 'Failed to reject recommendation');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNew = async () => {
    setIsLoading(true);
    try {
      const response = await recommendationService.generateRecommendations(eventId);
      if (response.success && response.data) {
        setRecommendations(response.data);
        console.log(`✅ Generated ${response.data.length} new recommendations`);
      } else {
        alert(response.error || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Loading and Error States */}
        {isLoading && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-sm text-indigo-900">Loading AI insights...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-900">{error}</span>
          </div>
        )}

        {/* Last Update Timestamp */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <button
            onClick={() => {
              loadRecommendations();
              loadPredictiveInsights();
            }}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

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
            {insights.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-slate-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No insights available yet</p>
              </div>
            ) : (
              insights.map(insight => (
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
            ))
            )}
          </div>
        </div>

        {/* Section 2: AI Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">AI Recommendations</h2>
              <span className="text-xs text-emerald-100">Suggested actions based on analysis</span>
            </div>
            <button
              onClick={handleGenerateNew}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Generate New
            </button>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No recommendations available yet</p>
                <button
                  onClick={handleGenerateNew}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                >
                  Generate Recommendations
                </button>
              </div>
            ) : (
              recommendations.map(rec => {
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(rec.id);
                          }}
                          disabled={isLoading || rec.status === 'approved' || rec.status === 'rejected'}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {rec.status === 'approved' ? 'Approved' : 'Approve & Execute'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(rec.id);
                          }}
                          disabled={isLoading || rec.status === 'approved' || rec.status === 'rejected'}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {rec.status === 'rejected' ? 'Rejected' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            )}
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
