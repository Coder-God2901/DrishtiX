import { useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface VolunteerRequirement {
  id: string;
  role: string;
  count: number;
  description: string;
  hoursPerWeek: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface VolunteerRequestBuilderProps {
  requirements: VolunteerRequirement[];
  onChange: (requirements: VolunteerRequirement[]) => void;
}

export function VolunteerRequestBuilder({ requirements, onChange }: VolunteerRequestBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addRequirement = () => {
    const newRequirement: VolunteerRequirement = {
      id: `req-${Date.now()}`,
      role: 'assistant',
      count: 1,
      description: '',
      hoursPerWeek: 8,
      urgency: 'medium'
    };
    onChange([...requirements, newRequirement]);
    setExpandedIndex(requirements.length);
  };

  const updateRequirement = (index: number, updates: Partial<VolunteerRequirement>) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeRequirement = (index: number) => {
    onChange(requirements.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const urgencyColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 text-lg">Volunteer Requirements</h3>
            <p className="text-sm text-slate-600">Request volunteers with specific skills and roles</p>
          </div>
        </div>
        <button
          onClick={addRequirement}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {requirements.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
          <Users className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h4 className="text-lg text-slate-900 mb-2">No Volunteer Roles Yet</h4>
          <p className="text-slate-600 mb-4">Add volunteer requirements to start recruiting help for your event</p>
          <button
            onClick={addRequirement}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Role
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((req, index) => {
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={req.id}
                className="border-2 border-slate-200 rounded-xl overflow-hidden hover:border-purple-300 transition-all"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 capitalize">{req.role}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${urgencyColors[req.urgency]}`}>
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {req.count} {req.count === 1 ? 'volunteer' : 'volunteers'} • {req.hoursPerWeek}hrs/week
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRequirement(index);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm mb-2">Role Type</label>
                        <select
                          value={req.role}
                          onChange={(e) => updateRequirement(index, { role: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="doctor">Doctor</option>
                          <option value="nurse">Nurse</option>
                          <option value="security">Security</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="assistant">Assistant</option>
                          <option value="photographer">Photographer</option>
                          <option value="technical">Technical Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 text-sm mb-2">Number Required</label>
                        <input
                          type="number"
                          min="1"
                          value={req.count}
                          onChange={(e) => updateRequirement(index, { count: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 text-sm mb-2">Hours per Week</label>
                        <input
                          type="number"
                          min="1"
                          value={req.hoursPerWeek}
                          onChange={(e) => updateRequirement(index, { hoursPerWeek: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 text-sm mb-2">Urgency Level</label>
                        <select
                          value={req.urgency}
                          onChange={(e) => updateRequirement(index, { urgency: e.target.value as any })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 text-sm mb-2">Role Description</label>
                      <textarea
                        value={req.description}
                        onChange={(e) => updateRequirement(index, { description: e.target.value })}
                        placeholder="Describe what this volunteer will do..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {requirements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <span>Total volunteer positions: <strong className="text-slate-900">{requirements.reduce((sum, req) => sum + req.count, 0)}</strong></span>
          <span>Different roles: <strong className="text-slate-900">{requirements.length}</strong></span>
        </div>
      )}
    </div>
  );
}
