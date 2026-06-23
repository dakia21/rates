"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils/format";
import type { Video } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onRepost: (videoId: string) => void;
  onFollow: (userId: string) => void;
}

export function VideoPlayer({
  video,
  isActive,
  onLike,
  onComment,
  onRepost,
  onFollow,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(video.is_liked || false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [reposted, setReposted] = useState(video.is_reposted || false);
  const [following, setFollowing] = useState(video.is_following || false);
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isActive) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play();
      setIsPlaying(true);
    }
  };

  const handleDoubleTap = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikesCount((c) => c + 1);
      onLike(video.id);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  }, [liked, video.id, onLike]);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    onLike(video.id);
  };

  const handleRepost = () => {
    setReposted(!reposted);
    onRepost(video.id);
  };

  const handleFollow = () => {
    setFollowing(true);
    onFollow(video.user_id);
  };

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always">
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url || undefined}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
      />

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 lg:pb-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-end gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/profile/${video.profile?.username}`}>
                <Avatar src={video.profile?.avatar_url} alt={video.profile?.display_name || ""} size="sm" />
              </Link>
              <Link href={`/profile/${video.profile?.username}`} className="font-semibold text-white text-sm hover:underline">
                @{video.profile?.username}
              </Link>
              {!following && (
                <button
                  onClick={handleFollow}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-rates-500 text-white hover:bg-rates-600 transition-colors"
                >
                  Подписаться
                </button>
              )}
            </div>
            <p className="text-white text-sm font-medium mb-1">{video.title}</p>
            {video.description && (
              <p className="text-white/70 text-xs line-clamp-2">{video.description}</p>
            )}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-rates-300 text-xs">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
              <Music className="w-3 h-3" />
              <span>Оригинальный звук</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button onClick={handleLike} className="flex flex-col items-center gap-1">
              <div className={cn("p-2 rounded-full glass", liked && "text-red-500")}>
                <Heart className={cn("w-6 h-6", liked && "fill-red-500")} />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(likesCount)}</span>
            </button>

            <button onClick={() => onComment(video.id)} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-full glass">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(video.comments_count)}</span>
            </button>

            <button onClick={handleRepost} className="flex flex-col items-center gap-1">
              <div className={cn("p-2 rounded-full glass", reposted && "text-green-400")}>
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(video.reposts_count)}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-full glass">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full glass"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 text-white/60 text-xs">
        {formatNumber(video.views_count)} просмотров
      </div>
    </div>
  );
}
