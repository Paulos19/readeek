"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarSelectionProps {
  currentAvatar: string;
  onSelect: (avatarUrl: string) => void;
}

// Assumindo que temos 7 avatares free na pasta public/avatars/
const freeAvatars = Array.from({ length: 7 }, (_, i) => `/avatars/${i + 1}.svg`);

export function AvatarSelection({ currentAvatar, onSelect }: AvatarSelectionProps) {
  const [selected, setSelected] = useState(currentAvatar);

  const handleSelect = (avatarUrl: string) => {
    setSelected(avatarUrl);
    onSelect(avatarUrl);
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
      {freeAvatars.map((avatar) => (
        <button
          key={avatar}
          onClick={() => handleSelect(avatar)}
          className={cn(
            "relative aspect-square w-full rounded-full border-2 transition-all",
            selected === avatar
              ? "border-primary ring-2 ring-primary ring-offset-2"
              : "border-transparent hover:border-muted-foreground"
          )}
        >
          <Image
            src={avatar}
            alt={`Avatar ${avatar}`}
            fill
            className="rounded-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}