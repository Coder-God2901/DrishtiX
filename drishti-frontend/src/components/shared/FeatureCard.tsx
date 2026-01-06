import { Sparkles, ChevronRight, Check } from 'lucide-react';

interface FeatureCardProps {
  onLaunch: () => void;
}

export function FeatureCard({ onLaunch }: FeatureCardProps) {
  const tools = [
    'Event Creator',
    'Venue Mapping',
    'Canvas Editor',
    'CRUD Manager',
    'Analytics',
    'Data Pipeline',
  ];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-slate-900 mb-2">Event Management Hub</h2>
            <p className="text-slate-600">Complete event lifecycle management with integrated tools</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <Check className="w-4 h-4 text-green-600" />
              {tool}
            </div>
          ))}
        </div>

        <button 
          onClick={onLaunch}
          className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>Launch Event Hub</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
