import { AICommandCenter } from '../../components/organizer/AICommandCenter';
import { useParams } from 'react-router-dom';

/**
 * Organizer AI Command Page
 * AI-powered decision making and automation
 */
export default function AICommandPage() {
  const { eventId } = useParams();

  return <AICommandCenter />;
}
