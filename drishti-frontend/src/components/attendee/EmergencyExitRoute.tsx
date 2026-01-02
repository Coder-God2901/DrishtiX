import {
  ArrowLeft,
  AlertTriangle,
  Navigation,
  Phone,
  Shield,
  ChevronRight,
  MapPin,
  Users,
  Activity,
} from "lucide-react";
import { LeafletMap } from "../shared/LeafletMap";

interface EmergencyExitRouteProps {
  onBack: () => void;
}

export function EmergencyExitRoute({ onBack }: EmergencyExitRouteProps) {
  const safetySteps = [
    "Stay with your group if possible",
    "Follow staff instructions and exit signs",
    "Do not run - walk quickly and calmly",
    "Once outside, move away from the building",
  ];

  const emergencyContacts = [
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Emergency Services",
      number: "911",
      color: "red",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Event Security",
      number: "(555) 123-4567",
      color: "blue",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Medical Team",
      number: "(555) 123-4568",
      color: "green",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-600">
      {/* Header */}
      <header className="bg-red-700 border-b border-red-600 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-red-600 rounded-lg transition-all duration-200 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-white">Emergency Exit Route</h1>
                <div className="flex items-center gap-2 text-sm text-red-200 mt-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Quick access to emergency information</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-800 text-red-100 rounded-full text-sm">
              <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
              Emergency Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Alert Banner */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-2xl mb-1">Stay Safe</p>
                <p className="text-red-100">Your safety is our priority</p>
              </div>
            </div>
          </div>

          {/* Safety Instructions */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-slate-900 text-xl mb-2">
                Stay Calm - Follow These Steps
              </h2>
              <p className="text-slate-600 text-sm">
                Important safety guidelines for emergency situations
              </p>
            </div>
            <div className="space-y-3">
              {safetySteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600">{index + 1}</span>
                  </div>
                  <p className="text-slate-900 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nearest Exit */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-slate-900 text-xl mb-1">
                  Nearest Exit: Exit E3
                </h3>
                <p className="text-slate-600">
                  120 meters away from your location
                </p>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Navigation className="w-5 h-5" />
              <span className="text-lg">Show Exit Route</span>
            </button>

            {/* Visual Emergency Route Map */}
            <div
              className="mt-6 relative bg-slate-50 rounded-xl overflow-hidden border-2 border-green-200"
              style={{ height: "500px" }}
            >
              <LeafletMap
                center={[19.076, 72.8777]}
                zoom={17}
                height="100%"
                markers={[
                  { position: [19.076, 72.8777] as [number, number], label: "Your Location", color: "blue" },
                  { position: [19.0768, 72.8785] as [number, number], label: "Exit E1 - North (120m)", color: "green" },
                  { position: [19.0755, 72.8790] as [number, number], label: "Exit E2 - East (320m)", color: "green" },
                  { position: [19.0752, 72.8770] as [number, number], label: "Exit E3 - South (250m)", color: "green" },
                  { position: [19.0765, 72.8760] as [number, number], label: "Exit E4 - West (180m)", color: "green" },
                  { position: [19.0762, 72.8780] as [number, number], label: "⚠️ High Crowd - Avoid", color: "red" },
                ]}
              />

              <div className="absolute top-4 right-4 bg-green-500 text-white rounded-xl px-4 py-2 shadow-lg font-bold z-10 flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                <div>
                  <div className="text-lg">120m</div>
                  <div className="text-xs text-green-100">2 min walk</div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200 z-10">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-slate-700 font-medium">Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-slate-700 font-medium">Emergency Exits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-slate-700 font-medium">Avoid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Emergency Exits */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h3 className="text-slate-900 mb-4">All Emergency Exits</h3>
            <div className="space-y-3">
              {[
                { name: "Exit E1 - North", distance: "320m", eta: "4 min" },
                { name: "Exit E2 - East", distance: "250m", eta: "3 min" },
                {
                  name: "Exit E3 - South",
                  distance: "120m",
                  eta: "2 min",
                  nearest: true,
                },
                { name: "Exit E4 - West", distance: "410m", eta: "5 min" },
              ].map((exit, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    exit.nearest
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        exit.nearest ? "bg-green-100" : "bg-slate-100"
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${
                          exit.nearest ? "text-green-600" : "text-slate-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-slate-900">{exit.name}</p>
                      {exit.nearest && (
                        <p className="text-green-600 text-sm">Nearest exit</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-slate-600 text-sm">Distance</p>
                      <p className="text-slate-900">{exit.distance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 text-sm">Walk Time</p>
                      <p className="text-slate-900">{exit.eta}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h3 className="text-slate-900 mb-6">Emergency Contacts</h3>
            <div className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.number.replace(/\D/g, "")}`}
                  className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    contact.color === "red"
                      ? "border-red-200 bg-red-50 hover:border-red-300"
                      : contact.color === "blue"
                      ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                      : "border-green-200 bg-green-50 hover:border-green-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        contact.color === "red"
                          ? "bg-red-100 text-red-600"
                          : contact.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {contact.icon}
                    </div>
                    <div>
                      <p className="text-slate-900">{contact.label}</p>
                      <p
                        className={`text-lg ${
                          contact.color === "red"
                            ? "text-red-600"
                            : contact.color === "blue"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        {contact.number}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Meeting Point */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-900 mb-2">Emergency Assembly Point</p>
                <p className="text-slate-700 text-sm mb-3">
                  If evacuation is necessary, gather at the designated assembly
                  point in the North Parking Lot.
                </p>
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>North Parking Lot - 500m from Main Entrance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
