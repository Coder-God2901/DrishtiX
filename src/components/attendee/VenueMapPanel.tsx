/**
 * Venue Map Panel Component
 * Displays live venue map with crowd heatmap overlay (USP 1: Predictions)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, RefreshCw, Maximize2, TrendingUp, AlertCircle } from 'lucide-react';

interface VenueMapPanelProps {
  eventId: string;
  venueData: any;
  isLoading: boolean;
}

export default function VenueMapPanel({ eventId, venueData, isLoading }: VenueMapPanelProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showPredictions, setShowPredictions] = useState(true);

  const getZoneDensityColor = (density: number) => {
    if (density < 0.3) return 'bg-green-500';
    if (density < 0.5) return 'bg-yellow-500';
    if (density < 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getZoneDensityLabel = (density: number) => {
    if (density < 0.3) return 'Low';
    if (density < 0.5) return 'Moderate';
    if (density < 0.7) return 'High';
    return 'Critical';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Loading venue map...</p>
        </CardContent>
      </Card>
    );
  }

  if (!venueData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Venue map not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Live Venue Map
              </CardTitle>
              <CardDescription>Real-time crowd density with AI predictions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showPredictions ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPredictions(!showPredictions)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {showPredictions ? 'Hide' : 'Show'} Predictions
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Map Visualization */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video mb-4">
            {/* Simplified map grid - replace with actual map library like Leaflet or Mapbox */}
            <div className="grid grid-cols-4 grid-rows-3 gap-1 p-2 h-full">
              {venueData.venueLayout?.zones?.slice(0, 12).map((zone: any, index: number) => {
                const crowdData = venueData.crowdData?.find((c: any) => c.zoneId === zone.id);
                const density = crowdData?.density || 0;
                const isPredicted = crowdData?.predicted || false;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`rounded cursor-pointer transition-all hover:scale-105 ${getZoneDensityColor(
                      density
                    )} ${selectedZone === zone.id ? 'ring-4 ring-blue-600' : ''} ${
                      isPredicted && showPredictions ? 'opacity-70 border-2 border-dashed border-white' : ''
                    } flex items-center justify-center text-white font-medium text-sm`}
                  >
                    {zone.name || `Zone ${index + 1}`}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 space-y-2">
              <p className="text-xs font-semibold mb-2">Crowd Density</p>
              <div className="space-y-1">
                {[
                  { label: 'Low', color: 'bg-green-500' },
                  { label: 'Moderate', color: 'bg-yellow-500' },
                  { label: 'High', color: 'bg-orange-500' },
                  { label: 'Critical', color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
              {showPredictions && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500 opacity-70 border-2 border-dashed border-white" />
                    <span className="text-xs">AI Predicted</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone Details */}
          {selectedZone && (
            <Card className="border-blue-600">
              <CardHeader>
                <CardTitle className="text-lg">Zone Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const zone = venueData.venueLayout?.zones?.find((z: any) => z.id === selectedZone);
                  const crowdData = venueData.crowdData?.find((c: any) => c.zoneId === selectedZone);
                  const density = crowdData?.density || 0;
                  const isPredicted = crowdData?.predicted || false;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{zone?.name || 'Unknown Zone'}</span>
                        <Badge variant={isPredicted ? 'secondary' : 'default'}>
                          {isPredicted ? 'Predicted' : 'Live Data'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Density Level</p>
                          <p className="text-lg font-bold">{getZoneDensityLabel(density)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Occupancy</p>
                          <p className="text-lg font-bold">{Math.round(density * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                          <p className="text-sm font-medium">{zone?.type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Capacity</p>
                          <p className="text-sm font-medium">{zone?.capacity || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Amenities */}
                      {zone?.amenities && zone.amenities.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Nearby Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {zone.amenities.map((amenity: any) => (
                              <Badge key={amenity.id} variant="outline">
                                {amenity.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {isPredicted && (
                        <div className="pt-3 border-t">
                          <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <TrendingUp className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium">AI Prediction</p>
                              <p className="text-xs">
                                Based on historical patterns and current trends. Updates every 5 minutes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Heatmap Data Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Zones</p>
                <p className="text-2xl font-bold">{venueData.venueLayout?.zones?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Crowded Areas</p>
                <p className="text-2xl font-bold text-red-600">
                  {venueData.crowdData?.filter((c: any) => c.density > 0.7).length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Predictions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {venueData.crowdData?.filter((c: any) => c.predicted).length || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
