import { 
  Music,
  PartyPopper,
  Briefcase,
  Users,
  Flag,
  GraduationCap,
  Plus,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { EventCreationForm } from './EventCreationForm';

interface EventTypeSelectionProps {
  onSelectType: (eventType: EventType) => void;
  onBack: () => void;
}

interface EventType {
  id: string;
  name: string;
  description: string;
  capacity: string;
  riskLevel: 'high risk' | 'medium risk' | 'low risk';
  icon: any;
  color: string;
  subtitle: string;
  defaultCapacity: number;
}

export function EventTypeSelection({ onSelectType, onBack }: EventTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);

  const eventTypes: EventType[] = [
    {
      id: 'concert',
      name: 'Concert / Music Festival',
      description: 'Live music events with high crowd density',
      subtitle: 'High-energy music events with multiple stages and performers',
      capacity: '50,000',
      defaultCapacity: 50000,
      riskLevel: 'high risk',
      icon: Music,
      color: '#FF6A00'
    },
    {
      id: 'festival',
      name: 'Festival',
      description: 'Multi-day outdoor celebrations',
      subtitle: 'Multi-day celebrations with diverse activities and entertainment',
      capacity: '75,000',
      defaultCapacity: 75000,
      riskLevel: 'high risk',
      icon: PartyPopper,
      color: '#9C27B0'
    },
    {
      id: 'conference',
      name: 'Conference',
      description: 'Professional business events',
      subtitle: 'Professional gatherings for networking and knowledge sharing',
      capacity: '5,000',
      defaultCapacity: 5000,
      riskLevel: 'low risk',
      icon: Briefcase,
      color: '#0B3D91'
    },
    {
      id: 'marathon',
      name: 'Marathon / Running Event',
      description: 'Running events with distributed attendees',
      subtitle: 'Athletic events with various running categories',
      capacity: '30,000',
      defaultCapacity: 30000,
      riskLevel: 'medium risk',
      icon: Users,
      color: '#16A34A'
    },
    {
      id: 'rally',
      name: 'Rally / Public Gathering',
      description: 'Political or awareness gatherings',
      subtitle: 'Public gatherings for causes and awareness',
      capacity: '100,000',
      defaultCapacity: 100000,
      riskLevel: 'high risk',
      icon: Flag,
      color: '#F59E0B'
    },
    {
      id: 'workshop',
      name: 'Workshop / Training',
      description: 'Educational and training sessions',
      subtitle: 'Educational sessions with hands-on learning',
      capacity: '500',
      defaultCapacity: 500,
      riskLevel: 'low risk',
      icon: GraduationCap,
      color: '#0EA5E9'
    },
    {
      id: 'custom',
      name: 'Custom Event',
      description: 'Create your own event with custom fields',
      subtitle: 'Build a completely custom event type',
      capacity: '1,000',
      defaultCapacity: 1000,
      riskLevel: 'medium risk',
      icon: Plus,
      color: '#6B7280'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'high risk': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium risk': return 'text-amber-600 bg-amber-100 border-amber-300';
      case 'low risk': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-slate-600 bg-slate-100 border-slate-300';
    }
  };

  const getIconColor = (color: string) => {
    return `bg-opacity-20`;
  };

  const handleSelectType = (type: EventType) => {
    setSelectedType(type);
  };

  if (selectedType) {
    return (
      <EventCreationForm
        eventType={selectedType}
        onBack={() => setSelectedType(null)}
        onSave={(eventData) => {
          console.log('Event created:', eventData);
          alert(`Event "${eventData.eventName}" created successfully!`);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                <button onClick={onBack} className="hover:text-slate-900 transition-colors">
                  Dashboard
                </button>
                <ChevronRight className="w-4 h-4" />
                <span>Events</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-900">Select Event Type</span>
              </div>
              <h1 className="text-slate-900 text-2xl">Select Event Type</h1>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
              Organizer Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-slate-600">Choose your event type to get started with customized configuration</p>
        </div>

        {/* Event Type Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <div
                key={type.id}
                className="bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div 
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4`}
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <IconComponent className="w-8 h-8" style={{ color: type.color }} />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-slate-900 text-lg mb-2">{type.name}</h3>
                    <p className="text-slate-600 text-sm mb-3">{type.description}</p>
                    <p className="text-slate-700 text-sm">
                      Capacity: <span className="text-slate-900">{type.capacity}</span>
                    </p>
                  </div>

                  {/* Risk Badge */}
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border mb-4 ${getRiskColor(type.riskLevel)}`}>
                    {type.riskLevel === 'high risk' && <AlertTriangle className="w-3 h-3" />}
                    {type.riskLevel === 'medium risk' && <TrendingUp className="w-3 h-3" />}
                    {type.riskLevel === 'low risk' && <CheckCircle className="w-3 h-3" />}
                    <span>{type.riskLevel}</span>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectType(type)}
                    className="w-full py-2.5 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <span>Select</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-slate-900 mb-2">Need help choosing?</h4>
              <p className="text-slate-700 text-sm mb-3">
                Each event type comes with pre-configured settings optimized for that specific use case. You can customize everything after selection.
              </p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Pre-configured venue layouts and zones</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Recommended capacity and safety thresholds</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Event-specific volunteer roles and requirements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Tailored analytics and monitoring dashboards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}