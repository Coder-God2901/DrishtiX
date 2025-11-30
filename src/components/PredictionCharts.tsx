import React from 'react';
import { useRealtime } from '../providers/realtime';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const PredictionCharts: React.FC = () => {
  const { state } = useRealtime();
  const data = state.forecasts
    .slice(0, 40)
    .reverse()
    .map((p, idx) => ({
      idx,
      horizon: p.timeHorizonMinutes,
      count: p.predictedCount,
      conf: Math.round((p.confidence ?? 0) * 100),
      zone: p.zoneId || 'global',
    }));

  return (
    <div className="border rounded p-2 h-full">
      <h2 className="font-semibold mb-2">Predictions</h2>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" tick={false} />
            <YAxis />
            <Tooltip formatter={(v: any, n: any) => [v, n]} labelFormatter={(l) => `#${l}`} />
            <Line type="monotone" dataKey="count" stroke="#0B3D91" dot={false} name="Predicted Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
