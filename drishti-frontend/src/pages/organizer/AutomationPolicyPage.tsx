import { AutomationPolicyPage as AutomationPolicyComponent } from '../../components/organizer/AutomationPolicyPage';
import { useParams } from 'react-router-dom';

/**
 * Organizer Automation Policy Page
 * Configure automated responses and policies
 */
export default function AutomationPolicyPage() {
  const { eventId } = useParams();

  return <AutomationPolicyComponent />;
}
