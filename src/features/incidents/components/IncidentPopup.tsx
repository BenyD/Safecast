"use client";

interface IncidentPopupProps {
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
  color: string;
}

export function IncidentPopup({ incident, color }: IncidentPopupProps) {
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
    <div className="p-3 min-w-[200px] max-w-[280px]">
      <div className="flex items-start gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-gray-900">
            {incident.title}
          </h3>
          {incident.address && (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {incident.address}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Reported {formatTimeAgo(incident.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
