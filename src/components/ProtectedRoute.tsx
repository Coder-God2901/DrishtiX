/**
 * ProtectedRoute Component
 * Route guard with role-based access control
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRoles?: string[];
  requirePermissions?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requireRoles = [],
  requirePermissions = [],
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requireRoles.length > 0 && !hasRole(requireRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this page. Required role: {requireRoles.join(' or ')}.
              <br />
              Your current role: {user?.roles}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requirePermissions.length > 0) {
    const hasAllPermissions = requirePermissions.every((permission) => hasPermission(permission));

    if (!hasAllPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>You don't have the required permissions to access this page.</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * RoleGate Component
 * Conditionally render content based on user role
 */

interface RoleGateProps {
  children: ReactNode;
  requireRoles?: string[];
  requirePermissions?: string[];
  fallback?: ReactNode;
}

export function RoleGate({ children, requireRoles = [], requirePermissions = [], fallback = null }: RoleGateProps) {
  const { hasRole, hasPermission } = useAuth();

  // Check role requirements
  if (requireRoles.length > 0 && !hasRole(requireRoles)) {
    return <>{fallback}</>;
  }

  // Check permission requirements
  if (requirePermissions.length > 0) {
    const hasAllPermissions = requirePermissions.every((permission) => hasPermission(permission));

    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
