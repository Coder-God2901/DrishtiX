import React from 'react';
import { useRealtime } from '../providers/realtime';

export const Heatmap: React.FC = () => {
  const { state } = useRealtime();
  // Minimal placeholder: render counts; real map implementation can use MapLibre/Leaflet
  return (
    <div className="border rounded p-2 h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Crowd Heatmap</h2>
        <span className="text-xs text-muted-foreground">cells: {state.heatgrid.length}</span>
      </div>
      <div className="grid grid-cols-6 gap-1 overflow-auto max-h-[500px]">
        {state.heatgrid.slice(0, 60).map((c) => (
          <div
            key={c.cellId}
            className="p-2 text-center text-xs border rounded"
            style={{ background: `rgba(255,0,0,${Math.min(1, c.count / 150)})` }}
          >
            {c.cellId}: {c.count}
          </div>
        ))}
      </div>
    </div>
  );
};
