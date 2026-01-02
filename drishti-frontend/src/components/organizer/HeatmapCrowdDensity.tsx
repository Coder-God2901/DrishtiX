import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart3,
  Clock,
  Radio,
  Eye,
  EyeOff,
  Grid3x3,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Layers,
  Timer
} from 'lucide-react';
import { LeafletMap } from '../shared/LeafletMap';

interface HeatmapCrowdDensityProps {
  onBack: () => void;
}

interface ZoneDensity {
  id: string;
  name: string;
  density: 'high' | 'medium' | 'low';
  occupancy: number;
  capacity: number;
  trend: 'rising' | 'falling' | 'stable';
  coordinates: [number, number];
  timeToThreshold?: number;
  entryRate: number;
  exitRate: number;
  avgDwellTime: number;
}

interface HeatmapKPI {
  highDensityZones: number;
  mediumDensityZones: number;
  lowDensityZones: number;
  totalAttendees: number;
  avgCrowdFlowRate: number;
}

interface CrowdInsight {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  icon: React.ElementType;
}

// Mock data hook - simulates real-time updates
function useHeatmapData() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  
  const [kpis, setKpis] = useState<HeatmapKPI>({
    highDensityZones: 3,
    mediumDensityZones: 5,
    lowDensityZones: 7,
    totalAttendees: 12847,
    avgCrowdFlowRate: 142
  });

  const [zones, setZones] = useState<ZoneDensity[]>([
    {
      id: 'z1',
      name: 'Main Stage',
      density: 'high',
      occupancy: 4250,
      capacity: 5000,
      trend: 'rising',
      coordinates: [28.6139, 77.2090],
      timeToThreshold: 7,
      entryRate: 85,
      exitRate: 42,
      avgDwellTime: 45
    },
    {
      id: 'z2',
      name: 'Food Court',
      density: 'high',
      occupancy: 1820,
      capacity: 2000,
      trend: 'falling',
      coordinates: [28.6149, 77.2100],
      entryRate: 32,
      exitRate: 58,
      avgDwellTime: 22
    },
    {
      id: 'z3',
      name: 'Entrance Gate A',
      density: 'high',
      occupancy: 980,
      capacity: 1200,
      trend: 'stable',
      coordinates: [28.6159, 77.2080],
      entryRate: 45,
      exitRate: 44,
      avgDwellTime: 8
    },
    {
      id: 'z4',
      name: 'Exhibition Hall',
      density: 'medium',
      occupancy: 650,
      capacity: 1500,
      trend: 'rising',
      coordinates: [28.6129, 77.2110],
      timeToThreshold: 18,
      entryRate: 28,
      exitRate: 18,
      avgDwellTime: 32
    },
    {
      id: 'z5',
      name: 'Parking Zone B',
      density: 'medium',
      occupancy: 420,
      capacity: 800,
      trend: 'stable',
      coordinates: [28.6169, 77.2070],
      entryRate: 12,
      exitRate: 13,
      avgDwellTime: 15
    },
    {
      id: 'z6',
      name: 'Open Lawn',
      density: 'medium',
      occupancy: 780,
      capacity: 2000,
      trend: 'rising',
      coordinates: [28.6119, 77.2095],
      timeToThreshold: 25,
      entryRate: 22,
      exitRate: 15,
      avgDwellTime: 38
    },
    {
      id: 'z7',
      name: 'Side Stage',
      density: 'medium',
      occupancy: 890,
      capacity: 2000,
      trend: 'falling',
      coordinates: [28.6139, 77.2120],
      entryRate: 18,
      exitRate: 28,
      avgDwellTime: 28
    },
    {
      id: 'z8',
      name: 'Merchandise Area',
      density: 'medium',
      occupancy: 320,
      capacity: 800,
      trend: 'stable',
      coordinates: [28.6109, 77.2085],
      entryRate: 15,
      exitRate: 15,
      avgDwellTime: 18
    },
    {
      id: 'z9',
      name: 'Restrooms Zone C',
      density: 'low',
      occupancy: 140,
      capacity: 500,
      trend: 'stable',
      coordinates: [28.6149, 77.2075],
      entryRate: 8,
      exitRate: 8,
      avgDwellTime: 5
    },
    {
      id: 'z10',
      name: 'VIP Lounge',
      density: 'low',
      occupancy: 85,
      capacity: 300,
      trend: 'rising',
      coordinates: [28.6129, 77.2130],
      entryRate: 3,
      exitRate: 1,
      avgDwellTime: 65
    },
    {
      id: 'z11',
      name: 'Kids Play Area',
      density: 'low',
      occupancy: 95,
      capacity: 400,
      trend: 'falling',
      coordinates: [28.6099, 77.2105],
      entryRate: 2,
      exitRate: 5,
      avgDwellTime: 42
    },
    {
      id: 'z12',
      name: 'Info Desk',
      density: 'low',
      occupancy: 45,
      capacity: 200,
      trend: 'stable',
      coordinates: [28.6159, 77.2110],
      entryRate: 4,
      exitRate: 4,
      avgDwellTime: 3
    },
    {
      id: 'z13',
      name: 'Quiet Zone',
      density: 'low',
      occupancy: 32,
      capacity: 150,
      trend: 'stable',
      coordinates: [28.6089, 77.2090],
      entryRate: 1,
      exitRate: 1,
      avgDwellTime: 28
    },
    {
      id: 'z14',
      name: 'Photography Zone',
      density: 'low',
      occupancy: 68,
      capacity: 250,
      trend: 'rising',
      coordinates: [28.6169, 77.2120],
      entryRate: 5,
      exitRate: 3,
      avgDwellTime: 12
    },
    {
      id: 'z15',
      name: 'Emergency Exit D',
      density: 'low',
      occupancy: 12,
      capacity: 300,
      trend: 'stable',
      coordinates: [28.6179, 77.2095],
      entryRate: 1,
      exitRate: 1,
      avgDwellTime: 2
    }
  ]);

  const [insights, setInsights] = useState<CrowdInsight[]>([
    {
      id: 'i1',
      message: 'Main Stage density rising rapidly - approaching capacity',
      severity: 'warning',
      icon: AlertTriangle
    },
    {
      id: 'i2',
      message: 'Food Court congestion easing as crowd shifts to Main Stage',
      severity: 'info',
      icon: TrendingDown
    },
    {
      id: 'i3',
      message: 'Main Stage likely to reach threshold in ~7 minutes',
      severity: 'critical',
      icon: Timer
    },
    {
      id: 'i4',
      message: 'VIP Lounge flow is normal, no congestion detected',
      severity: 'info',
      icon: CheckCircle2
    }
  ]);

  // Simulate real-time updates every 10 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      
      // Update KPIs with slight variations
      setKpis(prev => ({
        ...prev,
        totalAttendees: prev.totalAttendees + Math.floor(Math.random() * 20 - 5),
        avgCrowdFlowRate: Math.max(100, prev.avgCrowdFlowRate + Math.floor(Math.random() * 10 - 5))
      }));

      // Update some zone densities randomly
      setZones(prev => prev.map(zone => {
        if (Math.random() > 0.7) {
          const change = Math.floor(Math.random() * 40 - 20);
          const newOccupancy = Math.max(0, Math.min(zone.capacity, zone.occupancy + change));
          const occupancyPercent = (newOccupancy / zone.capacity) * 100;
          
          let newDensity: 'high' | 'medium' | 'low' = 'low';
          if (occupancyPercent >= 75) newDensity = 'high';
          else if (occupancyPercent >= 40) newDensity = 'medium';

          let newTrend: 'rising' | 'falling' | 'stable' = 'stable';
          if (change > 5) newTrend = 'rising';
          else if (change < -5) newTrend = 'falling';

          return {
            ...zone,
            occupancy: newOccupancy,
            density: newDensity,
            trend: newTrend
          };
        }
        return zone;
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, [isLive]);

  return { kpis, zones, insights, lastUpdated, isLive, setIsLive };
}

export function HeatmapCrowdDensity({ onBack }: HeatmapCrowdDensityProps) {
  const { kpis, zones, insights, lastUpdated, isLive, setIsLive } = useHeatmapData();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [viewMode, setViewMode] = useState<'live' | 'historical'>('live');

  const getDensityColor = (density: 'high' | 'medium' | 'low') => {
    switch (density) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getDensityBadgeColor = (density: 'high' | 'medium' | 'low') => {
    switch (density) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
    }
  };

  const getTrendIcon = (trend: 'rising' | 'falling' | 'stable') => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-emerald-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  const getInsightColor = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'info': return 'border-blue-200 bg-blue-50';
    }
  };

  const activeZonesCount = zones.length;

  // Calculate aggregate flow metrics
  const totalEntryRate = zones.reduce((sum, z) => sum + z.entryRate, 0);
  const totalExitRate = zones.reduce((sum, z) => sum + z.exitRate, 0);
  const netFlow = totalEntryRate - totalExitRate;
  const avgDwellTime = Math.round(zones.reduce((sum, z) => sum + z.avgDwellTime, 0) / zones.length);

  // Map markers for zones
  const zoneMarkers = zones.map(zone => ({
    id: zone.id,
    position: zone.coordinates as [number, number],
    label: zone.name,
    color: zone.density === 'high' ? 'red' : zone.density === 'medium' ? 'orange' : 'green'
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Heatmap & Crowd Density
              </h1>
              <p className="text-purple-100 text-sm">
                Real-time crowd distribution and congestion analysis
              </p>
            </div>
          </div>

          {/* Header Badges */}
          <div className="flex items-center gap-3">
            {/* Live Feed Status */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-sm font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
              <button
                onClick={() => setIsLive(!isLive)}
                className="ml-1 p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isLive ? <Radio className="w-4 h-4" /> : <Radio className="w-4 h-4 opacity-50" />}
              </button>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Active Zones Count */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Grid3x3 className="w-4 h-4" />
              <span className="text-sm font-medium">{activeZonesCount} Active Zones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* KPI Summary Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* High Density Zones */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getDensityBadgeColor('high')}`}>
                HIGH
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-red-600">{kpis.highDensityZones}</p>
              <p className="text-xs text-slate-600 mt-1">High Density Zones</p>
            </div>
          </div>

          {/* Medium Density Zones */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getDensityBadgeColor('medium')}`}>
                MEDIUM
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-amber-600">{kpis.mediumDensityZones}</p>
              <p className="text-xs text-slate-600 mt-1">Medium Density Zones</p>
            </div>
          </div>

          {/* Low Density Zones */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getDensityBadgeColor('low')}`}>
                LOW
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-emerald-600">{kpis.lowDensityZones}</p>
              <p className="text-xs text-slate-600 mt-1">Low Density Zones</p>
            </div>
          </div>

          {/* Total Attendees */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-blue-600">{kpis.totalAttendees.toLocaleString()}</p>
              <p className="text-xs text-slate-600 mt-1">Total Attendees</p>
            </div>
          </div>

          {/* Avg Crowd Flow Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-purple-600">{kpis.avgCrowdFlowRate}</p>
              <p className="text-xs text-slate-600 mt-1">People/min</p>
            </div>
          </div>
        </div>

        {/* Main Heatmap Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Map Controls Bar */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Interactive Heatmap
            </h2>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('live')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'live' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setViewMode('historical')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'historical' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/20'
                  }`}
                >
                  Historical
                </button>
              </div>

              {/* Toggle Labels */}
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {showLabels ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                <span className="text-xs font-medium text-white">Labels</span>
              </button>

              {/* Toggle Boundaries */}
              <button
                onClick={() => setShowBoundaries(!showBoundaries)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Grid3x3 className="w-4 h-4 text-white" />
                <span className="text-xs font-medium text-white">Boundaries</span>
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[500px]">
            <LeafletMap
              center={[28.6139, 77.2090]}
              zoom={15}
              markers={zoneMarkers}
              onMarkerClick={(zoneId: string) => setSelectedZone(zoneId)}
              height="500px"
            />
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-3 z-[1000]">
              <h3 className="text-xs font-bold text-slate-900 mb-2">Density Legend</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-xs text-slate-700">High (≥75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-xs text-slate-700">Medium (40-74%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-xs text-slate-700">Low (&lt;40%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone Density Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Zone Density Cards
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-3 gap-4">
            {zones.map(zone => {
              const occupancyPercent = Math.round((zone.occupancy / zone.capacity) * 100);
              const isSelected = selectedZone === zone.id;
              
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-200' : getDensityColor(zone.density)
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">{zone.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getDensityBadgeColor(zone.density)}`}>
                        {zone.density.toUpperCase()}
                      </span>
                    </div>
                    {getTrendIcon(zone.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Occupancy</span>
                      <span className="text-sm font-bold text-slate-900">
                        {zone.occupancy.toLocaleString()} / {zone.capacity.toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          zone.density === 'high' ? 'bg-red-500' :
                          zone.density === 'medium' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Capacity</span>
                      <span className="text-lg font-bold text-slate-900">{occupancyPercent}%</span>
                    </div>

                    {zone.timeToThreshold && zone.trend === 'rising' && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 mt-2">
                        <Timer className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-red-700 font-medium">
                          Threshold in ~{zone.timeToThreshold} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crowd Flow Analytics + AI Insights Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Crowd Flow Analytics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Crowd Flow Analytics
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Entry Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">Entry Rate</span>
                  <span className="text-lg font-bold text-emerald-600">+{totalEntryRate} /min</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (totalEntryRate / 300) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Exit Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">Exit Rate</span>
                  <span className="text-lg font-bold text-red-600">-{totalExitRate} /min</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${Math.min(100, (totalExitRate / 300) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Net Flow */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">Net Flow</span>
                  <span className={`text-lg font-bold ${netFlow > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {netFlow > 0 ? '+' : ''}{netFlow} /min
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${netFlow > 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(100, Math.abs((netFlow / 150) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Avg Dwell Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">Avg Dwell Time</span>
                  <span className="text-lg font-bold text-purple-600">{avgDwellTime} min</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${Math.min(100, (avgDwellTime / 60) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Crowd Insights
              </h2>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 italic mb-3">
                AI-generated insights for crowd management (advisory only)
              </p>
              
              {insights.map(insight => {
                const Icon = insight.icon;
                return (
                  <div
                    key={insight.id}
                    className={`border-2 rounded-lg p-3 ${getInsightColor(insight.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        insight.severity === 'critical' ? 'bg-red-100' :
                        insight.severity === 'warning' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          insight.severity === 'critical' ? 'text-red-600' :
                          insight.severity === 'warning' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900 font-medium">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
