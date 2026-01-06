import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet - use data URIs
const iconUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEwLjUgMTIuNSAyOC41IDEyLjUgMjguNVMyNSAyMyAyNSAxMi41QzI1IDUuNiAxOS40IDAgMTIuNSAweiIgZmlsbD0iIzMzODhmZiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=";
const shadowUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZWxsaXBzZSBjeD0iMjAuNSIgY3k9IjM0IiByeD0iMTAiIHJ5PSIzIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMykiLz4KPC9zdmc+";

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  markers?: Array<{
    id?: string;
    position: [number, number];
    label: string;
    color?: string;
  }>;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function LeafletMap({
  center = [19.076, 72.8777], // Mumbai coordinates
  zoom = 13,
  height = "100%",
  markers = [],
  onMarkerClick,
  className,
  style: customStyle,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Add Google-style tile layer (using OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const color = marker.color || "blue";

      // Create custom colored marker icon with enhanced styling
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              background: ${
                color === "blue"
                  ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                  : color === "green"
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : color === "red"
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : color === "purple"
                  ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                  : color === "orange"
                  ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
              };
              border: 4px solid white;
              border-radius: 50%;
              box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 20px ${
                color === "blue"
                  ? "rgba(59, 130, 246, 0.6)"
                  : color === "green"
                  ? "rgba(16, 185, 129, 0.6)"
                  : color === "red"
                  ? "rgba(239, 68, 68, 0.6)"
                  : color === "purple"
                  ? "rgba(139, 92, 246, 0.6)"
                  : color === "orange"
                  ? "rgba(249, 115, 22, 0.6)"
                  : "rgba(139, 92, 246, 0.6)"
              };
              display: flex;
              align-items: center;
              justify-content: center;
              animation: bounce 2s infinite, pulse 2s infinite;
              cursor: pointer;
              transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform='scale(1.3)'"
            onmouseout="this.style.transform='scale(1)'">
              <div style="
                width: 14px;
                height: 14px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            </div>
            <div style="
              position: absolute;
              top: 44px;
              left: 50%;
              transform: translateX(-50%);
              background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
              padding: 6px 12px;
              border-radius: 8px;
              white-space: nowrap;
              font-size: 12px;
              font-weight: 700;
              color: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              border: 2px solid ${
                color === "blue"
                  ? "#3b82f6"
                  : color === "green"
                  ? "#10b981"
                  : color === "red"
                  ? "#ef4444"
                  : color === "purple"
                  ? "#8b5cf6"
                  : color === "orange"
                  ? "#f97316"
                  : "#8b5cf6"
              };
              z-index: 1000;
            ">
              📍 ${marker.label}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const markerInstance = L.marker(marker.position, { icon: customIcon }).addTo(map).bindPopup(`
          <div style="padding: 8px; text-align: center;">
            <strong style="font-size: 14px; color: #1e293b;">${marker.label}</strong>
          </div>
        `);

      if (onMarkerClick && marker.id) {
        markerInstance.on('click', () => {
          onMarkerClick(marker.id!);
        });
      }
    });

    // Add animation styles
    const style = document.createElement("style");
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 20px rgba(59, 130, 246, 0.6); }
        50% { box-shadow: 0 8px 25px rgba(0,0,0,0.5), 0 0 30px rgba(59, 130, 246, 0.9); }
      }
      .custom-marker {
        background: transparent;
        border: none;
        z-index: 1000 !important;
      }
      .leaflet-container {
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 0;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      .leaflet-popup-tip {
        display: none;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      document.head.removeChild(style);
    };
  }, [center, zoom, markers]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        ...customStyle,
      }}
    />
  );
}
