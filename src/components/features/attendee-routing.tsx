import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Navigation,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowRight,
  Info,
  Route,
  X,
  Plus,
  Phone
} from "lucide-react";
import { StatusChip } from "../shared/status-chip";

interface Gate {
  id: string;
  name: string;
  crowdLevel: "low" | "medium" | "high";
  eta: string;
  distance: string;
  waitTime: string;
}

interface NavigationStep {
  instruction: string;
  distance: string;
  safetyNote?: string;
}

export function AttendeeRouting() {
  const [currentView, setCurrentView] = useState<"home" | "gate-selection" | "navigation" | "emergency">("home");
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [eventStatus] = useState<"safe" | "caution" | "critical">("safe");

  const gates: Gate[] = [
    { id: "A", name: "Gate A - Main Entrance", crowdLevel: "high", eta: "12 min", distance: "850m", waitTime: "~8 min" },
    { id: "B", name: "Gate B - North Entrance", crowdLevel: "low", eta: "15 min", distance: "1.1km", waitTime: "~2 min" },
    { id: "C", name: "Gate C - VIP Entrance", crowdLevel: "medium", eta: "10 min", distance: "720m", waitTime: "~5 min" },
  ];

  const navigationSteps: NavigationStep[] = [
    { instruction: "Head north on Main Street", distance: "250m" },
    { instruction: "Turn right onto Festival Avenue", distance: "180m", safetyNote: "Watch for pedestrian crossing" },
    { instruction: "Continue straight past the parking lot", distance: "200m" },
    { instruction: "Gate B entrance will be on your left", distance: "90m" },
  ];

  const selectedGateData = gates.find(g => g.id === selectedGate);

  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-card border-b p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="mb-2">Summer Music Festival 2025</h1>
            <div className="flex items-center gap-2">
              <StatusChip status={eventStatus} showIcon />
              <span className="text-muted-foreground">
                {eventStatus === "safe" && "All systems normal"}
                {eventStatus === "caution" && "Moderate crowd levels"}
                {eventStatus === "critical" && "High crowd density - follow instructions"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Event Info Card */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2>Welcome to the Festival!</h2>
                    <p className="text-muted-foreground mt-1">
                      Get real-time navigation and safety updates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <div>
                    <p className="text-muted-foreground">Event Start</p>
                    <p className="text-foreground">3:00 PM Today</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Attendance</p>
                    <p className="text-foreground">8,432 / 12,000</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Navigation Options */}
            <div className="space-y-3">
              <h3>Navigation</h3>
              
              <Button
                className="w-full h-auto p-6 justify-start bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                onClick={() => setCurrentView("gate-selection")}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white">Navigate to Venue</p>
                    <p className="text-white/80">Get directions to the best entrance</p>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-6 justify-start"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-foreground">Navigate Inside Venue</p>
                    <p className="text-muted-foreground">Find stages, facilities & more</p>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-6 justify-start border-[#E02D2D] hover:bg-[#E02D2D]/5"
                onClick={() => setCurrentView("emergency")}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-[#E02D2D]/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-[#E02D2D]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-foreground">Emergency Exit Route</p>
                    <p className="text-muted-foreground">Quick access to nearest exit</p>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </div>

            {/* Safety Tips */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4>Safety Tips</h4>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Stay hydrated and use designated water stations</li>
                    <li>• Keep your phone charged for navigation</li>
                    <li>• Note the nearest medical tent location</li>
                    <li>• Follow crowd flow and staff instructions</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "gate-selection") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-card border-b p-6">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => setCurrentView("home")} className="mb-3">
              ← Back
            </Button>
            <h2>Select Entry Gate</h2>
            <p className="text-muted-foreground mt-1">
              Choose the best entrance based on current crowd levels
            </p>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {gates.map((gate) => (
              <Card
                key={gate.id}
                className={`p-6 cursor-pointer hover:shadow-lg transition-all ${
                  selectedGate === gate.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedGate(gate.id)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3>{gate.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            gate.crowdLevel === "low"
                              ? "bg-[#16A34A]/10 text-[#16A34A]"
                              : gate.crowdLevel === "medium"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                              : "bg-[#E02D2D]/10 text-[#E02D2D]"
                          }
                        >
                          {gate.crowdLevel === "low" && "Low Crowd"}
                          {gate.crowdLevel === "medium" && "Moderate Crowd"}
                          {gate.crowdLevel === "high" && "Busy"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Navigation className="w-4 h-4" />
                            <span>Distance</span>
                          </div>
                          <p className="text-foreground">{gate.distance}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Clock className="w-4 h-4" />
                            <span>ETA</span>
                          </div>
                          <p className="text-foreground">{gate.eta}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="w-4 h-4" />
                            <span>Wait Time</span>
                          </div>
                          <p className="text-foreground">{gate.waitTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {gate.crowdLevel === "low" && (
                    <div className="flex items-center gap-2 p-3 bg-[#16A34A]/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                      <span className="text-[#16A34A]">Recommended - Shortest wait time</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {selectedGate && (
              <Button
                className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 h-14"
                onClick={() => setCurrentView("navigation")}
              >
                <Navigation className="w-5 h-5 mr-2" />
                Start Navigation to Gate {selectedGate}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "navigation") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Map View */}
        <div className="h-96 bg-[#E5E7EB] relative">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(#D1D5DB 1px, transparent 1px), linear-gradient(90deg, #D1D5DB 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Route Line */}
          <svg className="absolute inset-0 w-full h-full">
            <path
              d="M 80 300 Q 150 250 200 200 T 350 150"
              stroke="#FF6A00"
              strokeWidth="4"
              fill="none"
              strokeDasharray="8 4"
            />
          </svg>

          {/* User Location */}
          <div className="absolute left-20 top-72 w-4 h-4 bg-[#0B3D91] rounded-full border-4 border-white shadow-lg animate-pulse" />
          
          {/* Destination */}
          <div className="absolute right-24 top-36">
            <div className="w-12 h-12 bg-[#16A34A] rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Safety Badge */}
          <div className="absolute top-4 left-4">
            <Card className="p-3 bg-white/95 backdrop-blur">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                <span className="text-foreground">Safe Route</span>
              </div>
            </Card>
          </div>

          {/* Back Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 bg-white shadow-lg"
            onClick={() => setCurrentView("gate-selection")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Instructions */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Current Step (Large) */}
            <Card className="p-6 bg-primary text-primary-foreground">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-6 h-6" />
                  <span className="text-white/80">In 250 meters</span>
                </div>
                <p className="text-white">{navigationSteps[0].instruction}</p>
                <div className="flex items-center gap-4 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-white/90">ETA: {selectedGateData?.eta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    <span className="text-white/90">{selectedGateData?.distance} remaining</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Steps */}
            <div className="space-y-2">
              <h4>Upcoming Steps</h4>
              {navigationSteps.slice(1).map((step, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      {index + 2}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">{step.instruction}</p>
                      <p className="text-muted-foreground">{step.distance}</p>
                      {step.safetyNote && (
                        <div className="flex items-center gap-2 mt-2 text-[#F59E0B]">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{step.safetyNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Offline Notice */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>Using cached route (updated 30 sec ago)</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "emergency") {
    return (
      <div className="min-h-screen bg-[#E02D2D] flex flex-col text-white">
        <div className="p-6 border-b border-white/20">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className="mb-3 text-white hover:bg-white/10"
            >
              ← Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-white">Emergency Exit Route</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Emergency Instructions */}
            <Card className="p-6 bg-white text-foreground">
              <h3 className="mb-4">Stay Calm - Follow These Steps</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E02D2D] text-white flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Stay with your group if possible</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E02D2D] text-white flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>Follow staff instructions and exit signs</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E02D2D] text-white flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>Do not run - walk quickly and calmly</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E02D2D] text-white flex items-center justify-center flex-shrink-0">
                    4
                  </span>
                  <span>Once outside, move away from the building</span>
                </li>
              </ol>
            </Card>

            {/* Nearest Exit */}
            <Card className="p-6 bg-white text-foreground border-4 border-[#16A34A]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#16A34A] rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3>Nearest Exit: Exit E3</h3>
                  <p className="text-muted-foreground">120 meters away</p>
                </div>
              </div>
              
              <Button className="w-full h-14 bg-[#16A34A] hover:bg-[#16A34A]/90">
                <Navigation className="w-5 h-5 mr-2" />
                Show Exit Route
              </Button>
            </Card>

            {/* Emergency Contacts */}
            <Card className="p-6 bg-white text-foreground">
              <h4 className="mb-3">Emergency Contacts</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-[#E02D2D]/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#E02D2D]" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground">Emergency Services</p>
                      <p className="text-muted-foreground">911</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-foreground">Event Security</p>
                      <p className="text-muted-foreground">(555) 123-4567</p>
                    </div>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}