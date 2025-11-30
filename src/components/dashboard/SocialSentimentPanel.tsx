/**
 * Social Sentiment Panel Component
 * Real-time social media sentiment analysis using GCP Gemini API
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, TrendingUp, TrendingDown, AlertTriangle, Twitter, Hash, Activity } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useGCPRealtime } from '@/hooks/useGCPRealtime';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SocialSentimentPanelProps {
  eventId: string;
  className?: string;
  maxSignals?: number;
}

export function SocialSentimentPanel({ eventId, className, maxSignals = 50 }: SocialSentimentPanelProps) {
  const { socialSignals, isConnected } = useGCPRealtime({
    eventId,
    enableSocialSignals: true,
    enablePredictions: false,
    enableVideoAnalytics: false,
    enableAnomalies: false,
  });

  // Calculate sentiment statistics
  const stats = {
    total: socialSignals.length,
    positive: socialSignals.filter((s) => s.sentiment === 'positive').length,
    neutral: socialSignals.filter((s) => s.sentiment === 'neutral').length,
    negative: socialSignals.filter((s) => s.sentiment === 'negative').length,
    urgent: socialSignals.filter((s) => s.sentiment === 'urgent').length,
  };

  const positivePercent = stats.total > 0 ? (stats.positive / stats.total) * 100 : 0;
  const negativePercent = stats.total > 0 ? (stats.negative / stats.total) * 100 : 0;
  const urgentPercent = stats.total > 0 ? (stats.urgent / stats.total) * 100 : 0;

  // Sentiment over time chart data
  const chartData = socialSignals
    .slice(0, 20)
    .reverse()
    .map((signal) => ({
      time: new Date(signal.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      score: signal.score * 100,
      sentiment: signal.sentiment,
    }));

  const sentimentConfig = {
    positive: {
      color: 'text-success-green bg-success-green/10',
      icon: '😊',
      chartColor: '#16A34A',
    },
    neutral: {
      color: 'text-muted-foreground bg-muted/10',
      icon: '😐',
      chartColor: '#64748B',
    },
    negative: {
      color: 'text-warning-amber bg-warning-amber/10',
      icon: '😟',
      chartColor: '#F59E0B',
    },
    urgent: {
      color: 'text-destructive bg-destructive/10',
      icon: '🚨',
      chartColor: '#E02D2D',
    },
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Social Sentiment Analysis
          </CardTitle>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sentiment Statistics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-success-green/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-success-green" />
              <div className="text-2xl font-bold text-success-green">{stats.positive}</div>
            </div>
            <div className="text-xs text-muted-foreground">Positive</div>
            <div className="text-xs font-semibold text-success-green">{positivePercent.toFixed(0)}%</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.neutral}</div>
            <div className="text-xs text-muted-foreground">Neutral</div>
          </div>
          <div className="rounded-lg bg-warning-amber/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-warning-amber" />
              <div className="text-2xl font-bold text-warning-amber">{stats.negative}</div>
            </div>
            <div className="text-xs text-muted-foreground">Negative</div>
            <div className="text-xs font-semibold text-warning-amber">{negativePercent.toFixed(0)}%</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{stats.urgent}</div>
            </div>
            <div className="text-xs text-muted-foreground">Urgent</div>
            <div className="text-xs font-semibold text-destructive">{urgentPercent.toFixed(0)}%</div>
          </div>
        </div>

        {/* Sentiment Trend Chart */}
        {chartData.length > 0 && (
          <div className="rounded-lg border bg-card/50 p-4">
            <h4 className="text-sm font-medium mb-3">Sentiment Trend</h4>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[-100, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} fill="url(#sentimentGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trending Topics */}
        {socialSignals.length > 0 && (
          <div className="rounded-lg border bg-card/50 p-3">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Trending Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {['crowdsafety', 'eventupdate', 'venuesecurity', 'liveevents'].map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Social Signals */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Social Signals
          </h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {socialSignals.slice(0, maxSignals).map((signal, idx) => {
                const config = sentimentConfig[signal.sentiment];
                return (
                  <div
                    key={`${signal.timestamp}-${idx}`}
                    className="rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{config.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-xs', config.color)}>
                            {signal.sentiment}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Twitter className="w-3 h-3 mr-1" />
                            {signal.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm leading-tight mb-2">{signal.text}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {signal.author && <span className="flex items-center gap-1">👤 {signal.author}</span>}
                          {signal.location && <span className="flex items-center gap-1">📍 {signal.location}</span>}
                          <span className="flex items-center gap-1 ml-auto">
                            Score:{' '}
                            <span className={cn('font-semibold', config.color)}>{(signal.score * 100).toFixed(0)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {socialSignals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No social signals yet</p>
                  <p className="text-xs mt-1">Listening to social media for event mentions...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
