import { MapPin, Activity } from "lucide-react";
import { IndianMap, INDIAN_VENUES } from "./IndianMap";

export function MapSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-900 flex items-center gap-2">
              Live Events Map
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              Real-time event locations and status
            </p>
          </div>
        </div>
      </div>
      <div className="relative h-80">
        <IndianMap
          location={INDIAN_VENUES.hyderabad}
          height="320px"
          showControls={false}
          markers={[
            {
              lat: INDIAN_VENUES.hyderabad.lat + 0.003,
              lng: INDIAN_VENUES.hyderabad.lng + 0.003,
              label: "Tech Conference (Active)",
              color: "green",
            },
            {
              lat: INDIAN_VENUES.hyderabad.lat - 0.002,
              lng: INDIAN_VENUES.hyderabad.lng + 0.004,
              label: "Music Festival (Active)",
              color: "green",
            },
            {
              lat: INDIAN_VENUES.hyderabad.lat + 0.004,
              lng: INDIAN_VENUES.hyderabad.lng - 0.002,
              label: "Art Exhibition (Starting Soon)",
              color: "red",
            },
            {
              lat: INDIAN_VENUES.hyderabad.lat - 0.003,
              lng: INDIAN_VENUES.hyderabad.lng - 0.003,
              label: "Food Carnival (Active)",
              color: "green",
            },
            {
              lat: INDIAN_VENUES.hyderabad.lat + 0.001,
              lng: INDIAN_VENUES.hyderabad.lng + 0.005,
              label: "Sports Event (Starting Soon)",
              color: "red",
            },
          ]}
        />
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-20">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-slate-700">12 Active Events</span>
          </div>
          <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-slate-700">5 Starting Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
