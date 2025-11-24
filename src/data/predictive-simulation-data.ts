// Forecast Outputs + Simulation Parameters + Simulation Heatgrid + Recommendations + Scenarios

export interface ForecastOutput {
  zoneId: string;
  timeHorizonMinutes: number;
  predictedCount: number;
  confidence: number;
  explanation: string[];
}

export interface SimulationParameters {
  totalAgents: number;
  arrivalRatePerMinute: number;
  scenario: string;
  speedMultiplier: number;
}

export interface SimulationHeatCell {
  cellId: string;
  count: number;
  mode: "simulation";
  timestamp: string;
}

export interface Recommendation {
  id: string;
  zone: string;
  action: string;
  expectedImpact: number;
  confidence: number;
  drivers: { icon: any; label: string }[];
  timeHorizon: string;
  forecast: number[];
}

export interface Scenario {
  id: string;
  name: string;
  icon: any;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

import { Users, AlertTriangle, TrendingUp, Clock, Flame, CloudRain, Video, BarChart3 } from "lucide-react";

export const forecastOutputs: ForecastOutput[] = [
  {
    zoneId: "zone_main_stage",
    timeHorizonMinutes: 15,
    predictedCount: 15500,
    confidence: 0.75,
    explanation: ["High inflow from Gate A", "Stage show starting soon"]
  }
];

export const simulationParameters: SimulationParameters = {
  totalAgents: 20000,
  arrivalRatePerMinute: 180,
  scenario: "fire_zone_C",
  speedMultiplier: 2
};

export const simulationHeatgrid: SimulationHeatCell[] = [
  {
    cellId: "r12c08",
    count: 120,
    mode: "simulation",
    timestamp: "2025-02-15T18:00:00Z"
  }
];

export const recommendationsData: Recommendation[] = [
  {
    id: "1",
    zone: "Main Stage",
    action: "Delay opening by 7 minutes",
    expectedImpact: -40,
    confidence: 87,
    drivers: [
      { icon: Users, label: "Gate A inflow ↑" },
      { icon: AlertTriangle, label: "Traffic congestion" },
      { icon: TrendingUp, label: "Weather heat" }
    ],
    timeHorizon: "Next 30 min",
    forecast: [45, 62, 78, 92, 85, 73]
  },
  {
    id: "2",
    zone: "Food Court",
    action: "Add 2 mobile vendors to north side",
    expectedImpact: -25,
    confidence: 92,
    drivers: [
      { icon: Users, label: "Queue buildup" },
      { icon: Clock, label: "Peak lunch time" },
      { icon: TrendingUp, label: "Concert break" }
    ],
    timeHorizon: "Next 15 min",
    forecast: [35, 48, 65, 58, 42, 35]
  },
  {
    id: "3",
    zone: "VIP Area",
    action: "Open second bar station",
    expectedImpact: -30,
    confidence: 79,
    drivers: [
      { icon: Users, label: "VIP arrivals ↑" },
      { icon: Clock, label: "Pre-show rush" }
    ],
    timeHorizon: "Next 10 min",
    forecast: [25, 38, 52, 45, 35, 28]
  }
];

export const scenariosData: Scenario[] = [
  { id: "fire", name: "Fire Emergency", icon: Flame, description: "Simulate fire outbreak and evacuation", severity: "critical" },
  { id: "panic", name: "Crowd Panic", icon: Users, description: "Mass panic scenario with crowd surge", severity: "critical" },
  { id: "weather", name: "Severe Weather", icon: CloudRain, description: "Heavy rain and lightning evacuation", severity: "high" },
  { id: "gate-surge", name: "Gate Surge", icon: TrendingUp, description: "Excessive crowd at single entry point", severity: "medium" }
];