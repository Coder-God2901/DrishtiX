import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { MapPin, Clock, Route, PhoneCall, CheckCircle, AlertCircle, TrendingUp, Navigation } from 'lucide-react';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { firebaseService } from '@/services/firebase.service';
import { toast } from 'sonner';

interface ResponderAssignment {
  id: string;
  incidentId: string;
  incidentType: string;
  incidentSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  responderId: string;
  responderName: string;
  responderType: 'SECURITY' | 'MEDICAL' | 'FIRE' | 'LOGISTICS';
  status: 'DISPATCHED' | 'RESPONDING' | 'ON_SCENE' | 'RESOLVED';
  eta: number; // minutes
  distance: number; // meters
  assignedAt: Date;
  location: { lat: number; lon: number; zone?: string };
}

interface ResponderStatus {
  id: string;
  name: string;
  type: string;
  status: 'AVAILABLE' | 'DISPATCHED' | 'RESPONDING' | 'ON_SCENE' | 'RETURNING' | 'OFF_DUTY';
  activeIncidents: number;
  location: { lat: number; lon: number };
  skills: string[];
}

export function ResponderDispatchBoard() {
  const [assignments, setAssignments] = useState<ResponderAssignment[]>([]);
  const [responders, setResponders] = useState<ResponderStatus[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ResponderAssignment | null>(null);
  const eventId = 'evt_101';

  // GCP real-time integration for incidents
  const { incidents: gcpIncidents } = useGCPRealtime({
    eventId,
    enableIncidents: true,
    enableResponderUpdates: true,
  });

  // Firebase real-time assignments
  useEffect(() => {
    // Merge GCP incidents into assignments
    if (gcpIncidents.length > 0) {
      const newAssignments: ResponderAssignment[] = gcpIncidents.slice(0, 3).map((inc: any, idx: number) => ({
        id: `gcp-${inc.id}`,
        incidentId: inc.id,
        incidentType: inc.type || 'EMERGENCY',
        incidentSeverity: (inc.severity?.toUpperCase() as any) || 'HIGH',
        responderId: `r${idx + 1}`,
        responderName: `Responder ${idx + 1}`,
        responderType: 'SECURITY',
        status: 'DISPATCHED',
        eta: Math.floor(Math.random() * 10) + 1,
        distance: Math.floor(Math.random() * 2000) + 500,
        assignedAt: new Date(inc.timestamp || Date.now()),
        location: { lat: inc.location?.lat || 28.7041, lon: inc.location?.lon || 77.1025 },
      }));
      setAssignments((prev) => [...newAssignments, ...prev.filter((a) => !a.id.startsWith('gcp-'))].slice(0, 10));
    }
  }, [gcpIncidents]);

  useEffect(() => {
    const unsubscribe =
      typeof (firebaseService as any).subscribeToResponderAssignments === 'function'
        ? (firebaseService as any).subscribeToResponderAssignments((data: any[]) => {
            const mapped: ResponderAssignment[] = data.map((a) => ({
              id: a.id,
              incidentId: a.incidentId,
              incidentType: a.incidentType,
              incidentSeverity: a.severity,
              responderId: a.responderId,
              responderName: a.responderName,
              responderType: a.responderType,
              status: a.status,
              eta: a.eta || 0,
              distance: a.distance || 0,
              assignedAt: new Date(a.assignedAt?.toMillis() || Date.now()),
              location: a.location,
            }));
            setAssignments(mapped);
          })
        : () => {};
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Real-time responder status
  useEffect(() => {
    // Initialize with mock responders on mount
    const mockResponders: ResponderStatus[] = [
      {
        id: 'r1',
        name: 'Fire Team Alpha',
        type: 'FIRE',
        status: 'RESPONDING',
        activeIncidents: 1,
        location: { lat: 28.7039, lon: 77.1023 },
        skills: ['Fire Suppression', 'Evacuation', 'First Aid'],
      },
      {
        id: 'r2',
        name: 'Medic Unit 3',
        type: 'MEDICAL',
        status: 'ON_SCENE',
        activeIncidents: 1,
        location: { lat: 28.7045, lon: 77.103 },
        skills: ['Emergency Medicine', 'CPR', 'Trauma Care'],
      },
      {
        id: 'r3',
        name: 'Security Team 1',
        type: 'SECURITY',
        status: 'DISPATCHED',
        activeIncidents: 1,
        location: { lat: 28.7042, lon: 77.1028 },
        skills: ['Crowd Control', 'De-escalation', 'First Response'],
      },
      {
        id: 'r4',
        name: 'Security Team 2',
        type: 'SECURITY',
        status: 'AVAILABLE',
        activeIncidents: 0,
        location: { lat: 28.705, lon: 77.1015 },
        skills: ['Crowd Control', 'Patrol', 'Communication'],
      },
      {
        id: 'r5',
        name: 'Medic Unit 1',
        type: 'MEDICAL',
        status: 'AVAILABLE',
        activeIncidents: 0,
        location: { lat: 28.7035, lon: 77.1032 },
        skills: ['Emergency Medicine', 'Triage', 'Transport'],
      },
    ];
    setResponders(mockResponders);

    const unsubscribe = firebaseService.subscribeToResponders((data: any[]) => {
      const mapped: ResponderStatus[] = data.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        status: r.status,
        activeIncidents: r.activeIncidents || 0,
        location: r.location,
        skills: r.skills || [],
      }));
      setResponders(mapped);
    });
    return () => unsubscribe();
  }, []);

  // Socket.IO for instant updates
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('responder:assignment-updated', (data: any) => {
      toast.info(`Responder ${data.responderName} status: ${data.status}`, {
        description: `ETA: ${data.eta} minutes`,
      });
    });

    socket.emit('subscribe:responder-assignments');

    return () => {
      socket.off('responder:assignment-updated');
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500';
      case 'DISPATCHED':
        return 'bg-blue-500';
      case 'RESPONDING':
        return 'bg-yellow-500';
      case 'ON_SCENE':
        return 'bg-orange-500';
      case 'RESOLVED':
        return 'bg-gray-500';
      case 'RETURNING':
        return 'bg-purple-500';
      case 'OFF_DUTY':
        return 'bg-gray-300';
      default:
        return 'bg-gray-400';
    }
  };

  const formatETA = (eta: number) => {
    if (eta === 0) return 'On Scene';
    if (eta < 60) return `${eta}m`;
    return `${Math.floor(eta / 60)}h ${eta % 60}m`;
  };

  const formatDistance = (distance: number) => {
    if (distance === 0) return '0m';
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const handleCallResponder = (assignment: ResponderAssignment) => {
    console.log(`Calling responder: ${assignment.responderName}`);
    // Implement call functionality
  };

  const handleViewRoute = (assignment: ResponderAssignment) => {
    console.log(`Viewing route for: ${assignment.responderName}`);
    // Implement route visualization
  };

  const activeAssignments = assignments.filter((a) => a.status !== 'RESOLVED');
  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Dispatches */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Dispatches</h2>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {activeAssignments.length} Active
            </Badge>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedAssignment?.id === assignment.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(assignment.incidentSeverity)}>
                          {assignment.incidentSeverity}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(assignment.status)}`} />
                          <span className="text-sm font-medium">{assignment.status}</span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{assignment.incidentType.replace(/_/g, ' ')}</h3>

                      <p className="text-sm text-gray-600 mb-2">Responder: {assignment.responderName}</p>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          ETA: {formatETA(assignment.eta)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Route className="h-4 w-4" />
                          {formatDistance(assignment.distance)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {assignment.location.zone || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="h-4 w-4" />
                          {Math.floor((Date.now() - assignment.assignedAt.getTime()) / 60000)}m ago
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for ETA */}
                  {assignment.eta > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-600">{formatETA(assignment.eta)} remaining</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            assignment.eta <= 2 ? 'bg-green-500' : assignment.eta <= 5 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.max(0, 100 - (assignment.eta / 10) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e: { stopPropagation: () => void }) => {
                        e.stopPropagation();
                        handleCallResponder(assignment);
                      }}
                    >
                      <PhoneCall className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e: { stopPropagation: () => void }) => {
                        e.stopPropagation();
                        handleViewRoute(assignment);
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Route
                    </Button>
                  </div>
                </Card>
              ))}

              {activeAssignments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3" />
                  <p>No active dispatches</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Available Responders */}
      <div>
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Available Responders</h3>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {availableResponders.map((responder) => (
                <Card key={responder.id} className="p-3 bg-green-50 border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(responder.status)}`} />
                        <p className="font-semibold text-sm">{responder.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {responder.type}
                      </Badge>
                      <div className="text-xs text-gray-600">
                        <p className="mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {responder.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {availableResponders.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">All responders busy</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Responders</span>
              <span className="font-semibold">{responders.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Available</span>
              <span className="font-semibold text-green-600">{availableResponders.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold text-blue-600">
                {responders.filter((r) => r.activeIncidents > 0).length}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
