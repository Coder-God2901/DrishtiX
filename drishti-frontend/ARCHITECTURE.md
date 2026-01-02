# DrishtiX Frontend Architecture

## 📐 Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser URL Bar                          │
│                  https://drishti.com/attendee/dashboard          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Router (routes/index.tsx)               │
│                   - Matches URL to Routes                        │
│                   - Lazy loads components                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RootLayout (Global)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • IncidentProvider (Global State)                       │   │
│  │  • Theme Provider                                        │   │
│  │  • Error Boundaries                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌───────────────────────┐   ┌───────────────────────┐
│   AttendeeLayout      │   │   OrganizerLayout     │
│   ┌───────────────┐   │   │   ┌───────────────┐   │
│   │   Sidebar     │   │   │   │   Sidebar     │   │
│   │   ┌────────┐  │   │   │   │   ┌────────┐  │   │
│   │   │ Home   │  │   │   │   │   │ Home   │  │   │
│   │   │ Events │  │   │   │   │   │ Events │  │   │
│   │   │ Nav    │  │   │   │   │   │ Ops    │  │   │
│   │   │ Help   │  │   │   │   │   │ AI     │  │   │
│   │   └────────┘  │   │   │   │   └────────┘  │   │
│   └───────────────┘   │   │   └───────────────┘   │
│                       │   │                       │
│   ┌───────────────┐   │   │   ┌───────────────┐   │
│   │     Outlet    │   │   │   │     Outlet    │   │
│   │  (Page Area)  │   │   │   │  (Page Area)  │   │
│   └───────────────┘   │   │   └───────────────┘   │
└───────────────────────┘   └───────────────────────┘
            │                         │
            ▼                         ▼
┌───────────────────────┐   ┌───────────────────────┐
│   Attendee Pages      │   │   Organizer Pages     │
│   • Dashboard         │   │   • Home              │
│   • Events            │   │   • Event Dashboard   │
│   • Navigation        │   │   • Command Center    │
│   • Tickets           │   │   • Operations        │
│   • Help              │   │   • Analytics         │
│   • Emergency         │   │   • AI Command        │
└───────────────────────┘   └───────────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Shared Components                           │
│  • Maps              • Charts           • Modals                 │
│  • Cards             • Buttons          • Forms                  │
│  • Tables            • Alerts           • Icons                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

```
┌──────────────┐
│   Browser    │
│   URL/State  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│   React Router       │
│   • Route Matching   │
│   • Lazy Loading     │
│   • Navigation       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│              Layouts                      │
│  ┌────────────────────────────────┐      │
│  │   Global Providers             │      │
│  │   • Auth Context               │      │
│  │   • Incident Context           │      │
│  │   • Theme Context              │      │
│  └────────────────────────────────┘      │
│                                           │
│  ┌────────────────────────────────┐      │
│  │   Navigation UI                │      │
│  │   • Sidebar                    │      │
│  │   • Header                     │      │
│  │   • Footer                     │      │
│  └────────────────────────────────┘      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│      Pages           │
│  • Route handlers    │
│  • State management  │
│  • API calls         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐         ┌──────────────────┐
│    Components        │◄────────┤    Services      │
│  • UI elements       │         │  • API calls     │
│  • Business logic    │         │  • Data fetching │
│  • Interactions      │         │  • Business logic│
└──────────────────────┘         └──────────────────┘
```

## 🗺️ Route Tree

```
/ (Landing)
│
├── /login (Login Page)
│   ├── Select: Attendee
│   └── Select: Organizer
│
├── /attendee/* (AttendeeLayout)
│   ├── /dashboard        → Main view
│   ├── /events           → Browse events
│   ├── /navigation       → Indoor nav
│   ├── /tickets          → My tickets
│   ├── /help             → Support
│   └── /emergency        → Emergency
│
└── /organizer/* (OrganizerLayout)
    ├── /home             → Event list
    └── /event/:id/*      → Event management
        ├── /dashboard               → Overview
        ├── /command-center          → Control center
        ├── /operations              → Team ops
        ├── /analytics               → Data insights
        ├── /ai-command              → AI features
        ├── /crowd-intelligence      → Crowd data
        ├── /dispatch                → Dispatch
        ├── /gate-control            → Access control
        ├── /automation              → Policies
        └── /post-event              → Reports
```

## 🎯 Component Hierarchy

```
App (main.tsx)
└── RouterProvider
    └── RootLayout
        ├── IncidentProvider
        └── Outlet (Current Route)
            │
            ├── LandingPage (/)
            │
            ├── LoginPage (/login)
            │
            ├── AttendeeLayout (/attendee/*)
            │   ├── Sidebar
            │   │   ├── Logo
            │   │   ├── Navigation Menu
            │   │   └── Logout
            │   └── Outlet (Attendee Page)
            │       ├── DashboardPage
            │       │   ├── MetricCards
            │       │   ├── EventList
            │       │   └── QuickActions
            │       ├── EventHubPage
            │       │   ├── SearchBar
            │       │   ├── Filters
            │       │   └── EventGrid
            │       └── ... (other pages)
            │
            └── OrganizerLayout (/organizer/*)
                ├── Sidebar
                │   ├── Logo
                │   ├── Main Navigation
                │   ├── Event Navigation (if event selected)
                │   └── Logout
                └── Outlet (Organizer Page)
                    ├── HomePage
                    │   ├── EventList
                    │   ├── CreateButton
                    │   └── Stats
                    ├── EventDashboardPage
                    │   ├── Metrics
                    │   ├── Charts
                    │   └── QuickActions
                    └── ... (other pages)
```

## 🔐 Authentication Flow

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │ Click "Login"
       ▼
┌─────────────┐
│   Login     │
│    Page     │
│             │
│ ┌─────────┐ │
│ │Attendee │ │
│ └────┬────┘ │
│      │      │
│ ┌────┴────┐ │
│ │Organizer│ │
│ └────┬────┘ │
└──────┼──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Attendee   │   │  Organizer  │
│  Dashboard  │   │    Home     │
└─────────────┘   └─────────────┘
```

## 📦 Module Dependencies

```
┌────────────────────────────────────────────┐
│           External Dependencies            │
│  • react                                   │
│  • react-dom                               │
│  • react-router-dom                        │
│  • lucide-react (icons)                    │
│  • tailwindcss (styling)                   │
│  • leaflet (maps)                          │
└────────────────────────────────────────────┘
                     ▲
                     │
┌────────────────────┴───────────────────────┐
│              Core Application              │
│                                            │
│  routes/         layouts/      pages/      │
│  ├─ index.tsx   ├─ Root       ├─ attendee │
│                 ├─ Attendee   ├─ organizer│
│                 └─ Organizer  └─ common   │
└────────────────────┬───────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│           Feature Modules                  │
│                                            │
│  components/      services/     hooks/     │
│  ├─ attendee     ├─ api        ├─ useAuth │
│  ├─ organizer    ├─ events     ├─ useNav  │
│  ├─ shared       └─ incidents  └─ useMap  │
│  └─ ui                                     │
└────────────────────────────────────────────┘
```

## 🎨 Styling Architecture

```
┌────────────────────────────────────────┐
│        Global Styles (index.css)       │
│  • Tailwind base, components, utils   │
│  • Custom CSS variables               │
│  • Global resets                      │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│         Tailwind Configuration         │
│  • Theme customization                 │
│  • Custom colors                       │
│  • Responsive breakpoints             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│       Component-Level Styling          │
│  • Utility classes (Tailwind)         │
│  • Conditional classes (clsx)         │
│  • Component variants (CVA)           │
└────────────────────────────────────────┘
```

## 📱 Responsive Layout

```
Desktop (1024px+)
┌─────────────────────────────────────────┐
│  Sidebar  │        Main Content         │
│  (256px)  │                             │
│           │                             │
│  ├ Home   │  ┌───────────────────────┐  │
│  ├ Events │  │                       │  │
│  ├ Nav    │  │      Page Content     │  │
│  └ Help   │  │                       │  │
│           │  └───────────────────────┘  │
└─────────────────────────────────────────┘

Tablet (768px - 1023px)
┌─────────────────────────────────────────┐
│  Sidebar  │    Main Content             │
│  (80px)   │                             │
│           │                             │
│  ├ 🏠     │  ┌───────────────────────┐  │
│  ├ 📅     │  │                       │  │
│  ├ 🗺️     │  │    Page Content       │  │
│  └ ❓     │  │                       │  │
│           │  └───────────────────────┘  │
└─────────────────────────────────────────┘

Mobile (< 768px)
┌─────────────────────────────┐
│   ≡  DrishtiX          👤   │
├─────────────────────────────┤
│                             │
│                             │
│       Page Content          │
│                             │
│                             │
└─────────────────────────────┘
│         Bottom Nav          │
│   🏠   📅   🗺️   ❓        │
└─────────────────────────────┘
```

## 🚀 Performance Architecture

```
Initial Bundle (Main)
├── React Runtime
├── React Router
├── RootLayout
├── Common Components
└── Landing Page

Lazy Loaded Chunks
├── Attendee Bundle
│   ├── AttendeeLayout
│   ├── Attendee Pages
│   └── Attendee Components
│
└── Organizer Bundle
    ├── OrganizerLayout
    ├── Organizer Pages
    └── Organizer Components

Static Assets
├── Images
├── Fonts
└── Icons
```

## 🔄 State Management Layers

```
┌─────────────────────────────────────────┐
│           URL State (Router)            │
│  • Current route                        │
│  • URL parameters                       │
│  • Query strings                        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Context State (React)            │
│  • Authentication                       │
│  • Incidents                            │
│  • Theme                                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│       Component State (useState)        │
│  • Form inputs                          │
│  • UI toggles                           │
│  • Local data                           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Server State (API)               │
│  • Events data                          │
│  • User data                            │
│  • Analytics                            │
└─────────────────────────────────────────┘
```

---

**Created**: January 2, 2026  
**Version**: 2.0.0
