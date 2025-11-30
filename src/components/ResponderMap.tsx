import React from 'react';
import { useRealtime } from '../providers/realtime';

export const ResponderMap: React.FC = () => {
  const { state } = useRealtime();
  return (
    <div className="border rounded p-2 h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Responder Tracking</h2>
        <span className="text-xs text-muted-foreground">team: {state.teamLocations.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 overflow-auto max-h-[260px]">
        {state.teamLocations.map((t) => (
          <div key={`${t.userId}-${t.timestamp}`} className="border rounded p-2 text-xs">
            {t.userId} · {t.role || 'staff'}
            <div className="text-muted-foreground">
              {t.lat.toFixed(5)}, {t.lng.toFixed(5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
