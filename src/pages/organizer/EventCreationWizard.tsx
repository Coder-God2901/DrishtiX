/**
 * Event Creation Wizard Component
 * 7-step wizard for creating events with ML mode selection (USP 5)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Users,
  Target,
  Shield,
  Eye,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Zap,
  Music,
  Trophy,
  Megaphone,
  Box,
  Plus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api.service';

type WizardStep = 'basic' | 'venue' | 'mlmode' | 'team' | 'alerts' | 'preview' | 'publish';

const ML_MODES = [
  {
    value: 'SPORTS',
    label: 'Sports Event',
    icon: Trophy,
    color: 'text-blue-600',
    description: 'Optimized for sports matches with dynamic crowd patterns',
    features: ['Goal celebration detection', 'Post-match surge prediction', 'Entry/exit flow optimization'],
    defaultLearningRate: 0.01,
    config: {
      crowdDynamics: 'high',
      peakMoments: true,
      exitRushPrediction: true,
    },
  },
  {
    value: 'CONCERT',
    label: 'Concert/Music',
    icon: Music,
    color: 'text-purple-600',
    description: 'Tuned for concerts with stage-focused crowd behavior',
    features: ['Stage surge detection', 'Mosh pit monitoring', 'Sound level correlation'],
    defaultLearningRate: 0.015,
    config: {
      crowdDynamics: 'very-high',
      stageFocus: true,
      soundLevelTracking: true,
    },
  },
  {
    value: 'RALLY',
    label: 'Rally/Protest',
    icon: Megaphone,
    color: 'text-orange-600',
    description: 'Designed for rallies with unpredictable movement patterns',
    features: ['Movement tracking', 'Bottleneck detection', 'Dispersal prediction'],
    defaultLearningRate: 0.02,
    config: {
      crowdDynamics: 'unpredictable',
      movementTracking: true,
      dispersalPrediction: true,
    },
  },
  {
    value: 'GENERIC',
    label: 'Generic Event',
    icon: Box,
    color: 'text-gray-600',
    description: 'Balanced model for conferences, exhibitions, and other events',
    features: ['Standard crowd monitoring', 'Session-based patterns', 'Registration tracking'],
    defaultLearningRate: 0.005,
    config: {
      crowdDynamics: 'moderate',
      sessionBased: true,
      registrationTracking: true,
    },
  },
];

interface Zone {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AlertRule {
  id: string;
  name: string;
  severity: string;
  condition: string;
  action: string;
}

export default function EventCreationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
    expectedAttendees: number | '';
  }>({
    name: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    expectedAttendees: '',
  });

  // Step 2: Venue Setup
  const [venueInfo, setVenueInfo] = useState<{
    venueName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    totalCapacity: number | '';
  }>({
    venueName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    totalCapacity: '',
  });
  const [zones, setZones] = useState<Zone[]>([]);

  // Step 3: ML Mode
  const [selectedMLMode, setSelectedMLMode] = useState<string>('');
  const [mlConfig, setMlConfig] = useState<{
    learningRate: number;
    autoTune: boolean;
    predictionWindow: number;
  }>({
    learningRate: 0.01,
    autoTune: true,
    predictionWindow: 30,
  });

  // Step 4: Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Step 5: Alert Rules
  const [alertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'High Crowd Density',
      severity: 'HIGH',
      condition: 'density > 0.8',
      action: 'Auto-dispatch security team',
    },
    {
      id: '2',
      name: 'Critical Occupancy',
      severity: 'CRITICAL',
      condition: 'occupancy >= 95%',
      action: 'Stop entry + broadcast alert',
    },
  ]);

  const addZone = () => {
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: '',
      type: 'general',
      capacity: 0,
    };
    setZones([...zones, newZone]);
  };

  const removeZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  const updateZone = (id: string, field: keyof Zone, value: string | number) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: '',
      email: '',
      role: 'security',
    };
    setTeamMembers([...teamMembers, newMember]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(teamMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handlePublish = async () => {
    // Validate required fields before publishing
    if (
      !basicInfo.name ||
      !basicInfo.category ||
      !basicInfo.startDate ||
      !basicInfo.endDate ||
      basicInfo.expectedAttendees === '' ||
      basicInfo.expectedAttendees <= 0
    ) {
      toast.error('Please fill all required fields in Basic Info');
      setCurrentStep('basic');
      return;
    }
    if (
      !venueInfo.venueName ||
      !venueInfo.address ||
      !venueInfo.city ||
      !venueInfo.state ||
      !venueInfo.zipCode ||
      venueInfo.totalCapacity === '' ||
      venueInfo.totalCapacity <= 0
    ) {
      toast.error('Please fill all required fields in Venue Info');
      setCurrentStep('venue');
      return;
    }
    if (!selectedMLMode) {
      toast.error('Please select an ML Mode');
      setCurrentStep('mlmode');
      return;
    }

    // Construct event data with ML mode config
    const eventData = {
      name: basicInfo.name,
      description: basicInfo.description,
      category: basicInfo.category,
      startDate: basicInfo.startDate,
      endDate: basicInfo.endDate,
      expectedAttendees: Number(basicInfo.expectedAttendees),
      venue: {
        name: venueInfo.venueName,
        address: venueInfo.address,
        city: venueInfo.city,
        state: venueInfo.state,
        zipCode: venueInfo.zipCode,
        country: venueInfo.country || 'USA',
        coordinates: venueInfo.coordinates,
        totalCapacity: Number(venueInfo.totalCapacity),
      },
      zones,
      mlMode: {
        mode: selectedMLMode,
        ...mlConfig,
        config: ML_MODES.find((m) => m.value === selectedMLMode)?.config,
      },
      team: teamMembers,
      alertRules,
    };

    try {
      console.log('Publishing event:', eventData);
      const response = await apiService.events.create(eventData);
      toast.success('Event published successfully!');
      // Access the id from response.data if it exists
      const eventId = response?.data?.id || (response as any).id;
      if (eventId) {
        navigate(`/organizer/events/${eventId}`);
      } else {
        navigate('/organizer/events');
      }
    } catch (error: any) {
      console.error('Failed to publish event:', error);
      toast.error(error.message || 'Failed to publish event');
    }
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['basic', 'venue', 'mlmode', 'team', 'alerts', 'preview', 'publish'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['basic', 'venue', 'mlmode', 'team', 'alerts', 'preview', 'publish'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {['Basic', 'Venue', 'ML Mode', 'Team', 'Alerts', 'Preview', 'Publish'].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ['basic', 'venue', 'mlmode', 'team', 'alerts', 'preview', 'publish'][index] === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="ml-2 text-xs font-medium hidden md:block">{step}</p>
                  {index < 6 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Basic Info */}
        {currentStep === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Event Information
              </CardTitle>
              <CardDescription>Enter the fundamental details of your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  placeholder="e.g., Tech Summit 2024"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  placeholder="Brief description of your event"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={basicInfo.category}
                    onValueChange={(v: any) => setBasicInfo({ ...basicInfo, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="concert">Concert</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="rally">Rally</SelectItem>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="attendees">Expected Attendees *</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={basicInfo.expectedAttendees}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBasicInfo({
                        ...basicInfo,
                        expectedAttendees: val === '' ? '' : Math.max(0, parseInt(val)),
                      });
                    }}
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={basicInfo.startDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={basicInfo.endDate}
                    onChange={(e) => setBasicInfo({ ...basicInfo, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Venue Setup */}
        {currentStep === 'venue' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Venue Setup
              </CardTitle>
              <CardDescription>Configure your venue and zones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Venue Details</h3>
                <div>
                  <Label htmlFor="venueName">Venue Name *</Label>
                  <Input
                    id="venueName"
                    value={venueInfo.venueName}
                    onChange={(e) => setVenueInfo({ ...venueInfo, venueName: e.target.value })}
                    placeholder="Madison Square Garden"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={venueInfo.address}
                    onChange={(e) => setVenueInfo({ ...venueInfo, address: e.target.value })}
                    placeholder="123 Event Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={venueInfo.city}
                      onChange={(e) => setVenueInfo({ ...venueInfo, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={venueInfo.state}
                      onChange={(e) => setVenueInfo({ ...venueInfo, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={venueInfo.zipCode}
                      onChange={(e) => setVenueInfo({ ...venueInfo, zipCode: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="totalCapacity">Total Capacity *</Label>
                  <Input
                    id="totalCapacity"
                    type="number"
                    value={venueInfo.totalCapacity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVenueInfo({
                        ...venueInfo,
                        totalCapacity: val === '' ? '' : Math.max(0, parseInt(val)),
                      });
                    }}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Venue Zones</h3>
                  <Button onClick={addZone} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                </div>
                {zones.map((zone) => (
                  <Card key={zone.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
                          <Label>Zone Name</Label>
                          <Input
                            value={zone.name}
                            onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                            placeholder="Main Hall"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={zone.type}
                            onValueChange={(v: string | number) => updateZone(zone.id, 'type', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="stage">Stage</SelectItem>
                              <SelectItem value="food">Food Court</SelectItem>
                              <SelectItem value="entrance">Entrance</SelectItem>
                              <SelectItem value="exit">Exit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={zone.capacity}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateZone(zone.id, 'capacity', val === '' ? 0 : Math.max(0, parseInt(val)));
                            }}
                            placeholder="1000"
                          />
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => removeZone(zone.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: ML Mode Selection (USP 5) */}
        {currentStep === 'mlmode' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                ML Mode Selection (USP 5)
              </CardTitle>
              <CardDescription>
                Choose the AI model optimized for your event type - multi-model switching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {ML_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Card
                      key={mode.value}
                      className={`cursor-pointer transition-all ${
                        selectedMLMode === mode.value ? 'border-4 border-blue-600' : 'hover:shadow-lg'
                      }`}
                      onClick={() => {
                        setSelectedMLMode(mode.value);
                        setMlConfig({ ...mlConfig, learningRate: mode.defaultLearningRate });
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-8 w-8 ${mode.color}`} />
                            <div>
                              <h3 className="font-bold text-lg">{mode.label}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{mode.description}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Key Features:</p>
                            {mode.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <Badge className={mode.color}>Learning Rate: {mode.defaultLearningRate}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedMLMode && (
                <Card className="border-blue-600">
                  <CardHeader>
                    <CardTitle className="text-sm">Advanced ML Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="learningRate">Learning Rate</Label>
                        <Input
                          id="learningRate"
                          type="number"
                          step="0.001"
                          value={mlConfig.learningRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMlConfig({
                              ...mlConfig,
                              learningRate: val === '' ? 0 : Math.max(0, parseFloat(val)),
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="predictionWindow">Prediction Window (minutes)</Label>
                        <Input
                          id="predictionWindow"
                          type="number"
                          value={mlConfig.predictionWindow}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMlConfig({
                              ...mlConfig,
                              predictionWindow: val === '' ? 0 : Math.max(0, parseInt(val)),
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoTune"
                        checked={mlConfig.autoTune}
                        onChange={(e) => setMlConfig({ ...mlConfig, autoTune: e.target.checked })}
                      />
                      <Label htmlFor="autoTune" className="cursor-pointer">
                        Enable Auto-Tuning (USP 6: Self-learning after every event)
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} disabled={!selectedMLMode}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Team Assignment */}
        {currentStep === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Assignment
              </CardTitle>
              <CardDescription>Add team members for event management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={addTeamMember} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-3 items-end">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select
                          value={member.role}
                          onValueChange={(v: string) => updateTeamMember(member.id, 'role', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeTeamMember(member.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Alert Rules */}
        {currentStep === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alert Rules Configuration
              </CardTitle>
              <CardDescription>Define automated alert rules (USP 4: Actions, not just warnings)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertRules.map((rule) => (
                <Card key={rule.id} className="border-orange-600">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                          {rule.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">Condition:</p>
                          <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">{rule.condition}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">Automated Action:</p>
                          <p className="text-xs bg-blue-100 dark:bg-blue-900 p-2 rounded">{rule.action}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-purple-600">
                <CardContent className="pt-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">USP 4: Automated Actions</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        When alerts are triggered, the system automatically dispatches teams, broadcasts messages, and
                        adjusts crowd routing - no manual intervention needed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Preview */}
        {currentStep === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review & Preview
              </CardTitle>
              <CardDescription>Review all event details before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Info</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <strong>Name:</strong> {basicInfo.name}
                    </p>
                    <p>
                      <strong>Category:</strong> {basicInfo.category}
                    </p>
                    <p>
                      <strong>Attendees:</strong> {basicInfo.expectedAttendees}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Venue</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <strong>Name:</strong> {venueInfo.venueName}
                    </p>
                    <p>
                      <strong>City:</strong> {venueInfo.city}
                    </p>
                    <p>
                      <strong>Zones:</strong> {zones.length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ML Mode (USP 5)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <strong>Mode:</strong> {ML_MODES.find((m) => m.value === selectedMLMode)?.label}
                    </p>
                    <p>
                      <strong>Learning Rate:</strong> {mlConfig.learningRate}
                    </p>
                    <p>
                      <strong>Auto-Tune:</strong> {mlConfig.autoTune ? 'Enabled' : 'Disabled'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Team</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <strong>Members:</strong> {teamMembers.length}
                    </p>
                    <p>
                      <strong>Alert Rules:</strong> {alertRules.length}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep}>
                  Publish Event <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Publish */}
        {currentStep === 'publish' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Publish Event
              </CardTitle>
              <CardDescription>Finalize and publish your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to Publish</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your event is configured with AI-powered crowd management
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Badge className="mb-2">USP 1</Badge>
                  <p className="font-semibold">ConvLSTM Predictions</p>
                  <p className="text-xs text-gray-500">5-30 min ahead</p>
                </div>
                <div>
                  <Badge className="mb-2">USP 2</Badge>
                  <p className="font-semibold">Triple-Layer Detection</p>
                  <p className="text-xs text-gray-500">Rules + IF + Autoencoder</p>
                </div>
                <div>
                  <Badge className="mb-2">USP 5</Badge>
                  <p className="font-semibold">{ML_MODES.find((m) => m.value === selectedMLMode)?.label} Mode</p>
                  <p className="text-xs text-gray-500">Optimized AI model</p>
                </div>
              </div>
              <div className="flex gap-3 justify-center pt-6">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handlePublish} size="lg" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Publish Event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
