import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import RootLayout from '../layouts/RootLayout';
import AttendeeLayout from '../layouts/AttendeeLayout';
import OrganizerLayout from '../layouts/OrganizerLayout';

// Common Pages
import LandingPage from '../pages/common/LandingPage';
import LoginPage from '../pages/common/LoginPage';
import NotFoundPage from '../pages/common/NotFoundPage';

// Lazy load pages for better performance
const AttendeeDashboardPage = lazy(() => import('../pages/attendee/DashboardPage'));
const AttendeeEventHubPage = lazy(() => import('../pages/attendee/EventHubPage'));
const AttendeeNavigationPage = lazy(() => import('../pages/attendee/NavigationPage'));
const AttendeeTicketsPage = lazy(() => import('../pages/attendee/TicketsPage'));
const AttendeeHelpPage = lazy(() => import('../pages/attendee/HelpPage'));
const AttendeeEmergencyPage = lazy(() => import('../pages/attendee/EmergencyPage'));

const OrganizerHomePage = lazy(() => import('../pages/organizer/HomePage'));
const OrganizerEventDashboardPage = lazy(() => import('../pages/organizer/EventDashboardPage'));
const OrganizerEventCommandCenterPage = lazy(() => import('../pages/organizer/EventCommandCenterPage'));
const OrganizerOperationsPage = lazy(() => import('../pages/organizer/OperationsPage'));
const OrganizerAnalyticsPage = lazy(() => import('../pages/organizer/AnalyticsPage'));
const OrganizerAICommandPage = lazy(() => import('../pages/organizer/AICommandPage'));
const OrganizerCrowdIntelligencePage = lazy(() => import('../pages/organizer/CrowdIntelligencePage'));
const OrganizerDispatchCenterPage = lazy(() => import('../pages/organizer/DispatchCenterPage'));
const OrganizerGateControlPage = lazy(() => import('../pages/organizer/GateControlPage'));
const OrganizerAutomationPolicyPage = lazy(() => import('../pages/organizer/AutomationPolicyPage'));
const OrganizerPostEventAnalysisPage = lazy(() => import('../pages/organizer/PostEventAnalysisPage'));

// Loading Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-slate-300">Loading...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      
      // Attendee Routes
      {
        path: 'attendee',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AttendeeLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AttendeeDashboardPage />,
          },
          {
            path: 'events',
            element: <AttendeeEventHubPage />,
          },
          {
            path: 'navigation',
            element: <AttendeeNavigationPage />,
          },
          {
            path: 'tickets',
            element: <AttendeeTicketsPage />,
          },
          {
            path: 'help',
            element: <AttendeeHelpPage />,
          },
          {
            path: 'emergency',
            element: <AttendeeEmergencyPage />,
          },
        ],
      },

      // Organizer Routes
      {
        path: 'organizer',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <OrganizerLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="home" replace />,
          },
          {
            path: 'home',
            element: <OrganizerHomePage />,
          },
          {
            path: 'event/:eventId',
            children: [
              {
                index: true,
                element: <Navigate to="dashboard" replace />,
              },
              {
                path: 'dashboard',
                element: <OrganizerEventDashboardPage />,
              },
              {
                path: 'command-center',
                element: <OrganizerEventCommandCenterPage />,
              },
              {
                path: 'operations',
                element: <OrganizerOperationsPage />,
              },
              {
                path: 'analytics',
                element: <OrganizerAnalyticsPage />,
              },
              {
                path: 'ai-command',
                element: <OrganizerAICommandPage />,
              },
              {
                path: 'crowd-intelligence',
                element: <OrganizerCrowdIntelligencePage />,
              },
              {
                path: 'dispatch',
                element: <OrganizerDispatchCenterPage />,
              },
              {
                path: 'gate-control',
                element: <OrganizerGateControlPage />,
              },
              {
                path: 'automation',
                element: <OrganizerAutomationPolicyPage />,
              },
              {
                path: 'post-event',
                element: <OrganizerPostEventAnalysisPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
