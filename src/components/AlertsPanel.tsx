import React from 'react';
import { useRealtime } from '../providers/realtime';

export const AlertsPanel: React.FC = () => {
  const { state } = useRealtime();
  const alerts = state.alerts;
  return (
    <div className="border rounded p-2 h-full">
      <h2 className="font-semibold mb-2">Alerts</h2>
      <div className="space-y-2 overflow-auto max-h-[500px]">
        {alerts.length === 0 && <div className="text-sm text-muted-foreground">No alerts yet</div>}
        {alerts.map((a) => (
          <div key={a.alertId} className="border rounded p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{a.type}</span>
              <span className="text-xs">{a.priority}</span>
            </div>
            <div className="text-xs text-muted-foreground">{a.summary || 'Alert triggered'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
