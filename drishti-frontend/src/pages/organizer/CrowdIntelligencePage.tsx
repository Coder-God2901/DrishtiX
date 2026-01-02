import { CrowdIntelligencePage as CrowdIntelligenceComponent } from '../../components/organizer/CrowdIntelligencePage';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Organizer Crowd Intelligence Page
 * Real-time crowd monitoring and predictions
 */
export default function CrowdIntelligencePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return <CrowdIntelligenceComponent onBack={() => navigate(-1)} eventId={eventId} />;
}
