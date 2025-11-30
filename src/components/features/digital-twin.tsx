import { SetStateAction, useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Play, Pause, RotateCcw, Settings, Download, Video, BarChart3, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { scenariosData, simulationParameters } from '../../data/predictive-simulation-data';
import { toast } from 'sonner';

export function DigitalTwin() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(simulationParameters.speedMultiplier);
  const [simulationTime, setSimulationTime] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [agentCount, setAgentCount] = useState(simulationParameters.totalAgents);
  const [arrivalRate, setArrivalRate] = useState(simulationParameters.arrivalRatePerMinute);

  // Real-time simulation synchronization
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('simulation:update', (data: any) => {
      setSimulationTime(data.simulationTime);
      if (data.agentCount) setAgentCount(data.agentCount);
    });

    socket.on('simulation:scenario-triggered', (data: any) => {
      toast.warning(`Scenario triggered: ${data.scenarioName}`, {
        description: data.description,
      });
    });

    if (isPlaying) {
      socket.emit('simulation:start', {
        scenarioId: selectedScenario,
        speed: playbackSpeed,
        agentCount,
        arrivalRate,
      });
    } else {
      socket.emit('simulation:pause');
    }

    return () => {
      socket.off('simulation:update');
      socket.off('simulation:scenario-triggered');
    };
  }, [isPlaying, selectedScenario, playbackSpeed, agentCount, arrivalRate]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-16 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>Digital Twin Simulation</h2>
          <Badge className="bg-[#0B3D91] text-white">
            <Video className="w-3 h-3 mr-1" />
            Simulation Mode
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-80 bg-card border-r overflow-y-auto">
          <Tabs defaultValue="scenarios" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="scenarios" className="flex-1">
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="controls" className="flex-1">
                Controls
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="flex-1 p-4 space-y-3">
              <div>
                <h4 className="mb-3">Preset Scenarios</h4>
                <div className="space-y-2">
                  {scenariosData.map((scenario) => {
                    const Icon = scenario.icon;
                    return (
                      <Card
                        key={scenario.id}
                        className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                          selectedScenario === scenario.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedScenario(scenario.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              scenario.severity === 'critical'
                                ? 'bg-[#E02D2D]/10'
                                : scenario.severity === 'high'
                                  ? 'bg-[#F59E0B]/10'
                                  : 'bg-[#0B3D91]/10'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                scenario.severity === 'critical'
                                  ? 'text-[#E02D2D]'
                                  : scenario.severity === 'high'
                                    ? 'text-[#F59E0B]'
                                    : 'text-[#0B3D91]'
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <h4>{scenario.name}</h4>
                            <p className="text-muted-foreground mt-1">{scenario.description}</p>
                            <Badge
                              variant="outline"
                              className={`mt-2 ${
                                scenario.severity === 'critical'
                                  ? 'bg-[#E02D2D]/10 text-[#E02D2D]'
                                  : scenario.severity === 'high'
                                    ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                    : 'bg-[#0B3D91]/10 text-[#0B3D91]'
                              }`}
                            >
                              {scenario.severity}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {selectedScenario && (
                <Button
                  className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                  onClick={() => {
                    setIsPlaying(true);
                    setSimulationTime(0);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Scenario
                </Button>
              )}
            </TabsContent>

            <TabsContent value="controls" className="flex-1 p-4 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-count">Agent Count</Label>
                  <Input
                    id="agent-count"
                    type="number"
                    value={agentCount}
                    onChange={(e) => setAgentCount(parseInt(e.target.value))}
                  />
                  <p className="text-muted-foreground">Number of simulated attendees</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival-rate">Arrival Rate (per min)</Label>
                  <div className="space-y-2">
                    <Slider
                      id="arrival-rate"
                      value={[arrivalRate]}
                      onValueChange={(v: SetStateAction<number>[]) => setArrivalRate(v[0])}
                      min={10}
                      max={200}
                      step={10}
                    />
                    <p className="text-muted-foreground">{arrivalRate} agents/min</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Simulation Speed</Label>
                  <div className="flex gap-2">
                    {[0.5, 1, 2, 5].map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackSpeed === speed ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setPlaybackSpeed(speed)}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Weather Conditions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                    <Button variant="outline" size="sm">
                      Rain
                    </Button>
                    <Button variant="outline" size="sm">
                      Hot
                    </Button>
                    <Button variant="outline" size="sm">
                      Night
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gate Configuration</Label>
                  <div className="space-y-2">
                    {['Gate A', 'Gate B', 'Gate C'].map((gate) => (
                      <div key={gate} className="flex items-center gap-2">
                        <input type="checkbox" id={gate} defaultChecked className="w-4 h-4" />
                        <Label htmlFor={gate} className="font-normal cursor-pointer flex-1">
                          {gate}
                        </Label>
                        <span className="text-muted-foreground text-sm">Open</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Simulation Canvas */}
        <div className="flex-1 relative bg-[#E5E7EB]">
          {/* Simulated 2D View */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#D1D5DB 1px, transparent 1px), linear-gradient(90deg, #D1D5DB 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* Venue Zones */}
            <div className="absolute left-[20%] top-[30%] w-64 h-40 border-2 border-primary rounded-lg bg-primary/10">
              <Badge className="m-2">Main Stage</Badge>
            </div>
            <div className="absolute left-[50%] top-[45%] w-48 h-32 border-2 border-[#F59E0B] rounded-lg bg-[#F59E0B]/10">
              <Badge className="m-2">Food Court</Badge>
            </div>
            <div className="absolute left-[65%] top-[25%] w-40 h-32 border-2 border-[#16A34A] rounded-lg bg-[#16A34A]/10">
              <Badge className="m-2">VIP Area</Badge>
            </div>

            {/* Simulated Agents (dots) */}
            {isPlaying &&
              Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-[#0B3D91] rounded-full transition-all duration-1000"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${25 + Math.random() * 50}%`,
                    opacity: 0.6,
                  }}
                />
              ))}

            {/* Heatmap Overlay */}
            {isPlaying && (
              <>
                <div
                  className="absolute left-[22%] top-[32%] w-60 h-36 rounded-xl animate-pulse-soft"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(224, 45, 45, 0.3) 0%, rgba(224, 45, 45, 0.1) 70%, transparent 100%)',
                  }}
                />
                <div
                  className="absolute left-[52%] top-[47%] w-44 h-28 rounded-xl animate-pulse-soft"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 70%, transparent 100%)',
                    animationDelay: '0.5s',
                  }}
                />
              </>
            )}

            {/* Synthetic Camera View Toggle */}
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="sm" className="bg-white shadow-lg">
                <Video className="w-4 h-4 mr-2" />
                Camera View
              </Button>
            </div>

            {/* Playback Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-96">
              <Card className="p-4 bg-white/95 backdrop-blur">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[simulationTime]}
                      onValueChange={(v: SetStateAction<number>[]) => setSimulationTime(v[0])}
                      max={100}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setIsPlaying(false);
                        setSimulationTime(0);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>00:00</span>
                    <span>{playbackSpeed}x speed</span>
                    <span>30:00</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Event Markers on Timeline */}
            {isPlaying && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
                <Badge variant="destructive" className="animate-pulse">
                  Gate surge detected at 12:34
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Stats */}
        <div className="w-80 bg-card border-l overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-card z-10">
            <h3>Live Metrics</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* KPIs */}
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground">Simulated Time</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="text-foreground">
                      {Math.floor(simulationTime / 60)}:{(simulationTime % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Attendance</p>
                  <p className="text-foreground">{isPlaying ? '3,847' : '0'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Evacuation ETA</p>
                  <p className="text-foreground">{isPlaying ? '8.5 min' : '--'}</p>
                </div>
              </div>
            </Card>

            {/* Zone Statistics */}
            <div className="space-y-3">
              <h4>Zone Density</h4>
              {['Main Stage', 'Food Court', 'VIP Area'].map((zone, i) => {
                const values = [82, 65, 43];
                const value = isPlaying ? values[i] : 0;
                return (
                  <Card key={zone} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground">{zone}</span>
                        <span
                          className={value > 80 ? 'text-[#E02D2D]' : value > 60 ? 'text-[#F59E0B]' : 'text-[#16A34A]'}
                        >
                          {value}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            value > 80 ? 'bg-[#E02D2D]' : value > 60 ? 'bg-[#F59E0B]' : 'bg-[#16A34A]'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Event Log */}
            <div className="space-y-3">
              <h4>Event Log</h4>
              <Card className="p-3">
                <div className="space-y-2 text-sm">
                  {isPlaying ? (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">12:34</span>
                        <span className="text-[#E02D2D]">Gate surge detected</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">12:15</span>
                        <span className="text-foreground">Main stage opened</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">12:00</span>
                        <span className="text-foreground">Gates opened</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No events yet</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Analytics Summary */}
            {isPlaying && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4>Simulation Insights</h4>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• Peak density: 92% at Main Stage</li>
                      <li>• Evacuation time: 8.5 min</li>
                      <li>• Bottleneck detected: Gate A</li>
                      <li>• Suggestion: Open Gate D</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
