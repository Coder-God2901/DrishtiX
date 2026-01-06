import { AttendeeEventHub } from '../../components/attendee/AttendeeEventHub';
import { useNavigate } from 'react-router-dom';

/**
 * Attendee Event Hub Page
 * Browse and explore events
 */
export default function EventHubPage() {
  const navigate = useNavigate();
  
  return <AttendeeEventHub onBack={() => navigate('/attendee/dashboard')} />;
}
