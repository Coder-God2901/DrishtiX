# DrishtiX Frontend - Developer Quick Reference 🚀

> **Last Updated:** January 2, 2026  
> **Status:** ✅ Production Ready

---

## 📁 Where to Find Components

### **Creating Organizer Features?**
→ Add components to [`src/components/organizer/`](src/components/organizer/)  
→ Examples: Event management, analytics, operations, monitoring

### **Creating Attendee Features?**
→ Add components to [`src/components/attendee/`](src/components/attendee/)  
→ Examples: Navigation, tickets, help systems, safety

### **Creating Shared Features?**
→ Add components to [`src/components/shared/`](src/components/shared/)  
→ Examples: Login, maps, chatbot, notifications, common UI

### **Need UI Components?**
→ Use from [`src/components/ui/`](src/components/ui/)  
→ Shadcn UI library with 46+ accessible components

---

## 🎯 Import Cheat Sheet

### **From Pages or External Files:**
```typescript
// ✅ Recommended: Import from index
import { 
  OrganizerHome, 
  EventDashboard 
} from '@/components/organizer';

import { 
  AttendeeDashboard, 
  MyTickets 
} from '@/components/attendee';

import { 
  Login, 
  IndianMap, 
  FAQChatbot 
} from '@/components/shared';

import { 
  Button, 
  Card, 
  Dialog 
} from '@/components/ui';
```

### **Within Component Folders:**
```typescript
// Same folder (organizer → organizer)
import { EventHub } from './EventHub';

// Cross-folder (organizer → shared)
import { IncidentDrawer } from '../shared/IncidentDrawer';
import { LeafletMap } from '../shared/LeafletMap';

// Cross-folder (attendee → shared)
import { Login } from '../shared/Login';
import { MetricCard } from '../shared/MetricCard';

// Services (from any component folder)
import { useIncidents } from '../../services/incidentContext';
import { mockBackend } from '../../services/mockBackend';
```

---

## 🛠️ Common Tasks

### **1. Add a New Organizer Component**
```bash
# 1. Create file
touch src/components/organizer/MyNewComponent.tsx

# 2. Add export to index
# Edit src/components/organizer/index.ts
export { MyNewComponent } from './MyNewComponent';

# 3. Use it
import { MyNewComponent } from '@/components/organizer';
```

### **2. Add a New Attendee Component**
```bash
# 1. Create file
touch src/components/attendee/MyNewComponent.tsx

# 2. Add export to index
# Edit src/components/attendee/index.ts
export { MyNewComponent } from './MyNewComponent';

# 3. Use it
import { MyNewComponent } from '@/components/attendee';
```

### **3. Add a New Shared Component**
```bash
# 1. Create file
touch src/components/shared/MyNewComponent.tsx

# 2. Add export to index
# Edit src/components/shared/index.ts
export { MyNewComponent } from './MyNewComponent';

# 3. Use it from anywhere
import { MyNewComponent } from '@/components/shared';
```

### **4. Add a New Page**
```bash
# Organizer page
touch src/pages/organizer/MyPage.tsx

# Attendee page
touch src/pages/attendee/MyPage.tsx

# Common page
touch src/pages/common/MyPage.tsx

# Add route in src/routes/index.tsx
```

---

## 🔍 Component Lookup

### **Organizer Components (40)**
<details>
<summary>Click to expand full list</summary>

**Event Management:**
- EventHub, EventDashboard, EventCommandCenter
- EventCreationForm, EventCRUDManager, EventDetails
- EventInformation, EventOverview, EventSidebar
- EventTypeSelection, EventWorkflowView
- MyEventsView, OrganizerHome

**Live Operations:**
- OperationsCommandCenter, LiveMonitoring
- LiveHeatmapView, HeatmapCrowdDensity
- DigitalTwinLive, DigitalTwinSetup
- GoLiveView, LaunchLivePage

**Safety & Incidents:**
- AlertsIncidentCenter, DispatchCenterPage
- GateControlPage, AutomationPolicyPage

**Analytics & AI:**
- AICommandCenter, CrowdIntelligencePage
- AnalyticsSetupView, PostEventAnalysisPage
- DrishtiXAIPlatform

**Venue & Teams:**
- VenueMapperView, VenueDataPipeline
- SchedulePage, ScheduleTeamsView
- VolunteerManagement, VolunteerManagementPage
- VolunteerRequestBuilder

**Data Management:**
- MasterDataHub, ManagementToolsView
- OrganizerCRUDPanel

</details>

### **Attendee Components (18)**
<details>
<summary>Click to expand full list</summary>

**Dashboard & Events:**
- AttendeeDashboard, AttendeeEventHub
- EventBrowse, EventDetail
- MyTickets, TicketPurchase
- AchievementSection

**Navigation:**
- NavigationMap, NavigationRouting
- IndoorNavigationMap, NavigateInsideVenue
- GateSelection, VenueMapView
- AccessibleNavigationSystem, AccessibleNavigationMap

**Safety & Help:**
- EmergencyExitRoute, FindAndHelpSystem
- MedicalAssistanceSystem

</details>

### **Shared Components (13)**
<details>
<summary>Click to expand full list</summary>

**Auth & UI:**
- Login, FeatureCard, MetricCard, ModuleCard

**Maps:**
- IndianMap, LeafletMap, MapSection, MapDebugTest

**Safety & Intelligence:**
- DrishtiXIntelligenceLayer, SmartSafetyMapSystem
- IncidentDrawer

**Communication:**
- FAQChatbot, RealTimeNotifications

</details>

---

## 📝 Common Code Patterns

### **Component Template**
```typescript
import React from 'react';
import { Button, Card } from '@/components/ui';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </Card>
  );
}
```

### **Using Shared Services**
```typescript
import { useIncidents } from '../../services/incidentContext';
import { mockBackend } from '../../services/mockBackend';

function MyComponent() {
  const { incidents, addIncident } = useIncidents();
  const events = mockBackend.getEvents();
  
  // Your logic here
}
```

### **Cross-Component Communication**
```typescript
// In organizer component, use shared incident drawer
import { IncidentDrawer } from '../shared/IncidentDrawer';

function MyOrganizerComponent() {
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  return (
    <>
      {/* Your content */}
      <IncidentDrawer 
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </>
  );
}
```

---

## 🎨 Styling Guidelines

### **Use Tailwind CSS**
```typescript
<div className="flex items-center justify-between p-4 bg-slate-900">
  <h1 className="text-2xl font-bold text-white">Title</h1>
</div>
```

### **Use UI Components**
```typescript
import { Button } from '@/components/ui';

<Button variant="default" size="lg">
  Click Me
</Button>
```

### **Component Class Names**
- Use semantic class names
- Follow BEM or Tailwind patterns
- Keep styles consistent with design system

---

## 🧪 Testing

### **Run Tests**
```bash
pnpm test
```

### **Type Check**
```bash
pnpm type-check
```

### **Lint**
```bash
pnpm lint
```

### **Build**
```bash
pnpm build
```

---

## 🐛 Debugging Tips

### **Component Not Found?**
1. Check if it's exported in the folder's `index.ts`
2. Verify import path is correct
3. Check if component file exists in the right folder

### **Import Error?**
1. Use `@/components/` alias for absolute imports
2. From within components, use relative paths
3. Services always need `../../services/`

### **Build Failing?**
1. Run `pnpm type-check` to see TypeScript errors
2. Check for circular dependencies
3. Verify all imports are correct

---

## 📚 Additional Resources

- [Main Documentation](FRONTEND_RESTRUCTURE_COMPLETE.md)
- [Visual Structure](STRUCTURE_VISUAL.md)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Shadcn UI Docs](https://ui.shadcn.com/)

---

## 🚀 Quick Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build

# Quality
pnpm type-check   # TypeScript checking
pnpm lint         # ESLint
pnpm format       # Prettier (if configured)

# Testing
pnpm test         # Run tests
pnpm test:watch   # Watch mode
```

---

## 💡 Pro Tips

1. **Always use index exports** for cleaner imports
2. **Keep components small and focused** (< 300 lines)
3. **Extract shared logic to hooks** in `src/hooks/`
4. **Use TypeScript** for all new components
5. **Follow existing patterns** in the codebase
6. **Document complex logic** with comments
7. **Test your changes** before committing

---

**Happy Coding! 🎉**
