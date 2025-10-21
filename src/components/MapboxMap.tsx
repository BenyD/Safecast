"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
}

export function MapboxMap({
  center,
  zoom = 10,
  className = "",
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // You'll need to set your Mapbox access token
    // For now, we'll use a placeholder - you should replace this with your actual token
    mapboxgl.accessToken =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example";

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: center,
        zoom: zoom,
        projection: "globe",
        attributionControl: false, // Remove Mapbox attribution
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add geolocate control with automatic tracking
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        showUserLocation: true, // Show user location by default
      });
      map.current.addControl(geolocate, "top-right");

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      map.current.on("load", () => {
        setIsLoaded(true);
        // Auto-trigger geolocation when map loads
        geolocate.trigger();
      });

      // Handle map errors
      map.current.on("error", (e) => {
        console.error("Map error:", e);
        if (e.error && e.error.message && e.error.message.includes("401")) {
          console.error(
            "Mapbox token error: Please check your access token and ensure it has the correct scopes (styles:read, fonts:read)"
          );
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  // Using Mapbox's built-in GeolocateControl for user location

  // Update map center when center prop changes
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.flyTo({
        center: center,
        zoom: zoom,
        essential: true,
      });

      // Clear existing popups (but keep user location marker)
      const popups = document.querySelectorAll(".mapboxgl-popup");
      popups.forEach((popup) => popup.remove());
    }
  }, [center, zoom, isLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mapboxgl-ctrl-logo {
            display: none !important;
          }
          .mapboxgl-ctrl-attrib {
            display: none !important;
          }
          .mapboxgl-ctrl-bottom-left .mapboxgl-ctrl {
            display: none !important;
          }
          .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl {
            display: none !important;
          }
        `,
        }}
      />
    </div>
  );
}
