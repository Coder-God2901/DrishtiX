/**
 * Weather Dashboard Component
 * Displays real-time weather data and heat stress index
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer, AlertTriangle, Eye, Gauge } from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  description: string;
  cloudiness: number;
  visibility: number;
  uvIndex?: number;
  heatStressIndex?: number;
  heatStressLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  timestamp: string;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
}

interface WeatherPanelProps {
  eventId: string;
  location: { lat: number; lon: number; name: string };
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ eventId }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherImpact, setWeatherImpact] = useState<any>(null);
  const [safetyCheck, setSafetyCheck] = useState<any>(null);

  // Subscribe to real-time weather updates via Socket.IO
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('weather:update', (data: any) => {
      if (data.eventId === eventId) {
        setWeather(data.weather);
        setWeatherImpact(data.impact);
        setSafetyCheck(data.safety);
      }
    });

    socket.emit('subscribe:weather', eventId);

    return () => {
      socket.off('weather:update');
    };
  }, [eventId]);

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Clear':
        return <Sun className="h-12 w-12 text-yellow-500" />;
      case 'Clouds':
        return <Cloud className="h-12 w-12 text-gray-400" />;
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className="h-12 w-12 text-blue-500" />;
      case 'Snow':
        return <CloudSnow className="h-12 w-12 text-blue-200" />;
      default:
        return <Cloud className="h-12 w-12 text-gray-400" />;
    }
  };

  // Get heat stress color
  const getHeatStressColor = (level?: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500';
      case 'MODERATE':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'EXTREME':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading weather data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Weather Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Weather</span>
            <span className="text-sm font-normal text-muted-foreground">{weather.location.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main condition */}
            <div className="flex items-center space-x-4">
              {getWeatherIcon(weather.condition)}
              <div>
                <div className="text-4xl font-bold">{Math.round(weather.temperature)}°C</div>
                <div className="text-sm text-muted-foreground capitalize">{weather.description}</div>
                <div className="text-xs text-muted-foreground mt-1">Feels like {Math.round(weather.feelsLike)}°C</div>
              </div>
            </div>

            {/* Weather metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Humidity */}
              <div className="flex items-center space-x-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">{weather.humidity}%</div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center space-x-2">
                <Wind className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">{Math.round(weather.windSpeed)} m/s</div>
                  <div className="text-xs text-muted-foreground">Wind Speed</div>
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">{Math.round(weather.visibility / 1000)} km</div>
                  <div className="text-xs text-muted-foreground">Visibility</div>
                </div>
              </div>

              {/* Pressure */}
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">{weather.pressure} hPa</div>
                  <div className="text-xs text-muted-foreground">Pressure</div>
                </div>
              </div>
            </div>
          </div>

          {/* UV Index */}
          {weather.uvIndex !== undefined && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">UV Index</span>
                </div>
                <Badge variant={weather.uvIndex >= 8 ? 'destructive' : 'secondary'}>
                  {weather.uvIndex.toFixed(1)}
                  {weather.uvIndex >= 8 ? ' - Very High' : weather.uvIndex >= 6 ? ' - High' : ' - Moderate'}
                </Badge>
              </div>
            </div>
          )}

          {/* Heat Stress Index */}
          {weather.heatStressIndex !== undefined && weather.heatStressLevel && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Heat Stress Index</span>
                </div>
                <Badge className={getHeatStressColor(weather.heatStressLevel)}>
                  {weather.heatStressLevel} ({Math.round(weather.heatStressIndex * 100)}%)
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Warnings */}
      {safetyCheck && !safetyCheck.safe && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Weather Safety Warnings</div>
            <ul className="list-disc list-inside space-y-1">
              {safetyCheck.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
            {safetyCheck.recommendations.length > 0 && (
              <div className="mt-3">
                <div className="font-medium text-sm mb-1">Recommendations:</div>
                <ul className="list-disc list-inside space-y-1">
                  {safetyCheck.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Weather Impact on Crowds */}
      {weatherImpact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Weather Impact on Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Crowd Multiplier</span>
                <Badge variant={weatherImpact.crowdMultiplier < 0.7 ? 'destructive' : 'secondary'}>
                  {Math.round(weatherImpact.crowdMultiplier * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alert Level</span>
                <Badge
                  variant={
                    weatherImpact.alertLevel === 'HIGH'
                      ? 'destructive'
                      : weatherImpact.alertLevel === 'MEDIUM'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {weatherImpact.alertLevel}
                </Badge>
              </div>
              {weatherImpact.factors.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium mb-2">Factors:</div>
                  <ul className="space-y-1">
                    {weatherImpact.factors.map((factor: string, index: number) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(weather.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};
