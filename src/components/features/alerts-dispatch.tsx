import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AlertCircle, MapPin, Clock, Navigation, CheckCircle, X, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { incidentsData, respondersData } from '../../data/alerts-incidents-data';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { firebaseService } from '@/services/firebase.service';
import { toast } from 'sonner';

interface Incident {
  id: string;
  type: 'medical' | 'security' | 'safety' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: string;
  coordinates: { x: number; y: number };
  timestamp: string;
  reporter?: string;
  status: 'new' | 'dispatched' | 'responding' | 'resolved';
  assignedTo?: string[];
  eta?: string;
  images?: string[];
}

interface Responder {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  location: { x: number; y: number };
  eta: string;
  distance: string;
}

export function AlertsDispatch() {
  const eventId = 'evt_101';
  const [incidents, setIncidents] = useState(incidentsData);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [responders, setResponders] = useState(respondersData);

  // GCP real-time incidents
  const { incidents: gcpIncidents, alerts: gcpAlerts } = useGCPRealtime({
    eventId,
    enableIncidents: true,
    enableAlerts: true,
  });

  // Merge GCP incidents into local state
  useEffect(() => {
    if (gcpIncidents.length > 0) {
      const gcpMapped = gcpIncidents.slice(0, 5).map((inc: any) => ({
        id: `gcp-${inc.id}`,
        type: (inc.type as any) || 'other',
        severity: (inc.severity as any) || 'medium',
        title: inc.title || 'GCP Incident',
        description: inc.description || 'Real-time incident from GCP',
        location: inc.location?.description || `Zone ${inc.zoneId || 'Unknown'}`,
        coordinates: { x: inc.location?.lat || 50, y: inc.location?.lon || 50 },
        timestamp: new Date(inc.timestamp).toLocaleString(),
        reporter: 'AI System',
        status: 'new' as const,
        assignedTo: [],
        images: [],
      }));
      setIncidents((prev) => [...gcpMapped, ...prev.filter((i) => !i.id.startsWith('gcp-'))].slice(0, 20));
    }
  }, [gcpIncidents]);

  // Merge GCP alerts as high-priority incidents
  useEffect(() => {
    if (gcpAlerts.length > 0) {
      const alertMapped = gcpAlerts.slice(0, 3).map((alert: any) => ({
        id: `alert-${alert.id}`,
        type: 'safety' as const,
        severity: alert.severity === 'danger' ? ('critical' as const) : ('high' as const),
        title: alert.title,
        description: alert.message || 'Real-time alert from AI system',
        location: `Zone ${alert.zoneId || 'Unknown'}`,
        coordinates: { x: alert.location?.lat || 50, y: alert.location?.lon || 50 },
        timestamp: new Date(alert.timestamp).toLocaleString(),
        reporter: 'AI Alert System',
        status: 'new' as const,
        assignedTo: [],
        images: [],
      }));
      setIncidents((prev) => [...alertMapped, ...prev.filter((i) => !i.id.startsWith('alert-'))].slice(0, 20));
    }
  }, [gcpAlerts]);

  // Firebase real-time updates
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToIncidents((data: any[]) => {
      const mapped = data.map((inc) => ({
        id: inc.id,
        type: inc.type as any,
        severity: inc.severity as any,
        title: inc.title || inc.type,
        description: inc.description,
        location: inc.location?.description || 'Unknown',
        coordinates: { x: inc.location?.lat || 0, y: inc.location?.lon || 0 },
        timestamp: new Date(inc.timestamp?.toMillis() || Date.now()).toLocaleString(),
        reporter: inc.reporter,
        status: inc.status as any,
        assignedTo: inc.assignedResponders || [],
        eta: inc.eta,
        images: inc.images || [],
      }));
      setIncidents((prev) => [...mapped, ...prev].slice(0, 20));
    });
    return () => unsubscribe();
  }, []);

  // Socket.IO instant notifications
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('incident:new', (data: any) => {
      toast.error(`New ${data.severity} incident: ${data.title}`, {
        description: data.location,
        action: {
          label: 'View',
          onClick: () => setSelectedIncident(data.id),
        },
      });
    });

    socket.on('incident:status-update', (data: any) => {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === data.incidentId ? { ...inc, status: data.status, assignedTo: data.assignedTo } : inc
        )
      );
    });

    socket.on('responder:status-changed', (data: any) => {
      setResponders((prev) =>
        prev.map((r) =>
          r.id === data.responderId ? { ...r, status: data.status, location: data.location || r.location } : r
        )
      );
    });

    socket.emit('subscribe:incidents');

    return () => {
      socket.off('incident:new');
      socket.off('incident:status-update');
    };
  }, []);

  const selectedIncidentData = incidents.find((i) => i.id === selectedIncident);
  const availableResponders = responders.filter((r) => r.status === 'available');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-[#E02D2D] bg-[#E02D2D]/5';
      case 'high':
        return 'border-l-[#F59E0B] bg-[#F59E0B]/5';
      case 'medium':
        return 'border-l-[#0B3D91] bg-[#0B3D91]/5';
      default:
        return 'border-l-[#475569] bg-[#475569]/5';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-[#E02D2D]/10 text-[#E02D2D]';
      case 'dispatched':
        return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'responding':
        return 'bg-[#0B3D91]/10 text-[#0B3D91]';
      case 'resolved':
        return 'bg-[#16A34A]/10 text-[#16A34A]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Alerts & Dispatch</h1>
            <p className="text-muted-foreground mt-2">Monitor incidents and coordinate response teams</p>
          </div>
          <Button className="bg-[#E02D2D] hover:bg-[#E02D2D]/90">
            <AlertCircle className="w-4 h-4 mr-2" />
            Create Manual Alert
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">Active Incidents</p>
              <p className="text-foreground">{incidents.filter((i) => i.status !== 'resolved').length}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">Available Responders</p>
              <p className="text-foreground">{availableResponders.length}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">Avg Response Time</p>
              <p className="text-foreground">3.2 min</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">Resolved Today</p>
              <p className="text-foreground">47</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active ({incidents.filter((i) => i.status !== 'resolved').length})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3 mt-4">
                {incidents
                  .filter((i) => i.status !== 'resolved')
                  .map((incident) => (
                    <Card
                      key={incident.id}
                      className={`p-5 border-l-4 cursor-pointer hover:shadow-lg transition-all ${getSeverityColor(incident.severity)} ${
                        selectedIncident === incident.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedIncident(incident.id)}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={getStatusColor(incident.status)}>
                                {incident.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {incident.type}
                              </Badge>
                              <span className="text-muted-foreground">{incident.timestamp}</span>
                            </div>
                            <h3>{incident.title}</h3>
                            <p className="text-muted-foreground mt-1">{incident.description}</p>
                          </div>
                          <AlertCircle
                            className={`w-5 h-5 flex-shrink-0 ${
                              incident.severity === 'critical'
                                ? 'text-[#E02D2D]'
                                : incident.severity === 'high'
                                  ? 'text-[#F59E0B]'
                                  : 'text-[#0B3D91]'
                            }`}
                          />
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{incident.location}</span>
                        </div>

                        {/* Assigned Team */}
                        {incident.assignedTo && incident.assignedTo.length > 0 && (
                          <div className="flex items-center gap-3 pt-2 border-t">
                            <div className="flex -space-x-2">
                              {incident.assignedTo.map((name, i) => (
                                <Avatar key={i} className="border-2 border-card w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground">{incident.assignedTo.join(', ')}</p>
                              {incident.eta && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>ETA: {incident.eta}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {incident.status === 'new' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                              onClick={(e: { stopPropagation: () => void }) => {
                                e.stopPropagation();
                                setSelectedIncident(incident.id);
                                setShowDispatchDialog(true);
                              }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Dispatch
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <p className="text-muted-foreground text-center py-8">All incidents view</p>
              </TabsContent>

              <TabsContent value="resolved" className="mt-4">
                <p className="text-muted-foreground text-center py-8">Resolved incidents view</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Incident Detail / Available Responders */}
          <div className="space-y-4">
            {selectedIncidentData ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3>Incident Details</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedIncident(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Map Preview */}
                  <div className="w-full h-48 bg-[#F3F4F6] rounded-lg relative overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <div
                      className="absolute w-4 h-4 bg-[#E02D2D] rounded-full animate-pulse"
                      style={{
                        left: `${selectedIncidentData.coordinates.x}%`,
                        top: `${selectedIncidentData.coordinates.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <Badge variant="outline" className="capitalize mt-1">
                        {selectedIncidentData.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Severity</p>
                      <Badge
                        variant="outline"
                        className={`capitalize mt-1 ${
                          selectedIncidentData.severity === 'critical'
                            ? 'bg-[#E02D2D]/10 text-[#E02D2D]'
                            : selectedIncidentData.severity === 'high'
                              ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                              : 'bg-[#0B3D91]/10 text-[#0B3D91]'
                        }`}
                      >
                        {selectedIncidentData.severity}
                      </Badge>
                    </div>
                    {selectedIncidentData.reporter && (
                      <div>
                        <p className="text-muted-foreground">Reported By</p>
                        <p className="text-foreground mt-1">{selectedIncidentData.reporter}</p>
                      </div>
                    )}
                  </div>

                  {selectedIncidentData.status === 'new' && (
                    <Button
                      className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                      onClick={() => setShowDispatchDialog(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Dispatch Team
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <h3 className="mb-4">Available Responders</h3>
                <div className="space-y-3">
                  {availableResponders.map((responder) => (
                    <div
                      key={responder.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-[#16A34A]/10 text-[#16A34A]">
                          {responder.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-foreground">{responder.name}</p>
                        <p className="text-muted-foreground">{responder.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground">{responder.distance}</p>
                        <p className="text-muted-foreground">{responder.eta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Incident Timeline */}
            {selectedIncidentData && (
              <Card className="p-6">
                <h3 className="mb-4">Incident Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#E02D2D] mt-2" />
                    <div>
                      <p className="text-foreground">Incident reported</p>
                      <p className="text-muted-foreground">{selectedIncidentData.timestamp}</p>
                    </div>
                  </div>
                  {selectedIncidentData.status !== 'new' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-2" />
                      <div>
                        <p className="text-foreground">Team dispatched</p>
                        <p className="text-muted-foreground">1 min ago</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Dispatch Dialog */}
        <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispatch Team</DialogTitle>
            </DialogHeader>
            <DispatchWorkflow
              incident={selectedIncidentData}
              responders={availableResponders}
              onClose={() => setShowDispatchDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DispatchWorkflow({
  incident,
  responders,
  onClose,
}: {
  incident?: Incident;
  responders: Responder[];
  onClose: () => void;
}) {
  const [selectedResponders, setSelectedResponders] = useState<string[]>([]);

  if (!incident) return null;

  return (
    <div className="space-y-6">
      {/* Incident Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="mb-2">{incident.title}</h4>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{incident.location}</span>
        </div>
      </div>

      {/* Select Responders */}
      <div className="space-y-3">
        <h4>Select Responders</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {responders.map((responder) => (
            <div
              key={responder.id}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedResponders.includes(responder.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => {
                setSelectedResponders((prev) =>
                  prev.includes(responder.id) ? prev.filter((id) => id !== responder.id) : [...prev, responder.id]
                );
              }}
            >
              <Avatar>
                <AvatarFallback>
                  {responder.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-foreground">{responder.name}</p>
                <p className="text-muted-foreground">{responder.role}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-foreground">
                  <Navigation className="w-4 h-4" />
                  <span>{responder.distance}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>ETA: {responder.eta}</span>
                </div>
              </div>
              {selectedResponders.includes(responder.id) && <CheckCircle className="w-5 h-5 text-primary" />}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Message */}
      <div className="space-y-2">
        <h4>Additional Instructions (Optional)</h4>
        <Textarea placeholder="Add any specific instructions for the team..." rows={3} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-[#FF6A00] hover:bg-[#FF6A00]/90"
          disabled={selectedResponders.length === 0}
          onClick={onClose}
        >
          <Send className="w-4 h-4 mr-2" />
          Dispatch ({selectedResponders.length} responder{selectedResponders.length !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );
}
