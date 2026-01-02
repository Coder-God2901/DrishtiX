import React from 'react';
import {
  Users,
  MapPin,
  ArrowUpDown,
  Move,
  Heart,
  Circle,
  Info,
  Check
} from 'lucide-react';

interface AccessibilityFeature {
  id: string;
  name: string;
  icon: any;
  x: number;
  y: number;
  type: 'elevator' | 'ramp' | 'medical' | 'rest' | 'wide-path';
}

interface AccessibleNavigationMapProps {
  destination?: string;
}

export function AccessibleNavigationMap({ destination = 'Main Stage Area' }: AccessibleNavigationMapProps) {
  const accessibilityFeatures: AccessibilityFeature[] = [
    { id: 'f1', name: 'Elevator A', icon: ArrowUpDown, x: 25, y: 30, type: 'elevator' },
    { id: 'f2', name: 'Elevator B', icon: ArrowUpDown, x: 70, y: 40, type: 'elevator' },
    { id: 'f3', name: 'Gentle Ramp', icon: Move, x: 40, y: 55, type: 'ramp' },
    { id: 'f4', name: 'Medical Station', icon: Heart, x: 60, y: 70, type: 'medical' },
    { id: 'f5', name: 'Rest Area', icon: Circle, x: 50, y: 25, type: 'rest' },
    { id: 'f6', name: 'Wide Pathway', icon: Move, x: 35, y: 65, type: 'wide-path' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-teal-200 overflow-hidden flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Move className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl">Accessible Navigation Map</h2>
              <p className="text-teal-100 text-sm">Optimized routes for accessibility</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm">Live Guidance</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative flex-1 bg-slate-50 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none text-teal-600">
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
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                  <span className="text-xs text-slate-600">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
