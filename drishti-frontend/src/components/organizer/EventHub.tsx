import { useState } from 'react';
import { X, Calendar, GitBranch, Settings } from 'lucide-react';
import { MyEventsView } from './MyEventsView';
import { EventWorkflowView } from './EventWorkflowView';
import { ManagementToolsView } from './ManagementToolsView';
import { EventTypeSelection } from './EventTypeSelection';
import { VenueMapperView } from './VenueMapperView';
import { LiveHeatmapView } from './LiveHeatmapView';
import { VolunteerRequestBuilder } from './VolunteerRequestBuilder';
import { ScheduleTeamsView } from './ScheduleTeamsView';
import { AnalyticsSetupView } from './AnalyticsSetupView';
import { EventCRUDManager } from './EventCRUDManager';
import { VenueDataPipeline } from './VenueDataPipeline';
import { MasterDataHub } from './MasterDataHub';
import { DrishtiXAIPlatform } from './DrishtiXAIPlatform';
import { DigitalTwinSetup } from './DigitalTwinSetup';
import { DigitalTwinLive } from './DigitalTwinLive';
import { EventSidebar } from './EventSidebar';
import { LaunchLivePage } from './LaunchLivePage';
import { SchedulePage } from './SchedulePage';
import { VolunteerManagementPage } from './VolunteerManagementPage';
import { EventCreationForm } from './EventCreationForm';

interface EventHubProps {
  onClose: () => void;
  initialView?: DetailView;
}

type TabView = 'myevents' | 'workflow' | 'tools';
export type DetailView =
  | 'none'
  | 'create-event'
  | 'venue-mapper'
  | 'schedule-teams'
  | 'schedule'
  | 'analytics-setup'
  | 'go-live'
  | 'live-heatmap'
  | 'event-crud'
  | 'venue-pipeline'
  | 'master-data'
  | 'volunteer-management'
  | 'volunteer-dispatch'
  | 'drishti-ai';

export function EventHub({ onClose, initialView = 'none' }: EventHubProps) {
  const [activeTab, setActiveTab] = useState<TabView>('myevents');
  const [detailView, setDetailView] = useState<DetailView>(initialView);
  const [sidebarView, setSidebarView] = useState<string>('dashboard');
  const [selectedEventType, setSelectedEventType] = useState<any>(null);

  const tabs = [
    { id: 'myevents', label: 'My Events', icon: Calendar },
    { id: 'workflow', label: 'Event Workflow', icon: GitBranch },
    { id: 'tools', label: 'Management Tools', icon: Settings },
  ];

  // Handler for workflow navigation
  const handleWorkflowNavigation = (step: number) => {
    switch (step) {
      case 1:
        setDetailView('create-event');
        setSidebarView('event-details');
        break;
      case 2:
        setDetailView('venue-mapper');
        setSidebarView('venue-mapping');
        break;
      case 3:
        setDetailView('schedule-teams');
        setSidebarView('teams-setup');
        break;
      case 4:
        setDetailView('analytics-setup');
        setSidebarView('analytics-setup');
        break;
      case 5:
        setDetailView('go-live');
        setSidebarView('go-live');
        break;
    }
  };

  // Handler for management tools navigation
  const handleToolsNavigation = (toolName: string) => {
    switch (toolName) {
      case 'Event CRUD Manager':
        setDetailView('event-crud');
        setSidebarView('event-crud');
        break;
      case 'Venue Data Pipeline':
        setDetailView('venue-pipeline');
        setSidebarView('venue-pipeline');
        break;
      case 'Master Data Hub':
        setDetailView('master-data');
        setSidebarView('master-data');
        break;
      case 'DrishtiX AI Platform':
        setDetailView('drishti-ai');
        setSidebarView('drishti-ai');
        break;
      case 'Live Heatmap':
        setDetailView('live-heatmap');
        setSidebarView('live-heatmap');
        break;
    }
  };

  // Handler to go back to main view
  const handleBackToMain = () => {
    setDetailView('none');
    setSidebarView('dashboard');
  };

  const handleSidebarNavigate = (view: string) => {
    setSidebarView(view);

    switch (view) {
      case 'dashboard':
        setDetailView('none');
        break;
      case 'event-details':
        setDetailView('create-event');
        break;
      case 'venue-mapping':
        setDetailView('venue-mapper');
        break;
      case 'teams-setup':
          // Show teams view in the main pane (avoid full-screen detail overlay)
          setSidebarView('teams-setup');
          setDetailView('none');
        break;
      case 'volunteer-management':
        setDetailView('volunteer-management');
        break;
      case 'schedule':
        setDetailView('schedule');
        break;
      case 'analytics-setup':
        setDetailView('analytics-setup');
        break;
      case 'digital-twin':
        setSidebarView('digital-twin');
        setDetailView('none');
        setActiveTab('myevents');
        break;
      case 'digital-twin-live':
        setSidebarView('digital-twin-live');
        setDetailView('none');
        setActiveTab('myevents');
        break;
      case 'live-heatmap':
      case 'live-monitoring':
        setDetailView('live-heatmap');
        break;
      case 'alerts':
        setDetailView('venue-pipeline');
        break;
      case 'volunteer-dispatch':
        setDetailView('volunteer-dispatch');
        break;
      case 'event-crud':
        setDetailView('event-crud');
        break;
      case 'master-data':
        setDetailView('master-data');
        break;
      case 'reports':
      case 'settings':
        setDetailView('drishti-ai');
        break;
      default:
        break;
    }
  };

  // Render detail views
  const renderDetailView = () => {
    switch (detailView) {
      case 'create-event':
        if (selectedEventType) {
          return (
            <EventCreationForm
              eventType={selectedEventType}
              onBack={() => setSelectedEventType(null)}
              onSave={(data) => {
                console.log('Event saved:', data);
                handleBackToMain();
              }}
            />
          );
        }
        return (
          <EventTypeSelection
            onSelectType={(type) => setSelectedEventType(type)}
            onBack={handleBackToMain}
          />
        );
      case 'venue-mapper':
        return <VenueMapperView onBack={handleBackToMain} />;
      case 'schedule-teams':
        return <ScheduleTeamsView onBack={handleBackToMain} />;
      case 'schedule':
        return <SchedulePage onBack={handleBackToMain} />;
      case 'analytics-setup':
        return <AnalyticsSetupView onBack={handleBackToMain} />;
      case 'go-live':
        return <LaunchLivePage onBack={handleBackToMain} />;
      case 'live-heatmap':
        return <LiveHeatmapView onBack={handleBackToMain} />;
      case 'event-crud':
        return <EventCRUDManager onBack={handleBackToMain} />;
      case 'venue-pipeline':
        return <VenueDataPipeline onBack={handleBackToMain} />;
      case 'master-data':
        return <MasterDataHub onBack={handleBackToMain} />;
      case 'volunteer-management':
        return <VolunteerManagementPage onBack={handleBackToMain} />;
      case 'volunteer-dispatch':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-slate-900 text-2xl mb-1">Dispatch Center</h2>
                  <p className="text-slate-600 text-sm">
                    Configure volunteer roles and dispatch requirements for this event.
                  </p>
                </div>
              </div>
              <VolunteerRequestBuilder
                requirements={[]}
                onChange={() => {
                  // UI-only placeholder; backend integration intentionally omitted.
                }}
              />
            </div>
          </div>
        );
      case 'drishti-ai':
        return <DrishtiXAIPlatform onBack={handleBackToMain} />;
      default:
        return null;
    }
  };

  // If showing a detail view, render it
  if (detailView !== 'none') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300">
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 mb-6 sticky top-6 z-10">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-slate-900 text-2xl mb-2">Event Management Hub</h2>
                      <p className="text-slate-600">Create, manage, and monitor your events</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-3 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <X className="w-6 h-6 text-slate-700" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail View Content */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
                {renderDetailView()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view with tabs
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300">
      <div className="absolute inset-0 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
          <div className="max-w-7xl mx-auto flex gap-6">
            <EventSidebar
              currentView={sidebarView}
              onNavigate={handleSidebarNavigate}
              isLive={true}
            />

            <div className="flex-1">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 mb-6 sticky top-6 z-10">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-slate-900 text-2xl mb-2">Event Management Hub</h2>
                      <p className="text-slate-600">Create, manage, and monitor your events</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-3 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <X className="w-6 h-6 text-slate-700" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-slate-200">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as TabView)}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                            activeTab === tab.id
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
                {/* If user selected Teams from the sidebar, show the Teams view in the main pane */}
                {sidebarView === 'teams-setup' ? (
                  <ScheduleTeamsView
                    onBack={() => {
                      setSidebarView('dashboard');
                      setDetailView('none');
                    }}
                  />
                ) : sidebarView === 'digital-twin' ? (
                  <DigitalTwinSetup
                    onBack={() => {
                      setSidebarView('dashboard');
                      setDetailView('none');
                    }}
                  />
                ) : sidebarView === 'digital-twin-live' ? (
                  <DigitalTwinLive
                    onBack={() => {
                      setSidebarView('dashboard');
                      setDetailView('none');
                    }}
                  />
                ) : (
                  <>
                    {activeTab === 'myevents' && <MyEventsView />}

                    {activeTab === 'workflow' && (
                  <div className="p-6 space-y-6">
                    {/* Quick Actions - clone-style UI-only */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        type="button"
                        onClick={() => handleSidebarNavigate('live-monitoring')}
                        className="px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        Open Live Monitoring
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSidebarNavigate('alerts')}
                        className="px-4 py-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-amber-600 rounded-full" />
                        Open Alerts Center
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSidebarNavigate('live-heatmap')}
                        className="px-4 py-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-rose-600 rounded-full" />
                        View Heatmap
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSidebarNavigate('volunteer-dispatch')}
                        className="px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                        Dispatch Center
                      </button>
                    </div>

                    {/* Existing workflow view below */}
                    <EventWorkflowView onNavigate={handleWorkflowNavigation} />
                  </div>
                )}

                    {activeTab === 'tools' && (
                      <ManagementToolsView onNavigate={handleToolsNavigation} />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}