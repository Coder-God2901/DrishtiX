import { useEffect } from 'react';
import { EventCreator as EventCreatorComponent } from '@/components/features/event-creator';

export default function EventCreator() {
  useEffect(() => {
    document.title = 'Create Event - EventSphere';
  }, []);

  return <EventCreatorComponent />;
}
