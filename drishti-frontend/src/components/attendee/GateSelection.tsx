import { useState } from 'react';
import { 
  ArrowLeft, 
  Navigation, 
  Clock, 
  Users,
  CheckCircle2,
  ChevronRight,
  MapPin,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { NavigationMap } from './NavigationMap';

interface GateSelectionProps {
  onBack: () => void;
}

interface Gate {
  id: string;
  name: string;
  crowdLevel: 'Busy' | 'Low Crowd' | 'Moderate';
  distance: string;
  eta: string;
  waitTime: string;
  recommended?: boolean;
  color: 'red' | 'green' | 'amber';
  icon: React.ReactNode;
}

export function GateSelection({ onBack }: GateSelectionProps) {
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [showMap, setShowMap] = useState(false);

  const gates: Gate[] = [
    {
      id: 'A',
      name: 'Gate A - Main Entrance',
      crowdLevel: 'Busy',
      distance: '850m',
      eta: '12 min',
      waitTime: '~8 min',
      color: 'red',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'B',
      name: 'Gate B - North Entrance',
      crowdLevel: 'Low Crowd',
      distance: '1.1km',
      eta: '15 min',
      waitTime: '~2 min',
      recommended: true,
      color: 'green',
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      id: 'C',
      name: 'Gate C - VIP Entrance',
      crowdLevel: 'Moderate',
      distance: '720m',
      eta: '10 min',
      waitTime: '~5 min',
      color: 'amber',
      icon: <Minus className="w-4 h-4" />,
    },
  ];

  if (showMap && selectedGate) {
    return <NavigationMap gate={selectedGate} onBack={() => setShowMap(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-slate-900">Select Your Gate</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Choose based on current crowd levels</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              Attendee Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm">Total Check-ins Today</p>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-slate-900 text-3xl">8,432</p>
              <p className="text-green-600 text-sm mt-1">+1,245 in last hour</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm">Avg Wait Time</p>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-slate-900 text-3xl">5.2m</p>
              <p className="text-green-600 text-sm mt-1">-2.1m from peak</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm">Active Gates</p>
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-slate-900 text-3xl">3/3</p>
              <p className="text-blue-600 text-sm mt-1">All gates operational</p>
            </div>
          </div>

          {/* Gates List */}
          <div className="space-y-4">
            {gates.map((gate) => (
              <div
                key={gate.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 overflow-hidden ${
                  selectedGate?.id === gate.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        gate.color === 'red' ? 'bg-red-100' :
                        gate.color === 'green' ? 'bg-green-100' :
                        'bg-amber-100'
                      }`}>
                        <span className={`text-2xl ${
                          gate.color === 'red' ? 'text-red-600' :
                          gate.color === 'green' ? 'text-green-600' :
                          'text-amber-600'
                        }`}>
                          {gate.id}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-slate-900 mb-1">{gate.name}</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
                          gate.color === 'red' ? 'bg-red-100 text-red-700' :
                          gate.color === 'green' ? 'bg-green-100 text-green-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {gate.icon}
                          <span>{gate.crowdLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                        <Navigation className="w-4 h-4" />
                        <span>Distance</span>
                      </div>
                      <p className="text-slate-900 text-xl">{gate.distance}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Walking Time</span>
                      </div>
                      <p className="text-slate-900 text-xl">{gate.eta}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                        <Users className="w-4 h-4" />
                        <span>Wait Time</span>
                      </div>
                      <p className="text-slate-900 text-xl">{gate.waitTime}</p>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  {gate.recommended && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-green-900 mb-1">Recommended Gate</p>
                          <p className="text-green-700 text-sm">Shortest wait time • Less crowded</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSelectedGate(gate);
                      setShowMap(true);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg py-4 px-6 flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Navigation className="w-5 h-5" />
                    <span className="text-lg">Start Navigation to Gate {gate.id}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-900 mb-2">Pro Tip</p>
                <p className="text-slate-700 text-sm">Crowd levels update every 2 minutes. Gate B typically has the shortest wait times during peak hours.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
