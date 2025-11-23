import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  AlertCircle, 
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Radio,
  Play,
  Pause,
  PhoneCall,
  Filter,
  X,
  Plus
} from "lucide-react";
import { KPICard } from "../shared/kpi-card";
import { StatusChip } from "../shared/status-chip";
import { Slider } from "../ui/slider";

interface Alert {
  id: string;
  type: "critical" | "high" | "info";
  title: string;
  zone: string;
  time: string;
  confidence: number;
  suggestedAction: string;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: { x: number; y: number };
  status: "active" | "responding" | "available";
}

export function OperationsDashboard() {
  const [selectedEvent] = useState("Summer Music Festival 2025");
  const [timeMode, setTimeMode] = useState<"live" | "replay" | "simulation">("live");
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      type: "critical",
      title: "High crowd density detected",
      zone: "Main Stage",
      time: "2 min ago",
      confidence: 92,
      suggestedAction: "Deploy security team & close entry"
    },
    {
      id: "2",
      type: "high",
      title: "Medical incident reported",
      zone: "Food Court",
      time: "5 min ago",
      confidence: 87,
      suggestedAction: "Dispatch medical team"
    },
    {
      id: "3",
      type: "info",
      title: "Gate A throughput optimal",
      zone: "Gate A",
      time: "10 min ago",
      confidence: 95,
      suggestedAction: "Continue monitoring"
    },
  ]);

  const [teamMembers] = useState<TeamMember[]>([
    { id: "1", name: "John Smith", initials: "JS", role: "Security", location: { x: 25, y: 30 }, status: "active" },
    { id: "2", name: "Sarah Johnson", initials: "SJ", role: "Security", location: { x: 45, y: 40 }, status: "responding" },
    { id: "3", name: "Dr. Emily Chen", initials: "EC", role: "Medical", location: { x: 60, y: 55 }, status: "available" },
    { id: "4", name: "Mike Rodriguez", initials: "MR", role: "Logistics", location: { x: 35, y: 65 }, status: "active" },
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{selectedEvent}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={timeMode === "live" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeMode("live")}
            >
              <Radio className="w-4 h-4 mr-2" />
              Live
            </Button>
            <Button
              variant={timeMode === "replay" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeMode("replay")}
            >
              <Play className="w-4 h-4 mr-2" />
              Replay
            </Button>
            <Button
              variant={timeMode === "simulation" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeMode("simulation")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Simulation
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-[#16A34A]/10 text-[#16A34A]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Organizer
          </Badge>
          <Button variant="destructive" size="sm">
            <PhoneCall className="w-4 h-4 mr-2" />
            SOS
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Alerts Panel */}
        <div className="w-80 bg-card border-r overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between mb-3">
              <h3>Alerts</h3>
              <Button variant="ghost" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-xs">
                Critical (1)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                High (1)
              </Badge>
              <Badge variant="outline" className="text-xs">
                Info (1)
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 animate-slide-in-right cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  alert.type === "critical" ? "border-l-[#E02D2D]" :
                  alert.type === "high" ? "border-l-[#F59E0B]" :
                  "border-l-[#0B3D91]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={`w-4 h-4 ${
                          alert.type === "critical" ? "text-[#E02D2D]" :
                          alert.type === "high" ? "text-[#F59E0B]" :
                          "text-[#0B3D91]"
                        }`} />
                        <span className="text-muted-foreground">{alert.time}</span>
                      </div>
                      <h4>{alert.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{alert.zone}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Confidence</span>
                      <span>{alert.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${alert.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-2">Suggested Action</p>
                    <p className="text-foreground">{alert.suggestedAction}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Modify
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Center: Map */}
        <div className="flex-1 relative bg-[#E5E7EB]">
          {/* Simulated Map with Heatmap */}
          <div className="absolute inset-0">
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'linear-gradient(#D1D5DB 1px, transparent 1px), linear-gradient(90deg, #D1D5DB 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Heatmap Zones */}
            <div 
              className="absolute left-[20%] top-[25%] w-64 h-48 rounded-2xl animate-pulse-soft"
              style={{
                background: 'radial-gradient(circle, rgba(224, 45, 45, 0.4) 0%, rgba(224, 45, 45, 0.1) 70%, transparent 100%)'
              }}
            />
            
            <div 
              className="absolute left-[50%] top-[40%] w-48 h-48 rounded-2xl animate-pulse-soft"
              style={{
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 70%, transparent 100%)',
                animationDelay: '0.5s'
              }}
            />

            <div 
              className="absolute left-[65%] top-[55%] w-40 h-40 rounded-2xl animate-pulse-soft"
              style={{
                background: 'radial-gradient(circle, rgba(22, 163, 74, 0.3) 0%, rgba(22, 163, 74, 0.1) 70%, transparent 100%)',
                animationDelay: '1s'
              }}
            />

            {/* Zone Labels */}
            <div className="absolute left-[24%] top-[30%]">
              <Badge className="bg-white/95 text-foreground shadow-lg">Main Stage</Badge>
            </div>
            <div className="absolute left-[54%] top-[45%]">
              <Badge className="bg-white/95 text-foreground shadow-lg">Food Court</Badge>
            </div>
            <div className="absolute left-[68%] top-[58%]">
              <Badge className="bg-white/95 text-foreground shadow-lg">VIP Area</Badge>
            </div>

            {/* Team Member Markers */}
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${member.location.x}%`, top: `${member.location.y}%` }}
              >
                <div className="relative">
                  <Avatar className={`border-4 ${
                    member.status === "active" ? "border-[#16A34A]" :
                    member.status === "responding" ? "border-[#FF6A00]" :
                    "border-[#0B3D91]"
                  }`}>
                    <AvatarFallback className="bg-white text-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  {member.status === "responding" && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6A00] rounded-full animate-ping" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="bg-white shadow-lg">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="bg-white shadow-lg">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <Card className="absolute bottom-4 left-4 p-4 bg-white/95 backdrop-blur">
            <h4 className="mb-3">Crowd Density</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#E02D2D]/40" />
                <span className="text-muted-foreground">Critical (~90%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#F59E0B]/30" />
                <span className="text-muted-foreground">High (70-90%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#16A34A]/30" />
                <span className="text-muted-foreground">Normal (~70%)</span>
              </div>
            </div>
          </Card>

          {/* Timeline Slider (for replay mode) */}
          {timeMode === "replay" && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-96">
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="ghost">
                    <Play className="w-4 h-4" />
                  </Button>
                  <Slider defaultValue={[50]} className="flex-1" />
                  <span className="text-muted-foreground text-sm">14:32</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right: Action Console */}
        <div className="w-80 bg-card border-l overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <h3>Action Console</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* KPIs */}
            <div className="space-y-3">
              <h4>Key Metrics</h4>
              <KPICard
                title="Current Attendance"
                value="8,432"
                subtitle="of 12,000 capacity"
                trend="up"
                trendValue="+234"
              />
              <KPICard
                title="Avg Response Time"
                value="3.2 min"
                subtitle="Last hour"
                trend="down"
                trendValue="-0.8 min"
              />
              <KPICard
                title="Active Incidents"
                value="2"
                subtitle="1 critical, 1 high"
                trend="neutral"
              />
            </div>

            {/* Team Status */}
            <div className="space-y-3">
              <h4>Team Status</h4>
              <Card className="p-4">
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground">{member.name}</p>
                          <p className="text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <StatusChip 
                        status={member.status === "active" || member.status === "responding" ? "online" : "offline"} 
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4>Quick Actions</h4>
              <div className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Radio className="w-4 h-4 mr-2" />
                  Dispatch Team
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Emergency Broadcast
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}