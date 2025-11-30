import { useEffect } from 'react';
import { DigitalTwin as DigitalTwinComponent } from '@/components/features/digital-twin';

export default function DigitalTwin() {
  useEffect(() => {
    document.title = 'Digital Twin - EventSphere';
  }, []);

  return <DigitalTwinComponent />;
}
