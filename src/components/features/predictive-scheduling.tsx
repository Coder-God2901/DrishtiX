import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Users,
  Zap,
  Info,
  Calendar,
  CheckCircle
} from "lucide-react";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { recommendationsData, forecastOutputs } from "../../data/predictive-simulation-data";

interface Recommendation {
  id: string;
  zone: string;
  action: string;
  expectedImpact: number;
  confidence: number;
  drivers: { icon: any; label: string; }[];
  timeHorizon: string;
  forecast: number[];
}

export function PredictiveScheduling() {
  const [recommendations] = useState(recommendationsData);

  const [expandedExplainer, setExpandedExplainer] = useState<string | null>(null);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1>Predictive Scheduling AI</h1>
            <Badge className="bg-[#FF6A00] text-white">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-muted-foreground">
            AI-generated recommendations to optimize operations and prevent incidents
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#FF6A00]" />
              </div>
              <div>
                <p className="text-muted-foreground">Active Recommendations</p>
                <p className="text-foreground">{recommendations.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-muted-foreground">Approved Today</p>
                <p className="text-foreground">12</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0B3D91]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B3D91]" />
              </div>
              <div>
                <p className="text-muted-foreground">Avg Confidence</p>
                <p className="text-foreground">86%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-muted-foreground">Impact Reduction</p>
                <p className="text-foreground">-32%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommendations">Active Recommendations</TabsTrigger>
            <TabsTrigger value="forecast">Zone Forecasts</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{rec.zone}</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.timeHorizon}
                        </Badge>
                      </div>
                      <h3>{rec.action}</h3>
                    </div>

                    {/* Confidence Ring */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - rec.confidence / 100)}`}
                            className="text-[#FF6A00]"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-foreground">{rec.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1">Confidence</p>
                    </div>
                  </div>

                  {/* Forecast Sparkline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Predicted Density</span>
                      <span className="text-foreground">{rec.forecast[3]}% peak</span>
                    </div>
                    <div className="h-16 flex items-end gap-1">
                      {rec.forecast.map((value, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-all ${
                            value > 80 ? "bg-[#E02D2D]" :
                            value > 60 ? "bg-[#F59E0B]" :
                            "bg-[#16A34A]"
                          }`}
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Now</span>
                      <span>+5m</span>
                      <span>+10m</span>
                      <span>+15m</span>
                      <span>+20m</span>
                      <span>+30m</span>
                    </div>
                  </div>

                  {/* Expected Impact */}
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Expected Impact</span>
                      <span className="text-[#16A34A]">{rec.expectedImpact}% density</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.abs(rec.expectedImpact)} className="flex-1" />
                      <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                    </div>
                  </div>

                  {/* Drivers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Info className="w-4 h-4" />
                      <span>Top Drivers</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.drivers.map((driver, i) => {
                        const Icon = driver.icon;
                        return (
                          <Badge key={i} variant="outline" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {driver.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explainability */}
                  {expandedExplainer === rec.id && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3 animate-fade-in">
                      <h4>Model Explanation</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Gate A inflow rate</span>
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <Progress value={85} className="flex-1" />
                            <span className="text-foreground">85%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Historical patterns (3pm)</span>
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <Progress value={72} className="flex-1" />
                            <span className="text-foreground">72%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Weather conditions</span>
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <Progress value={58} className="flex-1" />
                            <span className="text-foreground">58%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground italic">
                        "The model predicts high density due to concert start time coinciding with peak arrival patterns and warm weather driving indoor food court traffic."
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" className="flex-1 bg-[#FF6A00] text-white hover:bg-[#FF6A00]/90">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                    <Button variant="ghost">
                      Ignore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedExplainer(
                        expandedExplainer === rec.id ? null : rec.id
                      )}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <h3>30-Minute Zone Forecasts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["Main Stage", "Food Court", "VIP Area", "Gate A", "Gate B", "Parking"].map((zone) => (
                    <Card key={zone} className="p-4">
                      <h4 className="mb-3">{zone}</h4>
                      <div className="h-24 flex items-end gap-1">
                        {[45, 62, 78, 92, 85, 73, 68, 55].map((value, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t ${
                              value > 80 ? "bg-[#E02D2D]" :
                              value > 60 ? "bg-[#F59E0B]" :
                              "bg-[#16A34A]"
                            }`}
                            style={{ height: `${value}%` }}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-muted-foreground">Peak: 92%</span>
                        <span className="text-muted-foreground">+15m</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h3 className="mb-4">Recent Actions</h3>
              <div className="space-y-3">
                {[
                  { action: "Delayed Main Stage opening by 5 min", result: "✓ Reduced density by 38%", time: "30 min ago" },
                  { action: "Deployed 2 security teams to Gate A", result: "✓ Cleared congestion in 12 min", time: "1 hour ago" },
                  { action: "Opened emergency exit E3", result: "✓ Improved evacuation ETA by 3 min", time: "2 hours ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-foreground">{item.action}</p>
                      <p className="text-[#16A34A]">{item.result}</p>
                    </div>
                    <span className="text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
