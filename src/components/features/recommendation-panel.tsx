/**
 * Recommendation Panel Component
 * Displays ranked AI-generated recommendations with approve/reject functionality
 * Based on Technical Design Document 3: Recommendation Engine
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, Clock, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

interface Action {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: number;
  cost: number;
  executionTime: number;
}

interface Recommendation {
  action: Action;
  rank: number;
  confidence: number;
  reason: string;
  estimatedImpact: string;
}

interface RecommendationEvent {
  eventId: string;
  zoneId?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: Recommendation[];
  timestamp: string;
}

interface RecommendationPanelProps {
  eventId: string;
  onActionApproved?: (actionId: string) => void;
  onActionRejected?: (actionId: string) => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  eventId,
  onActionApproved,
  onActionRejected,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [zoneId, setZoneId] = useState<string | undefined>();
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize Socket.IO connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const socket = io(wsUrl);

    // Subscribe to recommendation events
    const handleRecommendations = (event: RecommendationEvent) => {
      if (event.eventId === eventId) {
        setRecommendations(event.recommendations);
        setRiskLevel(event.riskLevel);
        setZoneId(event.zoneId);
        setLastUpdate(event.timestamp);

        // Show toast notification
        if (event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH') {
          toast.error(`${event.riskLevel} Risk Detected`, {
            description: `${event.recommendations.length} action${event.recommendations.length > 1 ? 's' : ''} recommended`,
          });
        }
      }
    };

    socket.on('recommendations:new', handleRecommendations);
    socket.emit('subscribe:recommendations', eventId);

    return () => {
      socket.off('recommendations:new', handleRecommendations);
      socket.disconnect();
    };
  }, [eventId]);

  const handleApprove = async (recommendation: Recommendation) => {
    const actionId = recommendation.action.id;
    setProcessingActions(new Set(processingActions.add(actionId)));

    try {
      // Call API to approve recommendation
      const response = await fetch(`/api/recommendations/${actionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          zoneId,
          decision: 'APPROVED',
        }),
      });

      if (!response.ok) throw new Error('Failed to approve recommendation');

      toast.success('Action Approved', {
        description: `${recommendation.action.title} has been activated`,
      });

      // Remove from list
      setRecommendations(recommendations.filter((r) => r.action.id !== actionId));

      onActionApproved?.(actionId);
    } catch (error) {
      toast.error('Approval Failed', {
        description: 'Failed to approve recommendation. Please try again.',
      });
    } finally {
      const newSet = new Set(processingActions);
      newSet.delete(actionId);
      setProcessingActions(newSet);
    }
  };

  const handleReject = async (recommendation: Recommendation) => {
    const actionId = recommendation.action.id;
    setProcessingActions(new Set(processingActions.add(actionId)));

    try {
      // Call API to reject recommendation
      const response = await fetch(`/api/recommendations/${actionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          zoneId,
          decision: 'REJECTED',
        }),
      });

      if (!response.ok) throw new Error('Failed to reject recommendation');

      toast.info('Action Rejected', {
        description: `${recommendation.action.title} has been dismissed`,
      });

      // Remove from list
      setRecommendations(recommendations.filter((r) => r.action.id !== actionId));

      onActionRejected?.(actionId);
    } catch (error) {
      toast.error('Rejection Failed', {
        description: 'Failed to reject recommendation. Please try again.',
      });
    } finally {
      const newSet = new Set(processingActions);
      newSet.delete(actionId);
      setProcessingActions(newSet);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'CRITICAL':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'DISPATCH_STAFF':
        return <Users className="h-4 w-4" />;
      case 'THROTTLE_GATE':
      case 'OPEN_GATE':
        return <TrendingUp className="h-4 w-4" />;
      case 'BROADCAST_ALERT':
        return <AlertCircle className="h-4 w-4" />;
      case 'PAUSE_EVENT':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            No Actions Required
          </CardTitle>
          <CardDescription>All systems operating normally. No recommendations at this time.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
            <CardDescription>
              AI-generated recommendations based on current risk analysis
              {zoneId && ` for ${zoneId}`}
            </CardDescription>
          </div>
          <Badge className={getRiskBadgeColor(riskLevel)}>{riskLevel} RISK</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => {
          const isProcessing = processingActions.has(recommendation.action.id);

          return (
            <div
              key={recommendation.action.id}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getActionIcon(recommendation.action.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        #{recommendation.rank} {recommendation.action.title}
                      </h4>
                      <Badge variant="outline" className={getConfidenceColor(recommendation.confidence)}>
                        {(recommendation.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{recommendation.action.description}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Impact</div>
                  <div className="font-medium">{(recommendation.action.impact * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Implementation</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recommendation.action.executionTime} min
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cost</div>
                  <div className="font-medium">{recommendation.action.cost}/10</div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-muted/50 rounded p-3 text-sm">
                <div className="font-medium mb-1">Why this action?</div>
                <p className="text-muted-foreground">{recommendation.reason}</p>
              </div>

              {/* Estimated Impact */}
              <div className="text-sm">
                <div className="font-medium mb-1">Estimated Impact:</div>
                <p className="text-muted-foreground">{recommendation.estimatedImpact}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleApprove(recommendation)}
                  disabled={isProcessing}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Approve & Execute'}
                </Button>
                <Button
                  onClick={() => handleReject(recommendation)}
                  disabled={isProcessing}
                  className="flex-1"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}

        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Last updated: {new Date(lastUpdate).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
