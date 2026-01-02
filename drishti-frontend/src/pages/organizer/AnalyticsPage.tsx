import { AnalyticsSetupView } from '../../components/organizer/AnalyticsSetupView';
import { useParams } from 'react-router-dom';

/**
 * Organizer Analytics Page
 * Advanced analytics and insights for event data
 */
export default function AnalyticsPage() {
  const { eventId } = useParams();

  return <AnalyticsSetupView />;
}
