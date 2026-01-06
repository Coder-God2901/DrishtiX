import { EmergencyExitRoute } from '../../components/attendee/EmergencyExitRoute';
import { SmartSafetyMapSystem } from '../../components/shared/SmartSafetyMapSystem';
import { AlertsIncidentCenter } from '../../components/organizer/AlertsIncidentCenter';
import { useState } from 'react';
import { AlertTriangle, Map, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Attendee Emergency Page
 * Emergency services, safety alerts, and evacuation routes
 */
export default function EmergencyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'alerts' | 'exits' | 'safety'>('alerts');

  const tabs = [
    { id: 'alerts' as const, name: 'Alerts', icon: Bell },
    { id: 'exits' as const, name: 'Emergency Exits', icon: AlertTriangle },
    { id: 'safety' as const, name: 'Safety Map', icon: Map },
  ];

  return (
    <div className="h-full bg-slate-950">
      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="flex gap-2 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-500/10 text-red-400 border border-red-500/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-73px)]">
        {activeTab === 'alerts' && <AlertsIncidentCenter onBack={() => navigate('/attendee/dashboard')} />}
        {activeTab === 'exits' && <EmergencyExitRoute onBack={() => navigate('/attendee/dashboard')} />}
        {activeTab === 'safety' && <SmartSafetyMapSystem />}
      </div>
    </div>
  );
}
