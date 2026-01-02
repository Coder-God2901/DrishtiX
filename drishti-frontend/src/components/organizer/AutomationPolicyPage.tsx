import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Shield, 
  Save, 
  AlertTriangle, 
  CheckCircle2,
  Radio,
  DoorOpen,
  Users,
  Flame,
  Bell,
  Zap,
  Info,
  Settings
} from 'lucide-react';

interface AutomationPolicyPageProps {
  onBack: () => void;
}

interface PolicyRule {
  id: string;
  category: 'incident' | 'gate' | 'crowd' | 'security';
  title: string;
  description: string;
  enabled: boolean;
  requiresApproval: boolean;
}

interface SeverityAction {
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'auto-dispatch' | 'suggest-only' | 'notify' | 'log-only';
}

// Mock policy state
const INITIAL_POLICIES: PolicyRule[] = [
  {
    id: 'pol-1',
    category: 'gate',
    title: 'Auto-close gates on critical crowd density',
    description: 'Automatically close entry gates when any zone reaches 90% capacity',
    enabled: true,
    requiresApproval: false
  },
  {
    id: 'pol-2',
    category: 'incident',
    title: 'Auto-dispatch medical teams for critical incidents',
    description: 'Immediately dispatch nearest medical team for critical severity incidents',
    enabled: true,
    requiresApproval: false
  },
  {
    id: 'pol-3',
    category: 'security',
    title: 'Require approval for evacuation alerts',
    description: 'All evacuation alerts must be approved by event manager before broadcast',
    enabled: true,
    requiresApproval: true
  },
  {
    id: 'pol-4',
    category: 'crowd',
    title: 'Auto-activate alternative routes',
    description: 'Open secondary pathways when primary routes exceed 75% capacity',
    enabled: false,
    requiresApproval: false
  },
  {
    id: 'pol-5',
    category: 'gate',
    title: 'Smart gate balancing',
    description: 'Automatically redirect incoming traffic to less congested gates',
    enabled: false,
    requiresApproval: true
  },
  {
    id: 'pol-6',
    category: 'incident',
    title: 'Auto-escalate unresolved incidents',
    description: 'Escalate incident severity if unresolved after 10 minutes',
    enabled: true,
    requiresApproval: false
  }
];

const INITIAL_SEVERITY_ACTIONS: SeverityAction[] = [
  { severity: 'critical', action: 'auto-dispatch' },
  { severity: 'high', action: 'suggest-only' },
  { severity: 'medium', action: 'notify' },
  { severity: 'low', action: 'log-only' }
];

export function AutomationPolicyPage({ onBack }: AutomationPolicyPageProps) {
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [severityActions, setSeverityActions] = useState<SeverityAction[]>(INITIAL_SEVERITY_ACTIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
    setHasChanges(true);
  };

  const handleToggleApproval = (id: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, requiresApproval: !p.requiresApproval } : p
    ));
    setHasChanges(true);
  };

  const handleSeverityActionChange = (severity: string, newAction: string) => {
    setSeverityActions(prev => prev.map(sa => 
      sa.severity === severity ? { ...sa, action: newAction as any } : sa
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulate save operation
    setShowSaveConfirmation(true);
    setHasChanges(false);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'incident': return Flame;
      case 'gate': return DoorOpen;
      case 'crowd': return Users;
      case 'security': return Shield;
      default: return Settings;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incident': return 'bg-red-100 text-red-700 border-red-200';
      case 'gate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'crowd': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'security': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/20">
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
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Policy & Automation Rules</h1>
                  <p className="text-sm text-slate-500">Define how AI is allowed to act</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                hasChanges
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Policies
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Save Confirmation Toast */}
        {showSaveConfirmation && (
          <div className="fixed top-20 right-6 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold">Policies saved successfully!</p>
          </div>
        )}

        {/* Policy Rules Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Automation Rules</h2>
              <span className="text-xs text-purple-100">Toggle-based policy controls</span>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {policies.map(policy => {
              const Icon = getCategoryIcon(policy.category);
              return (
                <div 
                  key={policy.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${policy.enabled ? getCategoryColor(policy.category) : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">{policy.title}</h3>
                          <p className="text-sm text-slate-600">{policy.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={policy.enabled}
                            onChange={() => handleTogglePolicy(policy.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      {policy.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-sm text-slate-600">Requires human approval</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={policy.requiresApproval}
                              onChange={() => handleToggleApproval(policy.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity-Based Automation Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Severity-Based Automation</h2>
              <span className="text-xs text-indigo-100">Default actions by incident severity</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {severityActions.map(sa => (
                <div key={sa.severity} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg border font-bold uppercase text-sm ${getSeverityColor(sa.severity)}`}>
                      {sa.severity}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                  </div>
                  <select
                    value={sa.action}
                    onChange={(e) => handleSeverityActionChange(sa.severity, e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-sm"
                  >
                    <option value="auto-dispatch">Auto-dispatch resources</option>
                    <option value="suggest-only">Suggest action only</option>
                    <option value="notify">Notify teams</option>
                    <option value="log-only">Log only (no action)</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <span className="font-semibold">Note:</span> These are default actions. Individual policy rules above can override these settings for specific scenarios.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">UI Simulation Only</h4>
            <p className="text-sm text-amber-700">
              This page demonstrates policy management UI. In production, these settings would be persisted to backend and enforced by the AI engine. All changes are currently local to your session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
