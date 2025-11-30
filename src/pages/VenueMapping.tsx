import { useEffect } from 'react';
import { VenueMapping as VenueMappingComponent } from '@/components/features/venue-mapping';

export default function VenueMapping() {
  useEffect(() => {
    document.title = 'Venue Mapping - EventSphere';
  }, []);

  return <VenueMappingComponent />;
}
