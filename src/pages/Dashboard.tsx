import { useEffect } from 'react';
import { OperationsDashboard } from '@/components/features/operations-dashboard';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard - EventSphere';
  }, []);

  return <OperationsDashboard />;
}
