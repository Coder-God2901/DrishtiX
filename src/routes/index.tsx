import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const EventsList = lazy(() => import('@/pages/EventsList'));
const EventDetails = lazy(() => import('@/pages/EventDetails'));
const EventCreator = lazy(() => import('@/pages/EventCreator'));
const TeamManagement = lazy(() => import('@/pages/TeamManagement'));
const AlertsDispatch = lazy(() => import('@/pages/AlertsDispatch'));
const VenueMapping = lazy(() => import('@/pages/VenueMapping'));
const DigitalTwin = lazy(() => import('@/pages/DigitalTwin'));
const PredictiveScheduling = lazy(() => import('@/pages/PredictiveScheduling'));
const AttendeeRouting = lazy(() => import('@/pages/AttendeeRouting'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const VideoSurveillance = lazy(() => import('@/pages/VideoSurveillance'));
const MLTraining = lazy(() => import('@/pages/MLTraining'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <Login />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'register',
        element: (
          <SuspenseWrapper>
            <Register />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <SuspenseWrapper>
            <ForgotPassword />
          </SuspenseWrapper>
        ),
      },
      {
        path: '',
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            element: (
              <SuspenseWrapper>
                <EventsList />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseWrapper>
                <EventCreator />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':eventId',
            element: (
              <SuspenseWrapper>
                <EventDetails />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'ORGANIZER']}>
            <SuspenseWrapper>
              <TeamManagement />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'alerts',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'SECURITY', 'ORGANIZER']}>
            <SuspenseWrapper>
              <AlertsDispatch />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'venue',
        element: (
          <SuspenseWrapper>
            <VenueMapping />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'digital-twin',
        element: (
          <SuspenseWrapper>
            <DigitalTwin />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling',
        element: (
          <SuspenseWrapper>
            <PredictiveScheduling />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'routing',
        element: (
          <SuspenseWrapper>
            <AttendeeRouting />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'ORGANIZER', 'SECURITY']}>
            <SuspenseWrapper>
              <Analytics />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'video-surveillance',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'SECURITY', 'ORGANIZER']}>
            <SuspenseWrapper>
              <VideoSurveillance />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'ml-training',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'ORGANIZER']}>
            <SuspenseWrapper>
              <MLTraining />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requireRoles={['ADMIN', 'ORGANIZER']}>
            <SuspenseWrapper>
              <Reports />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requireRoles={['ADMIN']}>
            <SuspenseWrapper>
              <Settings />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <Profile />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFound />
      </SuspenseWrapper>
    ),
  },
]);
