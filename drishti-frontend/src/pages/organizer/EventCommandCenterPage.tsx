import { EventCommandCenter } from '../../components/organizer/EventCommandCenter';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Organizer Event Command Center Page
 * Central command and control for event operations
 */
export default function EventCommandCenterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <EventCommandCenter 
      eventId={eventId || ''}
      onBack={() => navigate('/organizer/home')}
      onCreateEvent={() => navigate('/organizer/home')}
    />
  );
}
