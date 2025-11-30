import { useEffect } from 'react';
import { AlertsDispatch as AlertsDispatchComponent } from '@/components/features/alerts-dispatch';

export default function AlertsDispatch() {
  useEffect(() => {
    document.title = 'Alerts & Dispatch - EventSphere';
  }, []);

  return <AlertsDispatchComponent />;
}
