# Component Migration Guide

This guide helps you understand how the old component structure maps to the new one and how to migrate your code.

## 📊 Component Mapping

### Attendee Components

| Old Location | New Location | Notes |
|-------------|-------------|-------|
| `components/AttendeeDashboard.tsx` | Wrapped by `pages/attendee/DashboardPage.tsx` | Main attendee view |
| `components/AttendeeEventHub.tsx` | Wrapped by `pages/attendee/EventHubPage.tsx` | Event browsing |
| `components/NavigationRouting.tsx` | Wrapped by `pages/attendee/NavigationPage.tsx` | Indoor navigation |
| `components/MyTickets.tsx` | Wrapped by `pages/attendee/TicketsPage.tsx` | Ticket management |
| `components/FindAndHelpSystem.tsx` | Used in `pages/attendee/HelpPage.tsx` | Help features |
| `components/MedicalAssistanceSystem.tsx` | Used in `pages/attendee/HelpPage.tsx` | Medical help |
| `components/FAQChatbot.tsx` | Used in `pages/attendee/HelpPage.tsx` | FAQ support |
| `components/EmergencyExitRoute.tsx` | Used in `pages/attendee/EmergencyPage.tsx` | Emergency routes |
| `components/SmartSafetyMapSystem.tsx` | Used in `pages/attendee/EmergencyPage.tsx` | Safety map |
| `components/AlertsIncidentCenter.tsx` | Used in `pages/attendee/EmergencyPage.tsx` | Alerts |

### Organizer Components

| Old Location | New Location | Notes |
|-------------|-------------|-------|
| `components/OrganizerHome.tsx` | Wrapped by `pages/organizer/HomePage.tsx` | Event list view |
| `components/EventDashboard.tsx` | Wrapped by `pages/organizer/EventDashboardPage.tsx` | Event overview |
| `components/EventCommandCenter.tsx` | Wrapped by `pages/organizer/EventCommandCenterPage.tsx` | Command center |
| `components/OperationsCommandCenter.tsx` | Wrapped by `pages/organizer/OperationsPage.tsx` | Operations |
| `components/AnalyticsSetupView.tsx` | Wrapped by `pages/organizer/AnalyticsPage.tsx` | Analytics |
| `components/AICommandCenter.tsx` | Wrapped by `pages/organizer/AICommandPage.tsx` | AI features |
| `components/CrowdIntelligencePage.tsx` | Wrapped by `pages/organizer/CrowdIntelligencePage.tsx` | Crowd monitoring |
| `components/DispatchCenterPage.tsx` | Wrapped by `pages/organizer/DispatchCenterPage.tsx` | Dispatch |
| `components/GateControlPage.tsx` | Wrapped by `pages/organizer/GateControlPage.tsx` | Gate control |
| `components/AutomationPolicyPage.tsx` | Wrapped by `pages/organizer/AutomationPolicyPage.tsx` | Automation |
| `components/PostEventAnalysisPage.tsx` | Wrapped by `pages/organizer/PostEventAnalysisPage.tsx` | Post-event |

### Common Components

| Old Location | New Location | Notes |
|-------------|-------------|-------|
| `components/LandingPage.tsx` | `pages/common/LandingPage.tsx` | New implementation |
| `components/Login.tsx` | `pages/common/LoginPage.tsx` | New with routing |
| N/A | `pages/common/NotFoundPage.tsx` | New 404 page |

## 🔄 How to Migrate Your Code

### Step 1: Update Imports in Your Components

#### Before (Old Structure)
```tsx
import { AttendeeDashboard } from './components/AttendeeDashboard';
import { EventHub } from './components/EventHub';
```

#### After (New Structure)
```tsx
// In page components
import { AttendeeDashboard } from '../../components/AttendeeDashboard';

// Or use the page wrapper
import DashboardPage from './pages/attendee/DashboardPage';
```

### Step 2: Update Navigation Logic

#### Before (State-Based)
```tsx
const [view, setView] = useState('dashboard');

// Conditional rendering
{view === 'dashboard' && <AttendeeDashboard />}
{view === 'events' && <EventHub />}

// Navigation
<button onClick={() => setView('dashboard')}>Dashboard</button>
```

#### After (URL-Based)
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigation
<button onClick={() => navigate('/attendee/dashboard')}>
  Dashboard
</button>

// Or use Link
<Link to="/attendee/dashboard">Dashboard</Link>
```

### Step 3: Handle Route Parameters

#### Before (Props)
```tsx
function EventDashboard({ eventId }: { eventId: string }) {
  // Use eventId
}

// Usage
<EventDashboard eventId="123" />
```

#### After (URL Params)
```tsx
import { useParams } from 'react-router-dom';

function EventDashboardPage() {
  const { eventId } = useParams();
  // Use eventId
  
  return <EventDashboard eventId={eventId || ''} />;
}

// Navigation
navigate(`/organizer/event/${eventId}/dashboard`);
```

### Step 4: Update State Management

#### Before (Prop Drilling)
```tsx
// Parent
const [data, setData] = useState();

// Pass through multiple levels
<Component1 data={data}>
  <Component2 data={data}>
    <Component3 data={data} />
  </Component2>
</Component1>
```

#### After (Context/URL State)
```tsx
// For global state
import { useContext } from 'react';
import { DataContext } from './contexts/DataContext';

function MyComponent() {
  const { data } = useContext(DataContext);
}

// For navigation state
const navigate = useNavigate();
navigate('/path', { state: { data } });

// In destination
const location = useLocation();
const data = location.state?.data;
```

## 🛠️ Common Migration Patterns

### Pattern 1: Converting State View to Routes

#### Before
```tsx
function App() {
  const [currentView, setCurrentView] = useState('home');
  
  return (
    <div>
      {currentView === 'home' && <HomePage />}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'settings' && <Settings />}
    </div>
  );
}
```

#### After
```tsx
// In routes/index.tsx
{
  path: '/',
  children: [
    { index: true, element: <HomePage /> },
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'settings', element: <Settings /> },
  ]
}

// Navigation
<Link to="/dashboard">Dashboard</Link>
```

### Pattern 2: Converting Modal Views to Routes

#### Before
```tsx
const [showModal, setShowModal] = useState(false);

<button onClick={() => setShowModal(true)}>Open</button>
{showModal && <Modal onClose={() => setShowModal(false)} />}
```

#### After (Option 1: Keep as Modal)
```tsx
// Same as before - modals don't need routes
```

#### After (Option 2: Full Page)
```tsx
// Add route
{ path: 'details/:id', element: <DetailsPage /> }

// Navigate
<button onClick={() => navigate(`/details/${id}`)}>
  View Details
</button>
```

### Pattern 3: Converting Tabs to Routes

#### Before
```tsx
const [activeTab, setActiveTab] = useState('overview');

<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab value="overview">Overview</Tab>
  <Tab value="analytics">Analytics</Tab>
</Tabs>

{activeTab === 'overview' && <Overview />}
{activeTab === 'analytics' && <Analytics />}
```

#### After
```tsx
// Nested routes
{
  path: 'event/:id',
  children: [
    { index: true, element: <Navigate to="overview" /> },
    { path: 'overview', element: <Overview /> },
    { path: 'analytics', element: <Analytics /> },
  ]
}

// Navigation
<Link to="overview">Overview</Link>
<Link to="analytics">Analytics</Link>
```

## 🎯 Migration Checklist

### For Each Component:

- [ ] Identify if it's a page or reusable component
- [ ] Move to appropriate folder (`pages/` or `components/`)
- [ ] Update imports in all files
- [ ] Add route configuration if it's a page
- [ ] Update navigation to use React Router
- [ ] Replace state-based views with routes
- [ ] Test navigation and routing
- [ ] Update any affected tests

### For the Application:

- [ ] ✅ Install react-router-dom
- [ ] ✅ Create route configuration
- [ ] ✅ Create layout components
- [ ] ✅ Create page wrappers
- [ ] ✅ Update main.tsx
- [ ] Update authentication logic
- [ ] Add route guards
- [ ] Update error handling
- [ ] Update tests
- [ ] Update documentation

## 🚨 Common Pitfalls

### ❌ Pitfall 1: Incorrect Import Paths
```tsx
// Wrong - relative path issues
import { Component } from '../../../components/Component';

// Right - use clear paths
import { Component } from '@/components/Component';
```

**Solution**: Use path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ❌ Pitfall 2: Forgetting to Update Navigation
```tsx
// Wrong - still using state
setCurrentView('dashboard');

// Right - use router
navigate('/dashboard');
```

### ❌ Pitfall 3: Not Handling Route Params
```tsx
// Wrong - assuming eventId exists
function Page() {
  const { eventId } = useParams();
  return <div>{eventId.toUpperCase()}</div>; // Error if undefined!
}

// Right - handle undefined
function Page() {
  const { eventId } = useParams();
  
  if (!eventId) {
    return <div>No event selected</div>;
  }
  
  return <div>{eventId.toUpperCase()}</div>;
}
```

### ❌ Pitfall 4: Breaking Back Button
```tsx
// Wrong - replaces history
navigate('/dashboard', { replace: true });

// Right - adds to history (default)
navigate('/dashboard');
```

## 🔍 Testing After Migration

### Manual Testing Checklist:
1. ✅ Navigate to landing page
2. ✅ Test login flow
3. ✅ Navigate through all attendee routes
4. ✅ Navigate through all organizer routes
5. ✅ Test browser back/forward buttons
6. ✅ Test direct URL access
7. ✅ Test 404 page
8. ✅ Test deep linking
9. ✅ Test logout flow

### Automated Testing:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

test('renders dashboard page', () => {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/attendee/dashboard'],
  });
  
  render(<RouterProvider router={router} />);
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## 📞 Need Help?

If you encounter issues during migration:

1. **Check the documentation**: See `STRUCTURE_DOCUMENTATION.md`
2. **Look at examples**: Reference existing page components
3. **Review React Router docs**: https://reactrouter.com/
4. **Ask the team**: Create an issue or discussion

## 🎉 Benefits After Migration

### Developer Experience:
✅ Clear file organization  
✅ Better code navigation  
✅ Easier to find components  
✅ Consistent patterns  
✅ Scalable structure  

### User Experience:
✅ Working back button  
✅ Bookmarkable URLs  
✅ Shareable links  
✅ Better performance (code splitting)  
✅ Faster page loads  

### Maintenance:
✅ Easier onboarding  
✅ Better separation of concerns  
✅ Simpler testing  
✅ Reduced coupling  
✅ Clear dependencies  

---

**Happy Migrating! 🚀**
