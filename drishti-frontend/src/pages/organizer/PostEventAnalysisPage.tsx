import { PostEventAnalysisPage as PostEventAnalysisComponent } from '../../components/organizer/PostEventAnalysisPage';
import { useParams } from 'react-router-dom';

/**
 * Organizer Post-Event Analysis Page
 * Comprehensive post-event reporting and insights
 */
export default function PostEventAnalysisPage() {
  const { eventId } = useParams();

  return <PostEventAnalysisComponent />;
}
