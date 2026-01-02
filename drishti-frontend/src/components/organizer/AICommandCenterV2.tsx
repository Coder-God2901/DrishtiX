/**
 * AI Command Center - Real-time AI predictions and recommendations
 */

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
  Loader2,
  Sparkles,
} from 'lucide-react';
import { usePredictions, useRiskAnalysis } from '../../hooks/useRealtime';
import { useParams } from 'react-router-dom';

interface AICommandCenterProps {
  onBack: () => void;
}

export function AICommandCenterV2({ onBack }: AICommandCenterProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { predictions, loading: predictionsLoading } = usePredictions(eventId);
  const { riskAnalysis, loading: riskLoading } = useRiskAnalysis(eventId);

  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const loading = predictionsLoading || riskLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-amber-500';
      case 'LOW':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-2xl text-slate-900 flex items-center gap-2">
                  <Brain className="w-7 h-7 text-purple-600" />
                  AI Command Center
                </h1>
                <p className="text-slate-600 text-sm">
                  AI-powered predictive insights and recommendations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 text-sm">AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Risk Overview */}
        {riskAnalysis && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6" />
                <div>
                  <h2 className="text-xl mb-1">Risk Analysis Overview</h2>
                  <p className="text-purple-100 text-sm">
                    Real-time risk assessment and monitoring
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Overall Risk */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-900 font-medium">Overall Risk Level</span>
                  <span className="text-3xl text-slate-900">
                    {riskAnalysis.overallRisk}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      riskAnalysis.overallRisk > 80
                        ? 'bg-red-500'
                        : riskAnalysis.overallRisk > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${riskAnalysis.overallRisk}%` }}
                  />
                </div>
              </div>

              {/* Risk Factors */}
              <div className="grid grid-cols-2 gap-4">
                {riskAnalysis.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900 text-sm">{factor.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          factor.status === 'critical'
                            ? 'bg-red-500'
                            : factor.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            factor.status === 'critical'
                              ? 'bg-red-500'
                              : factor.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${factor.value}%` }}
                        />
                      </div>
                      <span className="text-slate-600 text-sm">{factor.value}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-slate-900 font-medium mb-3">AI Recommendations</h4>
                  <div className="space-y-2">
                    {riskAnalysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-700 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Predictive Insights */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <h2 className="text-xl mb-1">Predictive Insights</h2>
                <p className="text-blue-100 text-sm">
                  AI-detected patterns and predictions
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {predictions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No predictions available yet</p>
                <p className="text-sm mt-2">AI is analyzing event data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.slice(0, 5).map((prediction) => (
                  <div
                    key={prediction.id}
                    onClick={() => setSelectedInsight(prediction.id)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedInsight === prediction.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle
                            className={`w-5 h-5 ${
                              prediction.riskLevel === 'CRITICAL'
                                ? 'text-red-600'
                                : prediction.riskLevel === 'HIGH'
                                ? 'text-orange-600'
                                : 'text-amber-600'
                            }`}
                          />
                          <span className="text-slate-900 font-medium">
                            Crowd Density Prediction
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm mb-3">
                          {prediction.affectedZones.join(', ')} - Predicted density:{' '}
                          {prediction.predictedDensity}%
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getImpactColor(
                          prediction.riskLevel
                        )}`}
                      >
                        {prediction.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.round(prediction.confidenceLevel * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-slate-900 text-sm">
                            {Math.round(prediction.confidenceLevel * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Risk Level</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getRiskColor(
                              prediction.riskLevel
                            )}`}
                          />
                          <span className="text-slate-900 text-sm">
                            {prediction.riskLevel}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Timestamp</p>
                        <span className="text-slate-900 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(prediction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {prediction.affectedZones.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>Affected: {prediction.affectedZones.join(', ')}</span>
                      </div>
                    )}

                    {selectedInsight === prediction.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-slate-900 font-medium mb-2 text-sm">
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {prediction.recommendations?.map((rec, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          )) || (
                            <p className="text-slate-500 text-sm">
                              No specific recommendations available
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Status */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl mb-1">AI System Status</h3>
                <p className="text-purple-100 text-sm">
                  Continuously analyzing event data and generating insights
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-1">{predictions.length}</div>
              <p className="text-purple-100 text-sm">Active Predictions</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
