/**
 * Advanced Heatmap Visualization Component
 * Implements JET/VIRIDIS colorization with alpha blending
 * Based on Technical Design Document 1: Phase 3 - Visualization
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DensityData {
  grid: number[][]; // 2D array of density values (0-1)
  width: number;
  height: number;
  timestamp: string;
  densityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface HeatmapVisualizationProps {
  eventId: string;
  densityData?: DensityData;
  colorScheme?: 'JET' | 'VIRIDIS' | 'PLASMA';
  opacity?: number; // 0-1
  showLegend?: boolean;
}

export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({
  eventId,
  densityData,
  colorScheme = 'JET',
  opacity = 0.5,
  showLegend = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScheme, setCurrentScheme] = useState<'JET' | 'VIRIDIS' | 'PLASMA'>(colorScheme);
  const [currentOpacity, setCurrentOpacity] = useState(opacity);

  // Track event context for data subscription
  const eventIdentifier = eventId || 'unknown-event';

  // Log event updates for debugging
  useEffect(() => {
    if (densityData) {
      console.log(`Heatmap updated for event: ${eventIdentifier}`, {
        densityLevel: densityData.densityLevel,
        timestamp: densityData.timestamp,
      });
    }
  }, [densityData, eventIdentifier]);

  // Color map definitions (RGB values for different schemes)
  const colorMaps = {
    JET: [
      { pos: 0.0, r: 0, g: 0, b: 143 }, // Dark blue
      { pos: 0.25, r: 0, g: 0, b: 255 }, // Blue
      { pos: 0.5, r: 0, g: 255, b: 255 }, // Cyan
      { pos: 0.75, r: 255, g: 255, b: 0 }, // Yellow
      { pos: 1.0, r: 255, g: 0, b: 0 }, // Red
    ],
    VIRIDIS: [
      { pos: 0.0, r: 68, g: 1, b: 84 }, // Dark purple
      { pos: 0.25, r: 59, g: 82, b: 139 }, // Blue
      { pos: 0.5, r: 33, g: 145, b: 140 }, // Teal
      { pos: 0.75, r: 94, g: 201, b: 98 }, // Green
      { pos: 1.0, r: 253, g: 231, b: 37 }, // Yellow
    ],
    PLASMA: [
      { pos: 0.0, r: 13, g: 8, b: 135 }, // Dark blue
      { pos: 0.25, r: 126, g: 3, b: 168 }, // Purple
      { pos: 0.5, r: 204, g: 71, b: 120 }, // Pink
      { pos: 0.75, r: 248, g: 149, b: 64 }, // Orange
      { pos: 1.0, r: 240, g: 249, b: 33 }, // Yellow
    ],
  };

  /**
   * Interpolate color from color map based on value (0-1)
   */
  const getColor = (value: number, scheme: 'JET' | 'VIRIDIS' | 'PLASMA'): { r: number; g: number; b: number } => {
    const map = colorMaps[scheme];
    value = Math.max(0, Math.min(1, value)); // Clamp to 0-1

    // Find the two colors to interpolate between
    let lower = map[0];
    let upper = map[map.length - 1];

    for (let i = 0; i < map.length - 1; i++) {
      if (value >= map[i].pos && value <= map[i + 1].pos) {
        lower = map[i];
        upper = map[i + 1];
        break;
      }
    }

    // Interpolate
    const range = upper.pos - lower.pos;
    const ratio = range === 0 ? 0 : (value - lower.pos) / range;

    return {
      r: Math.round(lower.r + (upper.r - lower.r) * ratio),
      g: Math.round(lower.g + (upper.g - lower.g) * ratio),
      b: Math.round(lower.b + (upper.b - lower.b) * ratio),
    };
  };

  /**
   * Render heatmap on canvas
   */
  const renderHeatmap = () => {
    if (!densityData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { grid, width, height } = densityData;

    // Set canvas size
    canvas.width = width * 4; // 4x upscaling for better visual
    canvas.height = height * 4;

    const cellWidth = canvas.width / width;
    const cellHeight = canvas.height / height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const density = grid[y]?.[x] || 0;
        const color = getColor(density, currentScheme);

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${currentOpacity})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      }
    }

    // Apply smoothing for better visual
    ctx.filter = 'blur(2px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  };

  // Re-render when data or settings change
  useEffect(() => {
    renderHeatmap();
  }, [densityData, currentScheme, currentOpacity]);

  /**
   * Render color legend
   */
  const renderLegend = () => {
    if (!showLegend) return null;

    const gradientStops = [];
    for (let i = 0; i <= 10; i++) {
      const value = i / 10;
      const color = getColor(value, currentScheme);
      gradientStops.push(`rgba(${color.r}, ${color.g}, ${color.b}, ${currentOpacity})`);
    }

    return (
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Density Level</div>
        <div
          className="h-4 rounded"
          style={{
            background: `linear-gradient(to right, ${gradientStops.join(', ')})`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0% (Low)</span>
          <span>50% (Medium)</span>
          <span>100% (High)</span>
        </div>
      </div>
    );
  };

  const getDensityBadgeColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'CRITICAL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Crowd Density Heatmap</CardTitle>
            <CardDescription>Real-time visualization of crowd distribution</CardDescription>
          </div>
          {densityData && (
            <Badge className={getDensityBadgeColor(densityData.densityLevel)}>{densityData.densityLevel}</Badge>
          )}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Color Scheme</label>
            <Select
              value={currentScheme}
              onValueChange={(v: string) => setCurrentScheme(v as 'JET' | 'VIRIDIS' | 'PLASMA')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JET">JET (Blue→Red)</SelectItem>
                <SelectItem value="VIRIDIS">VIRIDIS (Purple→Yellow)</SelectItem>
                <SelectItem value="PLASMA">PLASMA (Blue→Yellow)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Opacity: {(currentOpacity * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={currentOpacity * 100}
              onChange={(e) => setCurrentOpacity(Number(e.target.value) / 100)}
              className="w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {densityData ? (
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
            {renderLegend()}
            <div className="text-xs text-muted-foreground text-center">
              Last updated: {new Date(densityData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No density data available</p>
            <p className="text-sm mt-2">Heatmap will appear when forecasting is active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
