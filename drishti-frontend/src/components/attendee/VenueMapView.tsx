import {
  ArrowLeft,
  MapPin,
  Music,
  UtensilsCrossed,
  Heart,
  ShoppingBag,
  Waves,
  Coffee,
  Navigation,
  Search,
  Filter,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { LeafletMap } from "../shared/LeafletMap";

interface VenueMapViewProps {
  onBack: () => void;
  onNavigateToLocation: (location: any) => void;
}

export function VenueMapView({
  onBack,
  onNavigateToLocation,
}: VenueMapViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const filters = [
    {
      id: "all",
      name: "All",
      icon: <Layers className="w-4 h-4" />,
      color: "slate",
    },
    {
      id: "stages",
      name: "Stages",
      icon: <Music className="w-4 h-4" />,
      color: "purple",
    },
    {
      id: "food",
      name: "Food",
      icon: <UtensilsCrossed className="w-4 h-4" />,
      color: "orange",
    },
    {
      id: "facilities",
      name: "Facilities",
      icon: <Waves className="w-4 h-4" />,
      color: "blue",
    },
    {
      id: "medical",
      name: "Medical",
      icon: <Heart className="w-4 h-4" />,
      color: "red",
    },
  ];

  const locations = [
    {
      id: 1,
      name: "Main Stage",
      category: "stages",
      x: "50%",
      y: "15%",
      color: "purple",
      icon: <Music className="w-5 h-5" />,
      status: "Live Now",
      distance: "120m",
    },
    {
      id: 2,
      name: "DJ Arena",
      category: "stages",
      x: "75%",
      y: "35%",
      color: "purple",
      icon: <Music className="w-5 h-5" />,
      status: "Next: 7:30 PM",
      distance: "250m",
    },
    {
      id: 3,
      name: "Acoustic Lounge",
      category: "stages",
      x: "25%",
      y: "30%",
      color: "purple",
      icon: <Music className="w-5 h-5" />,
      status: "Live Now",
      distance: "180m",
    },
    {
      id: 4,
      name: "Food Court North",
      category: "food",
      x: "80%",
      y: "20%",
      color: "orange",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      status: "~5 min wait",
      distance: "85m",
    },
    {
      id: 5,
      name: "BBQ Zone",
      category: "food",
      x: "20%",
      y: "55%",
      color: "orange",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      status: "~8 min wait",
      distance: "140m",
    },
    {
      id: 6,
      name: "Vegan Station",
      category: "food",
      x: "85%",
      y: "60%",
      color: "orange",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      status: "~3 min wait",
      distance: "95m",
    },
    {
      id: 7,
      name: "Restrooms Zone A",
      category: "facilities",
      x: "15%",
      y: "45%",
      color: "blue",
      icon: <Waves className="w-5 h-5" />,
      status: "Low queue",
      distance: "45m",
    },
    {
      id: 8,
      name: "Water Stations",
      category: "facilities",
      x: "60%",
      y: "70%",
      color: "blue",
      icon: <Waves className="w-5 h-5" />,
      status: "No wait",
      distance: "30m",
    },
    {
      id: 9,
      name: "Medical Tent",
      category: "medical",
      x: "10%",
      y: "20%",
      color: "red",
      icon: <Heart className="w-5 h-5" />,
      status: "Available",
      distance: "160m",
    },
    {
      id: 10,
      name: "First Aid",
      category: "medical",
      x: "90%",
      y: "45%",
      color: "red",
      icon: <Heart className="w-5 h-5" />,
      status: "Available",
      distance: "95m",
    },
    {
      id: 11,
      name: "Merchandise",
      category: "merch",
      x: "45%",
      y: "85%",
      color: "green",
      icon: <ShoppingBag className="w-5 h-5" />,
      status: "~10 min wait",
      distance: "190m",
    },
    {
      id: 12,
      name: "Chill Zone",
      category: "lounges",
      x: "70%",
      y: "75%",
      color: "amber",
      icon: <Coffee className="w-5 h-5" />,
      status: "Open Access",
      distance: "130m",
    },
  ];

  const filteredLocations =
    selectedFilter === "all"
      ? locations
      : locations.filter((loc) => loc.category === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-slate-900">Interactive Venue Map</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>All venue locations at a glance</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="text-sm">Search</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? filter.color === "purple"
                      ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                      : filter.color === "orange"
                      ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                      : filter.color === "blue"
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : filter.color === "red"
                      ? "bg-red-100 text-red-700 border-2 border-red-300"
                      : "bg-slate-100 text-slate-700 border-2 border-slate-300"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {filter.icon}
                <span>{filter.name}</span>
                <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs">
                  {filter.id === "all"
                    ? locations.length
                    : locations.filter((l) => l.category === filter.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Map Container - Full Height */}
          <div
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative"
            style={{ height: "calc(100vh - 320px)", minHeight: "700px" }}
          >
            {/* Leaflet Map Background */}
            <div className="absolute inset-8 rounded-xl overflow-hidden">
              <LeafletMap
                center={[19.076, 72.8777]}
                zoom={16}
                height="100%"
                markers={filteredLocations.map((location) => {
                  // Convert percentage positions to lat/lng offsets
                  const xPercent = parseFloat(location.x);
                  const yPercent = parseFloat(location.y);
                  const lat = 19.076 + (yPercent - 50) * 0.0003;
                  const lng = 72.8777 + (xPercent - 50) * 0.0003;

                  return {
                    position: [lat, lng] as [number, number],
                    label: location.name,
                    color:
                      location.color === "purple"
                        ? "purple"
                        : location.color === "orange"
                        ? "orange"
                        : location.color === "blue"
                        ? "blue"
                        : location.color === "red"
                        ? "red"
                        : "green",
                  };
                })}
              />
            </div>

            {/* Overlay for location markers and interactions */}
            <div className="absolute inset-8 bg-slate-900/10 backdrop-blur-[1px] rounded-xl overflow-hidden pointer-events-none">
              {/* Grid overlay for visual guidance */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                  }}
                />
              </div>

              {/* Entrance Marker */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
                <div className="bg-green-100 border-2 border-green-500 rounded-lg px-4 py-2 shadow-lg">
                  <p className="text-green-700 text-sm font-bold">
                    🚪 Main Entrance
                  </p>
                </div>
              </div>

              {/* Location Markers - Enhanced with pointer events */}
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto"
                  style={{ left: location.x, top: location.y }}
                  onMouseEnter={() => setHoveredLocation(location.name)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Location Pin */}
                  <div
                    className={`relative group cursor-pointer ${
                      hoveredLocation === location.name ? "z-50" : "z-10"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl border-4 border-white ${
                        hoveredLocation === location.name
                          ? "scale-150 shadow-3xl"
                          : "scale-100"
                      } ${
                        location.color === "purple"
                          ? "bg-gradient-to-br from-purple-500 to-purple-700"
                          : location.color === "orange"
                          ? "bg-gradient-to-br from-orange-500 to-orange-700"
                          : location.color === "blue"
                          ? "bg-gradient-to-br from-blue-500 to-blue-700"
                          : location.color === "red"
                          ? "bg-gradient-to-br from-red-500 to-red-700"
                          : location.color === "green"
                          ? "bg-gradient-to-br from-green-500 to-green-700"
                          : "bg-gradient-to-br from-amber-500 to-amber-700"
                      }`}
                    >
                      <div className="text-white drop-shadow-lg">
                        {location.icon}
                      </div>
                    </div>

                    {/* Pulse Animation for Live status */}
                    {location.status.includes("Live") && (
                      <div
                        className={`absolute inset-0 rounded-full animate-ping ${
                          location.color === "purple"
                            ? "bg-purple-400"
                            : "bg-red-400"
                        } opacity-75`}
                      />
                    )}

                    {/* Info Card on Hover */}
                    {hoveredLocation === location.name && (
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              location.color === "purple"
                                ? "bg-purple-100 text-purple-600"
                                : location.color === "orange"
                                ? "bg-orange-100 text-orange-600"
                                : location.color === "blue"
                                ? "bg-blue-100 text-blue-600"
                                : location.color === "red"
                                ? "bg-red-100 text-red-600"
                                : location.color === "green"
                                ? "bg-green-100 text-green-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {location.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-900 mb-1">
                              {location.name}
                            </p>
                            <p className="text-slate-600 text-sm">
                              {location.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{location.distance} away</span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            onNavigateToLocation({
                              name: location.name,
                              distance: location.distance,
                              waitTime: location.status,
                              category: location.category,
                            })
                          }
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-all duration-200"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Navigate Here</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Your Location */}
              <div className="absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-2xl animate-pulse" />
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-bold shadow-xl border-2 border-blue-400">
                    📍 You are here
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-4">Map Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  color: "purple",
                  label: "Stages",
                  icon: <Music className="w-4 h-4" />,
                },
                {
                  color: "orange",
                  label: "Food & Beverage",
                  icon: <UtensilsCrossed className="w-4 h-4" />,
                },
                {
                  color: "blue",
                  label: "Facilities",
                  icon: <Waves className="w-4 h-4" />,
                },
                {
                  color: "red",
                  label: "Medical",
                  icon: <Heart className="w-4 h-4" />,
                },
                {
                  color: "green",
                  label: "Merchandise",
                  icon: <ShoppingBag className="w-4 h-4" />,
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.color === "purple"
                        ? "bg-purple-600"
                        : item.color === "orange"
                        ? "bg-orange-600"
                        : item.color === "blue"
                        ? "bg-blue-600"
                        : item.color === "red"
                        ? "bg-red-600"
                        : "bg-green-600"
                    }`}
                  >
                    <div className="text-white">{item.icon}</div>
                  </div>
                  <span className="text-slate-700 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
