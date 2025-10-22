"use client";

import { useState, useEffect, useCallback } from "react";
import { MapboxMap } from "@/features/map/components/MapboxMap";
import { WelcomeDialog } from "@/features/map/components/WelcomeDialog";
import { IncidentReportForm } from "@/features/incidents/components/IncidentReportForm";
import { IncidentMarkers } from "@/features/incidents/components/IncidentMarkers";
import { AuthDialog } from "@/features/auth/components/AuthDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { useIncidents } from "@/features/incidents/hooks/useIncidents";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import mapboxgl from "mapbox-gl";
import { IncidentFormData } from "@/features/incidents/schemas/incidentSchema";
import toast from "react-hot-toast";
import * as turf from "@turf/turf";

export default function Home() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    80.2707, 13.0827,
  ]); // Chennai, India
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [customMarkerLocation, setCustomMarkerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [customMarkerAddress, setCustomMarkerAddress] = useState<string>("");
  const [showLocationConfirmDialog, setShowLocationConfirmDialog] =
    useState(false);
  const [pendingMarkerLocation, setPendingMarkerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pendingLocationAddress, setPendingLocationAddress] =
    useState<string>("");
  const [isMarkerMode, setIsMarkerMode] = useState(false);

  const {
    incidents,
    error: incidentsError,
    createIncident,
    retryFetch,
  } = useIncidents();

  // Cleanup marker mode elements when component unmounts or marker mode changes
  useEffect(() => {
    return () => {
      if (mapInstance && isMarkerMode) {
        // Remove the radius circle
        if (mapInstance.getLayer("radius-circle-stroke")) {
          mapInstance.removeLayer("radius-circle-stroke");
        }
        if (mapInstance.getLayer("radius-circle")) {
          mapInstance.removeLayer("radius-circle");
        }
        if (mapInstance.getSource("radius-circle")) {
          mapInstance.removeSource("radius-circle");
        }
      }
    };
  }, [mapInstance, isMarkerMode]);

  // Check for existing session and show welcome dialog on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true);
    } else {
      setShowWelcomeDialog(false);
    }

    // Check for existing session
    const sessionData = localStorage.getItem("supabase_session");
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (sessionData && userEmail && userName) {
      try {
        const session = JSON.parse(sessionData);
        // Check if session is still valid and not expired
        if (
          session &&
          userEmail &&
          userName &&
          session.expires_at &&
          session.expires_at > Date.now()
        ) {
          setIsAuthenticated(true);
          setUserInfo({ email: userEmail, name: userName });
        } else {
          // Session expired or invalid, clear it
          localStorage.removeItem("supabase_session");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
        // Clear invalid session data
        localStorage.removeItem("supabase_session");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
      }
    }

    // Check if location permissions are already granted and get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([longitude, latitude]);
          console.log("Location automatically detected:", {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          });
        },
        (error) => {
          console.log("Location not available:", error.message);
          // Don't show error to user, just log it
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout for better accuracy
          maximumAge: 60000, // Reduced to 1 minute for fresher data
        }
      );
    }
  }, []);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setMapCenter([lng, lat]);
    setUserLocation({ lat, lng });
    localStorage.setItem("hasSeenWelcome", "true");
  }, []);

  const handleWelcomeClose = useCallback(() => {
    setShowWelcomeDialog(false);
    localStorage.setItem("hasSeenWelcome", "true");
  }, []);

  const handleMapMarkerRequest = useCallback(() => {
    // Auto-close the incident form sheet
    setShowIncidentForm(false);
    // Set marker mode to true
    setIsMarkerMode(true);

    if (mapInstance && userLocation) {
      // Hide the Mapbox geolocate control during marker mode
      const geolocateControl = mapInstance
        .getContainer()
        .querySelector(".mapboxgl-ctrl-geolocate");
      if (geolocateControl) {
        (geolocateControl as HTMLElement).style.display = "none";
      }

      // Change cursor to indicate marker placement mode
      mapInstance.getCanvas().style.cursor = "crosshair";

      // Ensure user location is visible by centering map on user location
      mapInstance.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: Math.max(mapInstance.getZoom(), 15), // Ensure good zoom level to see the radius
        duration: 1000,
      });

      // Add a circle to show the 1km radius
      if (!mapInstance.getSource("radius-circle")) {
        // Create a proper GeoJSON circle for 1km radius
        const createCircle = (center: [number, number], radiusInKm: number) => {
          const points = 64;
          const coords = [];
          const distanceX =
            radiusInKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
          const distanceY = radiusInKm / 110.54;

          for (let i = 0; i < points; i++) {
            const theta = (i / points) * (2 * Math.PI);
            const x = distanceX * Math.cos(theta);
            const y = distanceY * Math.sin(theta);
            coords.push([center[0] + x, center[1] + y]);
          }
          coords.push(coords[0]); // Close the circle

          return {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "Polygon" as const,
              coordinates: [coords],
            },
          };
        };

        mapInstance.addSource("radius-circle", {
          type: "geojson",
          data: createCircle([userLocation.lng, userLocation.lat], 1), // 1km radius
        });
      }

      if (!mapInstance.getLayer("radius-circle")) {
        mapInstance.addLayer({
          id: "radius-circle",
          type: "fill",
          source: "radius-circle",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.1,
          },
        });

        mapInstance.addLayer({
          id: "radius-circle-stroke",
          type: "line",
          source: "radius-circle",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-opacity": 0.5,
          },
        });
      }

      // Add click listener for marker placement
      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        const clickedLocation = {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        };

        // Calculate distance from user location using Turf.js
        const userPoint = turf.point([userLocation.lng, userLocation.lat]);
        const clickedPoint = turf.point([
          clickedLocation.lng,
          clickedLocation.lat,
        ]);
        const distance = turf.distance(userPoint, clickedPoint, {
          units: "kilometers",
        });

        // Check if within 1km radius
        if (distance <= 1) {
          // Store the pending location and fetch address
          setPendingMarkerLocation(clickedLocation);

          // Get address for the selected location
          getAddressFromCoordinates(clickedLocation.lat, clickedLocation.lng)
            .then((address) => {
              setPendingLocationAddress(address);
              setShowLocationConfirmDialog(true);
            })
            .catch((error) => {
              console.error("Error getting address:", error);
              setPendingLocationAddress(
                `${clickedLocation.lat.toFixed(4)}, ${clickedLocation.lng.toFixed(4)}`
              );
              setShowLocationConfirmDialog(true);
            });

          mapInstance.getCanvas().style.cursor = "";
          mapInstance.off("click", handleMapClick);

          // Remove the radius circle
          if (mapInstance.getLayer("radius-circle-stroke")) {
            mapInstance.removeLayer("radius-circle-stroke");
          }
          if (mapInstance.getLayer("radius-circle")) {
            mapInstance.removeLayer("radius-circle");
          }
          if (mapInstance.getSource("radius-circle")) {
            mapInstance.removeSource("radius-circle");
          }
        } else {
          toast.error(
            "Location too far. Please place the marker within 1km of your current location"
          );
        }
      };

      mapInstance.on("click", handleMapClick);
    }
  }, [mapInstance, userLocation]);

  // Function to cancel marker mode
  const handleCancelMarkerMode = useCallback(() => {
    setIsMarkerMode(false);

    if (mapInstance) {
      // Show the Mapbox geolocate control again
      const geolocateControl = mapInstance
        .getContainer()
        .querySelector(".mapboxgl-ctrl-geolocate");
      if (geolocateControl) {
        (geolocateControl as HTMLElement).style.display = "";
      }

      // Reset cursor
      mapInstance.getCanvas().style.cursor = "";

      // Remove the radius circle
      if (mapInstance.getLayer("radius-circle-stroke")) {
        mapInstance.removeLayer("radius-circle-stroke");
      }
      if (mapInstance.getLayer("radius-circle")) {
        mapInstance.removeLayer("radius-circle");
      }
      if (mapInstance.getSource("radius-circle")) {
        mapInstance.removeSource("radius-circle");
      }
    }

    // Clear any pending states
    setPendingMarkerLocation(null);
    setPendingLocationAddress("");
    setCustomMarkerAddress("");

    toast(
      "Marker placement cancelled. You can reopen the incident form to try again."
    );
  }, [mapInstance]);

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (
    lat: number,
    lng: number
  ): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi,place,locality,neighborhood`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Get the most relevant feature (usually the first one)
        const feature = data.features[0];
        return (
          feature.place_name ||
          feature.text ||
          `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error("Error getting address:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleLocationConfirm = useCallback(() => {
    if (pendingMarkerLocation && pendingLocationAddress) {
      setCustomMarkerLocation(pendingMarkerLocation);
      setCustomMarkerAddress(pendingLocationAddress);
      setShowLocationConfirmDialog(false);
      setPendingMarkerLocation(null);
      setPendingLocationAddress("");
      setIsMarkerMode(false);

      // Clean up marker mode elements
      if (mapInstance) {
        // Remove the radius circle
        if (mapInstance.getLayer("radius-circle-stroke")) {
          mapInstance.removeLayer("radius-circle-stroke");
        }
        if (mapInstance.getLayer("radius-circle")) {
          mapInstance.removeLayer("radius-circle");
        }
        if (mapInstance.getSource("radius-circle")) {
          mapInstance.removeSource("radius-circle");
        }

        // Show the Mapbox geolocate control again
        const geolocateControl = mapInstance
          .getContainer()
          .querySelector(".mapboxgl-ctrl-geolocate");
        if (geolocateControl) {
          (geolocateControl as HTMLElement).style.display = "";
        }
      }

      // Reopen the incident form sheet
      setShowIncidentForm(true);

      toast.success(
        "Location confirmed! You can now continue with your incident report"
      );
    }
  }, [pendingMarkerLocation, pendingLocationAddress, mapInstance]);

  const handleLocationReject = useCallback(() => {
    setShowLocationConfirmDialog(false);
    setPendingMarkerLocation(null);
    setPendingLocationAddress("");
    setCustomMarkerAddress("");
    setIsMarkerMode(false);

    // Clean up any existing markers before re-enabling marker placement mode
    if (mapInstance) {
      // No custom markers to clean up
    }

    // Re-enable marker placement mode (this will hide the geolocate control again)
    handleMapMarkerRequest();
  }, [handleMapMarkerRequest, mapInstance]);

  const handleIncidentSubmit = async (data: IncidentFormData) => {
    try {
      // Get the current user ID from our local session
      let userId = null;
      try {
        const sessionData = localStorage.getItem("supabase_session");
        if (sessionData) {
          const session = JSON.parse(sessionData);
          userId = session.user?.id || null;
          console.log("Session data:", session);
          console.log("User ID from session:", userId);
        }
      } catch (error) {
        console.error("Error reading session data:", error);
      }

      console.log("Form data being submitted:", data);
      console.log("User ID being used:", userId);

      await createIncident({
        ...data,
        user_id: userId,
      });
      setShowIncidentForm(false);
      toast.success("Incident reported successfully!");
    } catch (error) {
      console.error("Failed to create incident:", error);
      toast.error("Failed to create incident. Please try again.");
    }
  };

  const handleAuthSuccess = useCallback((email: string, name: string) => {
    setIsAuthenticated(true);
    setUserInfo({ email, name });
    setShowAuthDialog(false);
    // Store user info in localStorage for session persistence
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);

    // Show welcome toast
    const isReturningUser = localStorage.getItem("userName") === name;
    toast.success(
      `Welcome${name ? `, ${name}` : ""}! ${isReturningUser ? "Welcome back! You have been signed in" : "You have been successfully signed in"}`,
      {
        duration: 3000,
      }
    );
  }, []);

  const handleAuthRequired = useCallback(() => {
    setShowAuthDialog(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUserInfo(null);

    // Clear ALL session data completely
    localStorage.removeItem("supabase_session");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("hasSeenWelcome");

    // Clear any other potential session data
    sessionStorage.clear();

    // Show logout success toast
    toast.success(
      "Successfully signed out. You have been signed out of your account",
      {
        duration: 3000,
      }
    );
  }, []);

  const handleSettings = useCallback(() => {
    // TODO: Implement settings functionality
    console.log("Settings clicked");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Avatar - Top Left */}
      {isAuthenticated && userInfo && (
        <div className="absolute top-4 left-4 z-20">
          <UserAvatar
            name={userInfo.name}
            email={userInfo.email}
            onLogout={handleLogout}
            onSettings={handleSettings}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="h-screen">
          <MapboxMap
            center={mapCenter}
            zoom={12}
            className="w-full h-full"
            onMapReady={setMapInstance}
            onLocationFound={handleLocationFound}
            userLocation={userLocation}
            showUserLocation={true}
          />

          {/* Incident Markers */}
          {mapInstance && (
            <IncidentMarkers map={mapInstance} incidents={incidents} />
          )}

          {/* Error State */}
          {incidentsError && (
            <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-red-700">
                  Failed to load incidents
                </span>
                <button
                  onClick={retryFetch}
                  className="ml-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Report Incident / Cancel Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            onClick={() => {
              if (isMarkerMode) {
                handleCancelMarkerMode();
              } else if (isAuthenticated) {
                setShowIncidentForm(true);
              } else {
                setShowAuthDialog(true);
              }
            }}
            className={`shadow-lg rounded-full w-12 h-12 sm:w-auto sm:h-auto sm:px-6 sm:py-3 ${
              isMarkerMode
                ? "bg-red-800 hover:bg-red-900 text-white"
                : "bg-black hover:bg-gray-800 text-white"
            }`}
            size="lg"
          >
            {isMarkerMode ? (
              <>
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Report Incident</span>
              </>
            )}
          </Button>
        </div>

        {/* Marker Mode Instructions Overlay */}
        {isMarkerMode && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Place Marker
                </h3>
                <button
                  onClick={handleCancelMarkerMode}
                  className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Tap within the blue circle to place your incident marker
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>1km radius</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Welcome Dialog */}
      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={handleWelcomeClose}
        onLocationFound={handleLocationFound}
      />

      {/* Location Confirmation Dialog */}
      <Dialog
        open={showLocationConfirmDialog}
        onOpenChange={setShowLocationConfirmDialog}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
              Confirm Location
            </DialogTitle>
            <DialogDescription className="text-sm">
              You&apos;ve selected a location for your incident report. Please
              confirm this is the correct location.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {pendingMarkerLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-sm">
                    Selected Location:
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  <div className="font-medium wrap-break-word">
                    {pendingLocationAddress || "Loading address..."}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 break-all">
                    {pendingMarkerLocation.lat.toFixed(6)},{" "}
                    {pendingMarkerLocation.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleLocationReject}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              Reselect
            </Button>
            <Button
              onClick={handleLocationConfirm}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Check className="h-4 w-4" />
              Confirm & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incident Report Form */}
      <IncidentReportForm
        isOpen={showIncidentForm}
        onClose={() => {
          setShowIncidentForm(false);
          setCustomMarkerLocation(null);
          setCustomMarkerAddress("");

          // Clean up any remaining marker mode elements when form is closed
          if (mapInstance && isMarkerMode) {
            // Remove the radius circle
            if (mapInstance.getLayer("radius-circle-stroke")) {
              mapInstance.removeLayer("radius-circle-stroke");
            }
            if (mapInstance.getLayer("radius-circle")) {
              mapInstance.removeLayer("radius-circle");
            }
            if (mapInstance.getSource("radius-circle")) {
              mapInstance.removeSource("radius-circle");
            }

            // Show the Mapbox geolocate control again
            const geolocateControl = mapInstance
              .getContainer()
              .querySelector(".mapboxgl-ctrl-geolocate");
            if (geolocateControl) {
              (geolocateControl as HTMLElement).style.display = "";
            }

            // Reset marker mode
            setIsMarkerMode(false);
          }
        }}
        onSubmit={handleIncidentSubmit}
        userLocation={userLocation}
        isAuthenticated={isAuthenticated}
        onAuthRequired={handleAuthRequired}
        onMapMarkerRequest={handleMapMarkerRequest}
        customMarkerLocation={customMarkerLocation}
        customMarkerAddress={customMarkerAddress}
      />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
