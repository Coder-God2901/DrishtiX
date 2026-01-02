import { AICommandCenter } from '../../components/organizer/AICommandCenter';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Organizer AI Command Page
 * AI-powered decision making and automation
 */
export default function AICommandPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return <AICommandCenter onBack={() => navigate('/organizer/dashboard')} />;
}
