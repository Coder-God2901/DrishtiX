import { MapPin, Navigation, Locate } from "lucide-react";

interface IndianMapProps {
  location: {
    name: string;
    lat: number;
    lng: number;
    zoom?: number;
  };
  height?: string;
  showControls?: boolean;
  markers?: Array<{
    lat: number;
    lng: number;
    label: string;
    color?: string;
  }>;
}

// Popular Indian event venues
export const INDIAN_VENUES = {
  mumbai: {
    name: "Mumbai - NSCI Dome",
    lat: 19.0653,
    lng: 72.8691,
    zoom: 15,
    address: "Worli, Mumbai, Maharashtra",
  },
  delhi: {
    name: "Delhi - Jawaharlal Nehru Stadium",
    lat: 28.5821,
    lng: 77.2349,
    zoom: 15,
    address: "Lodhi Road, New Delhi",
  },
  bangalore: {
    name: "Bangalore - Palace Grounds",
    lat: 13.0102,
    lng: 77.5925,
    zoom: 15,
    address: "Jayamahal, Bangalore, Karnataka",
  },
  goa: {
    name: "Goa - Vagator Beach",
    lat: 15.5991,
    lng: 73.7313,
    zoom: 14,
    address: "Vagator, North Goa",
  },
  pune: {
    name: "Pune - Shivaji Nagar",
    lat: 18.5304,
    lng: 73.8463,
    zoom: 15,
    address: "Shivaji Nagar, Pune, Maharashtra",
  },
  hyderabad: {
    name: "Hyderabad - HICC",
    lat: 17.4417,
    lng: 78.3474,
    zoom: 15,
    address: "Madhapur, Hyderabad, Telangana",
  },
  chennai: {
    name: "Chennai - YMCA Grounds",
    lat: 13.0522,
    lng: 80.2512,
    zoom: 15,
    address: "Nandanam, Chennai, Tamil Nadu",
  },
  kolkata: {
    name: "Kolkata - Nicco Park",
    lat: 22.5126,
    lng: 88.4053,
    zoom: 15,
    address: "Salt Lake, Kolkata, West Bengal",
  },
};

export function IndianMap({
  location,
  height = "400px",
  showControls = true,
  markers,
}: IndianMapProps) {
  const zoom = location.zoom || 15;

  // Calculate bounding box for the map
  const latOffset = 0.01;
  const lngOffset = 0.015;
  const bbox = `${location.lng - lngOffset},${location.lat - latOffset},${
    location.lng + lngOffset
  },${location.lat + latOffset}`;

  // Make map square for better visibility - Always square
  const mapSize = "600px";

  return (
    <div
      className="relative rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg mx-auto"
      style={{ height: mapSize, width: mapSize, maxWidth: "100%" }}
    >
      {/* Map Header */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {location.name}
                </p>
                <p className="text-xs text-slate-600">
                  {INDIAN_VENUES[
                    Object.keys(INDIAN_VENUES).find(
                      (key) =>
                        INDIAN_VENUES[key as keyof typeof INDIAN_VENUES]
                          .name === location.name
                    ) as keyof typeof INDIAN_VENUES
                  ]?.address || "India"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all">
                <Navigation className="w-4 h-4" />
              </button>
              <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all">
                <Locate className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenStreetMap iframe */}
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lng}`}
        className="w-full h-full"
        style={{ border: 0, marginTop: showControls ? "60px" : 0 }}
        loading="lazy"
        title={`Map of ${location.name}`}
      />

      {/* Custom markers overlay (visual representation) */}
      {markers && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Points of Interest
            </p>
            <div className="flex flex-wrap gap-2">
              {markers.map((marker, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-lg text-xs ${
                    marker.color === "red"
                      ? "bg-red-100 text-red-700"
                      : marker.color === "green"
                      ? "bg-green-100 text-green-700"
                      : marker.color === "blue"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  📍 {marker.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-medium shadow-lg">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  );
}

// Google Maps style alternative (uses Google Maps embed)
interface GoogleMapProps {
  location: string;
  height?: string;
  zoom?: number;
}

export function GoogleMapEmbed({
  location,
  height = "400px",
  zoom = 15,
}: GoogleMapProps) {
  const encodedLocation = encodeURIComponent(location);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg"
      style={{ height }}
    >
      <iframe
        src={`https://www.google.com/maps?q=${encodedLocation}&output=embed&z=${zoom}`}
        className="w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
        title={`Google Map of ${location}`}
      />
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-medium shadow-lg">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  );
}
