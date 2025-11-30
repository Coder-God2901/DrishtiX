import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  AlertTriangle,
  Users,
  Maximize2,
  Eye,
  Activity,
  TrendingUp,
  Minimize2,
  RefreshCw,
  Filter,
  Play,
  Pause,
  Layers,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { toast } from 'sonner';

interface VideoFrame {
  thumbnailUrl: string;
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  peopleCount: number;
  densityLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: string[];
  confidence: number;
  location?: { lat: number; lon: number };
  heatmapUrl?: string;
  frameUrl?: string;
  frameDataBase64?: string; // Real-time frame from OpenCV camera service
  processingTime?: number;
  outlierScore?: number; // 0-1, higher = more anomalous
  isL2Anomaly?: boolean;
  // L3 Anomaly (Autoencoder)
  reconstructionError?: number;
  isL3Anomaly?: boolean;
}

interface VideoFeedGridProps {
  eventId?: string;
  cameras?: VideoFrame[];
  maxCameras?: number;
  className?: string;
  onCameraClick?: (camera: VideoFrame) => void;
  showHeatmap?: boolean;
}

export function VideoFeedGrid({
  eventId,
  cameras = [],
  maxCameras = 8,
  className,
  onCameraClick,
  showHeatmap = false,
}: VideoFeedGridProps) {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [cameraFrames, setCameraFrames] = useState<Map<string, VideoFrame>>(new Map());
  const [showAnomalyOverlay, setShowAnomalyOverlay] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'anomalies' | 'critical'>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Subscribe to real-time camera streams via Socket.IO
  useEffect(() => {
    if (isPaused) return;

    const socket = (window as any).socket;
    if (!socket) return;

    // Subscribe to camera frames
    cameras.forEach((camera) => {
      socket.emit('subscribe:camera', camera.cameraId);
    });

    // Listen for camera frames
    const handleCameraFrame = (frameData: any) => {
      setCameraFrames((prev) => {
        const updated = new Map(prev);
        const existing = prev.get(frameData.cameraId);

        updated.set(frameData.cameraId, {
          id: `${frameData.cameraId}-${frameData.frameNumber}`,
          cameraId: frameData.cameraId,
          cameraName: existing?.cameraName || frameData.cameraId,
          timestamp: new Date(frameData.timestamp),
          peopleCount: existing?.peopleCount || 0,
          densityLevel: existing?.densityLevel || 'low',
          anomalies: existing?.anomalies || [],
          confidence: existing?.confidence || 0,
          frameDataBase64: frameData.imageDataBase64,
          frameUrl: `data:image/jpeg;base64,${frameData.imageDataBase64}`,
          thumbnailUrl: '',
        });

        return updated;
      });
      setLastUpdateTime(new Date());
    };

    socket.on('camera:frame', handleCameraFrame);

    // Listen for L2 anomaly detections (Isolation Forest)
    const handleL2Anomaly = (anomalyData: any) => {
      setCameraFrames((prev) => {
        const updated = new Map(prev);
        const existing = prev.get(anomalyData.cameraId);

        if (existing) {
          updated.set(anomalyData.cameraId, {
            ...existing,
            outlierScore: anomalyData.outlierScore,
            isL2Anomaly: anomalyData.isAnomaly,
          });

          if (anomalyData.isAnomaly) {
            toast.warning('Statistical Anomaly Detected', {
              description: `Camera ${existing.cameraName}: Outlier score ${(anomalyData.outlierScore * 100).toFixed(1)}%`,
            });
          }
        }

        return updated;
      });
    };

    socket.on('anomaly:l2', handleL2Anomaly);

    // Listen for L3 anomaly detections (Autoencoder)
    const handleL3Anomaly = (anomalyData: any) => {
      setCameraFrames((prev) => {
        const updated = new Map(prev);
        const existing = prev.get(anomalyData.cameraId);

        if (existing) {
          updated.set(anomalyData.cameraId, {
            ...existing,
            reconstructionError: anomalyData.reconstructionError,
            isL3Anomaly: anomalyData.isAnomaly,
          });

          if (anomalyData.isAnomaly) {
            toast.error('Visual Anomaly Detected', {
              description: `Camera ${existing.cameraName}: Unusual pattern detected`,
            });
          }
        }

        return updated;
      });
    };

    socket.on('anomaly:l3', handleL3Anomaly);

    return () => {
      socket.off('camera:frame', handleCameraFrame);
      socket.off('anomaly:l2', handleL2Anomaly);
      socket.off('anomaly:l3', handleL3Anomaly);
    };
  }, [cameras, isPaused]);

  // Use GCP real-time video analytics
  const { videoFrames: gcpVideoFrames } = useGCPRealtime({
    eventId,
    enablePredictions: false,
    enableVideoAnalytics: true,
    enableSocialSignals: false,
    enableAnomalies: false,
    enableAlerts: false,
    enableIncidents: false,
    enableResponderUpdates: false,
  });

  // Map GCP video frames to VideoFrame format
  const realtimeFrames: VideoFrame[] = gcpVideoFrames
    .map((frame, _idx) => ({
      id: `${frame.cameraId}-${frame.timestamp.getTime()}`,
      cameraId: frame.cameraId,
      cameraName: frame.cameraName,
      timestamp: frame.timestamp,
      peopleCount: frame.peopleCount,
      densityLevel: frame.densityLevel,
      anomalies: frame.anomalies,
      confidence: frame.confidence,
      heatmapUrl: frame.heatmapUrl,
      frameUrl: frame.frameUrl,
      thumbnailUrl: frame.thumbnailUrl || frame.frameUrl || '/placeholder-camera.jpg',
    }))
    .slice(0, maxCameras);

  // Merge real-time camera frames with GCP analytics
  const mergedFrames = new Map<string, VideoFrame>();

  // Add GCP analytics data
  realtimeFrames.forEach((frame) => {
    mergedFrames.set(frame.cameraId, frame);
  });

  // Overlay real-time camera frames (updates frameUrl with live video)
  cameraFrames.forEach((frame, cameraId) => {
    const existing = mergedFrames.get(cameraId);
    if (existing) {
      mergedFrames.set(cameraId, { ...existing, frameUrl: frame.frameUrl, timestamp: frame.timestamp });
    } else {
      mergedFrames.set(cameraId, frame);
    }
  });

  const displayFrames = Array.from(mergedFrames.values()).slice(0, maxCameras);
  if (displayFrames.length === 0 && cameras.length > 0) {
    displayFrames.push(
      ...cameras.slice(0, maxCameras).map((camera, _idx) => ({
        thumbnailUrl: camera.thumbnailUrl || '/placeholder-camera.jpg',
        id: camera.cameraId + '-fallback',
        cameraId: camera.cameraId,
        cameraName: camera.cameraName || camera.cameraId,
        timestamp: new Date(),
        peopleCount: 0,
        densityLevel: 'low' as 'low',
        anomalies: [],
        confidence: 0,
        location: camera.location,
        heatmapUrl: camera.heatmapUrl,
        frameUrl: camera.thumbnailUrl || '/placeholder-camera.jpg',
        frameDataBase64: undefined,
        processingTime: undefined,
        outlierScore: undefined,
        isL2Anomaly: false,
        reconstructionError: undefined,
        isL3Anomaly: false,
      }))
    );
  }

  // Apply filters
  const filteredFrames = displayFrames.filter((frame) => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'anomalies') return frame.anomalies.length > 0 || frame.isL2Anomaly || frame.isL3Anomaly;
    if (filterLevel === 'critical') return frame.densityLevel === 'critical';
    return true;
  });

  const densityConfig = {
    low: { color: 'text-success-green bg-success-green/10', label: 'Low Density', dotColor: 'bg-success-green' },
    medium: { color: 'text-accent bg-accent/10', label: 'Medium Density', dotColor: 'bg-accent' },
    high: { color: 'text-warning-amber bg-warning-amber/10', label: 'High Density', dotColor: 'bg-warning-amber' },
    critical: { color: 'text-destructive bg-destructive/10', label: 'Critical Density', dotColor: 'bg-destructive' },
  };

  const getTimeSince = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const stats = {
    total: displayFrames.length,
    anomalies: displayFrames.filter((f) => f.anomalies.length > 0 || f.isL2Anomaly || f.isL3Anomaly).length,
    critical: displayFrames.filter((f) => f.densityLevel === 'critical').length,
    avgPeople: Math.round(displayFrames.reduce((sum, f) => sum + f.peopleCount, 0) / (displayFrames.length || 1)),
  };

  const selectedFrame =
    viewMode === 'single' ? filteredFrames.find((f) => f.cameraId === selectedCamera) || filteredFrames[0] : null;

  const handleRefresh = useCallback(() => {
    setLastUpdateTime(new Date());
    toast.success('Video feeds refreshed', {
      description: `Updated ${filteredFrames.length} camera feeds`,
    });
  }, [filteredFrames.length]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newState = !prev;
      toast.info(newState ? 'Video feeds paused' : 'Video feeds resumed');
      return newState;
    });
  }, []);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Live Video Analytics
            <Badge
              variant="outline"
              className={cn(
                'ml-2 border',
                isPaused
                  ? 'bg-muted text-muted-foreground border-muted'
                  : 'bg-destructive/10 text-destructive border-destructive'
              )}
            >
              <Activity className={cn('w-3 h-3 mr-1', !isPaused && 'animate-pulse')} />
              {isPaused ? 'PAUSED' : 'LIVE'}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">Updated {getTimeSince(lastUpdateTime)}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePause} className="gap-1">
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
            <Button
              variant={showAnomalyOverlay ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowAnomalyOverlay(!showAnomalyOverlay);
                toast.info(showAnomalyOverlay ? 'Anomaly overlay hidden' : 'Anomaly overlay shown');
              }}
              className="gap-1"
            >
              {showAnomalyOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Anomalies
            </Button>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={filterLevel === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterLevel('all')}
                className="h-7 px-2 text-xs"
              >
                All
              </Button>
              <Button
                variant={filterLevel === 'anomalies' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterLevel('anomalies')}
                className="h-7 px-2 text-xs"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Anomalies
              </Button>
              <Button
                variant={filterLevel === 'critical' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterLevel('critical')}
                className="h-7 px-2 text-xs"
              >
                Critical
              </Button>
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 px-2"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('single')}
                disabled={filteredFrames.length === 0}
                className="h-7 px-2"
              >
                Single
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 pb-3 border-b">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Active Cameras</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Anomalies</p>
            <p className="text-lg font-bold text-destructive">{stats.anomalies}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Critical Zones</p>
            <p className="text-lg font-bold text-warning-amber">{stats.critical}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg People</p>
            <p className="text-lg font-bold text-accent">{stats.avgPeople}</p>
          </div>
        </div>

        {/* Camera Selector for Single View */}
        {viewMode === 'single' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filteredFrames.map((frame) => (
              <button
                key={frame.cameraId}
                onClick={() => setSelectedCamera(frame.cameraId)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                  selectedCamera === frame.cameraId || (!selectedCamera && frame === filteredFrames[0])
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-102'
                )}
              >
                <Video className="w-3 h-3" />
                {frame.cameraName}
                {(frame.anomalies.length > 0 || frame.isL2Anomaly || frame.isL3Anomaly) && (
                  <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Video Feed Display */}
        {viewMode === 'grid' ? (
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-3">
              {filteredFrames.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <Video className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {filterLevel !== 'all' ? 'No cameras match the current filter' : 'No active camera feeds'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filterLevel !== 'all'
                      ? 'Try changing the filter or wait for new data'
                      : 'Video analytics will appear here once cameras are connected'}
                  </p>
                  {filterLevel !== 'all' && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilterLevel('all')}>
                      <Filter className="w-3 h-3 mr-1" />
                      Show All Cameras
                    </Button>
                  )}
                </div>
              ) : (
                filteredFrames.map((frame) => (
                  <CameraFeedCard
                    key={frame.cameraId}
                    frame={frame}
                    showHeatmap={showHeatmap}
                    showAnomalyOverlay={showAnomalyOverlay}
                    onClick={() => {
                      onCameraClick?.(frame);
                      setSelectedCamera(frame.cameraId);
                      setViewMode('single');
                      toast.info(`Viewing ${frame.cameraName}`, {
                        description: `${frame.peopleCount} people detected`,
                      });
                    }}
                    densityConfig={densityConfig}
                    getTimeSince={getTimeSince}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          selectedFrame && (
            <div className="space-y-3">
              {/* Large Single Feed */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border group">
                {/* Real Video Feed or Placeholder */}
                {selectedFrame.frameUrl ? (
                  <img
                    src={selectedFrame.frameUrl}
                    alt={selectedFrame.cameraName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-20 h-20 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">{selectedFrame.cameraName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Real-time video feed</p>
                    </div>
                  </div>
                )}

                {/* Anomaly Alert Border */}
                {(selectedFrame.isL2Anomaly || selectedFrame.isL3Anomaly) && showAnomalyOverlay && (
                  <div className="absolute inset-0 border-4 border-destructive animate-pulse pointer-events-none" />
                )}

                {/* Overlay Info */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge className={cn('text-xs shadow-lg', densityConfig[selectedFrame.densityLevel].color)}>
                      {densityConfig[selectedFrame.densityLevel].label}
                    </Badge>
                    {selectedFrame.anomalies.length > 0 && (
                      <Badge variant="destructive" className="text-xs block shadow-lg">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {selectedFrame.anomalies.length} Anomalies
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs">
                      <Activity className={cn('w-3 h-3 mr-1', !isPaused && 'animate-pulse')} />
                      {isPaused ? 'PAUSED' : 'LIVE'}
                    </Badge>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 backdrop-blur"
                      onClick={() => setViewMode('grid')}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* People Count */}
                <div className="absolute bottom-3 left-3">
                  <div className="bg-background/80 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
                    <Users className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">People Detected</p>
                      <p className="text-xl font-bold text-foreground">{selectedFrame.peopleCount}</p>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="absolute bottom-3 right-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs shadow-lg">
                    <Eye className="w-3 h-3 mr-1" />
                    {(selectedFrame.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>

              {/* Detailed Info */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Detected Anomalies
                    </h4>
                    {selectedFrame.anomalies.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No anomalies detected</p>
                    ) : (
                      <ul className="space-y-1">
                        {selectedFrame.anomalies.map((anomaly, idx) => (
                          <li key={idx} className="text-xs text-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                            {anomaly}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      Analytics Metrics
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Density Level:</span>
                        <span className={cn('font-medium', densityConfig[selectedFrame.densityLevel].color)}>
                          {densityConfig[selectedFrame.densityLevel].label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="font-medium text-foreground">
                          {(selectedFrame.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span className="font-medium text-foreground">{selectedFrame.processingTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update:</span>
                        <span className="font-medium text-foreground">{getTimeSince(selectedFrame.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* L2 Anomaly Detection (Isolation Forest) */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      L2 Anomaly (Isolation Forest)
                    </h4>
                    <div className="space-y-2">
                      {selectedFrame.outlierScore !== undefined ? (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Outlier Score:</span>
                            <span
                              className={cn(
                                'font-medium',
                                selectedFrame.isL2Anomaly ? 'text-destructive' : 'text-success-green'
                              )}
                            >
                              {(selectedFrame.outlierScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                selectedFrame.isL2Anomaly ? 'bg-destructive' : 'bg-success-green'
                              )}
                              style={{ width: `${selectedFrame.outlierScore * 100}%` }}
                            />
                          </div>
                          {selectedFrame.isL2Anomaly && (
                            <Badge variant="destructive" className="text-xs w-full justify-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Statistical Anomaly Detected
                            </Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No L2 data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* L3 Anomaly Detection (Autoencoder) */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-500" />
                      L3 Anomaly (Autoencoder)
                    </h4>
                    <div className="space-y-2">
                      {selectedFrame.reconstructionError !== undefined ? (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Reconstruction Error:</span>
                            <span
                              className={cn(
                                'font-medium',
                                selectedFrame.isL3Anomaly ? 'text-destructive' : 'text-success-green'
                              )}
                            >
                              {selectedFrame.reconstructionError.toFixed(4)}
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                selectedFrame.isL3Anomaly ? 'bg-destructive' : 'bg-success-green'
                              )}
                              style={{ width: `${Math.min(selectedFrame.reconstructionError * 1000, 100)}%` }}
                            />
                          </div>
                          {selectedFrame.isL3Anomaly && (
                            <Badge variant="destructive" className="text-xs w-full justify-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Visual Anomaly Detected
                            </Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No L3 data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// Camera Feed Card Component
interface CameraFeedCardProps {
  frame: VideoFrame;
  showHeatmap?: boolean;
  showAnomalyOverlay?: boolean;
  onClick: () => void;
  densityConfig: Record<string, any>;
  getTimeSince: (timestamp: Date) => string;
}

function CameraFeedCard({
  frame,
  showHeatmap,
  showAnomalyOverlay = true,
  onClick,
  densityConfig,
  getTimeSince,
}: CameraFeedCardProps) {
  const hasAnyAnomaly = frame.isL2Anomaly || frame.isL3Anomaly || frame.anomalies.length > 0;

  return (
    <Card
      className={cn(
        'relative group cursor-pointer transition-all overflow-hidden',
        hasAnyAnomaly
          ? 'hover:shadow-xl border-2 border-destructive/50 hover:border-destructive'
          : 'hover:shadow-lg hover:border-primary/50'
      )}
      onClick={onClick}
    >
      {/* Camera Feed */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {frame.frameUrl ? (
          <img
            src={frame.frameUrl}
            alt={frame.cameraName}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
            <Video className="w-12 h-12 text-muted-foreground group-hover:scale-110 transition-transform" />
          </div>
        )}

        {/* Heatmap Overlay */}
        {showHeatmap && frame.heatmapUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-green-500/20 pointer-events-none">
            <img src={frame.heatmapUrl} alt="Heatmap" className="w-full h-full object-cover opacity-60" />
          </div>
        )}

        {/* Anomaly Overlay */}
        {showAnomalyOverlay && (frame.isL2Anomaly || frame.isL3Anomaly) && (
          <div className="absolute inset-0 border-4 border-destructive/60 animate-pulse" />
        )}

        {/* Live Badge */}
        <Badge variant="outline" className="absolute top-2 right-2 bg-background/80 backdrop-blur text-xs shadow-md">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          LIVE
        </Badge>

        {/* Anomaly Indicators */}
        {showAnomalyOverlay && (
          <div className="absolute top-2 left-2 flex gap-1">
            {frame.isL2Anomaly && (
              <Badge variant="destructive" className="text-xs bg-orange-500 shadow-md animate-pulse">
                L2
              </Badge>
            )}
            {frame.isL3Anomaly && (
              <Badge variant="destructive" className="text-xs bg-purple-500 shadow-md animate-pulse">
                L3
              </Badge>
            )}
          </div>
        )}

        {/* Heatmap Indicator */}
        {showHeatmap && frame.heatmapUrl && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur shadow-md">
              <Layers className="w-3 h-3 mr-1" />
              Heatmap
            </Badge>
          </div>
        )}

        {/* Expand Icon */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur shadow-lg">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <CardContent className="pt-3 pb-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold text-foreground truncate">{frame.cameraName}</h4>
            <Badge className={cn('text-xs ml-2 whitespace-nowrap', densityConfig[frame.densityLevel].color)}>
              {densityConfig[frame.densityLevel].label.split(' ')[0]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-accent" />
              <span className="text-foreground font-medium">{frame.peopleCount}</span>
              <span className="text-muted-foreground">people</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground font-medium">{(frame.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {hasAnyAnomaly && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1.5 text-destructive text-xs animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">
                  {frame.anomalies.length > 0 && `${frame.anomalies.length} anomalies`}
                  {frame.isL2Anomaly && ' • Statistical'}
                  {frame.isL3Anomaly && ' • Visual'}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{getTimeSince(frame.timestamp)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
