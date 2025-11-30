import React, { useMemo } from 'react';
import { useRealtime } from '@/providers/realtime';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const RiskTrendCharts: React.FC = () => {
  const { state } = useRealtime();

  // Aggregate alerts by priority
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.alerts.forEach((a) => {
      counts[a.priority] = (counts[a.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
  }, [state.alerts]);

  // Confidence trend (last N alerts)
  const confidenceTrend = useMemo(() => {
    return state.alerts
      .slice(0, 25)
      .reverse()
      .map((a, i) => ({ idx: i, confidence: Math.round((a.confidence ?? 0) * 100), priority: a.priority }));
  }, [state.alerts]);

  return (
    <div className="space-y-4">
      <div className="border rounded p-3">
        <h3 className="font-semibold mb-2">Alert Priority Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#E02D2D" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="border rounded p-3">
        <h3 className="font-semibold mb-2">Confidence Trend (Recent)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={confidenceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="idx" tick={false} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#0B3D91" dot={false} name="Confidence (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
