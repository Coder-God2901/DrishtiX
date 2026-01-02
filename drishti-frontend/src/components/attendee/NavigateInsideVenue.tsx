import {
  ArrowLeft,
  MapPin,
  ChevronRight,
  Music,
  UtensilsCrossed,
  Heart,
  ShoppingBag,
  Waves,
  Coffee,
  Camera,
  Wifi,
  DoorOpen,
  AlertTriangle,
  Navigation,
  Phone,
  Shield,
  Activity,
  Users,
} from "lucide-react";
import { useState } from "react";
import { IndoorNavigationMap } from "./IndoorNavigationMap";
import { VenueMapView } from "./VenueMapView";
import { DrishtiXIntelligenceLayer } from "../shared/DrishtiXIntelligenceLayer";
import { RealTimeNotifications } from "../shared/RealTimeNotifications";

interface NavigateInsideVenueProps {
  onBack: () => void;
}

export function NavigateInsideVenue({ onBack }: NavigateInsideVenueProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navigatingToLocation, setNavigatingToLocation] = useState<any>(null);
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [showEmergencyExits, setShowEmergencyExits] = useState(false);

  const categories = [
    {
      id: "gates",
      name: "Gates & Entry",
      icon: <DoorOpen className="w-6 h-6" />,
      color: "emerald",
      count: 6,
    },
    {
      id: "emergency",
      name: "Emergency Exits",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "red",
      count: 4,
      priority: true,
    },
    {
      id: "stages",
      name: "Stages & Performances",
      icon: <Music className="w-6 h-6" />,
      color: "purple",
      count: 4,
    },
    {
      id: "food",
      name: "Food & Beverages",
      icon: <UtensilsCrossed className="w-6 h-6" />,
      color: "orange",
      count: 8,
    },
    {
      id: "facilities",
      name: "Facilities",
      icon: <Waves className="w-6 h-6" />,
      color: "blue",
      count: 12,
    },
    {
      id: "medical",
      name: "Medical & First Aid",
      icon: <Heart className="w-6 h-6" />,
      color: "red",
      count: 3,
    },
    {
      id: "merch",
      name: "Merchandise",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "green",
      count: 5,
    },
    {
      id: "lounges",
      name: "Lounges & Relaxation",
      icon: <Coffee className="w-6 h-6" />,
      color: "amber",
      count: 6,
    },
  ];

  const locations = {
    emergency: [
      {
        name: "Exit E1 - North Emergency",
        distance: "320m",
        waitTime: "Clear path",
        status: "Open",
        category: "Emergency Exits",
        eta: "4 min walk",
        capacity: "500 people/min",
      },
      {
        name: "Exit E2 - East Emergency",
        distance: "250m",
        waitTime: "Clear path",
        status: "Open",
        category: "Emergency Exits",
        eta: "3 min walk",
        capacity: "600 people/min",
      },
      {
        name: "Exit E3 - South Emergency",
        distance: "120m",
        waitTime: "Clear path",
        status: "Open",
        category: "Emergency Exits",
        eta: "2 min walk",
        capacity: "400 people/min",
        nearest: true,
      },
      {
        name: "Exit E4 - West Emergency",
        distance: "410m",
        waitTime: "Clear path",
        status: "Open",
        category: "Emergency Exits",
        eta: "5 min walk",
        capacity: "550 people/min",
      },
    ],
    gates: [
      {
        name: "Gate A - Main Entrance",
        distance: "50m",
        waitTime: "Low queue",
        status: "Open",
        category: "Gates & Entry",
      },
      {
        name: "Gate B - North Side",
        distance: "180m",
        waitTime: "Medium queue",
        status: "Open",
        category: "Gates & Entry",
      },
      {
        name: "Gate C - South Side",
        distance: "220m",
        waitTime: "Congested",
        status: "Busy",
        category: "Gates & Entry",
      },
      {
        name: "VIP Entrance",
        distance: "140m",
        waitTime: "No wait",
        status: "Members Only",
        category: "Gates & Entry",
      },
    ],
    stages: [
      {
        name: "Main Stage",
        distance: "120m",
        waitTime: "Now Playing",
        status: "Live",
        category: "Stages & Performances",
      },
      {
        name: "DJ Arena",
        distance: "250m",
        waitTime: "Next: 7:30 PM",
        status: "Upcoming",
        category: "Stages & Performances",
      },
      {
        name: "Acoustic Lounge",
        distance: "180m",
        waitTime: "Now Playing",
        status: "Live",
        category: "Stages & Performances",
      },
      {
        name: "Electronic Dome",
        distance: "320m",
        waitTime: "Next: 9:00 PM",
        status: "Upcoming",
        category: "Stages & Performances",
      },
    ],
    food: [
      {
        name: "Food Court - North",
        distance: "85m",
        waitTime: "~5 min wait",
        status: "Open",
        category: "Food & Beverages",
      },
      {
        name: "BBQ Zone",
        distance: "140m",
        waitTime: "~8 min wait",
        status: "Open",
        category: "Food & Beverages",
      },
      {
        name: "Vegan Station",
        distance: "95m",
        waitTime: "~3 min wait",
        status: "Open",
        category: "Food & Beverages",
      },
      {
        name: "Dessert Corner",
        distance: "210m",
        waitTime: "~2 min wait",
        status: "Open",
        category: "Food & Beverages",
      },
    ],
    facilities: [
      {
        name: "Restrooms - Zone A",
        distance: "45m",
        waitTime: "Low queue",
        status: "Available",
        category: "Facilities",
      },
      {
        name: "Restrooms - Zone B",
        distance: "120m",
        waitTime: "Medium queue",
        status: "Available",
        category: "Facilities",
      },
      {
        name: "Water Stations",
        distance: "30m",
        waitTime: "No wait",
        status: "Available",
        category: "Facilities",
      },
      {
        name: "ATM & Lockers",
        distance: "110m",
        waitTime: "Available",
        status: "Available",
        category: "Facilities",
      },
    ],
    medical: [
      {
        name: "Medical Tent - North",
        distance: "160m",
        waitTime: "Immediate",
        status: "Available",
        category: "Medical & First Aid",
      },
      {
        name: "Medical Tent - South",
        distance: "280m",
        waitTime: "Immediate",
        status: "Available",
        category: "Medical & First Aid",
      },
      {
        name: "First Aid Station",
        distance: "95m",
        waitTime: "Immediate",
        status: "Available",
        category: "Medical & First Aid",
      },
    ],
    merch: [
      {
        name: "Official Merchandise",
        distance: "190m",
        waitTime: "~10 min wait",
        status: "Open",
        category: "Merchandise",
      },
      {
        name: "Artist Merch Booth",
        distance: "145m",
        waitTime: "~6 min wait",
        status: "Open",
        category: "Merchandise",
      },
      {
        name: "Souvenir Shop",
        distance: "220m",
        waitTime: "~4 min wait",
        status: "Open",
        category: "Merchandise",
      },
    ],
    lounges: [
      {
        name: "VIP Lounge",
        distance: "175m",
        waitTime: "Members Only",
        status: "Open",
        category: "Lounges & Relaxation",
      },
      {
        name: "Chill Zone",
        distance: "130m",
        waitTime: "Open Access",
        status: "Open",
        category: "Lounges & Relaxation",
      },
      {
        name: "Sunset Deck",
        distance: "240m",
        waitTime: "Open Access",
        status: "Open",
        category: "Lounges & Relaxation",
      },
    ],
  };

  if (navigatingToLocation) {
    return (
      <>
        <IndoorNavigationMap
          location={navigatingToLocation}
          onBack={() => setNavigatingToLocation(null)}
        />
        <DrishtiXIntelligenceLayer />
        <RealTimeNotifications />
      </>
    );
  }

  if (showVenueMap) {
    return (
      <>
        <VenueMapView
          onBack={() => setShowVenueMap(false)}
          onNavigateToLocation={setNavigatingToLocation}
        />
        <DrishtiXIntelligenceLayer />
        <RealTimeNotifications />
      </>
    );
  }

  if (showEmergencyExits) {
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
                  onClick={() => setShowEmergencyExits(false)}
                  className="p-2 hover:bg-red-600 rounded-lg transition-all duration-200 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-white font-black text-xl">
                    Emergency Exit Route
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-red-200 mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Quick access to emergency information</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-800 text-red-100 rounded-full text-sm font-semibold">
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
                  <p className="text-2xl font-black mb-1">Stay Safe</p>
                  <p className="text-red-100 font-medium">
                    Your safety is our priority
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Instructions */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-slate-900 text-xl font-black mb-2">
                  Stay Calm - Follow These Steps
                </h2>
                <p className="text-slate-600 text-sm font-medium">
                  Important safety guidelines for emergency situations
                </p>
              </div>
              <div className="space-y-3">
                {safetySteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-black">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-slate-900 pt-1 font-medium">{step}</p>
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
                  <h3 className="text-slate-900 text-xl font-black mb-1">
                    Nearest Exit: Exit E3
                  </h3>
                  <p className="text-slate-600 font-medium">
                    120 meters away from your location
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const nearestExit = locations.emergency.find(
                    (e) => e.nearest
                  );
                  if (nearestExit) setNavigatingToLocation(nearestExit);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl font-bold"
              >
                <Navigation className="w-5 h-5" />
                <span className="text-lg">Show Exit Route</span>
              </button>
            </div>

            {/* All Emergency Exits */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-slate-900 font-black text-xl mb-4">
                All Emergency Exits
              </h3>
              <div className="space-y-3">
                {locations.emergency.map((exit, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      exit.nearest
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => setNavigatingToLocation(exit)}
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
                        <p className="text-slate-900 font-bold">{exit.name}</p>
                        {exit.nearest && (
                          <p className="text-green-600 text-sm font-semibold">
                            Nearest exit
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-slate-600 text-sm font-medium">
                          Distance
                        </p>
                        <p className="text-slate-900 font-bold">
                          {exit.distance}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600 text-sm font-medium">
                          Walk Time
                        </p>
                        <p className="text-slate-900 font-bold">{exit.eta}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-slate-900 font-black text-xl mb-6">
                Emergency Contacts
              </h3>
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
                        <p className="text-slate-900 font-bold">
                          {contact.label}
                        </p>
                        <p
                          className={`text-lg font-black ${
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-black mb-2">
                    Emergency Assembly Point
                  </p>
                  <p className="text-slate-700 text-sm mb-3 font-medium">
                    If evacuation is necessary, gather at the designated
                    assembly point in the North Parking Lot.
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Real-time Notifications */}
      <RealTimeNotifications />

      {/* DrishtiX Intelligence Layer */}
      <DrishtiXIntelligenceLayer />

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
                <h1 className="text-slate-900">Navigate Inside Venue</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Find venues, facilities and more</span>
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Live Now</p>
                  <p className="text-slate-900">2 Stages</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Food Spots</p>
                  <p className="text-slate-900">8 Open</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">WiFi Zones</p>
                  <p className="text-slate-900">Available</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Photo Spots</p>
                  <p className="text-slate-900">12 Locations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Exit Button - Prominent */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 shadow-2xl border-2 border-red-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl mb-1">
                    Emergency Exit Routes
                  </h3>
                  <p className="text-red-100 text-sm font-medium">
                    Quick access to emergency exits and safety information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyExits(true)}
                className="px-6 py-3 bg-white hover:bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                View Exits
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div>
            <h3 className="text-slate-900 mb-4 font-black text-xl">
              What are you looking for?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    if (category.id === "emergency") {
                      setShowEmergencyExits(true);
                    } else {
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      );
                    }
                  }}
                  className={`group p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    category.priority
                      ? "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-lg"
                      : selectedCategory === category.id
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        category.color === "purple"
                          ? "bg-purple-100 text-purple-600"
                          : category.color === "orange"
                          ? "bg-orange-100 text-orange-600"
                          : category.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : category.color === "red"
                          ? "bg-red-100 text-red-600"
                          : category.color === "green"
                          ? "bg-green-100 text-green-600"
                          : category.color === "emerald"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {category.icon}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                        category.priority
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {category.count}
                    </span>
                  </div>
                  <h4
                    className={`mb-1 font-bold ${
                      category.priority ? "text-red-900" : "text-slate-900"
                    }`}
                  >
                    {category.name}
                  </h4>
                  <p
                    className={`text-sm font-medium ${
                      category.priority ? "text-red-700" : "text-slate-600"
                    }`}
                  >
                    {category.priority
                      ? "Quick access"
                      : "Tap to view locations"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Category Locations */}
          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h3>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3">
                {locations[selectedCategory as keyof typeof locations]?.map(
                  (location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            location.status === "Live"
                              ? "bg-red-100"
                              : location.status === "Upcoming"
                              ? "bg-purple-100"
                              : location.status === "Open"
                              ? "bg-green-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <MapPin
                            className={`w-6 h-6 ${
                              location.status === "Live"
                                ? "text-red-600"
                                : location.status === "Upcoming"
                                ? "text-purple-600"
                                : location.status === "Open"
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-slate-900 mb-1">{location.name}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span>{location.distance} away</span>
                            <span>•</span>
                            <span>{location.waitTime}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setNavigatingToLocation(location)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Navigate
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Map View Option */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 mb-2">Interactive Venue Map</p>
                <p className="text-slate-700 text-sm mb-4">
                  View all locations on an interactive map with real-time
                  updates
                </p>
                <button
                  onClick={() => setShowVenueMap(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                >
                  Open Map
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
