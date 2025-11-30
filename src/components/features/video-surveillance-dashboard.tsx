/**
 * Video Surveillance Dashboard
 * Real-time camera feeds with advanced analytics
 * Features: YOLO detection, facial recognition, object detection, anomaly detection
 */

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Video,
  AlertTriangle,
  Users,
  Eye,
  Shield,
  Target,
  Activity,
  TrendingUp,
  Camera,
  Maximize2,
  Settings,
  Download,
  Play,
  Pause,
  Zap,
  UserCheck,
  Crosshair,
} from 'lucide-react';

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  peopleCount: number;
  crowdDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  densityValue: number;
  vipCount?: number;
  securityCount?: number;
  weaponsDetected?: number;
  anomalies: Array<{
    type: string;
    confidence: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

interface AnalyticsData {
  totalPeople: number;
  avgDensity: number;
  vipsDetected: number;
  securityPersonnel: number;
  weaponAlerts: number;
  anomalyCount: number;
  processingTimeMs: number;
}

export function VideoSurveillanceDashboard() {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [enableYOLO, setEnableYOLO] = useState(true);
  const [enableFacialRecognition, setEnableFacialRecognition] = useState(true);
  const [enableObjectDetection, setEnableObjectDetection] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Mock camera feeds - in production, this would come from WebSocket/Socket.IO
  const [cameras] = useState<CameraFeed[]>([
    {
      id: 'cam-001',
      name: 'Main Gate',
      location: 'North Entrance',
      status: 'active',
      peopleCount: 234,
      crowdDensity: 'HIGH',
      densityValue: 0.78,
      vipCount: 2,
      securityCount: 4,
      weaponsDetected: 0,
      anomalies: [],
      alerts: [],
    },
    {
      id: 'cam-002',
      name: 'Main Stage',
      location: 'Center Area',
      status: 'active',
      peopleCount: 1843,
      crowdDensity: 'CRITICAL',
      densityValue: 0.92,
      vipCount: 8,
      securityCount: 12,
      weaponsDetected: 0,
      anomalies: [{ type: 'SURGE', confidence: 0.87, severity: 'HIGH' }],
      alerts: [{ type: 'CROWD_THRESHOLD', severity: 'CRITICAL', message: 'Critical crowd density detected' }],
    },
    {
      id: 'cam-003',
      name: 'VIP Lounge',
      location: 'West Wing',
      status: 'active',
      peopleCount: 45,
      crowdDensity: 'LOW',
      densityValue: 0.21,
      vipCount: 15,
      securityCount: 6,
      weaponsDetected: 0,
      anomalies: [],
      alerts: [],
    },
    {
      id: 'cam-004',
      name: 'Food Court',
      location: 'East Section',
      status: 'active',
      peopleCount: 387,
      crowdDensity: 'MEDIUM',
      densityValue: 0.54,
      vipCount: 1,
      securityCount: 3,
      weaponsDetected: 0,
      anomalies: [],
      alerts: [],
    },
    {
      id: 'cam-005',
      name: 'Emergency Exit 1',
      location: 'South Wing',
      status: 'active',
      peopleCount: 12,
      crowdDensity: 'LOW',
      densityValue: 0.08,
      securityCount: 2,
      anomalies: [],
      alerts: [],
    },
    {
      id: 'cam-006',
      name: 'Security Checkpoint',
      location: 'Main Entrance',
      status: 'active',
      peopleCount: 156,
      crowdDensity: 'MEDIUM',
      densityValue: 0.48,
      vipCount: 3,
      securityCount: 8,
      weaponsDetected: 0,
      anomalies: [],
      alerts: [],
    },
  ]);

  const analytics: AnalyticsData = {
    totalPeople: cameras.reduce((sum, cam) => sum + cam.peopleCount, 0),
    avgDensity: cameras.reduce((sum, cam) => sum + cam.densityValue, 0) / cameras.length,
    vipsDetected: cameras.reduce((sum, cam) => sum + (cam.vipCount || 0), 0),
    securityPersonnel: cameras.reduce((sum, cam) => sum + (cam.securityCount || 0), 0),
    weaponAlerts: cameras.reduce((sum, cam) => sum + (cam.weaponsDetected || 0), 0),
    anomalyCount: cameras.reduce((sum, cam) => sum + cam.anomalies.length, 0),
    processingTimeMs: 47,
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Camera className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">Video Surveillance & Analytics</h1>
          <Badge className="bg-green-500">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Recording
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Record
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="bg-card border-b px-6 py-3">
        <div className="grid grid-cols-7 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total People</p>
              <p className="text-lg font-semibold">{analytics.totalPeople.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Density</p>
              <p className="text-lg font-semibold">{Math.round(analytics.avgDensity * 100)}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VIPs</p>
              <p className="text-lg font-semibold">{analytics.vipsDetected}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Security</p>
              <p className="text-lg font-semibold">{analytics.securityPersonnel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weapon Alerts</p>
              <p className="text-lg font-semibold">{analytics.weaponAlerts}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Anomalies</p>
              <p className="text-lg font-semibold">{analytics.anomalyCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proc. Time</p>
              <p className="text-lg font-semibold">{analytics.processingTimeMs}ms</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-136px)]">
        {/* Left Sidebar - Feature Toggles */}
        <div className="w-64 bg-card border-r p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Detection Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">YOLO Detection</span>
                </div>
                <Button
                  variant={enableYOLO ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnableYOLO(!enableYOLO)}
                >
                  {enableYOLO ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Face Recognition</span>
                </div>
                <Button
                  variant={enableFacialRecognition ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnableFacialRecognition(!enableFacialRecognition)}
                >
                  {enableFacialRecognition ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Object Detection</span>
                </div>
                <Button
                  variant={enableObjectDetection ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnableObjectDetection(!enableObjectDetection)}
                >
                  {enableObjectDetection ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Camera List</h3>
            <div className="space-y-2">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedCamera === camera.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{camera.name}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${camera.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{camera.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {camera.peopleCount} people
                    </Badge>
                    {camera.alerts.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {camera.alerts.length} alerts
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Camera Feeds Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            {cameras.map((camera) => (
              <Card key={camera.id} className="overflow-hidden">
                {/* Camera Feed Placeholder */}
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-600" />
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      {camera.name}
                    </Badge>
                    <Badge className={getDensityColor(camera.crowdDensity) + ' text-white'}>
                      {camera.crowdDensity}
                    </Badge>
                  </div>

                  {/* Detection Overlays */}
                  <div className="absolute bottom-3 left-3 right-3 space-y-2">
                    {enableYOLO && (
                      <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
                        <Target className="w-3 h-3" />
                        <span>YOLO: {camera.peopleCount} detected</span>
                      </div>
                    )}
                    {enableFacialRecognition && camera.vipCount && camera.vipCount > 0 && (
                      <div className="bg-purple-500/90 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
                        <UserCheck className="w-3 h-3" />
                        <span>VIPs: {camera.vipCount}</span>
                      </div>
                    )}
                    {enableObjectDetection && camera.weaponsDetected && camera.weaponsDetected > 0 && (
                      <div className="bg-red-500/90 text-white px-2 py-1 rounded text-xs flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        <span>WEAPON DETECTED!</span>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen Button */}
                  <button className="absolute top-3 right-3 p-2 rounded bg-black/50 hover:bg-black/70 text-white">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Camera Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">{camera.location}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Crowd Density</span>
                      <span className="text-sm font-medium">{Math.round(camera.densityValue * 100)}%</span>
                    </div>
                    <Progress value={camera.densityValue * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-accent">
                      <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">People</p>
                      <p className="text-sm font-semibold">{camera.peopleCount}</p>
                    </div>
                    {camera.vipCount !== undefined && (
                      <div className="p-2 rounded bg-accent">
                        <UserCheck className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">VIPs</p>
                        <p className="text-sm font-semibold">{camera.vipCount}</p>
                      </div>
                    )}
                    {camera.securityCount !== undefined && (
                      <div className="p-2 rounded bg-accent">
                        <Shield className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Security</p>
                        <p className="text-sm font-semibold">{camera.securityCount}</p>
                      </div>
                    )}
                  </div>

                  {/* Anomalies */}
                  {camera.anomalies.length > 0 && (
                    <div className="space-y-1">
                      {camera.anomalies.map((anomaly, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/20"
                        >
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">{anomaly.type}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {Math.round(anomaly.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alerts */}
                  {camera.alerts.length > 0 && (
                    <div className="space-y-1">
                      {camera.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20"
                        >
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600 flex-1">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
