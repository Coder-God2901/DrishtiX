import { MapPin, Activity, AlertTriangle, Clock } from 'lucide-react';

export function MapDebugTest() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl mb-4">Map Rendering Debug Test</h1>
      
      {/* Test 1: Basic Container */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Test 1: Basic Container</h2>
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-[500px] border-4 border-blue-500">
          <p className="absolute top-4 left-4 text-2xl font-bold">Container Visible</p>
        </div>
      </div>

      {/* Test 2: Blur Overlays */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Test 2: Blur Overlays</h2>
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-[500px] border-4 border-green-500 overflow-hidden">
          <p className="absolute top-4 left-4 text-2xl font-bold z-50">Blur Test</p>
          <div className="absolute top-[18%] left-[40%] w-48 h-48 bg-red-600/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-[50%] left-[25%] w-36 h-36 bg-amber-500/25 rounded-full blur-2xl" />
          <div className="absolute bottom-[25%] right-[30%] w-28 h-28 bg-green-500/20 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Test 3: Absolute Positioned Elements */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Test 3: Absolute Positioned Labels</h2>
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-[500px] border-4 border-purple-500 overflow-hidden">
          <div className="absolute top-[20%] left-[42%] bg-red-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg border-2 border-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3" />
              <span>Main Stage</span>
            </div>
            <div className="text-[10px] opacity-90">
              8,500/10,000 (85%)
            </div>
          </div>

          <div className="absolute top-[52%] left-[27%] bg-amber-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg border-2 border-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3" />
              <span>Food Court</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test 4: Combined - Exact replica */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Test 4: Full Map Replica</h2>
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-[500px] flex items-center justify-center overflow-hidden border-4 border-orange-500">
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Live Venue Simulation</p>
            </div>
          </div>

          {/* Blur Overlays */}
          <div className="absolute top-[18%] left-[40%] w-48 h-48 bg-red-600/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-[50%] left-[25%] w-36 h-36 bg-amber-500/25 rounded-full blur-2xl" />
          <div className="absolute bottom-[25%] right-[30%] w-28 h-28 bg-green-500/20 rounded-full blur-2xl" />
          <div className="absolute top-[15%] right-[20%] w-32 h-32 bg-red-500/35 rounded-full blur-xl animate-pulse" />

          {/* Anomaly Markers */}
          <button
            className="absolute w-8 h-8 rounded-full border-3 border-white shadow-lg bg-red-600 animate-pulse flex items-center justify-center z-20"
            style={{ left: '60%', top: '30%' }}
          >
            <AlertTriangle className="w-4 h-4 text-white" />
          </button>

          {/* Zone Labels */}
          <div className="absolute top-[20%] left-[42%] bg-red-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg border-2 border-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3" />
              <span>Main Stage</span>
            </div>
            <div className="text-[10px] opacity-90">
              8,500/10,000 (85%)
              <br/>
              <span className="text-yellow-200">+45/min ↑</span>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200 z-10">
            <p className="text-xs text-slate-900 mb-2">Live Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-xs text-slate-700">Critical (1)</span>
              </div>
            </div>
          </div>

          {/* Time indicator */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-slate-200 z-10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-slate-900">8:23 PM</span>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Info */}
      <div className="bg-white p-4 rounded-lg border border-slate-300">
        <h3 className="font-bold mb-2">Diagnostic Checklist:</h3>
        <ul className="space-y-1 text-sm">
          <li>✓ Tailwind CSS classes applied</li>
          <li>✓ Lucide React icons imported</li>
          <li>✓ Blur effects (blur-xl, blur-2xl, blur-3xl)</li>
          <li>✓ Absolute positioning with percentage</li>
          <li>✓ Z-index layering</li>
          <li>✓ Overflow hidden on container</li>
          <li>✓ Background gradients</li>
          <li>✓ Opacity controls (bg-red-600/40)</li>
        </ul>
      </div>
    </div>
  );
}
