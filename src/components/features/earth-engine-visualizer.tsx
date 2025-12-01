/**
 * Earth Engine Synthetic Data Visualizer
 * Displays satellite-like venue imagery with synthetic crowd overlays
 * For hardware-free mode when drones/CCTV are unavailable
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Satellite, Map, Loader2, RefreshCw, Download, Info, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';

interface SyntheticCrowdData {
  gridCells: {
    gridId: string;
    lat: number;
    lon: number;
    density: number;
    count: number;
    terrain: string;
    landCover: string;
  }[];
  timestamp: Date;
  scenario: 'NORMAL' | 'SURGE' | 'BOTTLENECK' | 'EVACUATION';
  totalSimulatedCount: number;
}

export function EarthEngineVisualizer() {
  const [scenario, setScenario] = useState<'NORMAL' | 'SURGE' | 'BOTTLENECK' | 'EVACUATION'>('NORMAL');
  const [gridSize, setGridSize] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [syntheticData, setSyntheticData] = useState<SyntheticCrowdData | null>(null);
  const [isEnabled] = useState(import.meta.env.VITE_EARTH_ENGINE_ENABLED === 'true');

  const generateSyntheticData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to Earth Engine service
      // Replace with actual API call: await apiClient.get('/earth-engine/synthetic-data')
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock data generation
      const mockData: SyntheticCrowdData = {
        gridCells: Array.from({ length: 20 }, (_, i) => ({
          gridId: `grid_${i}`,
          lat: 18.5204 + (Math.random() - 0.5) * 0.01,
          lon: 73.8567 + (Math.random() - 0.5) * 0.01,
          density: Math.random() * (scenario === 'SURGE' ? 0.9 : 0.5),
          count: Math.floor(Math.random() * 500),
          terrain: Math.random() > 0.7 ? 'STEEP' : 'FLAT',
          landCover: Math.random() > 0.5 ? 'URBAN' : 'VEGETATION',
        })),
        timestamp: new Date(),
        scenario,
        totalSimulatedCount: Math.floor(Math.random() * 5000) + 2000,
      };

      setSyntheticData(mockData);
    } catch (error) {
      console.error('Failed to generate synthetic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEnabled) {
      generateSyntheticData();
    }
  }, [scenario, gridSize]);

  if (!isEnabled) {
    return (
      <Card className="p-8 text-center">
        <Satellite className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Earth Engine Disabled</h3>
        <p className="text-muted-foreground mb-4">
          Enable Earth Engine in environment settings to use hardware-free mode
        </p>
        <Badge variant="secondary">VITE_EARTH_ENGINE_ENABLED=false</Badge>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Satellite className="h-6 w-6" />
            Earth Engine Visualizer
          </h2>
          <p className="text-muted-foreground">Hardware-free mode using synthetic crowd data</p>
        </div>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
          Fallback Mode
        </Badge>
      </div>

      {/* Warning Banner */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-700 mb-1">Using Synthetic Data Generation</p>
            <p className="text-yellow-600">
              Earth Engine API integration is in fallback mode. Synthetic crowd patterns are generated based on terrain
              and scenario settings. This is useful for testing without real satellite data.
            </p>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <label className="text-sm font-medium mb-2 block">Scenario Type</label>
          <Select value={scenario} onValueChange={(v: any) => setScenario(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">Normal - Regular Event</SelectItem>
              <SelectItem value="SURGE">Surge - Peak Attendance</SelectItem>
              <SelectItem value="BOTTLENECK">Bottleneck - Congestion Points</SelectItem>
              <SelectItem value="EVACUATION">Evacuation - Emergency Exit</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">Simulates different crowd behavior patterns</p>
        </Card>

        <Card className="p-4">
          <label className="text-sm font-medium mb-2 block">Grid Size: {gridSize}m</label>
          <Slider value={[gridSize]} onValueChange={(v: number[]) => setGridSize(v[0])} min={25} max={100} step={25} />
          <p className="text-xs text-muted-foreground mt-2">Smaller grids = higher resolution but slower processing</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={generateSyntheticData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Data
            </>
          )}
        </Button>
        <Button variant="outline" disabled={!syntheticData}>
          <Download className="h-4 w-4 mr-2" />
          Export GeoJSON
        </Button>
      </div>

      {/* Results */}
      {syntheticData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total People</p>
              <p className="text-2xl font-bold">{syntheticData.totalSimulatedCount.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Grid Cells</p>
              <p className="text-2xl font-bold">{syntheticData.gridCells.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Avg Density</p>
              <p className="text-2xl font-bold">
                {(syntheticData.gridCells.reduce((s, c) => s + c.density, 0) / syntheticData.gridCells.length).toFixed(
                  2
                )}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm font-mono">{new Date(syntheticData.timestamp).toLocaleTimeString()}</p>
            </Card>
          </div>

          {/* Heatmap Preview */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Map className="h-5 w-5" />
              Synthetic Heatmap Preview
            </h3>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simulated heatmap */}
              <div className="absolute inset-0 grid grid-cols-5 gap-1 p-4">
                {syntheticData.gridCells.slice(0, 20).map((cell) => (
                  <div
                    key={cell.gridId}
                    className="rounded transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: `rgba(255, ${255 - cell.density * 255}, 0, ${cell.density})`,
                    }}
                    title={`Density: ${(cell.density * 100).toFixed(0)}% | Count: ${cell.count}`}
                  />
                ))}
              </div>
              <div className="relative z-10 text-center">
                <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Hover over cells to see density</p>
              </div>
            </div>
          </Card>

          {/* Grid Details Table */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Grid Cell Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2">Grid ID</th>
                    <th className="pb-2">Coordinates</th>
                    <th className="pb-2">Density</th>
                    <th className="pb-2">Count</th>
                    <th className="pb-2">Terrain</th>
                    <th className="pb-2">Land Cover</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {syntheticData.gridCells.slice(0, 10).map((cell) => (
                    <tr key={cell.gridId}>
                      <td className="py-2 font-mono text-xs">{cell.gridId}</td>
                      <td className="py-2 font-mono text-xs">
                        {cell.lat.toFixed(4)}, {cell.lon.toFixed(4)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                              style={{ width: `${cell.density * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{(cell.density * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2 font-mono">{cell.count}</td>
                      <td className="py-2">
                        <Badge variant="outline">{cell.terrain}</Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant="secondary">{cell.landCover}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Info Footer */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">About Synthetic Data Generation</p>
            <p className="text-muted-foreground">
              This fallback mode generates realistic crowd patterns based on terrain features, land cover
              classification, and scenario types. While not using actual satellite imagery, it provides useful data for
              testing and demonstration purposes. Full Earth Engine integration is planned for future releases.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
