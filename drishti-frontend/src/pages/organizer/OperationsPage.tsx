import { OperationsCommandCenter } from '../../components/organizer/OperationsCommandCenter';
import { useParams } from 'react-router-dom';

/**
 * Organizer Operations Page
 * Team and resource management operations
 */
export default function OperationsPage() {
  const { eventId } = useParams();

  return <OperationsCommandCenter />;
}
