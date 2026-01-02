import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  Heart,
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Baby,
  Accessibility,
  Package,
  HelpCircle,
  Loader,
  Radio,
  User,
  PhoneCall,
  Lock,
  Eye,
  LocateFixed,
  TrendingDown,
  Send,
  MessageSquare,
  Activity,
} from "lucide-react";
import { MedicalAssistanceSystem } from "./MedicalAssistanceSystem";
import { createVolunteerIncident } from "../../services/incidentManagementService";

interface FindAndHelpSystemProps {
  onBack: () => void;
}

export type Tab = "find-person" | "request-volunteer" | "medical-help";
type RequestStatus =
  | "idle"
  | "sending"
  | "waiting"
  | "accepted"
  | "declined"
  | "tracking";
type VolunteerStatus =
  | "idle"
  | "searching"
  | "assigned"
  | "approaching"
  | "nearby"
  | "arrived";

interface VolunteerInfo {
  name: string;
  eta: number;
  location: string;
  distance: number;
}

interface LocationData {
  distance: number;
  zone: string;
  lastUpdated: number;
}

interface FindAndHelpSystemProps {
  onBack: () => void;
  initialTab?: Tab;
}

export function FindAndHelpSystem({
  onBack,
  initialTab = "find-person",
}: FindAndHelpSystemProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Find Person State
  const [personName, setPersonName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [findMessage, setFindMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [findErrors, setFindErrors] = useState<{
    name?: string;
    contact?: string;
  }>({});

  // Volunteer Request State
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [volunteerStatus, setVolunteerStatus] =
    useState<VolunteerStatus>("idle");
  const [volunteerInfo, setVolunteerInfo] = useState<VolunteerInfo | null>(
    null
  );
  const [volunteerError, setVolunteerError] = useState<string>("");

  // Medical Help State
  const [showMedicalHelp, setShowMedicalHelp] = useState(false);

  const helpReasons = [
    {
      id: "child",
      icon: Baby,
      label: "Child Lost",
      color: "from-pink-500 to-rose-600",
    },
    {
      id: "medical",
      icon: Heart,
      label: "Medical Assistance",
      color: "from-red-500 to-red-600",
    },
    {
      id: "accessibility",
      icon: Accessibility,
      label: "Accessibility Help",
      color: "from-teal-500 to-blue-600",
    },
    {
      id: "lost-items",
      icon: Package,
      label: "Lost Items",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "general",
      icon: HelpCircle,
      label: "General Help",
      color: "from-blue-500 to-indigo-600",
    },
  ];

  // Simulate Find Person Flow
  const handleSendRequest = () => {
    // Validate inputs
    const errors: { name?: string; contact?: string } = {};

    if (!personName.trim()) {
      errors.name = "Please enter a name";
    } else if (personName.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (
      contactInfo.trim() &&
      !/^[\d\s+()-]{10,}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.trim())
    ) {
      errors.contact = "Please enter a valid phone number or email";
    }

    if (Object.keys(errors).length > 0) {
      setFindErrors(errors);
      return;
    }

    setFindErrors({});
    setRequestStatus("sending");
    setTimeout(() => {
      setRequestStatus("waiting");
      // Simulate consent screen appearing
      setTimeout(() => setShowConsentModal(true), 2000);
    }, 1500);
  };

  const handleConsentResponse = (accepted: boolean) => {
    setShowConsentModal(false);

    if (accepted) {
      setRequestStatus("accepted");
      setTimeout(() => {
        setRequestStatus("tracking");
        setLocationData({
          distance: 140,
          zone: "Zone E",
          lastUpdated: 0,
        });
      }, 1500);
    } else {
      setRequestStatus("declined");
    }
  };

  // Simulate Volunteer Request Flow
  const handleVolunteerRequest = () => {
    if (!selectedReason) {
      setVolunteerError("Please select a reason for assistance");
      return;
    }

    // Get the selected reason details
    const selectedHelpReason = helpReasons.find((r) => r.id === selectedReason);
    const reasonLabel = selectedHelpReason?.label || "General Assistance";

    // Create incident in the organizer dashboard
    // Medical requests from Find & Help go through medical tab, so these are non-medical
    createVolunteerIncident(
      reasonLabel,
      "Current Location", // In a real app, would use actual location
      "Zone C", // Mock zone
      description || `Volunteer assistance requested: ${reasonLabel}`
    );

    setVolunteerError("");
    setVolunteerStatus("searching");

    setTimeout(() => {
      setVolunteerStatus("assigned");
      setVolunteerInfo({
        name: ["Ravi Kumar", "Priya Singh", "Amit Patel", "Sneha Sharma"][
          Math.floor(Math.random() * 4)
        ],
        eta: 3,
        location: "Gate C",
        distance: 250,
      });

      setTimeout(() => setVolunteerStatus("approaching"), 3000);
      setTimeout(() => setVolunteerStatus("nearby"), 8000);
      setTimeout(() => setVolunteerStatus("arrived"), 12000);
    }, 2500);
  };

  // Update location simulation
  useEffect(() => {
    if (requestStatus === "tracking" && locationData) {
      const interval = setInterval(() => {
        setLocationData((prev) =>
          prev
            ? {
                ...prev,
                distance: Math.max(10, prev.distance - Math.random() * 15),
                lastUpdated: prev.lastUpdated + 1,
              }
            : null
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [requestStatus, locationData]);

  // Update volunteer distance
  useEffect(() => {
    if (volunteerStatus === "approaching" && volunteerInfo) {
      const interval = setInterval(() => {
        setVolunteerInfo((prev) =>
          prev
            ? {
                ...prev,
                distance: Math.max(10, prev.distance - Math.random() * 25),
                eta: Math.max(0, prev.eta - 0.5),
              }
            : null
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [volunteerStatus, volunteerInfo]);

  const resetFindPerson = () => {
    setPersonName("");
    setRequestStatus("idle");
    setLocationData(null);
  };

  const resetVolunteer = () => {
    setSelectedReason(null);
    setDescription("");
    setVolunteerStatus("idle");
    setVolunteerInfo(null);
  };

  // If Medical Help is active, show that component
  if (showMedicalHelp) {
    return <MedicalAssistanceSystem onBack={() => setShowMedicalHelp(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-600" />
                Find &amp; Help
              </h1>
              <p className="text-slate-600 text-sm">
                Connect with people and get assistance
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Medical Help Prominent Card */}
        <div
          onClick={() => setShowMedicalHelp(true)}
          className="group bg-white rounded-2xl shadow-xl border-l-4 border-red-500 p-8 mb-6 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-top duration-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-red-500 rounded-2xl opacity-25 animate-ping" />
              </div>
              <div>
                <h3 className="text-slate-900 text-2xl mb-1 flex items-center gap-2">
                  🩺 Medical Emergency
                </h3>
                <p className="text-slate-600">
                  Immediate medical assistance • Injuries • Heart issues •
                  Accidents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full border border-red-300">
                <Activity className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-red-700 text-sm">24/7</span>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-2 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("find-person")}
              className={`py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "find-person"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-lg">Find Person</span>
            </button>
            <button
              onClick={() => setActiveTab("request-volunteer")}
              className={`py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "request-volunteer"
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-lg">Request Volunteer</span>
            </button>
            <button
              onClick={() => setActiveTab("medical-help")}
              className={`py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "medical-help"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-lg">Medical Help</span>
            </button>
          </div>
        </div>

        {/* Find Person Tab */}
        {activeTab === "find-person" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            {requestStatus === "idle" && (
              <>
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                      <Search className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-2xl">Find Someone</h2>
                      <p className="text-slate-600">
                        Send a location request with their consent
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-700 mb-2 text-lg">
                        Whom are you looking for?
                      </label>
                      <input
                        type="text"
                        value={personName}
                        onChange={(e) => {
                          setPersonName(e.target.value);
                          if (findErrors.name)
                            setFindErrors({ ...findErrors, name: undefined });
                        }}
                        placeholder="Enter name or nickname"
                        className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          findErrors.name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                        }`}
                      />
                      {findErrors.name && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{findErrors.name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-lg">
                        Contact Information (optional)
                      </label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => {
                          setContactInfo(e.target.value);
                          if (findErrors.contact)
                            setFindErrors({
                              ...findErrors,
                              contact: undefined,
                            });
                        }}
                        placeholder="Enter phone number or email"
                        className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          findErrors.contact
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                        }`}
                      />
                      {findErrors.contact && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{findErrors.contact}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSendRequest}
                      disabled={requestStatus === "sending"}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-xl text-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {requestStatus === "sending" ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Request
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 mb-2">Privacy First</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        The person you&apos;re looking for must approve before
                        their location is shared. All sharing is temporary and
                        can be canceled anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {requestStatus === "sending" && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-12 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-Pulse">
                    <Send className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-slate-900 text-2xl mb-3">
                    Sending Request...
                  </h3>
                  <p className="text-slate-600">
                    {personName
                      ? `Contacting ${personName}`
                      : "Searching for person..."}
                  </p>
                  {findMessage && (
                    <div className="mt-4 max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-blue-900 text-sm italic">
                        &quot;{findMessage}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {requestStatus === "waiting" && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 p-12 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <h3 className="text-slate-900 text-2xl mb-3">
                    Request sent to{" "}
                    {personName
                      ? `"${personName}"`
                      : contactInfo
                      ? "contact"
                      : "person"}
                  </h3>
                  <p className="text-slate-600 mb-2">Waiting for approval...</p>
                  {findMessage && (
                    <div className="mt-4 max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-yellow-900 text-sm italic">
                        &quot;{findMessage}&quot;
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Message sent with request
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <div
                      className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {requestStatus === "accepted" && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-12 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-slate-900 text-2xl mb-3">
                    ✅ {personName || "Person"} accepted your request
                  </h3>
                  <p className="text-slate-600">📍 Navigating you closer...</p>
                </div>
              </div>
            )}

            {requestStatus === "declined" && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 text-2xl mb-3">
                      Request not accepted
                    </h3>
                    <p className="text-slate-600 mb-6">
                      You may ask a volunteer for help instead
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={resetFindPerson}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setActiveTab("request-volunteer")}
                        className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Request Volunteer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {requestStatus === "tracking" && locationData && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Live Tracking Card */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <LocateFixed className="w-7 h-7 animate-Pulse" />
                        </div>
                        <div>
                          <h3 className="text-2xl mb-1">
                            Tracking {personName}
                          </h3>
                          <p className="text-green-100">
                            Location shared temporarily
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-Pulse" />
                        <span className="text-sm">Live</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <TrendingDown className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Distance</p>
                        <p className="text-slate-900 text-2xl">
                          ~{Math.round(locationData.distance)}m
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <MapPin className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Location</p>
                        <p className="text-slate-900 text-2xl">
                          {locationData.zone}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Activity className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-slate-600 text-sm mb-1">Updated</p>
                        <p className="text-slate-900 text-2xl">
                          {locationData.lastUpdated}s ago
                        </p>
                      </div>
                    </div>

                    {/* Mini Map Visualization */}
                    <div
                      className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-xl p-8 mb-6 relative"
                      style={{ height: "300px" }}
                    >
                      <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%">
                          <defs>
                            <pattern
                              id="tracking-grid"
                              width="20"
                              height="20"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M 20 0 L 0 0 0 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                              />
                            </pattern>
                          </defs>
                          <rect
                            width="100%"
                            height="100%"
                            fill="url(#tracking-grid)"
                          />
                        </svg>
                      </div>

                      {/* Your location */}
                      <div className="absolute bottom-8 left-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-Pulse">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          You
                        </span>
                      </div>

                      {/* Person location */}
                      <div className="absolute top-8 right-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-Pulse">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <span className="bg-white px-2 py-1 rounded-lg text-sm text-slate-900 shadow-lg border border-slate-200">
                            {personName || "Person"}
                          </span>
                        </div>
                      </div>

                      {/* Connection line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line
                          x1="15%"
                          y1="85%"
                          x2="85%"
                          y2="20%"
                          stroke="url(#connection-gradient)"
                          strokeWidth="3"
                          strokeDasharray="10 5"
                          className="animate-Pulse"
                        />
                        <defs>
                          <linearGradient
                            id="connection-gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    <button
                      onClick={resetFindPerson}
                      className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Stop Tracking
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Request Volunteer Tab */}
        {activeTab === "request-volunteer" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            {volunteerStatus === "idle" && (
              <>
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-2xl">
                        Request Volunteer Help
                      </h2>
                      <p className="text-slate-600">
                        Get assistance from trained volunteers
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-slate-700 mb-3 text-lg">
                        What do you need help with?
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {helpReasons.map((reason) => {
                          const Icon = reason.icon;
                          return (
                            <button
                              key={reason.id}
                              onClick={() => {
                                setSelectedReason(reason.id);
                                if (volunteerError) setVolunteerError("");
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                selectedReason === reason.id
                                  ? "border-rose-500 bg-rose-50 shadow-lg"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-12 h-12 bg-gradient-to-br ${reason.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                                >
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-slate-900 block">
                                    {reason.label}
                                  </span>
                                  {reason.id === "medical" && (
                                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                      <Activity className="w-3 h-3" />
                                      Emergency medical support
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {volunteerError && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{volunteerError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">
                        Describe your situation (optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, 200))
                        }
                        placeholder="Additional details to help volunteers assist you better..."
                        rows={4}
                        maxLength={200}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none transition-all"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        {description.length}/200 characters
                      </p>
                    </div>

                    <button
                      onClick={handleVolunteerRequest}
                      disabled={volunteerStatus === "searching"}
                      className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white py-5 rounded-xl text-lg hover:shadow-xl hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {volunteerStatus === "searching" ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Help Request
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div
                  className={`rounded-2xl p-6 border-2 ${
                    selectedReason === "medical"
                      ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-100"
                      : "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selectedReason === "medical"
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : "bg-gradient-to-br from-rose-500 to-pink-600"
                      }`}
                    >
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 mb-2">
                        {selectedReason === "medical"
                          ? "Emergency Medical Response"
                          : "Trained Volunteers Ready"}
                      </h4>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {selectedReason === "medical"
                          ? "Professional medical staff will be dispatched immediately. Response time under 3 minutes for emergencies."
                          : "Our volunteers are trained professionals ready to assist you. Response time is typically under 5 minutes."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {volunteerStatus === "searching" && (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-12 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Radio className="w-10 h-10 text-white animate-Pulse" />
                  </div>
                  <h3 className="text-slate-900 text-2xl mb-3">
                    📡 Searching nearby volunteers...
                  </h3>
                  <p className="text-slate-600">
                    Finding the closest available helper
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(volunteerStatus === "assigned" ||
              volunteerStatus === "approaching" ||
              volunteerStatus === "nearby" ||
              volunteerStatus === "arrived") &&
              volunteerInfo && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Volunteer Assigned Card */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
                    <div
                      className={`p-6 text-white ${
                        volunteerStatus === "arrived"
                          ? "bg-gradient-to-r from-green-600 to-emerald-700"
                          : volunteerStatus === "nearby"
                          ? "bg-gradient-to-r from-yellow-500 to-orange-600"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            {volunteerStatus === "arrived" ? (
                              <CheckCircle className="w-7 h-7" />
                            ) : (
                              <Users className="w-7 h-7" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl mb-1">
                              {volunteerStatus === "arrived" &&
                                "✅ Volunteer Arrived"}
                              {volunteerStatus === "nearby" &&
                                "📍 Volunteer Nearby"}
                              {volunteerStatus === "approaching" &&
                                "🚶 Volunteer Approaching"}
                              {volunteerStatus === "assigned" &&
                                "✅ Volunteer Assigned"}
                            </h3>
                            <p
                              className={`text-sm ${
                                volunteerStatus === "arrived"
                                  ? "text-green-100"
                                  : volunteerStatus === "nearby"
                                  ? "text-orange-100"
                                  : "text-blue-100"
                              }`}
                            >
                              {volunteerStatus === "arrived" &&
                                "Your helper is here"}
                              {volunteerStatus === "nearby" &&
                                "Almost at your location"}
                              {volunteerStatus === "approaching" &&
                                "On the way to you"}
                              {volunteerStatus === "assigned" &&
                                "Help is on the way"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-Pulse" />
                          <span className="text-sm">Live</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                          <p className="text-xs mb-1 opacity-80">Name</p>
                          <p className="text-lg">{volunteerInfo.name}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                          <p className="text-xs mb-1 opacity-80">ETA</p>
                          <p className="text-lg">
                            {volunteerStatus === "arrived"
                              ? "0 min"
                              : `${Math.ceil(volunteerInfo.eta)} min`}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                          <p className="text-xs mb-1 opacity-80">Distance</p>
                          <p className="text-lg">
                            {Math.round(volunteerInfo.distance)}m
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="mb-6">
                        <p className="text-slate-600 text-sm mb-2">
                          Coming from
                        </p>
                        <p className="text-slate-900 text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {volunteerInfo.location}
                        </p>
                      </div>

                      {/* Mini Map */}
                      <div
                        className="bg-gradient-to-br from-slate-100 to-purple-50 rounded-xl p-8 mb-6 relative"
                        style={{ height: "300px" }}
                      >
                        <div className="absolute inset-0 opacity-10">
                          <svg width="100%" height="100%">
                            <defs>
                              <pattern
                                id="volunteer-grid"
                                width="20"
                                height="20"
                                patternUnits="userSpaceOnUse"
                              >
                                <path
                                  d="M 20 0 L 0 0 0 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="0.5"
                                />
                              </pattern>
                            </defs>
                            <rect
                              width="100%"
                              height="100%"
                              fill="url(#volunteer-grid)"
                            />
                          </svg>
                        </div>

                        {/* Your location */}
                        <div className="absolute bottom-8 right-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-Pulse">
                            <User className="w-8 h-8 text-white" />
                          </div>
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            You
                          </span>
                        </div>

                        {/* Volunteer location */}
                        <div
                          className="absolute transition-all duration-1000"
                          style={{
                            left:
                              volunteerStatus === "arrived"
                                ? "75%"
                                : volunteerStatus === "nearby"
                                ? "60%"
                                : volunteerStatus === "approaching"
                                ? "35%"
                                : "10%",
                            top:
                              volunteerStatus === "arrived"
                                ? "70%"
                                : volunteerStatus === "nearby"
                                ? "55%"
                                : volunteerStatus === "approaching"
                                ? "40%"
                                : "20%",
                          }}
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            {volunteerInfo.name.split(" ")[0]}
                          </span>
                        </div>

                        {/* Route line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <line
                            x1={
                              volunteerStatus === "arrived"
                                ? "75%"
                                : volunteerStatus === "nearby"
                                ? "60%"
                                : volunteerStatus === "approaching"
                                ? "35%"
                                : "10%"
                            }
                            y1={
                              volunteerStatus === "arrived"
                                ? "70%"
                                : volunteerStatus === "nearby"
                                ? "55%"
                                : volunteerStatus === "approaching"
                                ? "40%"
                                : "20%"
                            }
                            x2="85%"
                            y2="85%"
                            stroke="url(#volunteer-route-gradient)"
                            strokeWidth="3"
                            strokeDasharray="10 5"
                            className="animate-Pulse"
                          />
                          <defs>
                            <linearGradient
                              id="volunteer-route-gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#f43f5e" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      {volunteerStatus === "arrived" ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                          <p className="text-green-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>
                              Your volunteer has arrived and is ready to help
                              you
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                          <p className="text-blue-900 flex items-center gap-2">
                            <Navigation className="w-5 h-5" />
                            <span>
                              Stay at your current location • Volunteer is
                              coming to you
                            </span>
                          </p>
                        </div>
                      )}

                      <button
                        onClick={resetVolunteer}
                        className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Medical Help Tab */}
        {activeTab === "medical-help" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            {showMedicalHelp ? (
              <MedicalAssistanceSystem
                onBack={() => setShowMedicalHelp(false)}
              />
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center">
                      <Heart className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-2xl">
                        Medical Assistance
                      </h2>
                      <p className="text-slate-600">
                        Get immediate medical help
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-slate-700 mb-3 text-lg">
                        What medical assistance do you need?
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {helpReasons.map((reason) => {
                          const Icon = reason.icon;
                          return (
                            <button
                              key={reason.id}
                              onClick={() => setSelectedReason(reason.id)}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                selectedReason === reason.id
                                  ? "border-rose-500 bg-rose-50 shadow-lg"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-12 h-12 bg-gradient-to-br ${reason.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                                >
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-slate-900 block">
                                    {reason.label}
                                  </span>
                                  {reason.id === "medical" && (
                                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                      <Activity className="w-3 h-3" />
                                      Emergency medical support
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">
                        Describe your situation (optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, 200))
                        }
                        placeholder="Additional details to help volunteers assist you better..."
                        rows={4}
                        maxLength={200}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none transition-all"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        {description.length}/200 characters
                      </p>
                    </div>

                    <button
                      onClick={() => setShowMedicalHelp(true)}
                      disabled={!selectedReason}
                      className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white py-5 rounded-xl text-lg hover:shadow-xl hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Help Request
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 border-2 border-rose-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 mb-2">
                        Trained Volunteers Ready
                      </h4>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        Our volunteers are trained professionals ready to assist
                        you. Response time is typically under 5 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Privacy Footer */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Controls
              </h4>
              <ul className="space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Location shared only on approval
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  All sharing is temporary
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  No identity tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Cancel anytime
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-3xl">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-8 h-8" />
                <h3 className="text-2xl">Location Request</h3>
              </div>
              <p className="text-blue-100">Someone wants to find you</p>
            </div>

            <div className="p-8">
              <p className="text-slate-900 text-lg mb-2">
                &quot;{personName || (contactInfo ? contactInfo : "Someone")}
                &quot; wants to find you in the event.
              </p>
              <p className="text-slate-600 mb-6">
                Do you want to share your location temporarily?
              </p>

              {findMessage && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-blue-900 text-sm mb-1">Their message:</p>
                  <p className="text-blue-800 italic">
                    &quot;{findMessage}&quot;
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-900 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  You can stop sharing anytime
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConsentResponse(false)}
                  className="py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={() => handleConsentResponse(true)}
                  className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Allow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
