import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';

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

interface HeatmapSnapshot {
  id: string;
  timestamp: string;
  description: string;
  peakZone: string;
  density: number;
}

// Mock data for crowd intelligence
const MOCK_METRICS: CrowdMetric[] = [
  {
    zone: 'Main Stage Area (Zone A)',
    energyIndex: 87,
    stability: 'volatile',
    peakTime: '20:30 - 21:15',
    currentCapacity: 82,
    trend: 'increasing'
  },
  {
    zone: 'Food Court (Zone C)',
    energyIndex: 65,
    stability: 'moderate',
    peakTime: '18:45 - 19:30',
    currentCapacity: 58,
    trend: 'stable'
  },
  {
    zone: 'Exhibition Hall (Zone B)',
    energyIndex: 42,
    stability: 'stable',
    peakTime: '17:00 - 18:00',
    currentCapacity: 45,
    trend: 'decreasing'
  },
  {
    zone: 'VIP Lounge (Zone D)',
    energyIndex: 38,
    stability: 'stable',
    peakTime: '19:00 - 20:00',
    currentCapacity: 35,
    trend: 'stable'
  }
];

const MOCK_SNAPSHOTS: HeatmapSnapshot[] = [
  {
    id: 'snap-1',
    timestamp: '20:45',
    description: 'Peak crowd density at main stage during headliner performance',
    peakZone: 'Zone A',
    density: 89
  },
  {
    id: 'snap-2',
    timestamp: '19:15',
    description: 'Moderate density across all zones during dinner time',
    peakZone: 'Zone C',
    density: 67
  },
  {
    id: 'snap-3',
    timestamp: '18:00',
    description: 'Initial crowd buildup at entry gates and registration',
    peakZone: 'Entry Gates',
    density: 54
  },
  {
    id: 'snap-4',
    timestamp: '17:30',
    description: 'Low crowd density during early event hours',
    peakZone: 'Zone B',
    density: 32
  }
];

export function CrowdIntelligencePage({ onBack }: CrowdIntelligencePageProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

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

  const getDensityColor = (density: number) => {
    if (density >= 80) return 'text-red-600';
    if (density >= 60) return 'text-amber-600';
    if (density >= 40) return 'text-blue-600';
    return 'text-emerald-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Crowd Intelligence & Reports</h1>
                  <p className="text-sm text-slate-500">Aggregate insights & analytical data</p>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-sm transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Total Attendees</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">12,847</p>
            <p className="text-xs text-slate-500 mt-1">Peak: 13,200 at 20:45</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Flame className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Avg Energy Index</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">68</p>
            <p className="text-xs text-slate-500 mt-1">Moderate activity level</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Stable Zones</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">3/4</p>
            <p className="text-xs text-slate-500 mt-1">75% zones stable</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-600 font-semibold">Peak Intervals</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">4</p>
            <p className="text-xs text-slate-500 mt-1">High congestion periods</p>
          </div>
        </div>

        {/* Crowd Energy Index Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Crowd Energy Index by Zone</h2>
              <span className="text-xs text-blue-100">Real-time activity levels</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {MOCK_METRICS.map((metric, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedZone(selectedZone === metric.zone ? null : metric.zone)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedZone === metric.zone
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <h3 className="font-bold text-slate-900">{metric.zone}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-600">Energy Index</span>
                          <span className="text-sm font-bold text-slate-900">{metric.energyIndex}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getEnergyColor(metric.energyIndex)}`}
                            style={{ width: `${metric.energyIndex}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-lg border font-bold uppercase ${getStabilityColor(metric.stability)}`}>
                      {metric.stability}
                    </span>
                    <span className="text-2xl">{getTrendIcon(metric.trend)}</span>
                  </div>
                </div>

                {selectedZone === metric.zone && (
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-600">Peak Time</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{metric.peakTime}</p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-600">Current Capacity</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{metric.currentCapacity}%</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Snapshots Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Heatmap Snapshots Over Time</h2>
              <span className="text-xs text-purple-100">Historical density patterns</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {MOCK_SNAPSHOTS.map(snapshot => (
                <div 
                  key={snapshot.id}
                  onClick={() => setSelectedSnapshot(selectedSnapshot === snapshot.id ? null : snapshot.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedSnapshot === snapshot.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-purple-500/30'
                      : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{snapshot.timestamp}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-sm text-slate-600">{snapshot.peakZone}</span>
                        </div>
                        <p className="text-sm text-slate-600">{snapshot.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center bg-slate-50 px-4 py-2 rounded-lg">
                      <span className={`text-2xl font-bold ${getDensityColor(snapshot.density)}`}>
                        {snapshot.density}%
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Density</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Stability Scores */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Zone Stability Scores</h2>
              <span className="text-xs text-emerald-100">Overall zone performance</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_METRICS.map((metric, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">{metric.zone}</h3>
                    <span className={`text-xs px-2 py-1 rounded-lg border font-bold uppercase ${getStabilityColor(metric.stability)}`}>
                      {metric.stability}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Energy Index</span>
                      <span className="font-bold text-slate-900">{metric.energyIndex}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Capacity</span>
                      <span className="font-bold text-slate-900">{metric.currentCapacity}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Trend</span>
                      <span className="font-bold text-slate-900 capitalize">{metric.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Analytical & Historical Data</h4>
            <p className="text-sm text-blue-700">
              This page provides aggregate insights based on historical patterns and trends. For real-time monitoring, use Live Heatmap & Crowd Density page in Live Operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
