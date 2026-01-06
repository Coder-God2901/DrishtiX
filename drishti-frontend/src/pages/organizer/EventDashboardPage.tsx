import { EventDashboard } from '../../components/organizer/EventDashboard';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Organizer Event Dashboard Page
 * Overview and metrics for a specific event
 */
export default function EventDashboardPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <EventDashboard 
      eventId={eventId || ''}
      onNavigate={(view) => navigate(`/organizer/event/${eventId}/${view}`)}
      onBack={() => navigate('/organizer/home')}
      onSwitchEvent={(id) => navigate(`/organizer/event/${id}/dashboard`)}
      onCreateEvent={() => navigate('/organizer/home')}
    />
  );
}
