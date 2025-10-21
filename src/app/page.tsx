"use client";

import { useState, useEffect } from "react";
import { MapboxMap } from "@/components/MapboxMap";
import { WelcomeDialog } from "@/components/WelcomeDialog";

export default function Home() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([80.2707, 13.0827]); // Chennai, India
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [mapKey, setMapKey] = useState(0); // Force map re-render

  // Show welcome dialog on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true);
    } else {
      setShowWelcomeDialog(false);
    }
  }, []);

  const handleLocationFound = (lat: number, lng: number) => {
    setMapCenter([lng, lat]);
    setMapKey(prev => prev + 1); // Force map re-render
    localStorage.setItem("hasSeenWelcome", "true");
  };

  const handleWelcomeClose = () => {
    setShowWelcomeDialog(false);
    localStorage.setItem("hasSeenWelcome", "true");
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1">
        <div className="h-screen">
          <MapboxMap 
            key={mapKey}
            center={mapCenter} 
            zoom={12}
            className="w-full h-full"
          />
        </div>
      </main>

      {/* Welcome Dialog */}
      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={handleWelcomeClose}
        onLocationFound={handleLocationFound}
      />
    </div>
  );
}
