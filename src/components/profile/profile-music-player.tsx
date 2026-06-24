"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Disc } from "lucide-react";
import { soundEffects } from "@/lib/utils/sounds";

interface ProfileMusicPlayerProps {
  url: string;
  title?: string | null;
  artist?: string | null;
}

export function ProfileMusicPlayer({ url, title, artist }: ProfileMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset play state when URL changes
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [url]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    soundEffects.playClick();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.15; // Set volume low and pleasant
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (!audioRef.current) return;
    soundEffects.playClick();

    const muted = !isMuted;
    audioRef.current.muted = muted;
    setIsMuted(muted);
  };

  return (
    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 glass-card px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg select-none">
      <audio ref={audioRef} src={url} loop />

      {/* Vinyl Disc Icon */}
      <div className={`relative ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "6s", animationTimingFunction: "linear" }}>
        <Disc className={`w-6 h-6 ${isPlaying ? "text-primary" : "text-muted-foreground"} transition-colors`} />
        <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-background rounded-full border border-white/10" />
      </div>

      {/* Track Details */}
      <div className="max-w-[100px] sm:max-w-[140px] text-left">
        <p className="text-[10px] font-bold text-foreground truncate leading-none">
          {title || "Без названия"}
        </p>
        <p className="text-[8px] text-muted-foreground truncate mt-0.5 leading-none">
          {artist || "Неизвестен"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
        <button
          onClick={handlePlayToggle}
          className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleMuteToggle}
          className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-destructive" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
