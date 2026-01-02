import { GoLiveView } from './GoLiveView';

interface LaunchLivePageProps {
  onBack: () => void;
}

export function LaunchLivePage({ onBack }: LaunchLivePageProps) {
  // Thin wrapper to keep GoLiveView logic intact while
  // presenting it as a dedicated "Launch Live" page.
  return <GoLiveView onBack={onBack} />;
}
