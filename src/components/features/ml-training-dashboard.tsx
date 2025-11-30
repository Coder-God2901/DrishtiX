/**
 * ML Training Dashboard
 * Interface for training custom ML models on event crowd data
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Brain,
  TrendingUp,
  Database,
  Cpu,
  CheckCircle,
  Clock,
  Download,
  Play,
  Pause,
  BarChart3,
  Target,
  Zap,
  Activity,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingJob {
  id: string;
  modelType: string;
  status: 'queued' | 'training' | 'completed' | 'failed';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  accuracy: number;
  loss: number;
  startTime: string;
  estimatedCompletion?: string;
}

export function MLTrainingDashboard() {
  const [selectedModelType, setSelectedModelType] = useState<
    'crowd_density' | 'anomaly_detection' | 'transfer_learning'
  >('crowd_density');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
    {
      id: 'job-001',
      modelType: 'crowd_density',
      status: 'completed',
      progress: 100,
      currentEpoch: 50,
      totalEpochs: 50,
      accuracy: 0.94,
      loss: 0.12,
      startTime: '2025-11-29 10:30',
      estimatedCompletion: '2025-11-29 11:45',
    },
    {
      id: 'job-002',
      modelType: 'anomaly_detection',
      status: 'training',
      progress: 68,
      currentEpoch: 34,
      totalEpochs: 50,
      accuracy: 0.89,
      loss: 0.18,
      startTime: '2025-11-29 14:15',
      estimatedCompletion: '2025-11-29 15:30',
    },
    {
      id: 'job-003',
      modelType: 'transfer_learning',
      status: 'queued',
      progress: 0,
      currentEpoch: 0,
      totalEpochs: 30,
      accuracy: 0,
      loss: 0,
      startTime: '2025-11-29 16:00',
    },
  ]);

  // Real-time training job monitoring
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('ml:training:progress', (data: any) => {
      setTrainingJobs((prev) =>
        prev.map((job) =>
          job.id === data.jobId
            ? {
                ...job,
                progress: data.progress,
                currentEpoch: data.currentEpoch,
                accuracy: data.accuracy,
                loss: data.loss,
                status: data.status,
              }
            : job
        )
      );

      if (data.status === 'completed') {
        toast.success(`Training job ${data.jobId} completed!`, {
          description: `Accuracy: ${(data.accuracy * 100).toFixed(1)}%`,
        });
      }
    });

    socket.on('ml:training:started', (data: any) => {
      const newJob: TrainingJob = {
        id: data.jobId,
        modelType: data.modelType,
        status: 'training',
        progress: 0,
        currentEpoch: 0,
        totalEpochs: data.totalEpochs,
        accuracy: 0,
        loss: 0,
        startTime: new Date().toLocaleString(),
      };
      setTrainingJobs((prev) => [newJob, ...prev]);
      toast.info('New training job started', { description: `Model: ${data.modelType}` });
    });

    socket.emit('subscribe:ml-training');

    return () => {
      socket.off('ml:training:progress');
      socket.off('ml:training:started');
    };
  }, []);

  const deployedModels = [
    {
      name: 'crowd_density_v2.1',
      type: 'Crowd Density',
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.93,
      f1Score: 0.925,
      deployedDate: '2025-11-28',
      version: 'v2.1',
      status: 'active',
    },
    {
      name: 'anomaly_detection_v1.8',
      type: 'Anomaly Detection',
      accuracy: 0.89,
      precision: 0.87,
      recall: 0.88,
      f1Score: 0.875,
      deployedDate: '2025-11-27',
      version: 'v1.8',
      status: 'active',
    },
    {
      name: 'people_counting_yolo_v8',
      type: 'People Counting',
      accuracy: 0.96,
      precision: 0.95,
      recall: 0.94,
      f1Score: 0.945,
      deployedDate: '2025-11-26',
      version: 'v8.0',
      status: 'active',
    },
  ];

  const datasetStats = {
    totalFrames: 127843,
    totalEvents: 24,
    labeledData: 98234,
    unlabeledData: 29609,
    avgCrowdSize: 487,
    anomalyExamples: 1247,
  };

  const startTraining = () => {
    setIsTraining(true);
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'training':
        return <Badge className="bg-blue-500">Training</Badge>;
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">ML Model Training</h1>
          <Badge className="bg-purple-500">
            <Cpu className="w-3 h-3 mr-1" />
            GPU Accelerated
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Models
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Training Data</p>
                <p className="text-lg font-semibold">{datasetStats.totalFrames.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Labeled</p>
                <p className="text-lg font-semibold">{datasetStats.labeledData.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-lg font-semibold">{datasetStats.totalEvents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-lg font-semibold">{datasetStats.anomalyExamples.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Crowd</p>
                <p className="text-lg font-semibold">{datasetStats.avgCrowdSize}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Models</p>
                <p className="text-lg font-semibold">{deployedModels.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Training Configuration */}
          <Card className="col-span-1 p-6">
            <h3 className="text-lg font-semibold mb-4">New Training Job</h3>

            <div className="space-y-4">
              <div>
                <Label>Model Type</Label>
                <select
                  value={selectedModelType}
                  onChange={(e) => setSelectedModelType(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded border"
                >
                  <option value="crowd_density">Crowd Density</option>
                  <option value="anomaly_detection">Anomaly Detection</option>
                  <option value="transfer_learning">Transfer Learning</option>
                </select>
              </div>

              <div>
                <Label>Learning Rate</Label>
                <Input type="number" defaultValue="0.001" step="0.0001" className="mt-1" />
              </div>

              <div>
                <Label>Batch Size</Label>
                <Input type="number" defaultValue="32" className="mt-1" />
              </div>

              <div>
                <Label>Epochs</Label>
                <Input type="number" defaultValue="50" className="mt-1" />
              </div>

              <div>
                <Label>Validation Split</Label>
                <Input type="number" defaultValue="0.2" step="0.1" className="mt-1" />
              </div>

              <Button className="w-full" onClick={startTraining} disabled={isTraining}>
                {isTraining ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Training... {trainingProgress}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Training
                  </>
                )}
              </Button>

              {isTraining && (
                <div className="space-y-2">
                  <Progress value={trainingProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Epoch {Math.floor(trainingProgress / 2)}/50</span>
                    <span>{trainingProgress}%</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Training Jobs */}
          <Card className="col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Training Jobs</h3>

            <div className="space-y-3">
              {trainingJobs.map((job) => (
                <div key={job.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{job.modelType.replace(/_/g, ' ')}</h4>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">Started: {job.startTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Accuracy: {Math.round(job.accuracy * 100)}%</p>
                      <p className="text-sm text-muted-foreground">Loss: {job.loss.toFixed(2)}</p>
                    </div>
                  </div>

                  {job.status === 'training' && (
                    <div className="space-y-2">
                      <Progress value={job.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Epoch {job.currentEpoch}/{job.totalEpochs}
                        </span>
                        <span>ETA: {job.estimatedCompletion}</span>
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div className="text-center p-2 rounded bg-accent">
                        <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-sm font-semibold">{Math.round(job.accuracy * 100)}%</p>
                      </div>
                      <div className="text-center p-2 rounded bg-accent">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Loss</p>
                        <p className="text-sm font-semibold">{job.loss.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-accent">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Epochs</p>
                        <p className="text-sm font-semibold">{job.totalEpochs}</p>
                      </div>
                      <div className="text-center">
                        <Button size="sm" variant="outline" className="w-full">
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Deployed Models */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Deployed Models</h3>

          <div className="space-y-3">
            {deployedModels.map((model, idx) => (
              <div key={idx} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{model.name}</h4>
                      <Badge variant="outline">{model.version}</Badge>
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {model.type} • Deployed {model.deployedDate}
                    </p>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.accuracy * 100} className="h-2 flex-1" />
                          <span className="text-sm font-semibold">{Math.round(model.accuracy * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Precision</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.precision * 100} className="h-2 flex-1" />
                          <span className="text-sm font-semibold">{Math.round(model.precision * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Recall</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.recall * 100} className="h-2 flex-1" />
                          <span className="text-sm font-semibold">{Math.round(model.recall * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">F1 Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.f1Score * 100} className="h-2 flex-1" />
                          <span className="text-sm font-semibold">{Math.round(model.f1Score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Metrics
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
