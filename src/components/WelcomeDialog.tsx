"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationFound: (lat: number, lng: number) => void;
}

export function WelcomeDialog({
  isOpen,
  onClose,
  onLocationFound,
}: WelcomeDialogProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationFound(latitude, longitude);
        setIsGettingLocation(false);
        onClose();
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access is required for many app features. Please allow location access to continue.";
            setPermissionDenied(true);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Removed Chennai fallback - focusing on location permission only

  const handleDialogClose = (open: boolean) => {
    // Don't allow closing if permission was denied
    if (!open && permissionDenied) {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {permissionDenied
              ? "Location Access Required"
              : "Welcome to SafeCast"}
          </DialogTitle>
          <DialogDescription>
            {permissionDenied
              ? "Location access is essential for many features of SafeCast. Please allow location access to continue using the app."
              : "SafeCast requires location access to provide you with live tracking, location-based features, and personalized map experiences."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation
                ? "Getting your location..."
                : permissionDenied
                ? "Allow Location Access"
                : "Use my current location"}
            </Button>
          </div>

          {locationError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {locationError}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {permissionDenied
              ? "Without location access, you'll miss out on key features like live tracking, location-based alerts, and personalized map experiences."
              : "Your location data is processed locally and never shared with third parties."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
