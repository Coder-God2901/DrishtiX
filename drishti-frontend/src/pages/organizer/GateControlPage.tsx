import { GateControlPage as GateControlComponent } from '../../components/organizer/GateControlPage';
import { useParams } from 'react-router-dom';

/**
 * Organizer Gate Control Page
 * Access control and entry management
 */
export default function GateControlPage() {
  const { eventId } = useParams();

  return <GateControlComponent />;
}
