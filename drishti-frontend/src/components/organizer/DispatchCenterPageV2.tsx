/**
 * Updated Dispatch Center Page - Using Real APIs
 * Replaces MOCK data with real-time data from backend
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  UserPlus,
  Shield,
  Heart,
  Loader2,
  Send,
} from 'lucide-react';
import { useDispatch, useIncidents } from '../../hooks/useRealtime';
import { useParams } from 'react-router-dom';
import { dispatchService, incidentService } from '../../services';
import { toast } from 'sonner';

interface DispatchCenterPageProps {
  onBack: () => void;
}

export function DispatchCenterPageV2({ onBack }: DispatchCenterPageProps) {
  const { eventId } = useParams<{ eventId: string }>();
  const { teams, volunteers, loading: dispatchLoading } = useDispatch(eventId);
  const { incidents, loading: incidentsLoading } = useIncidents(eventId);

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const activeIncidents = incidents.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'IN_PROGRESS'
  );

  const handleAssignTeam = async () => {
    if (!selectedTeam || !selectedIncident || !eventId) return;

    setIsAssigning(true);
    try {
      await dispatchService.assignToIncident({
        teamId: selectedTeam,
        incidentId: selectedIncident,
        priority: 'HIGH',
      });
      
      toast.success('Team assigned successfully');
      setSelectedTeam(null);
      setSelectedIncident(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign team');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer || !selectedIncident || !eventId) return;

    setIsAssigning(true);
    try {
      await dispatchService.assignToIncident({
        volunteerId: selectedVolunteer,
        incidentId: selectedIncident,
        priority: 'MEDIUM',
      });
      
      toast.success('Volunteer assigned successfully');
      setSelectedVolunteer(null);
      setSelectedIncident(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign volunteer');
    } finally {
      setIsAssigning(false);
    }
  };

  const loading = dispatchLoading || incidentsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dispatch center...</p>
        </div>
      </div>
    );
  }

  const getTeamIcon = (type: string) => {
    switch (type) {
      case 'MEDICAL':
        return Heart;
      case 'SECURITY':
        return Shield;
      case 'EMERGENCY':
        return AlertCircle;
      default:
        return Users;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DEPLOYED':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OFFLINE':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-2xl text-slate-900 flex items-center gap-2">
                  <Radio className="w-7 h-7 text-cyan-600" />
                  Dispatch Center
                </h1>
                <p className="text-slate-600 text-sm">
                  Real-time team and volunteer coordination
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-700 text-sm">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Teams Panel */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h2 className="text-lg">Response Teams</h2>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                {teams.filter((t: any) => t.status === 'AVAILABLE').length} available
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No teams available</p>
                </div>
              ) : (
                teams.map((team: any) => {
                  const TeamIcon = getTeamIcon(team.type);
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTeam === team.id
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TeamIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-slate-900 font-medium">
                            {team.name}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(
                            team.status
                          )}`}
                        >
                          {team.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {team.members?.length || 0} members
                        </span>
                        {team.currentLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {team.currentLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Volunteers Panel */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h2 className="text-lg">Volunteers</h2>
              </div>
              <p className="text-purple-100 text-sm mt-1">
                {volunteers.filter((v: any) => v.availability === 'AVAILABLE').length}{' '}
                available
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {volunteers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No volunteers available</p>
                </div>
              ) : (
                volunteers.map((volunteer: any) => (
                  <div
                    key={volunteer.id}
                    onClick={() => setSelectedVolunteer(volunteer.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVolunteer === volunteer.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900 font-medium">
                        {volunteer.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(
                          volunteer.availability
                        )}`}
                      >
                        {volunteer.availability}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{volunteer.role}</p>
                    {volunteer.skills && volunteer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {volunteer.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Incidents Panel */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-lg">Active Incidents</h2>
              </div>
              <p className="text-red-100 text-sm mt-1">
                {activeIncidents.length} requiring response
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {activeIncidents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p>No active incidents</p>
                </div>
              ) : (
                activeIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedIncident === incident.id
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : incident.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-slate-500 text-xs">{incident.type}</span>
                    </div>
                    <p className="text-slate-900 font-medium mb-2">
                      {incident.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {incident.location}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assignment Action Panel */}
        {(selectedTeam || selectedVolunteer) && selectedIncident && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 text-lg mb-1">Ready to Dispatch</h3>
                <p className="text-slate-600 text-sm">
                  {selectedTeam
                    ? `Assigning team to incident`
                    : `Assigning volunteer to incident`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    setSelectedVolunteer(null);
                    setSelectedIncident(null);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedTeam ? handleAssignTeam : handleAssignVolunteer}
                  disabled={isAssigning}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Dispatch Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
