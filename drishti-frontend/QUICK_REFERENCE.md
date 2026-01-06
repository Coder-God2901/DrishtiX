# Quick Reference - DrishtiX Frontend Structure

## 🗂️ Folder Structure at a Glance

```
src/
├── pages/           → Full page views (routes)
│   ├── attendee/    → Attendee pages
│   ├── organizer/   → Organizer pages  
│   └── common/      → Shared pages
├── components/      → Reusable UI components
│   ├── attendee/    → Attendee components
│   ├── organizer/   → Organizer components
│   ├── shared/      → Shared components
│   └── ui/          → Base UI components
├── layouts/         → Layout wrappers
├── routes/          → Router config
├── services/        → API & business logic
├── hooks/           → Custom React hooks
├── utils/           → Helper functions
└── types/           → TypeScript types
```

## 🚀 Quick Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm type-check
```

## 🔗 Route Reference

### Attendee Routes
```
/attendee/dashboard           → Main dashboard
/attendee/events              → Browse events  
/attendee/navigation          → Indoor navigation
/attendee/tickets             → My tickets
/attendee/help                → Help & support
/attendee/emergency           → Emergency services
```

### Organizer Routes
```
/organizer/home                                    → Event list
/organizer/event/:id/dashboard                     → Event overview
/organizer/event/:id/command-center                → Command center
/organizer/event/:id/operations                    → Operations
/organizer/event/:id/analytics                     → Analytics
/organizer/event/:id/ai-command                    → AI automation
/organizer/event/:id/crowd-intelligence            → Crowd monitoring
/organizer/event/:id/dispatch                      → Dispatch center
/organizer/event/:id/gate-control                  → Gate control
/organizer/event/:id/automation                    → Automation
/organizer/event/:id/post-event                    → Post-event analysis
```

## 🎯 Common Code Snippets

### Navigation
```tsx
import { useNavigate, Link } from 'react-router-dom';

// Programmatic
const navigate = useNavigate();
navigate('/attendee/dashboard');

// Declarative
<Link to="/attendee/events">Events</Link>
```

### Get Route Params
```tsx
import { useParams } from 'react-router-dom';

const { eventId } = useParams();
```

### Get Location
```tsx
import { useLocation } from 'react-router-dom';

const location = useLocation();
const currentPath = location.pathname;
```

### Create New Page
```tsx
// 1. Create page: src/pages/attendee/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}

// 2. Add route: src/routes/index.tsx
{
  path: 'new-page',
  element: <NewPage />,
}

// 3. Add nav: src/layouts/AttendeeLayout.tsx
{ 
  name: 'New Page', 
  path: '/attendee/new-page', 
  icon: Star 
}
```

## 📁 When to Use Each Folder

| Folder | Use For | Example |
|--------|---------|---------|
| `pages/` | Route-level views | `DashboardPage.tsx` |
| `components/attendee/` | Attendee-only UI | `TicketCard.tsx` |
| `components/organizer/` | Organizer-only UI | `EventMetrics.tsx` |
| `components/shared/` | Shared UI | `MapComponent.tsx` |
| `components/ui/` | Base components | `Button.tsx`, `Card.tsx` |
| `layouts/` | Page wrappers | `AttendeeLayout.tsx` |
| `services/` | API calls | `eventService.ts` |
| `hooks/` | Custom hooks | `useAuth.ts` |
| `utils/` | Helper functions | `formatDate.ts` |
| `types/` | TypeScript types | `Event.ts` |

## 🎨 Component Patterns

### Page Component
```tsx
// src/pages/attendee/DashboardPage.tsx
import { SomeComponent } from '../../components/attendee/SomeComponent';

export default function DashboardPage() {
  // Page logic here
  return (
    <div>
      <SomeComponent />
    </div>
  );
}
```

### Layout Component
```tsx
// src/layouts/AttendeeLayout.tsx
import { Outlet } from 'react-router-dom';

export default function AttendeeLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}
```

### Reusable Component
```tsx
// src/components/shared/EventCard.tsx
interface EventCardProps {
  title: string;
  date: string;
}

export function EventCard({ title, date }: EventCardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{date}</p>
    </div>
  );
}
```

## 🔒 Authentication Pattern

```tsx
// Protect a route
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Use in routes
{
  path: 'dashboard',
  element: (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
}
```

## 🎭 Role-Based Routing

```tsx
// Check user role
import { useAuth } from '../hooks/useAuth';

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

// Use in routes
{
  path: 'organizer',
  element: (
    <RoleRoute allowedRoles={['organizer', 'admin']}>
      <OrganizerLayout />
    </RoleRoute>
  ),
}
```

## 📊 State Management Quick Ref

### Local State (Component)
```tsx
const [value, setValue] = useState('');
```

### URL State (Navigation)
```tsx
// Pass state
navigate('/path', { state: { data } });

// Receive state  
const location = useLocation();
const data = location.state?.data;
```

### Context (Global)
```tsx
// Create context
const MyContext = createContext();

// Provider
<MyContext.Provider value={data}>
  {children}
</MyContext.Provider>

// Consumer
const data = useContext(MyContext);
```

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property of undefined"
```tsx
// ❌ Bad
const { eventId } = useParams();
console.log(eventId.toUpperCase()); // Error!

// ✅ Good
const { eventId } = useParams();
if (eventId) {
  console.log(eventId.toUpperCase());
}
```

### Issue: "Module not found"
```tsx
// ❌ Bad
import Component from '../../../../../components/Component';

// ✅ Good - use absolute imports
import Component from '@/components/Component';
```

### Issue: "Route not working"
```tsx
// ❌ Bad - missing leading slash
navigate('attendee/dashboard');

// ✅ Good
navigate('/attendee/dashboard');
```

## 📦 Import Shortcuts

```tsx
// React Router
import { 
  useNavigate,    // Navigate programmatically
  useParams,      // Get URL params
  useLocation,    // Get current location
  Link,           // Declarative navigation
  Navigate,       // Redirect component
  Outlet,         // Render child routes
} from 'react-router-dom';

// Icons
import { 
  Home, 
  Calendar, 
  Users 
} from 'lucide-react';
```

## 🎨 Styling Quick Ref

```tsx
// Tailwind classes
className="
  bg-slate-900          // Background
  text-white            // Text color
  rounded-lg            // Border radius
  p-4                   // Padding
  hover:bg-slate-800    // Hover state
  transition-colors     // Smooth transition
"

// Gradients
className="bg-gradient-to-r from-blue-400 to-violet-400"

// Glass effect
className="bg-slate-900/50 backdrop-blur-xl"
```

## 🔧 VSCode Shortcuts

- `Ctrl+P` - Quick file open
- `Ctrl+Shift+F` - Search in files
- `F2` - Rename symbol
- `Ctrl+Click` - Go to definition
- `Alt+Up/Down` - Move line up/down

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point |
| `src/routes/index.tsx` | All routes |
| `src/layouts/RootLayout.tsx` | Global providers |
| `src/layouts/AttendeeLayout.tsx` | Attendee navigation |
| `src/layouts/OrganizerLayout.tsx` | Organizer navigation |

## 🎯 Development Workflow

1. **Start dev server**: `pnpm dev`
2. **Create branch**: `git checkout -b feature/new-feature`
3. **Make changes**: Edit files
4. **Test locally**: Check browser
5. **Commit**: `git commit -m "feat: add new feature"`
6. **Push**: `git push origin feature/new-feature`
7. **Create PR**: Open pull request

## ⚡ Performance Tips

- ✅ Use lazy loading for routes
- ✅ Memoize expensive computations
- ✅ Avoid inline functions in render
- ✅ Use React DevTools Profiler
- ✅ Optimize images
- ✅ Code split large components

## 📞 Getting Help

- 📖 Full docs: `STRUCTURE_DOCUMENTATION.md`
- 🔄 Migration: `MIGRATION_GUIDE.md`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**Last Updated**: January 2, 2026
