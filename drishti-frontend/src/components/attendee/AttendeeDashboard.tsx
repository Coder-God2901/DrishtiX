import { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  Users,
  Clock,
  Star,
  Heart,
  Bell,
  MapPin,
  Info,
  ChevronRight,
  Navigation,
  Accessibility,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Check,
  TrendingUp,
  BarChart3,
  Zap,
  Wifi,
  Radio,
} from "lucide-react";
import { SmartSafetyMapSystem } from "../shared/SmartSafetyMapSystem";
import { AccessibleNavigationMap } from "./AccessibleNavigationMap";
import { NavigationRouting } from "./NavigationRouting";
import { DrishtiXIntelligenceLayer } from "../shared/DrishtiXIntelligenceLayer";
import { AccessibleNavigationSystem } from "./AccessibleNavigationSystem";
import { FindAndHelpSystem, Tab } from "./FindAndHelpSystem";
import { MedicalAssistanceSystem } from "./MedicalAssistanceSystem";
import { AttendeeEventHub } from "./AttendeeEventHub";
import { analyticsService, AnalyticsMetrics } from "../../services/analytics.service";
import { wsService } from "../../services/websocket.service";
import { alertService } from "../../services/alert.service";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface AttendeeDashboardProps {
  onSwitchToOrganizer: () => void;
  onLogout: () => void;
  eventId?: string;
  userId?: string;
}

export function AttendeeDashboard({
  onSwitchToOrganizer,
  onLogout,
  eventId = 'default-event-id',
  userId = 'default-user-id',
}: AttendeeDashboardProps) {
  const [showNavigation, setShowNavigation] = useState(false);
  const [showAccessibleNav, setShowAccessibleNav] = useState(false);
  const [showFindHelp, setShowFindHelp] = useState(false);
  const [findHelpInitialTab, setFindHelpInitialTab] =
    useState<Tab>("find-person");
  const [showMedicalHelp, setShowMedicalHelp] = useState(false);
  const [showEventHub, setShowEventHub] = useState(false);
  const [isAccessibleMode, setIsAccessibleMode] = useState(false);

  // Real-time data states
  const [liveMetrics, setLiveMetrics] = useState<AnalyticsMetrics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<
    Array<{ icon: string; text: string; time: string }>
  >([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Subscribe to real-time updates
  useEffect(() => {
    console.log("🔴 AttendeeDashboard: Subscribing to real-time updates");
    setIsLiveConnected(true);
    loadMetrics();
    loadNotifications();

    // Subscribe to real-time metrics
    const handleMetricsUpdate = (metrics: AnalyticsMetrics) => {
      setLiveMetrics(metrics);
      setLastUpdateTime(new Date());
    };

    // Subscribe to real-time alerts/notifications
    const handleAlertUpdate = (alert: any) => {
      const notification: Notification = {
        id: alert.id,
        type: alert.severity === 'critical' ? 'alert' : alert.severity === 'high' ? 'warning' : 'info',
        title: alert.type,
        message: alert.message,
        timestamp: Date.now(),
        read: false
      };
      setNotifications((prev) => {
        const exists = prev.find((n) => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 10);
      });
    };

    wsService.on('metrics:realtime', handleMetricsUpdate);
    wsService.on('alert:new', handleAlertUpdate);
    wsService.emit('subscribe:metrics', eventId);
    wsService.emit('subscribe:alerts', eventId);

    // Initialize activity feed
    const initialActivity = [
      {
        icon: "🎵",
        text: 'Added "DJ Nexus" to favorites',
        time: "10 mins ago",
      },
      {
        icon: "⭐",
        text: 'Rated "Summer Music Festival" 5 stars',
        time: "2 hours ago",
      },
      { icon: "🎫", text: "Checked in at Gate B", time: "3 hours ago" },
      { icon: "📍", text: "Saved location: Main Stage", time: "3 hours ago" },
    ];
    setActivityFeed(initialActivity);

    // Simulate new activity periodically
    const activityInterval = setInterval(() => {
      const randomActivities = [
        { icon: "🎭", text: "Viewed performance schedule", time: "Just now" },
        { icon: "🍕", text: "Found nearby food vendor", time: "Just now" },
        { icon: "🚻", text: "Located nearest restroom", time: "Just now" },
        { icon: "📸", text: "Saved photo spot location", time: "Just now" },
        {
          icon: "🎪",
          text: "Checked merchandise store hours",
          time: "Just now",
        },
        { icon: "🅿️", text: "Found parking information", time: "Just now" },
      ];

      if (Math.random() > 0.5) {
        const newActivity =
          randomActivities[Math.floor(Math.random() * randomActivities.length)];
        setActivityFeed((prev) => [newActivity, ...prev].slice(0, 8));
      }
    }, 15000);

    return () => {
      wsService.off('metrics:realtime', handleMetricsUpdate);
      wsService.off('alert:new', handleAlertUpdate);
      clearInterval(activityInterval);
      setIsLiveConnected(false);
    };
  }, [eventId]);

  const loadMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getRealtimeMetrics(eventId);
      if (response.success && response.data) {
        setLiveMetrics(response.data);
        console.log('✅ Loaded real-time metrics');
      } else {
        setError(response.error || 'Failed to load metrics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('❌ Error loading metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await alertService.getAlerts({ eventId, limit: 10 });
      if (response.success && response.data) {
        const notifs: Notification[] = response.data.map((alert: any) => ({
          id: alert.id,
          type: alert.severity === 'critical' ? 'alert' : alert.severity === 'high' ? 'warning' : 'info',
          title: alert.type,
          message: alert.message,
          timestamp: new Date(alert.timestamp).getTime(),
          read: false
        }));
        setNotifications(notifs);
      }
    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
    }
  };

  const handleNavigateToSafeRoute = (route: any) => {
    setShowNavigation(true);
    // Here you could pass the route details to the NavigationRouting component
  };

  // Helper to format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  // Handle notification click
  const handleNotificationClick = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    // Could also call API to mark as read if backend supports it
    try {
      await alertService.acknowledgeAlert(notificationId, userId);
      console.log('✅ Notification marked as read');
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  };

  if (showEventHub) {
    return <AttendeeEventHub onBack={() => setShowEventHub(false)} />;
  }

  if (showMedicalHelp) {
    return <MedicalAssistanceSystem onBack={() => setShowMedicalHelp(false)} />;
  }

  if (showFindHelp) {
    return (
      <FindAndHelpSystem
        onBack={() => setShowFindHelp(false)}
        initialTab={findHelpInitialTab}
      />
    );
  }

  if (showAccessibleNav) {
    return (
      <AccessibleNavigationSystem onBack={() => setShowAccessibleNav(false)} />
    );
  }

  if (showNavigation) {
    return (
      <>
        <NavigationRouting onBack={() => setShowNavigation(false)} />
        <DrishtiXIntelligenceLayer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* DrishtiX Intelligence Layer */}
      <DrishtiXIntelligenceLayer />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-slate-900 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                Attendee Dashboard
              </h1>
              <p className="text-slate-600 text-sm mt-1 flex items-center gap-2">
                Your personal event companion
                {isLiveConnected && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Accessible Mode Toggle */}
              <div
                className={`flex items-center gap-3 mr-4 p-1.5 rounded-full border-2 transition-all duration-300 ${
                  isAccessibleMode
                    ? "bg-teal-50 border-teal-200 pr-2"
                    : "bg-slate-50 border-slate-200 pr-4"
                }`}
              >
                <button
                  onClick={() => setIsAccessibleMode(!isAccessibleMode)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner ${
                    isAccessibleMode
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                      isAccessibleMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  >
                    {isAccessibleMode ? (
                      <Accessibility className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Accessibility className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                <span
                  className={`text-sm font-semibold select-none cursor-pointer ${
                    isAccessibleMode ? "text-teal-700" : "text-slate-600"
                  }`}
                  onClick={() => setIsAccessibleMode(!isAccessibleMode)}
                >
                  Accessible Mode
                </span>
              </div>

              <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-slate-600">Logged in as</p>
                <p className="text-sm font-semibold text-purple-700">
                  Event Attendee
                </p>
              </div>
              <button
                className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200 hover:bg-red-200 transition-all"
                onClick={onLogout}
              >
                Logout
              </button>
              <button
                onClick={() => setShowEventHub(true)}
                className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Explore
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Smart Safety Map System or Accessible Map */}
        <div className="mb-8">
          {isAccessibleMode ? (
            <AccessibleNavigationMap />
          ) : (
            <SmartSafetyMapSystem onNavigate={handleNavigateToSafeRoute} />
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm text-purple-100">Welcome to</span>
                </div>
                <h2 className="text-3xl mb-2">Summer Music Festival 2025</h2>
                <p className="text-purple-100 mb-6">
                  Vagator Beach, Goa • Live Now
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Started at 3:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">8,432 Attendees</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-center">
                  <p className="text-xs text-purple-100 mb-1">Your Status</p>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm">Checked In</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 flex items-center gap-2">
                Live Event Statistics
                {liveMetrics && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Updating
                  </span>
                )}
              </h3>
              <span className="text-xs text-slate-500">
                Last update: {lastUpdateTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Current Attendance */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Current Attendance</p>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2 font-bold">
                  {liveMetrics
                    ? liveMetrics.currentAttendees.toLocaleString()
                    : "---"}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <span>of 50,000 expected</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: liveMetrics
                        ? `${Math.min(
                            100,
                            (liveMetrics.currentAttendees / 50000) * 100
                          )}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="text-blue-600 text-sm mt-2">
                  {liveMetrics
                    ? `${Math.round(
                        (liveMetrics.currentAttendees / 50000) * 100
                      )}% capacity`
                    : "Loading..."}
                </p>
              </div>

              {/* Active Volunteers */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Active Volunteers</p>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2 font-bold">
                  {liveMetrics ? liveMetrics.activeVolunteers : "---"}
                </p>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    Online
                  </span>
                </div>
                <p className="text-slate-600 text-sm">
                  Ready to assist attendees
                </p>
              </div>

              {/* Check-ins */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Total Check-ins</p>
                  <Zap className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2 font-bold">
                  {liveMetrics ? liveMetrics.checkIns.toLocaleString() : "---"}
                </p>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-slate-600">Entry processed</span>
                </div>
                <p className="text-green-600 text-sm">Smooth entry flow</p>
              </div>

              {/* Crowd Density */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-600 text-sm">Crowd Density</p>
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-slate-900 text-3xl mb-2 font-bold">
                  {liveMetrics
                    ? `${Math.round(liveMetrics.crowdDensity)}%`
                    : "---"}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      liveMetrics && liveMetrics.crowdDensity > 75
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : liveMetrics && liveMetrics.crowdDensity > 50
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{
                      width: liveMetrics
                        ? `${liveMetrics.crowdDensity}%`
                        : "0%",
                    }}
                  />
                </div>
                <p
                  className={`text-sm ${
                    liveMetrics && liveMetrics.crowdDensity > 75
                      ? "text-red-600"
                      : liveMetrics && liveMetrics.crowdDensity > 50
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {liveMetrics && liveMetrics.crowdDensity > 75
                    ? "High density areas"
                    : liveMetrics && liveMetrics.crowdDensity > 50
                    ? "Moderate density"
                    : "Comfortable spacing"}
                </p>
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Event Timeline
            </h3>
            <div className="space-y-6">
              {[
                {
                  time: "Feb 15, 10:30 PM",
                  title: "Event Start",
                  status: "completed",
                  icon: <CheckCircle2 className="w-5 h-5" />,
                },
                {
                  time: "Feb 15, 11:00 PM",
                  title: "Opening Performance",
                  status: "completed",
                  icon: <CheckCircle2 className="w-5 h-5" />,
                },
                {
                  time: "Feb 16, 12:30 AM",
                  title: "Headliner Performance",
                  status: "live",
                  icon: <Activity className="w-5 h-5" />,
                },
                {
                  time: "Feb 16, 02:00 AM",
                  title: "DJ Set Begins",
                  status: "upcoming",
                  icon: <Clock className="w-5 h-5" />,
                },
                {
                  time: "Feb 16, 05:00 AM",
                  title: "Event End",
                  status: "upcoming",
                  icon: <Clock className="w-5 h-5" />,
                },
              ].map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      event.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : event.status === "live"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {event.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-slate-900">{event.title}</p>
                      {event.status === "live" && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Flow Metrics
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Entry Rate</p>
                    <p className="text-slate-600 text-sm">People per minute</p>
                  </div>
                  <p className="text-3xl text-slate-900">164</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                    style={{ width: "82%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Exit Rate</p>
                    <p className="text-slate-600 text-sm">People per minute</p>
                  </div>
                  <p className="text-3xl text-slate-900">44</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                    style={{ width: "44%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-900">Avg Dwell Time</p>
                    <p className="text-slate-600 text-sm">Minutes average</p>
                  </div>
                  <p className="text-3xl text-slate-900">262</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                    style={{ width: "87%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Navigation & Information Cards */}
          <div>
            <h3 className="text-slate-900 mb-4">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Help - URGENT/PRIORITY FEATURE */}
              <div
                onClick={() => {
                  setFindHelpInitialTab("find-person");
                  setShowFindHelp(true);
                }}
                className="group bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      New
                    </div>
                    <div className="flex items-center gap-1 bg-red-600/80 px-2 py-1 rounded-full text-xs">
                      <Activity className="w-3 h-3 animate-pulse" />
                      <span>Medical</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl mb-2">🆘 Find &amp; Help</h2>
                <p className="text-rose-100 mb-6">
                  Connect with people, volunteers, and emergency medical support
                </p>
                <button className="group/btn flex items-center gap-2 text-white hover:gap-3 transition-all duration-200">
                  <span className="text-lg">Get Help Now</span>
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Event Navigation */}
              <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    Popular
                  </div>
                </div>
                <h2 className="text-2xl mb-2">Event Navigation</h2>
                <p className="text-orange-100 mb-6">
                  Find your way around the venue with real-time directions
                </p>
                <button
                  onClick={() => setShowNavigation(true)}
                  className="group/btn flex items-center gap-2 text-white hover:gap-3 transition-all duration-200"
                >
                  <span className="text-lg">Start Navigation</span>
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  Live Notifications
                  {isLiveConnected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </h3>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                  {notifications.filter((n) => !n.read).length} New
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`p-4 rounded-lg border cursor-pointer ${
                        !notification.read
                          ? "bg-blue-50 border-blue-200"
                          : "bg-slate-50 border-slate-200"
                      } hover:shadow-sm transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notification.type === "warning"
                              ? "bg-amber-100"
                              : notification.type === "success"
                              ? "bg-green-100"
                              : notification.type === "error"
                              ? "bg-red-100"
                              : notification.type === "alert"
                              ? "bg-orange-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {notification.type === "warning" && (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          )}
                          {notification.type === "success" && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {notification.type === "error" && (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          {notification.type === "alert" && (
                            <Bell className="w-5 h-5 text-orange-600" />
                          )}
                          {notification.type === "info" && (
                            <Info className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-slate-900 text-sm font-semibold">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-slate-600 text-sm mb-1">
                            {notification.message}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Your Activity
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {activityFeed.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 text-sm mb-1">
                        {activity.text}
                      </p>
                      <p className="text-slate-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 text-center text-blue-600 hover:text-blue-700 text-sm transition-colors border-t border-slate-200 pt-4">
                Load More Activity
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <MapPin className="w-5 h-5" />,
                label: "Find Parking",
                color: "blue",
              },
              {
                icon: <Navigation className="w-5 h-5" />,
                label: "Restrooms",
                color: "purple",
              },
              {
                icon: <Heart className="w-5 h-5" />,
                label: "First Aid",
                color: "red",
              },
              {
                icon: <Info className="w-5 h-5" />,
                label: "Help Desk",
                color: "green",
              },
              {
                icon: <Accessibility className="w-5 h-5" />,
                label: "Accessible Navigation",
                color: "blue",
              },
            ].map((item, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                onClick={() =>
                  item.label === "Accessible Navigation"
                    ? setShowAccessibleNav(true)
                    : null
                }
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    item.color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : item.color === "purple"
                      ? "bg-purple-100 text-purple-600"
                      : item.color === "red"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-sm text-slate-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* SOS Floating Button */}
      <button
        onClick={() => {
          setFindHelpInitialTab("request-volunteer");
          setShowFindHelp(true);
        }}
        className="fixed bottom-8 left-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full shadow-2xl hover:shadow-red-500/30 hover:scale-105 transition-all group border-2 border-white/20"
      >
        <div className="bg-white/20 p-2 rounded-full group-hover:rotate-12 transition-transform">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <p className="text-xs font-medium text-red-100 uppercase tracking-wider">
            Emergency
          </p>
          <p className="text-lg font-bold">SOS Help</p>
        </div>
      </button>
    </div>
  );
}
