import { useEffect } from 'react';
import { PredictiveScheduling as PredictiveSchedulingComponent } from '@/components/features/predictive-scheduling';

export default function PredictiveScheduling() {
  useEffect(() => {
    document.title = 'Predictive Scheduling - EventSphere';
  }, []);

  return <PredictiveSchedulingComponent />;
}
