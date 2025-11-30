import { useEffect } from 'react';
import { TeamManagement as TeamManagementComponent } from '@/components/features/team-management';

export default function TeamManagement() {
  useEffect(() => {
    document.title = 'Team Management - EventSphere';
  }, []);

  return <TeamManagementComponent />;
}
