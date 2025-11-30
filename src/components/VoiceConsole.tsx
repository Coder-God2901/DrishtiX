import React from 'react';
import { CLIENT_CONFIG } from '../config/client';

export const VoiceConsole: React.FC = () => {
  const [text, setText] = React.useState('');
  const [responses, setResponses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${CLIENT_CONFIG.apiBaseUrl}/voice/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResponses((r) => [data, ...r]);
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Type a command (e.g., 'show congestion near main stage')"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <button className="px-3 py-2 border rounded" onClick={send} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      <div className="flex-1 max-h-32 overflow-auto text-xs">
        {responses.map((r, i) => (
          <pre key={i} className="border rounded p-2 whitespace-pre-wrap">
            {JSON.stringify(r, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
};
