import { useEffect } from 'react';
import { AttendeeRouting as AttendeeRoutingComponent } from '@/components/features/attendee-routing';

export default function AttendeeRouting() {
  useEffect(() => {
    document.title = 'Attendee Routing - EventSphere';
  }, []);

  return <AttendeeRoutingComponent />;
}
