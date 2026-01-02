/**
 * Crowd Intelligence Page - Real-time crowd analytics and predictions
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Flame, 
  Activity,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import { useEventMetrics, useHeatmap, usePredictions } from '../../hooks/useRealtime';
import { useParams } from 'react-router-dom';

interface CrowdIntelligencePageProps {
  onBack: () => void;
}

interface CrowdMetric {
  zone: string;
  energyIndex: number;
  stability: 'stable' | 'moderate' | 'volatile';
  peakTime: string;
  currentCapacity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export function CrowdIntelligencePage({ onBack }: CrowdIntelligencePageProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { metrics, loading: metricsLoading } = useEventMetrics(eventId);
  const { heatmap, loading: heatmapLoading } = useHeatmap(eventId);
  const { predictions, loading: predictionsLoading } = usePredictions(eventId);

  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Transform real heatmap data into metrics
  const crowdMetrics: CrowdMetric[] = heatmap.map((zone) => ({
    zone: zone.zoneName,
    energyIndex: zone.density,
    stability: zone.density > 80 ? 'volatile' : zone.density > 60 ? 'moderate' : 'stable',
    peakTime: 'Real-time',
    currentCapacity: zone.density,
    trend: zone.density > 70 ? 'increasing' : zone.density < 40 ? 'decreasing' : 'stable',
  }));

  const loading = metricsLoading || heatmapLoading;

  const getEnergyColor = (index: number) => {
    if (index >= 80) return 'bg-red-500';
    if (index >= 60) return 'bg-amber-500';
    if (index >= 40) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'stable': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'volatile': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading crowd intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
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
                  <Activity className="w-7 h-7 text-indigo-600" />
                  Crowd Intelligence
                </h1>
                <p className="text-slate-600 text-sm">Real-time crowd dynamics and analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-700 text-sm">Live Updates</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { 
              label: 'Current Attendees', 
              value: metrics?.currentAttendees || 0,
              icon: Users, 
              color: 'blue',
              change: '+12%' 
            },
            { 
              label: 'Avg. Crowd Density', 
              value: `${metrics?.crowdDensity || 0}%`,
              icon: BarChart3, 
              color: 'amber',
              change: '+8%' 
            },
            { 
              label: 'Active Zones', 
              value: heatmap.length,
              icon: MapPin, 
              color: 'indigo',
              change: 'All online' 
            },
            { 
              label: 'High Density Zones', 
              value: heatmap.filter(z => z.density > 80).length,
              icon: Flame, 
              color: 'red',
              change: '2 critical' 
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'amber' ? 'bg-amber-100' :
                    stat.color === 'indigo' ? 'bg-indigo-100' :
                    'bg-red-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'amber' ? 'text-amber-600' :
                      stat.color === 'indigo' ? 'text-indigo-600' :
                      'text-red-600'
                    }`} />
                  </div>
                </div>
                <p className="text-3xl text-slate-900 mb-1">{stat.value}</p>
                <p className="text-slate-600 text-sm mb-2">{stat.label}</p>
                <p className="text-emerald-600 text-xs">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Zone Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h2 className="text-xl mb-1">Zone-by-Zone Analysis</h2>
                <p className="text-indigo-100 text-sm">Real-time crowd energy and stability metrics</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {crowdMetrics.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No crowd data available yet</p>
                </div>
              ) : (
                crowdMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedZone(metric.zone)}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedZone === metric.zone
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        <span className="text-slate-900">{metric.zone}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStabilityColor(metric.stability)}`}>
                        {metric.stability.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm mb-1">Energy Index</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getEnergyColor(metric.energyIndex)}`} />
                          <span className="text-slate-900">{metric.energyIndex}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-600 text-sm mb-1">Capacity</p>
                        <span className="text-slate-900">{metric.currentCapacity}%</span>
                      </div>

                      <div>
                        <p className="text-slate-600 text-sm mb-1">Trend</p>
                        <span className="text-slate-900">{getTrendIcon(metric.trend)} {metric.trend}</span>
                      </div>

                      <div>
                        <p className="text-slate-600 text-sm mb-1">Peak Time</p>
                        <span className="text-slate-900 text-sm">{metric.peakTime}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Predictions */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                <div>
                  <h2 className="text-xl mb-1">AI Predictions</h2>
                  <p className="text-purple-100 text-sm">Predictive crowd density analysis</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {predictions.slice(0, 3).map((prediction, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-900">{prediction.affectedZones.join(', ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prediction.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      prediction.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {prediction.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Predicted density: {prediction.predictedDensity}% 
                    (Confidence: {Math.round(prediction.confidenceLevel * 100)}%)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
