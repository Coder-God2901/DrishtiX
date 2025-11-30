import React from 'react';
import { Heatmap } from '../components/Heatmap';
import { AlertsPanel } from '../components/AlertsPanel';
import { VoiceConsole } from '../components/VoiceConsole';
import { ResponderMap } from '../components/ResponderMap';
import { PredictionCharts } from '../components/PredictionCharts';
import { VenueEditor } from '../components/VenueEditor';
import { useRealtimeInit } from '../providers/realtime';

export const Dashboard: React.FC = () => {
  useRealtimeInit();
  const [showEditor, setShowEditor] = React.useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex-1 grid grid-rows-[auto_1fr_auto] grid-cols-1">
        <header className="p-3 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">DrishtiX Command Center</h1>
            <p className="text-xs text-muted-foreground">Real-time operations dashboard</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={() => setShowEditor((v) => !v)}>
              {showEditor ? 'Close Venue Editor' : 'Open Venue Editor'}
            </button>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-3 p-3 overflow-auto">
          <div className="col-span-8 min-h-[400px]">
            <Heatmap />
          </div>
          <div className="col-span-4">
            <AlertsPanel />
          </div>
          <div className="col-span-8 min-h-[300px]">
            <ResponderMap />
          </div>
          <div className="col-span-4 min-h-[300px]">
            <PredictionCharts />
          </div>
        </main>

        <footer className="p-3 border-t">
          <VoiceConsole />
        </footer>
      </div>

      {showEditor && (
        <aside className="w-[420px] border-l p-3 overflow-auto">
          <VenueEditor />
        </aside>
      )}
    </div>
  );
};
