"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Shield,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
} from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState<
    "welcome" | "features" | "location"
  >("welcome");
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
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("Location obtained:", {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        });
        onLocationFound(latitude, longitude);
        setIsGettingLocation(false);
        onClose();
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access is required for many app features. Please allow location access in your browser settings and try again.";
            setPermissionDenied(true);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Please check your device's location settings and try again.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Location request timed out. Please try again or check your internet connection.";
            break;
          default:
            errorMessage =
              "An unexpected error occurred while getting your location. Please try again.";
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 60000, // 1 minute for fresher data
      }
    );
  };

  const handleNext = () => {
    if (currentStep === "welcome") {
      setCurrentStep("features");
    } else if (currentStep === "features") {
      setCurrentStep("location");
    }
  };

  const handleBack = () => {
    if (currentStep === "features") {
      setCurrentStep("welcome");
    } else if (currentStep === "location") {
      setCurrentStep("features");
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleDialogClose = (open: boolean) => {
    // Don't allow closing if permission was denied
    if (!open && permissionDenied) {
      return;
    }
    onClose();
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to SafeCast
          </h2>
          <p className="text-gray-600 mt-2">
            Your community safety platform for real-time incident reporting and
            monitoring
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900">
              Real-time Community Safety
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Stay informed about incidents in your area and help keep your
              community safe
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
          <Users className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-green-900">Community-Driven</h3>
            <p className="text-sm text-green-700 mt-1">
              Report incidents and help others stay aware of potential hazards
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleNext}
          className="flex-1 bg-black hover:bg-gray-800 text-white shadow-lg"
        >
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button onClick={handleSkip} variant="outline" className="px-6">
          Skip
        </Button>
      </div>
    </div>
  );

  const renderFeaturesStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          What SafeCast Offers
        </h2>
        <p className="text-gray-600">
          Discover the features that make your community safer
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-orange-900">Incident Reporting</h3>
            <p className="text-sm text-orange-700 mt-1">
              Quickly report water logging, fallen trees, flooding, and other
              community hazards
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
          <MapPin className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-purple-900">Live Map View</h3>
            <p className="text-sm text-purple-700 mt-1">
              See real-time incidents on an interactive map with detailed
              information
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-indigo-900">Verified Reports</h3>
            <p className="text-sm text-indigo-700 mt-1">
              All reports are verified and categorized by severity for accurate
              information
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleBack} variant="outline" className="px-6">
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 bg-black hover:bg-gray-800 text-white shadow-lg"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Navigation className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Enable Location Access
          </h2>
          <p className="text-gray-600 mt-2">
            SafeCast needs your location to show nearby incidents and help you
            report accurately
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">
            Why we need location access:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Show incidents near your current location</li>
            <li>• Automatically set location for incident reports</li>
            <li>• Provide location-based safety alerts</li>
            <li>• Help emergency services respond faster</li>
          </ul>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">For best accuracy:</p>
              <ul className="text-xs space-y-1">
                <li>• Ensure GPS is enabled on your device</li>
                <li>• Try to be outdoors or near a window</li>
                <li>• Wait a few seconds for GPS to lock on</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-3 w-3 text-gray-600" />
            <p className="text-xs text-gray-600 text-center">
              Your location data is processed locally and never shared with
              third parties
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full bg-black hover:bg-gray-800 text-white shadow-lg"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isGettingLocation
            ? "Getting your location..."
            : permissionDenied
              ? "Allow Location Access"
              : "Enable Location Access"}
        </Button>

        {locationError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {locationError}
          </div>
        )}

        <Button onClick={handleSkip} variant="outline" className="w-full">
          Continue without location
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="text-gray-500"
        >
          Back to features
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStep === "welcome" && ""}
            {currentStep === "features" && ""}
            {currentStep === "location" && ""}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2">
          {currentStep === "welcome" && renderWelcomeStep()}
          {currentStep === "features" && renderFeaturesStep()}
          {currentStep === "location" && renderLocationStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
