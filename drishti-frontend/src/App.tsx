import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Shield,
  Users,
  GitBranch,
  HelpCircle,
} from "lucide-react";
// Shared Components
import { MetricCard, MapSection, FeatureCard, ModuleCard, FAQChatbot, Login } from "./components/shared";
// Attendee Components
import { AchievementSection, AttendeeDashboard } from "./components/attendee";
// Organizer Components
import { EventHub, DetailView, OperationsCommandCenter, EventCommandCenter, VolunteerManagement, OrganizerHome } from "./components/organizer";
// Landing Page
import LandingPage from "./components/LandingPage";
import { IncidentProvider } from "./services/incidentContext";

type AppState = "landing" | "login" | "dashboard";

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [selectedUserType, setSelectedUserType] = useState<
    "organizer" | "attendee"
  >("organizer");
  const [isEventHubOpen, setIsEventHubOpen] = useState(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"organizer" | "attendee">(
    "organizer"
  );
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [eventHubInitialView, setEventHubInitialView] =
    useState<DetailView>("none");

  // New organizer-centric state similar to DrishtiX-clone
  const [organizerView, setOrganizerView] = useState<
    "home" | "event-dashboard"
  >("home");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialEventView, setInitialEventView] = useState<string>("dashboard");

  // Handle login navigation from landing page
  const handleLoginClick = (userType: "organizer" | "attendee") => {
    setSelectedUserType(userType);
    setAppState("login");
  };

  // Handle successful login
  const handleLoginSuccess = (userType: "organizer" | "attendee") => {
    setViewMode(userType);
    setAppState("dashboard");
    // Ensure organizer lands on MyEventsView after login
    if (userType === "organizer") {
      setOrganizerView("home");
      setSelectedEventId(null);
    }
  };

  // Show landing page
  if (appState === "landing") {
    return <LandingPage onLogin={handleLoginClick} />;
  }

  // Show login page
  if (appState === "login") {
    return (
      <Login
        userType={selectedUserType}
        onBack={() => setAppState("landing")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Show dashboard (existing code)
  if (viewMode === "attendee") {
    return (
      <IncidentProvider>
        <AttendeeDashboard
          onSwitchToOrganizer={() => setViewMode("organizer")}
          onLogout={() => {
            setAppState("landing");
            setViewMode("organizer");
          }}
        />

        {/* FAQ Floating Button */}
        <button
          onClick={() => setIsFAQOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center z-30 hover:scale-110"
          title="Help & Support"
        >
          <HelpCircle className="w-6 h-6" />
        </button>

        {/* FAQ Chatbot */}
        <FAQChatbot
          isOpen={isFAQOpen}
          onClose={() => setIsFAQOpen(false)}
          currentPage="attendee-dashboard"
        />
      </IncidentProvider>
    );
  }
  
  // Organizer-focused handlers
  const handleSelectEvent = (event: { id: string; status: string }) => {
    setSelectedEventId(event.id);
    // Route to live-monitoring if event is Live, otherwise to event-overview
    if (event.status === "Live") {
      setInitialEventView("live-monitoring");
    } else {
      setInitialEventView("event-overview");
    }
    setOrganizerView("event-dashboard");
  };

  const handleBackToHome = () => {
    setOrganizerView("home");
    setSelectedEventId(null);
  };

  const handleCreateEvent = () => {
    setEventHubInitialView("create-event");
    setIsEventHubOpen(true);
  };

  return (
    <IncidentProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Organizer View header/layout differs when in event-centric flow */}
        {organizerView === "home" ? (
          <>
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-slate-900 flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      DrishtiX Event Platform
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                      Intelligent Event Management & Safety Monitoring
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewMode("attendee")}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Users className="w-4 h-4" />
                      Switch to Attendee View
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Organizer Home - use existing MyEventsView as the home listing */}
            <main>
              <div className="max-w-7xl mx-auto px-6 py-8">
                <OrganizerHome
                  onSelectEvent={handleSelectEvent}
                  onCreateEvent={handleCreateEvent}
                />
              </div>
            </main>
          </>
        ) : (
          <>
            {/* Event Command Center - clone-style container with sidebar */}
            {selectedEventId && (
              <EventCommandCenter
                eventId={selectedEventId}
                onBack={handleBackToHome}
                onCreateEvent={handleCreateEvent}
                initialView={initialEventView}
              />
            )}

            {/* Floating switch to attendee view */}
            <button
              onClick={() => setViewMode("attendee")}
              className="fixed top-6 right-6 px-4 py-2.5 bg-white border-2 border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-lg z-50"
            >
              <Users className="w-4 h-4" />
              Attendee View
            </button>
          </>
        )}

        {/* Event Hub Modal */}
        {isEventHubOpen && (
          <EventHub
            onClose={() => {
              setIsEventHubOpen(false);
              setEventHubInitialView("none");
            }}
            initialView={eventHubInitialView}
          />
        )}

        {/* Operations Command Center Modal (fallback) */}
        {isOperationsOpen && (
          <OperationsCommandCenter onClose={() => setIsOperationsOpen(false)} />
        )}

        {/* Volunteer Management Modal */}
        {isVolunteerOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white w-[min(1100px,92vw)] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="overflow-auto" style={{ maxHeight: "85vh" }}>
                <VolunteerManagement
                  onClose={() => setIsVolunteerOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* FAQ Floating Button */}
        <button
          onClick={() => setIsFAQOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 flex items-center justify-center z-30 hover:scale-110"
          title="Help & Support"
        >
          <HelpCircle className="w-6 h-6" />
        </button>

        {/* FAQ Chatbot */}
        <FAQChatbot
          isOpen={isFAQOpen}
          onClose={() => setIsFAQOpen(false)}
          currentPage="organizer-dashboard"
        />
      </div>
    </IncidentProvider>
  );
}

function DashboardView({
  onOpenEventHub,
  onOpenOperations,
  onOpenVolunteer,
}: {
  onOpenEventHub: () => void;
  onOpenOperations: () => void;
  onOpenVolunteer: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          title="Available Events"
          value="120"
          subtitle="Ready to start"
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          title="Completed Events"
          value="865"
          subtitle="All time success"
          color="green"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Revenue Generated"
          value="$146.4K"
          subtitle="This quarter"
          color="purple"
        />
        <MetricCard
          icon={<Shield className="w-6 h-6" />}
          title="Safety Score"
          value="99.8%"
          subtitle="+2.3%"
          trend="up"
          color="emerald"
        />
      </div>

      {/* Map and Achievements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapSection />
        </div>
        <div>
          <AchievementSection />
        </div>
      </div>

      {/* Event Management Hub */}
      <FeatureCard onLaunch={onOpenEventHub} />

      {/* Bottom Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModuleCard
          icon={<GitBranch className="w-6 h-6" />}
          title="Operations Command Center"
          description="Live monitoring with GPS tracking and team deployment"
          buttonText="Open Module"
          color="blue"
          onClick={onOpenOperations}
        />
        <ModuleCard
          icon={<Users className="w-6 h-6" />}
          title="Volunteer Management"
          description="Manage volunteer applications and assignments"
          buttonText="Open Module"
          color="indigo"
          onClick={onOpenVolunteer}
        />
      </div>
    </div>
  );
}
