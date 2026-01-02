import { CrowdIntelligencePage as CrowdIntelligenceComponent } from '../../components/organizer/CrowdIntelligencePage';
import { useParams } from 'react-router-dom';

/**
 * Organizer Crowd Intelligence Page
 * Real-time crowd monitoring and predictions
 */
export default function CrowdIntelligencePage() {
  const { eventId } = useParams();

  return <CrowdIntelligenceComponent />;
}
