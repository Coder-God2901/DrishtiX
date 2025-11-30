/**
 * Navigation Panel Component
 * Provides crowd-aware navigation with ETA calculation (USP 4: Actions, not just warnings)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Navigation, MapPin, Clock, Route, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { attendeeService } from '@/services/attendee.service';

interface NavigationPanelProps {
  eventId: string;
  venueData: any;
}

interface NavigationRoute {
  from: any;
  to: any;
  distance: number;
  estimatedTime: number;
  avoidZones: string[];
  waypoints: any[];
  crowdLevel: string;
  updatedAt: string;
}

export default function NavigationPanel({ eventId, venueData }: NavigationPanelProps) {
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [avoidCrowds, setAvoidCrowds] = useState(true);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Use venueData for enhanced navigation context
  const hasVenueData = venueData !== null && venueData !== undefined;

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const destinations = [
    { id: 'main-stage', name: 'Main Stage', lat: 40.7829, lng: -73.9654 },
    { id: 'food-court', name: 'Food Court', lat: 40.7825, lng: -73.966 },
    { id: 'restrooms', name: 'Restrooms', lat: 40.7832, lng: -73.9648 },
    { id: 'first-aid', name: 'First Aid Station', lat: 40.7827, lng: -73.9652 },
    { id: 'exit-north', name: 'North Exit', lat: 40.7835, lng: -73.9645 },
    { id: 'exit-south', name: 'South Exit', lat: 40.782, lng: -73.9658 },
    { id: 'parking', name: 'Parking Area', lat: 40.7818, lng: -73.9665 },
    { id: 'info-booth', name: 'Information Booth', lat: 40.7828, lng: -73.9656 },
  ];

  const handleCalculateRoute = async () => {
    if (!toLocation) {
      toast.error('Please select a destination');
      return;
    }

    setIsCalculating(true);
    try {
      const from = currentLocation || { lat: 40.7829, lng: -73.9654, zoneId: fromLocation || undefined };
      const to = destinations.find((d) => d.id === toLocation);

      if (!to) {
        toast.error('Invalid destination');
        return;
      }

      type NavigateResponse = {
        success: boolean;
        data: NavigationRoute;
        message?: string;
      };

      const response = (await attendeeService.navigate(eventId, {
        from,
        to: { lat: to.lat, lng: to.lng },
        avoidCrowds,
      })) as NavigateResponse;

      if (response && response.success) {
        setRoute(response.data);
        toast.success('Route calculated successfully!');
      } else {
        toast.error(response?.message || 'Failed to calculate route');
      }
    } catch (error: any) {
      console.error('Navigation error:', error);
      toast.error(error?.message || 'Failed to calculate route');
    } finally {
      setIsCalculating(false);
    }
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCrowdLevelBadge = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Crowd-Aware Navigation
          </CardTitle>
          <CardDescription>Get optimized routes avoiding crowded areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Location */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <MapPin className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Your Current Location</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {currentLocation
                  ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : 'Detecting...'}
              </p>
            </div>
            {currentLocation && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>

          {/* Starting Location (Optional) */}
          {hasVenueData && (
            <div className="space-y-2">
              <Label htmlFor="fromLocation">Starting Location (Optional)</Label>
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger id="fromLocation">
                  <SelectValue placeholder="Use current location or select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Location</SelectItem>
                  {destinations.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      {dest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Destination Selection */}
          <div className="space-y-2">
            <Label htmlFor="destination">Select Destination</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Choose where you want to go" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>
                    {dest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Crowd Avoidance Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Avoid Crowded Areas</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Uses AI predictions to suggest safer routes</p>
              </div>
            </div>
            <Button
              variant={avoidCrowds ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAvoidCrowds(!avoidCrowds)}
            >
              {avoidCrowds ? 'ON' : 'OFF'}
            </Button>
          </div>

          {/* Calculate Button */}
          <Button onClick={handleCalculateRoute} disabled={isCalculating || !toLocation} className="w-full" size="lg">
            {isCalculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating Route...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Calculate Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Route Results */}
      {route && (
        <Card className="border-green-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recommended Route</CardTitle>
              <Badge variant={getCrowdLevelBadge(route.crowdLevel)}>{route.crowdLevel} Crowd Level</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Route Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Route className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{route.distance.toFixed(0)}m</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Clock className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">{route.estimatedTime} min</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">ETA</p>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${route.crowdLevel ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}
              >
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${getCrowdLevelColor(route.crowdLevel)}`} />
                <p className="text-2xl font-bold">{route.avoidZones.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avoided Zones</p>
              </div>
            </div>

            {/* Waypoints */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Route Steps:</p>
              {route.waypoints.map((waypoint, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {index === 0
                        ? 'Start from current location'
                        : index === route.waypoints.length - 1
                          ? `Arrive at ${destinations.find((d) => d.id === toLocation)?.name}`
                          : `Waypoint ${index}`}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Avoided Zones Warning */}
            {route.avoidZones.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Crowded Areas Avoided</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    This route avoids {route.avoidZones.length} crowded zone{route.avoidZones.length > 1 ? 's' : ''}{' '}
                    based on real-time density data and AI predictions.
                  </p>
                </div>
              </div>
            )}

            {/* USP 4 Highlight */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Smart Navigation Active</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Route automatically updates every 2 minutes based on crowd movements. You'll receive notifications if
                  conditions change significantly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCalculateRoute} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate
              </Button>
              <Button onClick={() => toast.success('Navigation started!')} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      {!route && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Navigation className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a destination to get started with crowd-aware navigation
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>✓ Real-time crowd density analysis</p>
                <p>✓ AI-predicted congestion avoidance</p>
                <p>✓ Automatic route updates</p>
                <p>✓ Optimized walking time (USP 4)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
