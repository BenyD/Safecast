"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// Removed unused imports
import {
  MapPin,
  Camera,
  AlertTriangle,
  Upload,
  Droplets,
  TreePine,
  Wrench,
  Home,
  Car,
  AlertCircle,
} from "lucide-react";
import {
  incidentFormSchema,
  IncidentFormData,
} from "../schemas/incidentSchema";

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IncidentFormData) => void;
  userLocation: { lat: number; lng: number } | null;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  onMapMarkerRequest?: () => void; // Callback to enable map marker placement mode
  customMarkerLocation?: { lat: number; lng: number } | null; // Custom marker location from map
  customMarkerAddress?: string; // Address of the custom marker location
}

const INCIDENT_TYPES = [
  { value: "water_logging", label: "Water Logging", icon: Droplets },
  { value: "fallen_trees", label: "Fallen Trees", icon: TreePine },
  { value: "sewage_issues", label: "Sewage Issues", icon: Wrench },
  { value: "house_flooding", label: "House Flooding", icon: Home },
  { value: "wildlife_hazard", label: "Wildlife Hazard", icon: AlertCircle },
  { value: "vehicle_stuck", label: "Vehicle Stuck", icon: Car },
  { value: "other", label: "Other", icon: AlertCircle },
] as const;

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
] as const;

export function IncidentReportForm({
  isOpen,
  onClose,
  onSubmit,
  userLocation,
  isAuthenticated,
  onAuthRequired,
  onMapMarkerRequest,
  customMarkerLocation,
  customMarkerAddress,
}: IncidentReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "water_logging",
      severity: "medium",
      location: userLocation || { lat: 13.0827, lng: 80.2707 },
      address: "",
      images: [],
    },
  });

  const watchedType = watch("type");
  const watchedSeverity = watch("severity");

  // Reverse geocode user location to get address
  useEffect(() => {
    if (userLocation && !useCustomLocation) {
      reverseGeocode(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, useCustomLocation]);

  // Auto-fetch current location address when form opens
  useEffect(() => {
    if (isOpen && userLocation && !useCustomLocation && !customMarkerLocation) {
      reverseGeocode(userLocation.lat, userLocation.lng);
    }
  }, [isOpen, userLocation, useCustomLocation, customMarkerLocation]);

  // Reset to current location when form opens (unless custom location is set)
  useEffect(() => {
    if (isOpen && userLocation && !customMarkerLocation) {
      setUseCustomLocation(false);
      setValue("location", userLocation);
    }
  }, [isOpen, userLocation, customMarkerLocation, setValue]);

  // Auto-enable custom location when form opens with a custom marker
  useEffect(() => {
    if (customMarkerLocation && customMarkerAddress) {
      setUseCustomLocation(true);
    }
  }, [customMarkerLocation, customMarkerAddress]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi,locality,neighborhood`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setCurrentAddress(
          feature.place_name || feature.text || "Unknown location"
        );
      } else {
        setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const onFormSubmit = async (data: IncidentFormData) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setIsSubmitting(true);
    try {
      // Use custom location if enabled, otherwise use user's current location
      let finalLocation = data.location;
      if (useCustomLocation && customMarkerLocation) {
        // Use the custom marker location from the map
        finalLocation = customMarkerLocation;
      } else {
        // Use user's current location
        finalLocation = userLocation || { lat: 13.0827, lng: 80.2707 }; // Fallback to Chennai
      }

      const formData = {
        ...data,
        location: finalLocation,
        address: undefined, // Remove address field as we're not using text input anymore
      };

      await onSubmit(formData);
      reset();
      setUseCustomLocation(false);
      setCurrentAddress("");
      onClose();
    } catch (error) {
      console.error("Error submitting incident:", error);
      alert("Failed to submit incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // For now, just store file names - we'll implement actual upload later
      const fileNames = Array.from(files).map((file) => file.name);
      const currentImages = watch("images") || [];
      setValue("images", [...currentImages, ...fileNames]);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-8 bg-white">
        <SheetHeader className="pb-8 px-2">
          <SheetTitle className="flex items-center gap-3 text-2xl font-normal text-gray-700">
            <AlertTriangle className="h-6 w-6 text-gray-600" />
            Report Incident
          </SheetTitle>
          <SheetDescription className="text-lg text-gray-500">
            Help your community by reporting incidents in your area.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 px-2">
          {/* Title Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              placeholder="Brief description of the incident"
              className="h-11"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Incident Type Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium">Incident Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setValue("type", type.value as IncidentFormData["type"])
                    }
                    className={`p-4 text-left border rounded-lg transition-all duration-200 ${
                      watchedType === type.value
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mb-2 text-gray-600" />
                    <div className="text-sm font-medium text-gray-900">
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Severity Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium">Severity Level</Label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITY_LEVELS.map((severity) => (
                <button
                  key={severity.value}
                  type="button"
                  onClick={() =>
                    setValue(
                      "severity",
                      severity.value as IncidentFormData["severity"]
                    )
                  }
                  className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all duration-200 ${
                    watchedSeverity === severity.value
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${severity.color}`}
                >
                  {severity.label}
                </button>
              ))}
            </div>
            {errors.severity && (
              <p className="text-sm text-red-600">{errors.severity.message}</p>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Provide more details about the incident..."
              rows={4}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium">Location</Label>

            {/* Current Location Display */}
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  useCustomLocation
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <MapPin
                  className={`h-5 w-5 shrink-0 ${
                    useCustomLocation ? "text-blue-600" : "text-gray-600"
                  }`}
                />
                <div className="flex-1">
                  {useCustomLocation && customMarkerAddress ? (
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Selected Location
                      </p>
                      <p className="text-sm text-blue-700">
                        {customMarkerAddress}
                      </p>
                    </div>
                  ) : isGeocoding ? (
                    <span
                      className={`text-sm ${
                        useCustomLocation ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      Getting address...
                    </span>
                  ) : userLocation ? (
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          useCustomLocation ? "text-blue-800" : "text-gray-800"
                        }`}
                      >
                        Current Location
                      </p>
                      <p
                        className={`text-sm ${
                          useCustomLocation ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {currentAddress}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          useCustomLocation ? "text-blue-800" : "text-gray-800"
                        }`}
                      >
                        Location Access
                      </p>
                      <p
                        className={`text-sm ${
                          useCustomLocation ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        Allow location access to automatically set your current
                        location
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reselect Location Button */}
              {useCustomLocation && customMarkerAddress && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onMapMarkerRequest) {
                        onMapMarkerRequest();
                      }
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Reselect Location
                  </Button>
                </div>
              )}

              {/* Location Override Option - Only show if no custom location has been set */}
              {!customMarkerLocation && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    id="use-custom-location"
                    checked={useCustomLocation}
                    onChange={(e) => {
                      setUseCustomLocation(e.target.checked);
                      if (e.target.checked && onMapMarkerRequest) {
                        onMapMarkerRequest();
                      }
                    }}
                    className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <Label
                    htmlFor="use-custom-location"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Place marker on map (within 1km radius)
                  </Label>
                </div>
              )}

              {/* Map Marker Instructions - Only show if no custom location has been set */}
              {useCustomLocation && !customMarkerLocation && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-sm font-medium text-blue-800">
                    Map Marker Placement
                  </Label>
                  <p className="text-sm text-blue-700">
                    Click on the map to place an incident marker within 1km of
                    your current location.
                  </p>
                  <p className="text-xs text-blue-600">
                    The marker will be automatically placed when you click on
                    the map.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium">Photos (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Camera className="h-10 w-10 text-gray-400" />
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload photos
                  </span>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 10MB each
                  </p>
                </div>
              </label>
            </div>
            {watch("images") && watch("images")!.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  {watch("images")!.length} photo(s) selected
                </p>
              </div>
            )}
          </div>

          {/* Submit Button Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-medium bg-black hover:bg-gray-800 text-white shadow-lg"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Incident Report
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
