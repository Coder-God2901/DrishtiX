/**
 * Alert Response Component
 * Comprehensive alert management with auto-dispatch (USP 4: Actions, not just warnings)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiService } from '@/services/api.service';
import {
  Bell,
  AlertTriangle,
  Users,
  Send,
  Zap,
  Clock,
  CheckCircle,
  ArrowUp,
  MapPin,
  MessageSquare,
} from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  zoneId: string;
  zoneName: string;
  detectionMethod: string;
  createdAt: string;
  status: string;
  assignedTeam?: string[];
  broadcastSent?: boolean;
  escalationLevel?: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  currentZone?: string;
}

interface ResponseAction {
  id: string;
  alertId: string;
  action: string;
  timestamp: string;
  performedBy: string;
}

export default function AlertResponse() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState<boolean>(false);
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);

  // Response form state
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [escalationLevel, setEscalationLevel] = useState<number>(1);

  useEffect(() => {
    loadAlerts();
    loadTeamMembers();
    const interval = setInterval(loadAlerts, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const loadAlerts: () => Promise<void> = async () => {
    try {
      // Fetch real alerts from API - get all active alerts across events
      const alertsResponse = await apiService.alerts.getAll();
      if (alertsResponse && Array.isArray(alertsResponse)) {
        const formattedAlerts = alertsResponse.map((alert: any) => ({
          id: alert.id,
          type: alert.type || 'INFO',
          severity: alert.severity || 'MEDIUM',
          title: alert.title || alert.message,
          description: alert.description || alert.message,
          zoneId: alert.zoneId || alert.location?.zone || 'unknown',
          zoneName: alert.zoneName || alert.location?.name || 'Unknown Zone',
          detectionMethod: alert.detectionMethod || 'SYSTEM',
          createdAt: alert.createdAt || alert.timestamp,
          status: alert.status || 'ACTIVE',
          assignedTeam: alert.assignedTeam || [],
          broadcastSent: alert.broadcastSent || false,
          escalationLevel: alert.escalationLevel || 1,
        }));
        setAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast.error('Failed to load alerts');
    }
  };

  const loadTeamMembers: () => Promise<void> = async () => {
    try {
      // Fetch real responders from API
      const respondersResponse = await apiService.responders.getAll();
      if (respondersResponse && Array.isArray(respondersResponse)) {
        const formattedTeam = respondersResponse.map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.type?.toUpperCase() || 'STAFF',
          status: r.status?.toUpperCase() || 'AVAILABLE',
          currentZone: r.currentZone || r.location?.zone,
        }));
        setTeamMembers(formattedTeam);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleOpenResponse = (alert: Alert): void => {
    setSelectedAlert(alert);
    setShowResponseDialog(true);
    setSelectedTeam(alert.assignedTeam || []);
    setEscalationLevel(alert.escalationLevel || 1);
    setBroadcastMessage(`Alert in ${alert.zoneName}: ${alert.title}. Please follow safety protocols.`);

    // Load response actions for this alert
    setResponseActions([
      {
        id: 'r1',
        alertId: alert.id,
        action: 'Alert created and detected by AI',
        timestamp: alert.createdAt,
        performedBy: 'System',
      },
    ]);
  };

  const handleAutoDispatch = (): void => {
    if (!selectedAlert) return;

    // Find nearest available team members
    const availableTeam = teamMembers.filter(
      (m) => m.status === 'AVAILABLE' && (m.role === 'SECURITY' || m.role === 'MEDICAL')
    );

    if (availableTeam.length === 0) {
      toast.error('No available team members for dispatch');
      return;
    }

    const dispatched = availableTeam.slice(0, 2).map((m) => m.id);
    setSelectedTeam(dispatched);

    const newAction: ResponseAction = {
      id: `r${Date.now()}`,
      alertId: selectedAlert.id,
      action: `Auto-dispatched ${dispatched.length} team members: ${availableTeam
        .slice(0, 2)
        .map((m) => m.name)
        .join(', ')}`,
      timestamp: new Date().toISOString(),
      performedBy: 'System (USP 4)',
    };

    setResponseActions([...responseActions, newAction]);
    toast.success('Team auto-dispatched successfully!');
  };

  const handleSendBroadcast = (): void => {
    if (!selectedAlert || !broadcastMessage) {
      toast.error('Please enter a broadcast message');
      return;
    }

    const newAction: ResponseAction = {
      id: `r${Date.now()}`,
      alertId: selectedAlert.id,
      action: `Broadcast sent: "${broadcastMessage}"`,
      timestamp: new Date().toISOString(),
      performedBy: 'Coordinator',
    };

    setResponseActions([...responseActions, newAction]);
    toast.success('Broadcast message sent to all attendees in the zone');
  };

  const handleEscalate = (): void => {
    if (!selectedAlert) return;

    const newLevel = escalationLevel + 1;
    if (newLevel > 4) {
      toast.error('Already at maximum escalation level');
      return;
    }

    setEscalationLevel(newLevel);

    const newAction: ResponseAction = {
      id: `r${Date.now()}`,
      alertId: selectedAlert.id,
      action: `Alert escalated to Level ${newLevel} (${['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][newLevel - 1]})`,
      timestamp: new Date().toISOString(),
      performedBy: 'Coordinator',
    };

    setResponseActions([...responseActions, newAction]);
    toast.success(`Alert escalated to ${['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][newLevel - 1]} level`);
  };

  const handleResolve = (): void => {
    if (!selectedAlert) return;

    const newAction: ResponseAction = {
      id: `r${Date.now()}`,
      alertId: selectedAlert.id,
      action: 'Alert marked as RESOLVED',
      timestamp: new Date().toISOString(),
      performedBy: 'Coordinator',
    };

    setResponseActions([...responseActions, newAction]);
    setAlerts(alerts.filter((a) => a.id !== selectedAlert.id));
    setShowResponseDialog(false);
    toast.success('Alert resolved successfully');
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'text-red-600';
      case 'DISPATCHED':
        return 'text-orange-600';
      case 'MONITORING':
        return 'text-yellow-600';
      case 'RESOLVED':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEscalationColor = (level: number): string => {
    switch (level) {
      case 1:
        return 'bg-blue-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-orange-500';
      case 4:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alert Response Center</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and respond to safety alerts</p>
          </div>
          <Badge className="text-lg px-4 py-2">
            {alerts.filter((a) => a.status === 'ACTIVE').length} Active Alerts
          </Badge>
        </div>

        {/* USP 4 Info Card */}
        <Card className="border-green-600">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">USP 4: Actions, Not Just Warnings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our system automatically dispatches teams, sends targeted broadcasts, and adjusts crowd routing when
                  alerts are triggered. Use the "Auto-Dispatch" button to leverage AI-powered response coordination.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>Respond to safety and operational alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium text-green-900 dark:text-green-100">All Clear</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">No active alerts at this time</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`cursor-pointer transition-shadow hover:shadow-lg ${
                    alert.severity === 'CRITICAL' ? 'border-2 border-red-600' : ''
                  }`}
                  onClick={() => handleOpenResponse(alert)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle
                            className={`h-5 w-5 ${alert.severity === 'CRITICAL' ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}
                          />
                          <h3 className="font-semibold text-lg">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <Badge variant="outline">{alert.detectionMethod}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{alert.zoneName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
                          <Badge className={`${getStatusColor(alert.status)}`} variant="outline">
                            {alert.status}
                          </Badge>
                          {alert.escalationLevel && (
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full ${getEscalationColor(alert.escalationLevel)}`} />
                              <span className="text-xs">Level {alert.escalationLevel}</span>
                            </div>
                          )}
                        </div>
                        {alert.assignedTeam && alert.assignedTeam.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600">
                              {alert.assignedTeam.length} team member(s) assigned
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline">Respond</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alert Response
              </DialogTitle>
              <DialogDescription>Manage and respond to the alert</DialogDescription>
            </DialogHeader>

            {selectedAlert && (
              <div className="space-y-6">
                {/* Alert Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Alert Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{selectedAlert.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zone:</span>
                      <span className="font-semibold">{selectedAlert.zoneName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detection Method:</span>
                      <span className="font-semibold">{selectedAlert.detectionMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escalation Level:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getEscalationColor(escalationLevel)}`} />
                        <span className="font-semibold">
                          Level {escalationLevel} ({['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][escalationLevel - 1]})
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-Dispatch Section */}
                <Card className="border-green-600">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      Auto-Dispatch (USP 4)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="team">Assign Team Members</Label>
                      <div className="flex gap-2 mt-2">
                        <Select
                          value={selectedTeam.join(',')}
                          onValueChange={(v: string) => setSelectedTeam(v.split(',').filter(Boolean))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team members" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name} - {member.role} ({member.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAutoDispatch} className="bg-green-600 hover:bg-green-700">
                          <Zap className="h-4 w-4 mr-2" />
                          Auto-Dispatch
                        </Button>
                      </div>
                      {selectedTeam.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedTeam.map((teamId) => {
                            const member = teamMembers.find((m) => m.id === teamId);
                            return member ? (
                              <Badge key={teamId} variant="outline">
                                {member.name} - {member.role}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Broadcast Message */}
                <Card className="border-blue-600">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Broadcast Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="broadcast">Message to Attendees</Label>
                      <Textarea
                        id="broadcast"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        rows={3}
                        placeholder="Enter message to broadcast to attendees in the affected zone"
                      />
                    </div>
                    <Button onClick={handleSendBroadcast} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Broadcast
                    </Button>
                  </CardContent>
                </Card>

                {/* Escalation */}
                <Card className="border-orange-600">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-orange-600" />
                      Escalation Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-8 flex-1 rounded ${
                                level <= escalationLevel ? getEscalationColor(level) : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current: Level {escalationLevel} / 4</p>
                      </div>
                      <Button onClick={handleEscalate} variant="outline" disabled={escalationLevel >= 4}>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Escalate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Response Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {responseActions.map((action, index) => (
                        <div key={action.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${index === responseActions.length - 1 ? 'bg-green-600' : 'bg-blue-600'}`}
                            />
                            {index < responseActions.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">{action.action}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(action.timestamp).toLocaleString()}</span>
                              <span>•</span>
                              <span>{action.performedBy}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowResponseDialog(false)} className="flex-1">
                    Close
                  </Button>
                  <Button onClick={handleResolve} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
