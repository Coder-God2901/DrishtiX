import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Navigation,
  Activity,
  Bell,
} from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function RealTimeNotifications() {
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>(
    []
  );
  const [isShowing, setIsShowing] = useState(false);

  // Mock notification queue generator
  useEffect(() => {
    const mockNotifications: Omit<Notification, "id" | "timestamp">[] = [
      {
        type: "warning",
        title: "Zone C Ahead Congested",
        message:
          "High crowd density detected. Redirecting you to safer path via Zone B.",
      },
      {
        type: "info",
        title: "Gate A Now Open",
        message: "Estimated wait time: 3 minutes. Crowd level: Medium",
      },
      {
        type: "success",
        title: "Medical Station Available",
        message: "First Aid Station 200m ahead on your route. No wait time.",
      },
      {
        type: "alert",
        title: "Weather Update",
        message:
          "Light rain expected in 30 minutes. Covered areas available at Zone D.",
      },
      {
        type: "info",
        title: "Restroom Queue Update",
        message:
          "Restroom Zone B has shorter queue (2 min wait) vs Zone A (8 min wait)",
      },
      {
        type: "warning",
        title: "Performance Starting Soon",
        message:
          "Main Stage performance begins in 15 minutes. Expect increased crowd movement.",
      },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < mockNotifications.length) {
        const newNotification: Notification = {
          ...mockNotifications[currentIndex],
          id: `notif-${Date.now()}-${currentIndex}`,
          timestamp: new Date(),
        };

        setNotificationQueue((prev) => [...prev, newNotification]);
        currentIndex++;
      } else {
        currentIndex = 0; // Restart cycle
      }
    }, 15000); // Add to queue every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Professional notification display with 4-second duration and 4-second gaps
  useEffect(() => {
    if (isShowing || notificationQueue.length === 0) return;

    // Get next notification from queue
    const nextNotification = notificationQueue[0];
    setCurrentNotification(nextNotification);
    setIsShowing(true);

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setIsShowing(false);

      // Remove from queue after slide-out animation (300ms)
      setTimeout(() => {
        setNotificationQueue((prev) => prev.slice(1));
        setCurrentNotification(null);
      }, 300);
    }, 4000); // Show for 4 seconds

    return () => clearTimeout(dismissTimer);
  }, [notificationQueue, isShowing]);

  const handleManualDismiss = () => {
    setIsShowing(false);
    setTimeout(() => {
      setNotificationQueue((prev) => prev.slice(1));
      setCurrentNotification(null);
    }, 300);
  };

  if (!currentNotification) return null;

  const Icon =
    currentNotification.type === "warning"
      ? AlertTriangle
      : currentNotification.type === "success"
      ? CheckCircle
      : currentNotification.type === "alert"
      ? Activity
      : Info;

  const colors =
    currentNotification.type === "warning"
      ? "from-amber-500 to-orange-500 border-amber-300"
      : currentNotification.type === "success"
      ? "from-emerald-500 to-green-500 border-emerald-300"
      : currentNotification.type === "alert"
      ? "from-red-500 to-rose-500 border-red-300"
      : "from-blue-500 to-indigo-500 border-blue-300";

  return (
    <div className="fixed top-20 right-6 z-50 max-w-md">
      <div
        className={`transition-all duration-300 ${
          isShowing
            ? "animate-in slide-in-from-right opacity-100"
            : "animate-out slide-out-to-right opacity-0"
        }`}
      >
        <div
          className={`bg-gradient-to-r ${colors} rounded-2xl shadow-2xl p-5 border-2 text-white relative overflow-hidden`}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-lg">
                    {currentNotification.title}
                  </h4>
                  <button
                    onClick={handleManualDismiss}
                    className="p-1 hover:bg-white/20 rounded-lg transition-all flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-3">
                  {currentNotification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">
                    {currentNotification.timestamp.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {currentNotification.action && (
                    <button
                      onClick={currentNotification.action.onClick}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      {currentNotification.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live indicator */}
            <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-medium">LIVE</span>
            </div>

            {/* Queue indicator - shows number of pending notifications */}
            {notificationQueue.length > 1 && (
              <div className="absolute -bottom-1 -left-1 flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                <Bell className="w-3 h-3" />
                <span className="text-[10px] font-medium">
                  +{notificationQueue.length - 1} more
                </span>
              </div>
            )}

            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-white/40"
                style={{
                  animation: "shrink 4s linear forwards",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
