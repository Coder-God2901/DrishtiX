import { EventSidebar } from "./EventSidebar";
import { EventHub } from "./EventHub";
import { LiveHeatmapView } from "./LiveHeatmapView";
import { LiveMonitoring } from "./LiveMonitoring";
import { SchedulePage } from "./SchedulePage";
import { ScheduleTeamsView } from "./ScheduleTeamsView";
import VolunteerManagement from "./VolunteerManagement";
import { VenueMapperView } from "./VenueMapperView";
import { AnalyticsSetupView } from "./AnalyticsSetupView";
import { EventCRUDManager } from "./EventCRUDManager";
import { VenueDataPipeline } from "./VenueDataPipeline";
import { MasterDataHub } from "./MasterDataHub";
import { DrishtiXAIPlatform } from "./DrishtiXAIPlatform";
import { OperationsCommandCenter } from "./OperationsCommandCenter";
import { EventDashboard } from "./EventDashboard";
import { DigitalTwinSetup } from "./DigitalTwinSetup";
import { DigitalTwinLive } from "./DigitalTwinLive";
import { OrganizerCRUDPanel } from "./OrganizerCRUDPanel";
import { GateControlPage } from "./GateControlPage";
import { AlertsIncidentCenter } from "./AlertsIncidentCenter";
import { DispatchCenterPage } from "./DispatchCenterPage";
import { AICommandCenter } from "./AICommandCenter";
import { AutomationPolicyPage } from "./AutomationPolicyPage";
import { CrowdIntelligencePage } from "./CrowdIntelligencePage";
import { PostEventAnalysisPage } from "./PostEventAnalysisPage";
import { HeatmapCrowdDensity } from "./HeatmapCrowdDensity";
import { EventOverview } from "./EventOverview";
import { EventDetails } from "./EventDetails";
import { LaunchLivePage } from "./LaunchLivePage";
import { useState } from "react";

interface EventCommandCenterProps {
  eventId: string;
  onBack: () => void;
  onCreateEvent: () => void;
  initialView?: string;
}

// UI-only orchestration component inspired by DrishtiX-clone.
// Routes sidebar selections to existing drishtiui pages without changing backend logic.
export function EventCommandCenter({
  eventId,
  onBack,
  onCreateEvent,
  initialView = "dashboard",
}: EventCommandCenterProps) {
  const [currentView, setCurrentView] = useState<string>(initialView);
  const [previousView, setPreviousView] = useState<string>("dashboard");

  // Custom navigation handler to track previous view
  const handleNavigate = (newView: string) => {
    setPreviousView(currentView);
    setCurrentView(newView);
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        // Use clone-style EventDashboard for overview
        return (
          <EventDashboard
            eventId={eventId}
            onNavigate={handleNavigate}
            onBack={onBack}
            onSwitchEvent={onBack}
            onCreateEvent={onCreateEvent}
          />
        );
      case "event-overview":
        return (
          <EventOverview
            onBack={onBack}
            onNavigate={handleNavigate}
          />
        );
      case "event-details":
        return (
          <EventDetails
            onBack={() => setCurrentView("dashboard")}
            onNavigate={handleNavigate}
          />
        );
      case "venue-mapping":
        return <VenueMapperView onBack={onBack} />;
      case "teams-setup":
        return <ScheduleTeamsView onBack={() => setCurrentView("dashboard")} />;
      case "schedule":
        return <SchedulePage onBack={onBack} />;
      case "volunteer-management":
        return (
          <VolunteerManagement onClose={() => setCurrentView("dashboard")} />
        );
      case "analytics-setup":
        return <AnalyticsSetupView onBack={onBack} />;
      case "live-heatmap":
        return <HeatmapCrowdDensity onBack={() => setCurrentView("dashboard")} />;
      case "live-monitoring":
        return <LiveMonitoring onBack={onBack} setCurrentView={handleNavigate} />;
      case "digital-twin":
        return <DigitalTwinSetup onBack={onBack} />;
      case "digital-twin-live":
        return <DigitalTwinLive onBack={onBack} />;
      case "go-live":
        return <LaunchLivePage onBack={() => setCurrentView(previousView)} />;
      case "event-crud":
        return <EventCRUDManager onBack={onBack} />;
      case "venue-pipeline":
        return <VenueDataPipeline onBack={onBack} />;
      case "master-data":
        return <MasterDataHub onBack={onBack} />;
      case "drishti-ai":
        return <DrishtiXAIPlatform onBack={onBack} />;
      case "crud-panel":
        return (
          <OrganizerCRUDPanel onBack={() => setCurrentView("dashboard")} />
        );
      case "gate-control":
        return <GateControlPage onBack={() => setCurrentView("dashboard")} />;
      case "alerts":
      case "alerts-incidents":
        return (
          <AlertsIncidentCenter onBack={() => setCurrentView("dashboard")} />
        );
      case "dispatch-center":
        return <DispatchCenterPage onBack={() => setCurrentView("dashboard")} />;
      case "ai-command":
        return <AICommandCenter onBack={() => setCurrentView("dashboard")} />;
      case "policies":
        return <AutomationPolicyPage onBack={() => setCurrentView("dashboard")} />;
      case "intelligence":
        return <CrowdIntelligencePage onBack={() => setCurrentView("dashboard")} />;
      case "post-event":
        return <PostEventAnalysisPage onBack={() => setCurrentView("dashboard")} />;
      default:
        return (
          <EventDashboard
            eventId={eventId}
            onNavigate={handleNavigate}
            onBack={onBack}
            onSwitchEvent={onBack}
            onCreateEvent={onCreateEvent}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto flex gap-6 px-6 py-8">
        <EventSidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isLive={true}
        />

        <div className="flex-1">
          {currentView !== "crud-panel" &&
            currentView !== "digital-twin-live" && (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
                {renderView()}
              </div>
            )}
          {(currentView === "crud-panel" ||
            currentView === "digital-twin-live") &&
            renderView()}
        </div>
      </div>
    </div>
  );
}
