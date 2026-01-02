import { Outlet } from 'react-router-dom';
import { IncidentProvider } from '../services/incidentContext';

/**
 * Root Layout Component
 * Wraps all routes with global providers and context
 */
export default function RootLayout() {
  return (
    <IncidentProvider>
      <div className="min-h-screen bg-slate-950">
        <Outlet />
      </div>
    </IncidentProvider>
  );
}
