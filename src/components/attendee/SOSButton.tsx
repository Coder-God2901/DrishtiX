/**
 * SOS Button Component
 * Emergency SOS with 6 issue types, auto-dispatch, and status tracking (USP 4)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone,
  AlertTriangle,
  Heart,
  Flame,
  Users,
  UserX,
  HelpCircle,
  MapPin,
  Clock,
  CheckCircle,
  Loader,
  Camera,
  X,
} from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';

interface SOSButtonProps {
  eventId: string;
  onClose: () => void;
}

const issueTypes = [
  {
    value: 'MEDICAL',
    label: 'Medical Emergency',
    icon: Heart,
    color: 'text-red-600',
    description: 'Health issues, injuries',
  },
  {
    value: 'SECURITY',
    label: 'Security Threat',
    icon: AlertTriangle,
    color: 'text-orange-600',
    description: 'Safety concerns, threats',
  },
  { value: 'FIRE', label: 'Fire Hazard', icon: Flame, color: 'text-red-700', description: 'Fire or smoke detected' },
  {
    value: 'CROWD_CRUSH',
    label: 'Crowd Crush',
    icon: Users,
    color: 'text-purple-600',
    description: 'Dangerous crowding',
  },
  {
    value: 'LOST_PERSON',
    label: 'Lost Person',
    icon: UserX,
    color: 'text-blue-600',
    description: 'Missing child/person',
  },
  {
    value: 'OTHER',
    label: 'Other Emergency',
    icon: HelpCircle,
    color: 'text-gray-600',
    description: 'Other urgent issues',
  },
];

export default function SOSButton({ eventId, onClose }: SOSButtonProps) {
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'tracking'>('select');
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosRequest, setSOSRequest] = useState<any>(null);
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Unable to get your location');
        }
      );
    }

    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, []);

  useEffect(() => {
    if (sosRequest && step === 'tracking') {
      // Poll for status updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const response = await attendeeService.getSOSStatus(sosRequest.id);
          if (response.success) {
            setSOSRequest(response.data);
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      }, 5000);

      setStatusPolling(interval);

      return () => clearInterval(interval);
    }
  }, [sosRequest, step]);

  const handleSubmitSOS = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Please select issue type and provide description');
      return;
    }

    if (!location) {
      toast.error('Location not available. Please enable location services.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await attendeeService.createSOS({
        eventId,
        issueType: selectedIssue as any,
        description,
        location,
        media,
      });

      if (response.success) {
        setSOSRequest(response.data);
        setStep('tracking');
        toast.success('Emergency request sent! Help is on the way.');
      } else {
        toast.error(response.error || 'Failed to send SOS');
      }
    } catch (error: any) {
      console.error('SOS submission error:', error);
      toast.error(error.message || 'Failed to send SOS');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500';
      case 'DISPATCHED':
        return 'bg-purple-500';
      case 'RESPONDING':
        return 'bg-orange-500';
      case 'ARRIVED':
        return 'bg-green-500';
      case 'RESOLVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5" />;
      case 'ACKNOWLEDGED':
      case 'DISPATCHED':
        return <CheckCircle className="h-5 w-5" />;
      case 'RESPONDING':
      case 'ARRIVED':
        return <Phone className="h-5 w-5" />;
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Loader className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Phone className="h-6 w-6" />
            SOS Emergency Request
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select the type of emergency'}
            {step === 'details' && 'Provide details about the emergency'}
            {step === 'confirm' && 'Confirm and send your emergency request'}
            {step === 'tracking' && 'Tracking your emergency request'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Issue Type */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {issueTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedIssue === type.value ? 'border-4 border-red-600 shadow-lg' : 'border-2'
                    }`}
                    onClick={() => setSelectedIssue(type.value)}
                  >
                    <CardContent className="pt-6 text-center space-y-2">
                      <Icon className={`h-12 w-12 mx-auto ${type.color}`} />
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedIssue}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Provide Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                {(() => {
                  const selected = issueTypes.find((t) => t.value === selectedIssue);
                  if (!selected) return null;
                  const Icon = selected.icon;
                  return (
                    <>
                      <Icon className={`h-6 w-6 ${selected.color}`} />
                      <div>
                        <p className="font-semibold">{selected.label}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selected.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Emergency Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the emergency situation in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Your Location</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  {location ? (
                    <>
                      <p className="text-sm font-medium">Location Detected</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Detecting location...</p>
                  )}
                </div>
                {location && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attach Photos/Videos (Optional)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
                <span className="text-xs text-gray-500">{media.length} file(s) attached</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!description.trim() || !location}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Ready to Send Emergency Request</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Emergency responders will be automatically dispatched to your location. Please review the details
                    below.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Type</p>
                  <p className="font-medium">{issueTypes.find((t) => t.value === selectedIssue)?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-sm">{description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="text-sm">
                    {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')} disabled={isSubmitting} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmitSOS} disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700">
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Send SOS
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Tracking */}
        {step === 'tracking' && sosRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Emergency Request Sent</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Help has been dispatched to your location. Stay calm and wait for assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${getStatusColor(sosRequest.status)} flex items-center justify-center text-white`}
                  >
                    {getStatusIcon(sosRequest.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{sosRequest.status.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Request ID: {sosRequest.id.slice(0, 8)}</p>
                  </div>
                </div>

                {sosRequest.responder && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-sm font-medium mb-2">Assigned Responder</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{sosRequest.responder.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{sosRequest.responder.role}</p>
                      </div>
                      {sosRequest.responderETA && <Badge variant="secondary">ETA: {sosRequest.responderETA} min</Badge>}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Status Updates:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                      <span>Request received - {new Date(sosRequest.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {sosRequest.acknowledgedAt && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Acknowledged - {new Date(sosRequest.acknowledgedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {sosRequest.dispatchedAt && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                        <span>Team dispatched - {new Date(sosRequest.dispatchedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm font-medium mb-1">USP 4: Automated Actions</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Our AI automatically assigned the nearest available responder and calculated the fastest route to your
                location. You'll receive real-time updates until help arrives.
              </p>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
