"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Droplets,
  TreePine,
  Wrench,
  Home,
  Car,
  AlertCircle,
} from "lucide-react";

interface IncidentDetailSheetProps {
  incident: {
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
  isOpen: boolean;
  onClose: () => void;
}

const INCIDENT_TYPE_ICONS = {
  water_logging: Droplets,
  fallen_trees: TreePine,
  sewage_issues: Wrench,
  house_flooding: Home,
  wildlife_hazard: AlertCircle,
  vehicle_stuck: Car,
  other: AlertCircle,
} as const;

const SEVERITY_CONFIG = {
  low: {
    label: "Low",
    variant: "secondary" as const,
    icon: CheckCircle,
    color: "bg-green-500",
  },
  medium: {
    label: "Medium",
    variant: "secondary" as const,
    icon: AlertTriangle,
    color: "bg-yellow-500",
  },
  high: {
    label: "High",
    variant: "secondary" as const,
    icon: AlertTriangle,
    color: "bg-orange-500",
  },
  urgent: {
    label: "Urgent",
    variant: "secondary" as const,
    icon: XCircle,
    color: "bg-red-500",
  },
} as const;

const TYPE_LABELS = {
  water_logging: "Water Logging",
  fallen_trees: "Fallen Trees",
  sewage_issues: "Sewage Issues",
  house_flooding: "House Flooding",
  wildlife_hazard: "Wildlife Hazard",
  vehicle_stuck: "Vehicle Stuck",
  other: "Other",
} as const;

export function IncidentDetailSheet({
  incident,
  isOpen,
  onClose,
}: IncidentDetailSheetProps) {
  const severity = incident.severity as keyof typeof SEVERITY_CONFIG;
  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  const SeverityIcon = severityConfig.icon;

  const typeLabel =
    TYPE_LABELS[incident.type as keyof typeof TYPE_LABELS] || incident.type;
  const TypeIcon =
    INCIDENT_TYPE_ICONS[incident.type as keyof typeof INCIDENT_TYPE_ICONS] ||
    AlertCircle;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-8 bg-white">
        <SheetHeader className="pb-8 px-2">
          <SheetTitle className="flex items-center gap-3 text-2xl font-normal text-gray-700">
            <TypeIcon className="h-6 w-6 text-gray-600" />
            {incident.title}
            {incident.is_verified && (
              <Badge
                variant="outline"
                className="text-sm ml-auto bg-green-100 text-green-800 border-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-lg text-gray-500">
            {typeLabel} • {formatTimeAgo(incident.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-2">
          {/* Type and Severity Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium">Incident Details</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">
                <TypeIcon className="w-4 h-4 mr-1" />
                {typeLabel}
              </Badge>
              <Badge
                variant={severityConfig.variant}
                className={`text-sm text-white ${severityConfig.color}`}
              >
                <SeverityIcon className="w-4 h-4 mr-1" />
                {severityConfig.label}
              </Badge>
            </div>
          </div>

          {/* Description Section */}
          {incident.description && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {incident.description}
              </p>
            </div>
          )}

          {/* Location Section */}
          {incident.address && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium">Location</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {incident.address}
                </p>
              </div>
            </div>
          )}

          {/* Images Section */}
          {incident.images && incident.images.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium">Photos</h3>
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {incident.images.length} photo
                  {incident.images.length !== 1 ? "s" : ""} attached
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {incident.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reported</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(incident.created_at)}
                  </p>
                </div>
              </div>
              {incident.expires_at && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Expires</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(incident.expires_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium">Status</h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  incident.status === "active"
                    ? "bg-green-500"
                    : incident.status === "resolved"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-900 capitalize">
                {incident.status || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
