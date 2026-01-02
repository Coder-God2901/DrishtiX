# DrishtiX Frontend - Visual Structure

```
📁 drishti-frontend/
│
├── 📁 src/
│   │
│   ├── 📁 components/  ⭐ MAIN COMPONENTS DIRECTORY
│   │   │
│   │   ├── 📁 organizer/  [40 components] 👥 Event Management
│   │   │   ├── AICommandCenter.tsx
│   │   │   ├── AlertsIncidentCenter.tsx
│   │   │   ├── AnalyticsSetupView.tsx
│   │   │   ├── AutomationPolicyPage.tsx
│   │   │   ├── CrowdIntelligencePage.tsx
│   │   │   ├── DigitalTwinLive.tsx
│   │   │   ├── DigitalTwinSetup.tsx
│   │   │   ├── DispatchCenterPage.tsx
│   │   │   ├── DrishtiXAIPlatform.tsx
│   │   │   ├── EventCommandCenter.tsx
│   │   │   ├── EventCreationForm.tsx
│   │   │   ├── EventCRUDManager.tsx
│   │   │   ├── EventDashboard.tsx
│   │   │   ├── EventDetails.tsx
│   │   │   ├── EventHub.tsx
│   │   │   ├── EventInformation.tsx
│   │   │   ├── EventOverview.tsx
│   │   │   ├── EventSidebar.tsx
│   │   │   ├── EventTypeSelection.tsx
│   │   │   ├── EventWorkflowView.tsx
│   │   │   ├── GateControlPage.tsx
│   │   │   ├── GoLiveView.tsx
│   │   │   ├── HeatmapCrowdDensity.tsx
│   │   │   ├── LaunchLivePage.tsx
│   │   │   ├── LiveHeatmapView.tsx
│   │   │   ├── LiveMonitoring.tsx
│   │   │   ├── ManagementToolsView.tsx
│   │   │   ├── MasterDataHub.tsx
│   │   │   ├── MyEventsView.tsx
│   │   │   ├── OperationsCommandCenter.tsx
│   │   │   ├── OrganizerCRUDPanel.tsx
│   │   │   ├── OrganizerHome.tsx
│   │   │   ├── PostEventAnalysisPage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   ├── ScheduleTeamsView.tsx
│   │   │   ├── VenueDataPipeline.tsx
│   │   │   ├── VenueMapperView.tsx
│   │   │   ├── VolunteerManagement.tsx
│   │   │   ├── VolunteerManagementPage.tsx
│   │   │   ├── VolunteerRequestBuilder.tsx
│   │   │   └── index.ts  📦 Exports
│   │   │
│   │   ├── 📁 attendee/  [18 components] 🎫 Tickets & Navigation
│   │   │   ├── AccessibleNavigationMap.tsx
│   │   │   ├── AccessibleNavigationSystem.tsx
│   │   │   ├── AchievementSection.tsx
│   │   │   ├── AttendeeDashboard.tsx
│   │   │   ├── AttendeeEventHub.tsx
│   │   │   ├── EmergencyExitRoute.tsx
│   │   │   ├── EventBrowse.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── FindAndHelpSystem.tsx
│   │   │   ├── GateSelection.tsx
│   │   │   ├── IndoorNavigationMap.tsx
│   │   │   ├── MedicalAssistanceSystem.tsx
│   │   │   ├── MyTickets.tsx
│   │   │   ├── NavigateInsideVenue.tsx
│   │   │   ├── NavigationMap.tsx
│   │   │   ├── NavigationRouting.tsx
│   │   │   ├── TicketPurchase.tsx
│   │   │   ├── VenueMapView.tsx
│   │   │   └── index.ts  📦 Exports
│   │   │
│   │   ├── 📁 shared/  [13 components] 🔗 Common Components
│   │   │   ├── DrishtiXIntelligenceLayer.tsx
│   │   │   ├── FAQChatbot.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── IncidentDrawer.tsx
│   │   │   ├── IndianMap.tsx
│   │   │   ├── LeafletMap.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MapDebugTest.tsx
│   │   │   ├── MapSection.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── RealTimeNotifications.tsx
│   │   │   ├── SmartSafetyMapSystem.tsx
│   │   │   └── index.ts  📦 Exports
│   │   │
│   │   ├── 📁 ui/  [46 components] 🎨 Shadcn UI Library
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── ... (41 more UI components)
│   │   │   └── utils.ts
│   │   │
│   │   ├── index.ts  📦 Master Export Hub
│   │   ├── LandingPage.tsx  🏠 Root Landing
│   │   └── LandingPage_old.tsx  📜 Legacy
│   │
│   ├── 📁 pages/  🌐 Page Components
│   │   │
│   │   ├── 📁 organizer/  [11 pages]
│   │   │   ├── HomePage.tsx
│   │   │   ├── EventDashboardPage.tsx
│   │   │   ├── EventCommandCenterPage.tsx
│   │   │   ├── OperationsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── AICommandPage.tsx
│   │   │   ├── CrowdIntelligencePage.tsx
│   │   │   ├── DispatchCenterPage.tsx
│   │   │   ├── GateControlPage.tsx
│   │   │   ├── AutomationPolicyPage.tsx
│   │   │   └── PostEventAnalysisPage.tsx
│   │   │
│   │   ├── 📁 attendee/  [6 pages]
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EventHubPage.tsx
│   │   │   ├── NavigationPage.tsx
│   │   │   ├── TicketsPage.tsx
│   │   │   ├── HelpPage.tsx
│   │   │   └── EmergencyPage.tsx
│   │   │
│   │   ├── 📁 common/  [3 pages]
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   └── index.ts  📦 Page Exports
│   │
│   ├── 📁 routes/
│   │   └── index.tsx  🗺️ React Router Config
│   │
│   ├── 📁 services/  🔧 Business Logic
│   │   ├── incidentContext.tsx
│   │   ├── incidentManagementService.ts
│   │   └── mockBackend.ts
│   │
│   ├── 📁 hooks/  🪝 Custom Hooks
│   ├── 📁 utils/  🛠️ Utilities
│   ├── 📁 types/  📝 TypeScript Types
│   ├── 📁 layouts/  📐 Layout Components
│   ├── 📁 styles/  🎨 Global Styles
│   │
│   ├── App.tsx  🚀 Main App
│   ├── main.tsx  🏁 Entry Point
│   └── index.css  🎨 Global CSS
│
├── 📁 public/  🌍 Static Assets
├── 📁 build/  📦 Production Build
│
├── package.json  📋 Dependencies
├── vite.config.ts  ⚙️ Vite Config
├── tsconfig.json  ⚙️ TypeScript Config
└── README.md  📖 Documentation
```

---

## 🎯 Quick Navigation

### **Import from Components:**
```typescript
// Organizer Components
import { 
  OrganizerHome, 
  EventDashboard, 
  AICommandCenter 
} from '@/components/organizer';

// Attendee Components
import { 
  AttendeeDashboard, 
  MyTickets, 
  NavigationMap 
} from '@/components/attendee';

// Shared Components
import { 
  Login, 
  FAQChatbot, 
  MetricCard, 
  IndianMap 
} from '@/components/shared';

// UI Components
import { 
  Button, 
  Card, 
  Dialog 
} from '@/components/ui';
```

---

## 📊 Component Distribution

```
╔═══════════════════════════════════════════════════════════╗
║                 COMPONENT BREAKDOWN                        ║
╠═══════════════════════════════════════════════════════════╣
║  👥 Organizer Components        40 (33.6%)                ║
║  🎫 Attendee Components         18 (15.1%)                ║
║  🔗 Shared Components            13 (10.9%)                ║
║  🎨 UI Library Components        46 (38.7%)                ║
║  🏠 Root Components               2 (1.7%)                 ║
║                                 ───────                    ║
║  📦 Total                       119 Components             ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ Status Checklist

- [x] All components categorized and moved
- [x] Index files created for clean exports
- [x] Import paths updated across all files
- [x] Service imports fixed (../../services/)
- [x] Cross-folder imports working (../shared/, etc.)
- [x] Build successful (0 errors)
- [x] Production bundle optimized
- [x] Documentation complete

---

**🎉 Frontend is now fully structured and ready for production!**
