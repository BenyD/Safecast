"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
// Removed unused icon imports

// Type for active incidents (matches get_active_incidents function return)
type ActiveIncident = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  severity: string | null;
  location: unknown;
  address: string | null;
  images: string[] | null;
  created_at: string | null;
  expires_at: string | null;
  status: string | null;
  is_verified: boolean | null;
  user_id: string | null;
};

interface IncidentMarkersProps {
  map: mapboxgl.Map | null;
  incidents: ActiveIncident[];
}

// Removed unused INCIDENT_TYPE_ICONS constant

const SEVERITY_COLORS = {
  low: "#10b981", // green
  medium: "#f59e0b", // yellow
  high: "#f97316", // orange
  urgent: "#ef4444", // red
} as const;

export function IncidentMarkers({ map, incidents }: IncidentMarkersProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Handle empty incidents array gracefully
    if (!incidents || incidents.length === 0) {
      return;
    }

    // Add new markers for each incident
    incidents.forEach((incident) => {
      if (!incident.location) return;

      // Parse location (assuming it's stored as a PostGIS point)
      let lat: number, lng: number;

      if (
        typeof incident.location === "object" &&
        incident.location !== null &&
        "lat" in incident.location &&
        "lng" in incident.location
      ) {
        lat = (incident.location as { lat: number; lng: number }).lat;
        lng = (incident.location as { lat: number; lng: number }).lng;
      } else if (Array.isArray(incident.location)) {
        [lng, lat] = incident.location as [number, number];
      } else {
        // Handle PostGIS point format
        const locationStr = String(incident.location);
        const match = locationStr.match(/\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        } else {
          return; // Skip if we can't parse the location
        }
      }

      // Get icon component for incident type (not used in current implementation)
      // const IconComponent =
      //   INCIDENT_TYPE_ICONS[
      //     incident.type as keyof typeof INCIDENT_TYPE_ICONS
      //   ] || AlertCircle;

      // Get color for severity
      const color =
        SEVERITY_COLORS[incident.severity as keyof typeof SEVERITY_COLORS] ||
        SEVERITY_COLORS.medium;

      // Create marker element
      const el = document.createElement("div");
      el.className = "incident-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "3px solid #ffffff";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.position = "relative";

      // Add icon to marker
      const iconSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      iconSvg.setAttribute("width", "16");
      iconSvg.setAttribute("height", "16");
      iconSvg.setAttribute("viewBox", "0 0 24 24");
      iconSvg.setAttribute("fill", "none");
      iconSvg.setAttribute("stroke", "#ffffff");
      iconSvg.setAttribute("stroke-width", "2");
      iconSvg.setAttribute("stroke-linecap", "round");
      iconSvg.setAttribute("stroke-linejoin", "round");

      // Add the icon path based on the incident type
      const iconPath = getIconPath(incident.type);
      if (iconPath) {
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute("d", iconPath);
        iconSvg.appendChild(path);
      }

      el.appendChild(iconSvg);

      // Create marker
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      }).setLngLat([lng, lat]).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
              <h3 class="font-semibold text-sm">${incident.title}</h3>
            </div>
            <p class="text-xs text-gray-600 mb-2">${incident.type
              .replace("_", " ")
              .toUpperCase()}</p>
            ${
              incident.description
                ? `<p class="text-xs text-gray-700 mb-2">${incident.description}</p>`
                : ""
            }
            ${
              incident.address
                ? `<p class="text-xs text-gray-500 mb-2">📍 ${incident.address}</p>`
                : ""
            }
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Severity: ${incident.severity}</span>
              <span>${
                incident.created_at
                  ? new Date(incident.created_at).toLocaleDateString()
                  : "Unknown"
              }</span>
            </div>
            ${
              incident.images && incident.images.length > 0
                ? `
              <div class="mt-2">
                <p class="text-xs text-gray-500">📷 ${incident.images.length} photo(s)</p>
              </div>
            `
                : ""
            }
          </div>
        `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, incidents]);

  return null; // This component doesn't render anything visible
}

// Helper function to get SVG path for each icon type
function getIconPath(type: string): string | null {
  const iconPaths: Record<string, string> = {
    water_logging: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
    fallen_trees:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    sewage_issues:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    house_flooding: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    wildlife_hazard:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    vehicle_stuck:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    other:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  };

  return iconPaths[type] || iconPaths.other;
}
