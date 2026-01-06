import { MyTickets } from '../../components/attendee/MyTickets';
import { useNavigate } from 'react-router-dom';

/**
 * Attendee Tickets Page
 * View and manage purchased tickets
 */
export default function TicketsPage() {
  const navigate = useNavigate();
  
  return <MyTickets onBack={() => navigate('/attendee/dashboard')} />;
}
