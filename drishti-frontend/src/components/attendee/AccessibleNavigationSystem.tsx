import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Accessibility,
  Check,
  MapPin,
  Clock,
  Navigation,
  AlertCircle,
  Heart,
  Users,
  Footprints,
  Move,
  ArrowUpDown,
  Circle,
  ChevronRight,
  Info,
  Shield,
  Sparkles
} from 'lucide-react';

interface AccessibleNavigationSystemProps {
  onBack: () => void;
  destination?: string;
}

interface AccessibilityFeature {
  id: string;
  name: string;
  icon: any;
  x: number;
  y: number;
  type: 'elevator' | 'ramp' | 'medical' | 'rest' | 'wide-path';
}

interface RouteSegment {
  id: string;
  name: string;
  distance: string;
  features: string[];
  description: string;
}

export function AccessibleNavigationSystem({ onBack, destination = 'Main Stage Area' }: AccessibleNavigationSystemProps) {
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);

  const accessibilityFeatures: AccessibilityFeature[] = [
    { id: 'f1', name: 'Elevator A', icon: ArrowUpDown, x: 25, y: 30, type: 'elevator' },
    { id: 'f2', name: 'Elevator B', icon: ArrowUpDown, x: 70, y: 40, type: 'elevator' },
    { id: 'f3', name: 'Gentle Ramp', icon: Move, x: 40, y: 55, type: 'ramp' },
    { id: 'f4', name: 'Medical Station', icon: Heart, x: 60, y: 70, type: 'medical' },
    { id: 'f5', name: 'Rest Area', icon: Circle, x: 50, y: 25, type: 'rest' },
    { id: 'f6', name: 'Wide Pathway', icon: Move, x: 35, y: 65, type: 'wide-path' },
  ];

  const routeSegments: RouteSegment[] = [
    {
      id: 's1',
      name: 'Main Entrance Plaza',
      distance: '120m',
      features: ['Wide pathway', 'Level surface'],
      description: 'Spacious area with smooth flooring'
    },
    {
      id: 's2',
      name: 'Via Elevator A',
      distance: '15m',
      features: ['Elevator access', 'No stairs'],
      description: 'Accessible elevator with audio announcements'
    },
    {
      id: 's3',
      name: 'Upper Concourse',
      distance: '180m',
      features: ['Wide corridor', 'Rest benches available'],
      description: 'Gentle path with seating every 50m'
    },
    {
      id: 's4',
      name: 'Arrival at Destination',
      distance: '25m',
      features: ['Reserved viewing area', 'Wheelchair spaces'],
      description: 'Dedicated accessible viewing zone'
    }
  ];

  useEffect(() => {
    if (accessibleMode) {
      setShowBanner(true);
      setTimeout(() => setRouteCalculated(true), 800);
    } else {
      setShowBanner(false);
      setRouteCalculated(false);
    }
  }, [accessibleMode]);

  const totalDistance = '340m';
  const estimatedTime = '6 mins';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
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
                <Navigation className="w-6 h-6 text-blue-600" />
                Accessible Navigation
              </h1>
              <p className="text-slate-600 text-sm">Safe routes for everyone</p>
            </div>
          </div>
        </div>
      </header>

      {/* Active Mode Banner */}
      {showBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl shadow-2xl p-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-lg mb-1">♿ Accessible Route Active</p>
                <p className="text-teal-100 text-sm">Avoiding steps and dense corridors for your comfort</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Destination Card */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">Navigating to</p>
              <p className="text-slate-900 text-xl">{destination}</p>
            </div>
          </div>
        </div>

        {/* Main Toggle Component */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Accessibility className="w-8 h-8" />
              <h2 className="text-2xl">Accessible Route Mode</h2>
            </div>
            <p className="text-teal-100">Safe paths designed for wheelchair users, elderly visitors, and families</p>
          </div>

          <div className="p-6">
            <button
              onClick={() => setAccessibleMode(!accessibleMode)}
              className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 ${
                accessibleMode
                  ? 'bg-gradient-to-r from-teal-50 to-blue-50 border-teal-400 shadow-lg shadow-teal-100'
                  : 'bg-slate-50 border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    accessibleMode
                      ? 'bg-gradient-to-br from-teal-500 to-blue-500'
                      : 'bg-slate-300'
                  }`}>
                    <Accessibility className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-900 text-xl mb-1">
                      {accessibleMode ? 'Accessible Mode Active' : 'Enable Accessible Routes'}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {accessibleMode 
                        ? 'Routes avoid stairs, steep paths, and crowded areas' 
                        : 'Tap to activate accessible navigation'}
                    </p>
                  </div>
                </div>
                
                {/* Animated Toggle Switch */}
                <div className={`relative w-20 h-10 rounded-full transition-all duration-300 ${
                  accessibleMode ? 'bg-teal-500' : 'bg-slate-300'
                }`}>
                  <div className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                    accessibleMode ? 'translate-x-10' : 'translate-x-0'
                  }`}>
                    {accessibleMode && <Check className="w-5 h-5 text-teal-500" />}
                  </div>
                </div>
              </div>
            </button>

            {/* Feature Benefits */}
            {accessibleMode && (
              <div className="mt-6 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom duration-500">
                {[
                  { icon: Footprints, label: 'No Stairs', color: 'teal' },
                  { icon: Move, label: 'Wide Paths', color: 'blue' },
                  { icon: Users, label: 'Low Crowds', color: 'indigo' },
                  { icon: Heart, label: 'Rest Areas', color: 'purple' },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        feature.color === 'teal' ? 'bg-teal-100' :
                        feature.color === 'blue' ? 'bg-blue-100' :
                        feature.color === 'indigo' ? 'bg-indigo-100' :
                        'bg-purple-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          feature.color === 'teal' ? 'text-teal-600' :
                          feature.color === 'blue' ? 'text-blue-600' :
                          feature.color === 'indigo' ? 'text-indigo-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <span className="text-slate-700 text-sm">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Route Summary Card */}
        {accessibleMode && routeCalculated && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-teal-200 overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 border-b-2 border-teal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 text-xl mb-1">Access-Safe Route</h3>
                    <p className="text-slate-600 text-sm">Comfortable path with no obstacles</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-teal-600 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl">{estimatedTime}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{totalDistance}</p>
                </div>
              </div>

              {/* Path Difficulty */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-slate-700 text-sm">Path Difficulty:</span>
                <div className="flex items-center gap-1">
                  <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                  <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                  <Circle className="w-3 h-3 text-slate-300" />
                  <Circle className="w-3 h-3 text-slate-300" />
                  <Circle className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-green-600 text-sm ml-2">Easy</span>
              </div>
            </div>

            {/* Route Segments */}
            <div className="p-6">
              <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Turn-by-Turn Directions
              </h4>
              <div className="space-y-3">
                {routeSegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="relative pl-8 pb-6 last:pb-0"
                  >
                    {/* Timeline Line */}
                    {index < routeSegments.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 to-blue-300" />
                    )}
                    
                    {/* Step Marker */}
                    <div className="absolute left-0 top-1 w-6 h-6 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                      {index + 1}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-900">{segment.name}</p>
                        <span className="text-teal-600 text-sm">{segment.distance}</span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">{segment.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {segment.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-lg border border-teal-200"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Visualization */}
        {accessibleMode && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden animate-in fade-in duration-500">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <h3 className="text-lg">Route Map</h3>
                </div>
                <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 p-8" style={{ height: '500px' }}>
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="access-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#access-grid)" />
                </svg>
              </div>

              {/* Accessible Route Path (glowing dotted line) */}
              <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.4))' }}>
                <path
                  d="M 15% 80% Q 25% 60%, 30% 50% T 45% 40% T 60% 35% T 75% 25%"
                  fill="none"
                  stroke="url(#accessible-gradient)"
                  strokeWidth="6"
                  strokeDasharray="12 8"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="accessible-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Start Point */}
              <div className="absolute" style={{ left: '15%', top: '80%' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-in zoom-in duration-500">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-white px-3 py-1 rounded-lg text-sm text-slate-900 shadow-lg border border-slate-200">
                    You are here
                  </span>
                </div>
              </div>

              {/* End Point */}
              <div className="absolute" style={{ left: '75%', top: '25%' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-in zoom-in duration-700">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-white px-3 py-1 rounded-lg text-sm text-slate-900 shadow-lg border border-slate-200">
                    {destination}
                  </span>
                </div>
              </div>

              {/* Accessibility Features */}
              {accessibilityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                const colors = {
                  elevator: 'from-blue-500 to-blue-600',
                  ramp: 'from-teal-500 to-teal-600',
                  medical: 'from-red-500 to-pink-600',
                  rest: 'from-purple-500 to-indigo-600',
                  'wide-path': 'from-green-500 to-emerald-600'
                };

                return (
                  <div
                    key={feature.id}
                    className="absolute group animate-in fade-in zoom-in"
                    style={{ 
                      left: `${feature.x}%`, 
                      top: `${feature.y}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${colors[feature.type]} rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap shadow-xl">
                        {feature.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-slate-200">
                <h5 className="text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Accessibility Features
                </h5>
                <div className="space-y-2">
                  {[
                    { icon: ArrowUpDown, label: 'Elevator', color: 'blue' },
                    { icon: Move, label: 'Ramp/Wide Path', color: 'teal' },
                    { icon: Heart, label: 'Medical Station', color: 'red' },
                    { icon: Circle, label: 'Rest Area', color: 'purple' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          item.color === 'blue' ? 'bg-blue-100' :
                          item.color === 'teal' ? 'bg-teal-100' :
                          item.color === 'red' ? 'bg-red-100' :
                          'bg-purple-100'
                        }`}>
                          <Icon className={`w-3 h-3 ${
                            item.color === 'blue' ? 'text-blue-600' :
                            item.color === 'teal' ? 'text-teal-600' :
                            item.color === 'red' ? 'text-red-600' :
                            'text-purple-600'
                          }`} />
                        </div>
                        <span className="text-slate-700">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border-2 border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-slate-900 mb-2">Designed for Everyone</h4>
              <p className="text-slate-700 text-sm leading-relaxed mb-3">
                Our accessible routing system uses DrishtiX AI to find the most comfortable path for your needs. 
                Routes are continuously updated based on real-time crowd data and venue conditions.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Wheelchair friendly', 'Stroller accessible', 'Elderly friendly', 'Family friendly'].map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white text-slate-700 text-xs rounded-full border border-blue-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Start Navigation Button */}
        {accessibleMode && routeCalculated && (
          <button className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-6 rounded-2xl shadow-xl hover:shadow-2xl hover:from-teal-700 hover:to-blue-700 transition-all flex items-center justify-center gap-3 text-xl animate-in fade-in slide-in-from-bottom duration-700">
            <Navigation className="w-6 h-6" />
            <span>Start Accessible Navigation</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </main>
    </div>
  );
}