import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
  Activity,
  Droplet,
  Wind,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Users,
  CheckCircle,
  Radio,
  Navigation,
  Shield,
  Lock,
  Eye,
  Zap,
  Loader,
  Ambulance,
  UserPlus,
} from "lucide-react";
import { createMedicalIncident } from "../../services/incidentManagementService";

interface MedicalAssistanceSystemProps {
  onBack: () => void;
}

type MedicalStatus =
  | "idle"
  | "searching"
  | "assigned"
  | "approaching"
  | "nearby"
  | "arrived";

interface MedicalResponder {
  name: string;
  role: string;
  eta: number;
  distance: number;
  location: string;
}

interface MedicalType {
  id: string;
  icon: any;
  label: string;
  description: string;
  color: string;
  urgent: boolean;
}

export function MedicalAssistanceSystem({
  onBack,
}: MedicalAssistanceSystemProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [helpingOther, setHelpingOther] = useState(false);
  const [status, setStatus] = useState<MedicalStatus>("idle");
  const [responder, setResponder] = useState<MedicalResponder | null>(null);

  const currentZone = "Zone C";
  const nearbyLandmark = "Food Court";

  const medicalTypes: MedicalType[] = [
    {
      id: "fainting",
      icon: Activity,
      label: "Fainting / Dizziness",
      description: "Loss of balance or consciousness",
      color: "from-purple-500 to-purple-600",
      urgent: true,
    },
    {
      id: "injury",
      icon: Droplet,
      label: "Injury / Bleeding",
      description: "Cuts, wounds, or bleeding",
      color: "from-red-500 to-red-600",
      urgent: true,
    },
    {
      id: "heatstroke",
      icon: Wind,
      label: "Fever / Heatstroke",
      description: "High temperature or dehydration",
      color: "from-orange-500 to-orange-600",
      urgent: false,
    },
    {
      id: "breathing",
      icon: Heart,
      label: "Heart / Breathing",
      description: "Chest pain or difficulty breathing",
      color: "from-red-600 to-rose-700",
      urgent: true,
    },
    {
      id: "general",
      icon: AlertCircle,
      label: "General Emergency",
      description: "Other medical concerns",
      color: "from-blue-500 to-indigo-600",
      urgent: false,
    },
  ];

  const handleSubmitRequest = () => {
    if (!selectedType) return;

    // Get the selected medical type details
    const selectedMedicalTypeObj = medicalTypes.find(
      (t) => t.id === selectedType
    );
    const medicalTypeLabel =
      selectedMedicalTypeObj?.label || "Medical Emergency";

    // Create incident in the organizer dashboard
    createMedicalIncident(
      medicalTypeLabel,
      `${currentZone} - Near ${nearbyLandmark}`,
      currentZone,
      symptoms || `Medical assistance requested: ${medicalTypeLabel}`,
      isUrgent || selectedMedicalTypeObj?.urgent,
      {
        isHelpingOther: helpingOther,
      }
    );

    setStatus("searching");

    setTimeout(() => {
      setStatus("assigned");
      setResponder({
        name:
          isUrgent || selectedType === "breathing" || selectedType === "injury"
            ? "Dr. Arjun Mehta"
            : "Nurse Priya Singh",
        role:
          isUrgent || selectedType === "breathing" || selectedType === "injury"
            ? "Emergency Physician"
            : "Medical Responder",
        eta: isUrgent ? 2 : 3,
        distance: 180,
        location: "Gate D Medical Post",
      });

      setTimeout(() => setStatus("approaching"), 3000);
      setTimeout(() => setStatus("nearby"), 7000);
      setTimeout(() => setStatus("arrived"), 10000);
    }, 2500);
  };

  // Update responder distance
  useEffect(() => {
    if (status === "approaching" && responder) {
      const interval = setInterval(() => {
        setResponder((prev) =>
          prev
            ? {
                ...prev,
                distance: Math.max(5, prev.distance - Math.random() * 20),
                eta: Math.max(0, prev.eta - 0.3),
              }
            : null
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status, responder]);

  const selectedMedicalType = medicalTypes.find((t) => t.id === selectedType);
  const needsAmbulance =
    isUrgent || selectedType === "breathing" || selectedType === "injury";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/20">
      {/* Header */}
      <header className="bg-white border-b-4 border-red-500 sticky top-0 z-50 shadow-lg">
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
                <Heart className="w-6 h-6 text-red-600 animate-pulse" />
                Medical Assistance
              </h1>
              <p className="text-slate-600 text-sm">
                Immediate access to on-ground medical support
              </p>
            </div>
            <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full border border-red-300">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 text-sm">Emergency Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {status === "idle" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            {/* Step 1: Medical Type Selection */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
                <h2 className="text-2xl mb-2 flex items-center gap-2">
                  <Activity className="w-7 h-7" />
                  What kind of help do you need?
                </h2>
                <p className="text-red-100">
                  Select the type of medical assistance required
                </p>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {medicalTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-left group ${
                          selectedType === type.id
                            ? "border-red-500 bg-red-50 shadow-xl scale-105"
                            : "border-slate-200 hover:border-red-300 hover:bg-slate-50"
                        }`}
                      >
                        {type.urgent && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                              Urgent
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-slate-900 mb-1">
                              {type.label}
                            </h3>
                            <p className="text-slate-600 text-sm">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Helping Someone Else Option */}
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={helpingOther}
                      onChange={(e) => setHelpingOther(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-2 border-blue-400 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      <span className="text-slate-900">
                        I am helping someone else
                      </span>
                    </div>
                  </label>
                  {helpingOther && (
                    <div className="mt-3 pl-8 text-sm text-blue-900 bg-blue-100 border border-blue-200 rounded-lg p-3 animate-in fade-in duration-300">
                      <p className="mb-1">
                        💡 <strong>Important:</strong>
                      </p>
                      <p>
                        If the person is unconscious, do not move them. Help is
                        coming.
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Optional Details */}
                <div className="mb-6">
                  <label className="block text-slate-900 mb-2 text-lg">
                    Describe symptoms{" "}
                    <span className="text-slate-500 text-sm">(Optional)</span>
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value.slice(0, 200))}
                    placeholder="Any additional details that can help the medical team..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
                  />
                  <p className="text-slate-500 text-sm mt-1">
                    {symptoms.length}/200 characters
                  </p>
                </div>

                {/* Urgent Checkbox */}
                <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="w-5 h-5 text-red-600 border-2 border-orange-400 rounded focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span className="text-slate-900">
                        I need urgent assistance
                      </span>
                    </div>
                  </label>
                </div>

                {/* Step 3: Location Confirmation */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-slate-900 mb-1">Your Location</h4>
                      <p className="text-slate-900 text-lg">{currentZone}</p>
                      <p className="text-slate-600 text-sm">
                        Near: {nearbyLandmark}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm flex items-center gap-2 pl-9">
                    <Lock className="w-4 h-4 text-slate-500" />
                    Location is only used for medical dispatch
                  </p>
                </div>

                {/* Step 4: Submit Button */}
                <button
                  onClick={handleSubmitRequest}
                  disabled={!selectedType}
                  className={`w-full py-6 rounded-xl text-xl transition-all flex items-center justify-center gap-3 ${
                    selectedType
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-2xl hover:from-red-700 hover:to-rose-700 transform hover:scale-105"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Zap className="w-6 h-6" />
                  <span>🚨 Request Medical Assistance</span>
                </button>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg mb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Your Privacy is Protected
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-200">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      No tracking after assistance
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Data deleted after help
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      No public display
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      HIPAA-compliant protocols
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Searching State */}
        {status === "searching" && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 p-12 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Radio className="w-12 h-12 text-white animate-pulse" />
              </div>
              <h3 className="text-slate-900 text-2xl mb-3">
                📡 Searching for nearest medical responder...
              </h3>
              <p className="text-slate-600 mb-2">
                Connecting you with emergency medical services
              </p>
              <div className="flex items-center justify-center gap-1 mt-4">
                <div
                  className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Assigned & Tracking States */}
        {(status === "assigned" ||
          status === "approaching" ||
          status === "nearby" ||
          status === "arrived") &&
          responder && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Medical Team Card */}
              <div className="bg-white rounded-2xl shadow-xl border-4 border-green-300 overflow-hidden">
                <div
                  className={`p-6 text-white ${
                    status === "arrived"
                      ? "bg-gradient-to-r from-green-600 to-emerald-700"
                      : status === "nearby"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        {status === "arrived" ? (
                          <CheckCircle className="w-8 h-8 animate-pulse" />
                        ) : needsAmbulance ? (
                          <Ambulance className="w-8 h-8" />
                        ) : (
                          <Heart className="w-8 h-8 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl mb-1">
                          {status === "arrived" && "✅ Medical Team Arrived"}
                          {status === "nearby" && "📍 Medical Team Nearby"}
                          {status === "approaching" &&
                            "🚑 Medical Team Approaching"}
                          {status === "assigned" && "✅ Medical Team Assigned"}
                        </h3>
                        <p
                          className={`text-sm ${
                            status === "arrived"
                              ? "text-green-100"
                              : status === "nearby"
                              ? "text-orange-100"
                              : "text-rose-100"
                          }`}
                        >
                          {status === "arrived" && "Professional help is here"}
                          {status === "nearby" && "Almost at your location"}
                          {status === "approaching" && "On the way to you"}
                          {status === "assigned" &&
                            "Emergency response activated"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs mb-1 opacity-80">
                        Medical Professional
                      </p>
                      <p className="text-lg">{responder.name}</p>
                      <p className="text-xs opacity-80">{responder.role}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs mb-1 opacity-80">ETA</p>
                      <p className="text-2xl">
                        {status === "arrived" ? "0" : Math.ceil(responder.eta)}
                      </p>
                      <p className="text-xs opacity-80">minutes</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xs mb-1 opacity-80">Distance</p>
                      <p className="text-2xl">
                        {Math.round(responder.distance)}
                      </p>
                      <p className="text-xs opacity-80">meters</p>
                    </div>
                  </div>
                </div>

                {/* Live Tracking Map */}
                <div className="p-8">
                  <div className="mb-6">
                    <p className="text-slate-600 text-sm mb-2">Coming from</p>
                    <p className="text-slate-900 text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      {responder.location}
                    </p>
                  </div>

                  {/* Mini Map */}
                  <div
                    className="bg-gradient-to-br from-slate-100 to-red-50 rounded-xl p-8 mb-6 relative"
                    style={{ height: "400px" }}
                  >
                    <div className="absolute inset-0 opacity-10">
                      <svg width="100%" height="100%">
                        <defs>
                          <pattern
                            id="medical-grid"
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
                          fill="url(#medical-grid)"
                        />
                      </svg>
                    </div>

                    {/* Patient location */}
                    <div className="absolute bottom-8 right-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                        {helpingOther ? (
                          <Users className="w-10 h-10 text-white" />
                        ) : (
                          <User className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-slate-700 bg-white px-3 py-1 rounded-lg border-2 border-blue-300 shadow-lg">
                        {helpingOther ? "Patient" : "You"}
                      </span>
                    </div>

                    {/* Medical responder location */}
                    <div
                      className="absolute transition-all duration-1000"
                      style={{
                        left:
                          status === "arrived"
                            ? "75%"
                            : status === "nearby"
                            ? "55%"
                            : status === "approaching"
                            ? "30%"
                            : "10%",
                        top:
                          status === "arrived"
                            ? "70%"
                            : status === "nearby"
                            ? "50%"
                            : status === "approaching"
                            ? "35%"
                            : "15%",
                      }}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                        {needsAmbulance ? (
                          <Ambulance className="w-10 h-10 text-white" />
                        ) : (
                          <Heart className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="bg-white px-3 py-1 rounded-lg text-sm text-slate-900 shadow-lg border-2 border-red-300">
                          {responder.name.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    {/* Route line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1={
                          status === "arrived"
                            ? "75%"
                            : status === "nearby"
                            ? "55%"
                            : status === "approaching"
                            ? "30%"
                            : "10%"
                        }
                        y1={
                          status === "arrived"
                            ? "70%"
                            : status === "nearby"
                            ? "50%"
                            : status === "approaching"
                            ? "35%"
                            : "15%"
                        }
                        x2="85%"
                        y2="85%"
                        stroke="url(#medical-route-gradient)"
                        strokeWidth="4"
                        strokeDasharray="10 5"
                        className="animate-pulse"
                      />
                      <defs>
                        <linearGradient
                          id="medical-route-gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Legend */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-slate-200">
                      <p className="text-slate-900 text-sm mb-2">
                        Live Tracking
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span className="text-slate-700">
                            {helpingOther ? "Patient" : "You"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span className="text-slate-700">Medical Team</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {status === "arrived" ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 mb-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-900 mb-2">
                            <strong>Medical professional has arrived</strong>
                          </p>
                          <p className="text-green-800 text-sm">
                            You are in professional hands. The medical team will
                            provide immediate care.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 mb-4">
                      <div className="flex items-start gap-3">
                        <Navigation className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-900 mb-2">
                            <strong>Stay at your current location</strong>
                          </p>
                          <p className="text-blue-800 text-sm">
                            {helpingOther
                              ? "Keep the person calm and comfortable. Don't move them unless necessary."
                              : "Stay calm. Medical help is on the way and will reach you shortly."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Medical Type Info */}
                  {selectedMedicalType && (
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 mb-4">
                      <p className="text-slate-600 text-sm mb-1">
                        Emergency Type
                      </p>
                      <p className="text-slate-900">
                        {selectedMedicalType.label}
                      </p>
                      {symptoms && (
                        <>
                          <p className="text-slate-600 text-sm mt-3 mb-1">
                            Symptoms reported
                          </p>
                          <p className="text-slate-900 text-sm italic">
                            &quot;{symptoms}&quot;
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Instructions */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-slate-900 mb-2">While you wait:</h4>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• Stay calm and keep breathing normally</li>
                      <li>• If possible, sit or lie down comfortably</li>
                      <li>• Keep your phone nearby and charged</li>
                      {helpingOther && (
                        <li>• Monitor the person&apos;s condition</li>
                      )}
                      <li>• Medical team will call if they need directions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
