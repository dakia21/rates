"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const iconSizeMap = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

const onlineSizeMap = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

export function Avatar({ src, alt = "Avatar", size = "md", online, className }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showPlaceholder = !src || hasError;

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-gradient-to-br from-[#7C4DFF] via-[#8B5CF6] to-[#A855F7] flex items-center justify-center text-white font-semibold select-none",
          sizeMap[size]
        )}
      >
        {showPlaceholder ? (
          <User className={iconSizeMap[size]} />
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            online ? "bg-green-500" : "bg-muted-foreground/40",
            onlineSizeMap[size]
          )}
        />
      )}
    </div>
  );
}

