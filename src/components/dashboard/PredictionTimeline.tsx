import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';

interface PredictionDataPoint {
  timestamp: number;
  predictedCount: number;
  confidence: number;
  densityLevel: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictionTimelineProps {
  predictions?: PredictionDataPoint[];
  currentCount?: number;
  className?: string;
  eventId?: string;
}

export function PredictionTimeline({
  predictions: propPredictions,
  currentCount,
  className,
  eventId,
}: PredictionTimelineProps) {
  // Use GCP real-time predictions if eventId provided
  const { predictions: realtimePredictions, isConnected } = useGCPRealtime({
    eventId,
    enablePredictions: true,
    enableVideoAnalytics: false,
    enableSocialSignals: false,
    enableAnomalies: false,
    enableAlerts: false,
    enableIncidents: false,
    enableResponderUpdates: false,
  });

  const predictions =
    eventId && realtimePredictions.length > 0
      ? realtimePredictions.map((p) => ({
          timestamp: p.timestamp.getTime(),
          predictedCount: p.predictedCount,
          confidence: p.confidence,
          densityLevel: p.densityLevel,
          riskLevel: p.riskLevel,
        }))
      : propPredictions || [];
  // Format data for chart
  const chartData = predictions.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    count: p.predictedCount,
    confidence: p.confidence * 100,
    densityLevel: p.densityLevel,
    riskLevel: p.riskLevel,
  }));

  // Find next critical prediction
  const nextCritical = predictions.find((p) => p.densityLevel === 'critical' || p.riskLevel === 'critical');

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-green';
    if (confidence >= 0.6) return 'text-warning-amber';
    return 'text-safety-red';
  };

  const getDensityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#E02D2D';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#FF6A00';
      case 'low':
        return '#16A34A';
      default:
        return '#475569';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{data.time}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Predicted Count:</span>
              <span className="text-sm font-semibold">{data.count}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={cn('text-sm font-semibold', getConfidenceColor(data.confidence / 100))}>
                {data.confidence.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Density:</span>
              <Badge variant="outline" className="text-xs" style={{ borderColor: getDensityColor(data.densityLevel) }}>
                {data.densityLevel}
              </Badge>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            15-Minute Forecast Timeline
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            <Clock className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Banner */}
        {nextCritical && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Critical Density Predicted</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expected at {new Date(nextCritical.timestamp).toLocaleTimeString()} (
                {Math.round((nextCritical.timestamp - Date.now()) / 60000)} min ahead)
              </p>
            </div>
          </div>
        )}

        {/* Current vs Predicted */}
        {currentCount !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{currentCount}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Predicted (+15min)</p>
              </div>
              <p className="text-2xl font-bold text-primary">{predictions[0]?.predictedCount || 0}</p>
              <p className={cn('text-xs mt-1', getConfidenceColor(predictions[0]?.confidence || 0))}>
                {((predictions[0]?.confidence || 0) * 100).toFixed(0)}% confidence
              </p>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                label={{
                  value: 'People Count',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {currentCount && (
                <ReferenceLine
                  y={currentCount}
                  stroke="#16A34A"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Current',
                    position: 'right',
                    fill: '#16A34A',
                    fontSize: 12,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="count"
                stroke="#FF6A00"
                strokeWidth={2}
                fill="url(#countGradient)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Prediction Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Accuracy</p>
            <p className="text-lg font-bold text-foreground">78%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
            <p className="text-lg font-bold text-foreground">15-20min</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">False Positives</p>
            <p className="text-lg font-bold text-success-green">12%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
