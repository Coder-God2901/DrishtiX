import { DispatchCenterPage as DispatchCenterComponent } from '../../components/organizer/DispatchCenterPage';
import { useParams } from 'react-router-dom';

/**
 * Organizer Dispatch Center Page
 * Incident dispatch and emergency response coordination
 */
export default function DispatchCenterPage() {
  const { eventId } = useParams();

  return <DispatchCenterComponent />;
}
