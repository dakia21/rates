"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Heart } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { soundEffects } from "@/lib/utils/sounds";
import type { Video } from "@/types";

interface ProfileVideosProps {
  videos: Video[];
  username: string;
}

export function ProfileVideos({ videos, username }: ProfileVideosProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Нет загруженных видео</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/feed?video=${video.id}`}
          onClick={() => soundEffects.playClick()}
          className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-secondary"
        >
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <video src={video.video_url} className="w-full h-full object-cover" muted />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {formatNumber(video.views_count)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatNumber(video.likes_count)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
