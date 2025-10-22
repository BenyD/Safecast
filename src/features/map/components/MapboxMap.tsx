"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
  onLocationFound?: (lat: number, lng: number) => void;
  userLocation?: { lat: number; lng: number } | null;
  showUserLocation?: boolean;
}

export function MapboxMap({
  center,
  zoom = 10,
  className = "",
  onMapReady,
  onLocationFound,
  userLocation,
  showUserLocation = true,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Store callbacks in refs to prevent re-renders
  const onMapReadyRef = useRef(onMapReady);
  const onLocationFoundRef = useRef(onLocationFound);

  // Update refs when callbacks change
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onLocationFoundRef.current = onLocationFound;
  }, [onLocationFound]);

  // Trigger geolocation when showUserLocation is true and map is loaded
  useEffect(() => {
    if (showUserLocation && isLoaded && geolocateControl.current) {
      geolocateControl.current.trigger();
    }
  }, [showUserLocation, isLoaded]);

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
          timeout: 15000, // Increased timeout for better accuracy
          maximumAge: 60000, // Reduced to 1 minute for fresher data
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        showUserLocation: true, // Show user location by default
        fitBoundsOptions: {
          maxZoom: 15, // Don't zoom in too close
        },
      });
      map.current.addControl(geolocate, "top-right");
      geolocateControl.current = geolocate;

      // Listen for geolocate events to notify parent component and center map
      geolocate.on(
        "geolocate",
        (e: {
          coords: { latitude: number; longitude: number; accuracy?: number };
        }) => {
          if (onLocationFoundRef.current && e.coords) {
            onLocationFoundRef.current(e.coords.latitude, e.coords.longitude);
          }

          // Log location accuracy for debugging (with proper null checking)
          if (e.coords && typeof e.coords.accuracy === "number") {
            console.log("Location accuracy:", e.coords.accuracy, "meters");
          }

          // Center map on user location with appropriate zoom
          if (map.current && e.coords) {
            map.current.flyTo({
              center: [e.coords.longitude, e.coords.latitude],
              zoom: Math.max(map.current.getZoom(), 12), // Ensure good zoom level
              duration: 1000,
            });
          }
        }
      );

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      map.current.on("load", () => {
        setIsLoaded(true);
        // Auto-trigger geolocation when map loads
        geolocate.trigger();

        // Call onMapReady callback if provided
        if (onMapReadyRef.current && map.current) {
          onMapReadyRef.current(map.current);
        }
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
  }, []); // Only run once on mount

  // Using Mapbox's built-in GeolocateControl for user location

  // Update map center when center prop changes
  useEffect(() => {
    if (map.current && isLoaded) {
      // Only update if the center has actually changed
      const currentCenter = map.current.getCenter();
      const centerChanged =
        Math.abs(currentCenter.lng - center[0]) > 0.0001 ||
        Math.abs(currentCenter.lat - center[1]) > 0.0001;

      if (centerChanged) {
        map.current.flyTo({
          center: center,
          zoom: zoom,
          essential: true,
          duration: 1000, // Smooth transition
        });

        // Clear existing popups (but keep user location marker)
        const popups = document.querySelectorAll(".mapboxgl-popup");
        popups.forEach((popup) => popup.remove());
      }
    }
  }, [center, zoom, isLoaded]);

  // Trigger geolocate control when userLocation is set (e.g., after permission granted)
  useEffect(() => {
    if (userLocation && geolocateControl.current && isLoaded) {
      // Trigger the geolocate control to show the user location puck
      geolocateControl.current.trigger();
    }
  }, [userLocation, isLoaded]);

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
