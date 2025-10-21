"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User, LogOut, Settings } from "lucide-react";

interface UserAvatarProps {
  name: string;
  email: string;
  onLogout: () => void;
  onSettings: () => void;
}

export function UserAvatar({
  name,
  email,
  onLogout,
  onSettings,
}: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-gray-100 bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
            {getInitials(name)}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-black">{name}</div>
            <div className="text-xs text-gray-600">{email}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2 bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg"
        align="start"
      >
        <div className="space-y-1">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-black">{name}</div>
            <div className="text-xs text-gray-600">{email}</div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-black hover:bg-gray-100"
            onClick={() => {
              onSettings();
              setIsOpen(false);
            }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
