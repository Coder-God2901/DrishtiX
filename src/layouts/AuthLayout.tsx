import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-light to-surface-muted dark:from-dark-bg dark:to-dark-surface">
      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EventSphere
          </h1>
          <p className="mt-2 text-muted-foreground">Advanced Event Management Platform</p>
        </div>
        <div className="rounded-lg bg-card p-8 shadow-xl border">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
