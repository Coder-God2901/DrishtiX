import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Users,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { GateSelection } from "./GateSelection";
import { EmergencyExitRoute } from "./EmergencyExitRoute";
import { NavigateInsideVenue } from "./NavigateInsideVenue";
import { IndianMap, INDIAN_VENUES } from "../shared/IndianMap";

interface NavigationRoutingProps {
  onBack: () => void;
}

export function NavigationRouting({ onBack }: NavigationRoutingProps) {
  const [showGateSelection, setShowGateSelection] = useState(false);
  const [showEmergencyExit, setShowEmergencyExit] = useState(false);
  const [showInsideVenue, setShowInsideVenue] = useState(false);

  if (showGateSelection) {
    return <GateSelection onBack={() => setShowGateSelection(false)} />;
  }

  if (showEmergencyExit) {
    return <EmergencyExitRoute onBack={() => setShowEmergencyExit(false)} />;
  }

  if (showInsideVenue) {
    return <NavigateInsideVenue onBack={() => setShowInsideVenue(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-slate-900">Navigation & Routing</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Real-time navigation system</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              Attendee Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg mb-1">All Systems Normal</p>
                <p className="text-green-100 text-sm">
                  Safe to navigate • Last updated: Just now
                </p>
              </div>
            </div>
          </div>

          {/* Event Info Card with Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-slate-900 mb-2">
                  Summer Music Festival 2025
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  Vagator Beach, Goa
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600 text-xs">Started</p>
                      <p className="text-slate-900 text-sm">3:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600 text-xs">Attendees</p>
                      <p className="text-slate-900 text-sm">12.4K</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600 text-xs">Safety</p>
                      <p className="text-green-600 text-sm">Good</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600 text-xs">Status</p>
                      <p className="text-green-600 text-sm">Live</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Map */}
            <IndianMap
              location={INDIAN_VENUES.goa}
              height="300px"
              showControls={true}
              markers={[
                {
                  lat: INDIAN_VENUES.goa.lat + 0.002,
                  lng: INDIAN_VENUES.goa.lng + 0.003,
                  label: "Main Entrance",
                  color: "green",
                },
                {
                  lat: INDIAN_VENUES.goa.lat - 0.001,
                  lng: INDIAN_VENUES.goa.lng + 0.002,
                  label: "North Gate",
                  color: "blue",
                },
                {
                  lat: INDIAN_VENUES.goa.lat + 0.003,
                  lng: INDIAN_VENUES.goa.lng - 0.002,
                  label: "VIP Entrance",
                  color: "purple",
                },
                {
                  lat: INDIAN_VENUES.goa.lat - 0.002,
                  lng: INDIAN_VENUES.goa.lng - 0.001,
                  label: "Emergency Exit",
                  color: "red",
                },
              ]}
            />
            {/* End of Venue Map */}
          </div>

          {/* Navigation Options */}
          <div>
            <h3 className="text-slate-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              Navigation Options
            </h3>
            <div className="space-y-4">
              {/* Navigate to Venue */}
              <button
                onClick={() => setShowGateSelection(true)}
                className="group w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl p-6 flex items-center justify-between transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Navigation className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl mb-1">Navigate to Venue</p>
                    <p className="text-orange-100 text-sm">
                      Get step-by-step directions to the best entrance
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Navigate Inside Venue */}
              <button
                onClick={() => setShowInsideVenue(true)}
                className="group w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-300 rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-900 text-xl mb-1">
                      Navigate Inside Venue
                    </p>
                    <p className="text-slate-600 text-sm">
                      Find stages, food courts, restrooms & more
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
              </button>

              {/* Emergency Exit Route */}
              <button
                onClick={() => setShowEmergencyExit(true)}
                className="group w-full bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-900 text-xl mb-1">
                      Emergency Exit Route
                    </p>
                    <p className="text-slate-600 text-sm">
                      Quick access to nearest emergency exit
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 group-hover:text-red-600 transition-all" />
              </button>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-slate-900 mb-1">
                  Safety & Navigation Tips
                </h3>
                <p className="text-slate-600 text-sm">
                  Stay safe and enjoy your experience
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Stay hydrated - Use designated water stations",
                "Keep your phone charged for navigation",
                "Note the nearest medical tent location",
                "Follow crowd flow and staff instructions",
                "Share your location with your group",
                "Know the emergency exits near you",
              ].map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
