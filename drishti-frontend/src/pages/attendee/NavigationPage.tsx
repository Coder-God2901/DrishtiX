import { NavigationRouting } from '../../components/attendee/NavigationRouting';
import { useNavigate } from 'react-router-dom';

/**
 * Attendee Navigation Page
 * Indoor navigation and wayfinding
 */
export default function NavigationPage() {
  const navigate = useNavigate();
  
  return <NavigationRouting onBack={() => navigate('/attendee/dashboard')} />;
}
