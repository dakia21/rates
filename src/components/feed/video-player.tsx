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
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import type { Video } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { soundEffects } from "@/lib/utils/sounds";

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
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(video.is_liked || false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [reposted, setReposted] = useState(video.is_reposted || false);
  const [following, setFollowing] = useState(video.is_following || false);
  const [showHeart, setShowHeart] = useState(false);
  const [superLiked, setSuperLiked] = useState(video.is_super_like || false);

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

  const triggerSuperLikeAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 600;
    
    const particles: any[] = [];
    const colors = ["#7C4DFF", "#facc15", "#22d3ee", "#ec4899", "#10b981", "#ff0055"];
    
    // Create particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 4,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01,
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      particles.forEach((p) => {
        if (p.alpha > 0) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // gravity
          p.alpha -= p.decay;
          
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          active = true;
        }
      });
      
      if (active) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const handleDoubleTap = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikesCount((c) => c + 1);
      onLike(video.id);
      soundEffects.playLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  }, [liked, video.id, onLike]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    onLike(video.id);
    if (newLiked) {
      soundEffects.playLike();
    } else {
      soundEffects.playClick();
    }
  };

  const handleSuperLike = async () => {
    if (superLiked) {
      toast("Вы уже поставили Супер-лайк этому видео!", "info");
      return;
    }

    soundEffects.playLike();
    triggerSuperLikeAnimation();

    try {
      const res = await fetch("/api/videos/super-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: video.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuperLiked(true);
        if (!liked) {
          setLiked(true);
          setLikesCount((c) => c + 1);
        }
        toast("Супер-лайк поставлен! ⚡", "success");
      } else {
        toast(data.error || "Не удалось поставить Супер-лайк", "error");
      }
    } catch (err) {
      toast("Ошибка отправки Супер-лайка", "error");
    }
  };

  const handleRepost = () => {
    setReposted(!reposted);
    onRepost(video.id);
    soundEffects.playClick();
  };

  const handleFollow = () => {
    setFollowing(true);
    onFollow(video.user_id);
    soundEffects.playClick();
  };

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always overflow-hidden">
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

      {/* Canvas for super like particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20 w-full h-full" />

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-25"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-glow" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 lg:pb-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-15">
        <div className="flex items-end gap-4">
          <div className="flex-1 min-w-0">
            {/* Author details with co-author support */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2.5 overflow-visible shrink-0 mr-1">
                <Link href={`/profile/${video.profile?.username}`}>
                  <Avatar
                    src={video.profile?.avatar_url}
                    alt={video.profile?.display_name || ""}
                    size="sm"
                    className="ring-2 ring-black"
                  />
                </Link>
                {video.co_author && (
                  <Link href={`/profile/${video.co_author.username}`}>
                    <Avatar
                      src={video.co_author.avatar_url}
                      alt={video.co_author.display_name || ""}
                      size="sm"
                      className="ring-2 ring-black"
                    />
                  </Link>
                )}
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <div className="flex items-center gap-1 text-white text-xs font-semibold">
                  <Link href={`/profile/${video.profile?.username}`} className="hover:underline truncate max-w-[85px]">
                    @{video.profile?.username}
                  </Link>
                  {video.co_author && (
                    <>
                      <span className="text-white/60 text-[9px]">&</span>
                      <Link href={`/profile/${video.co_author.username}`} className="hover:underline truncate max-w-[85px] text-[#4ade80]">
                        @{video.co_author.username}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {!following && (
                <button
                  onClick={handleFollow}
                  className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary text-white hover:opacity-90 transition-opacity ml-1.5 shrink-0"
                >
                  Подписаться
                </button>
              )}
            </div>

            <p className="text-white text-sm font-semibold mb-1">{video.title}</p>
            {video.description && (
              <p className="text-white/70 text-xs line-clamp-2">{video.description}</p>
            )}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {video.tags.map((tag) => (
                  <span key={tag} className="text-primary-foreground/80 text-xs font-medium">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
              <Music className="w-3 h-3 animate-spin-slow" />
              <span>Оригинальный звук</span>
            </div>
          </div>

          {/* Action sidebar */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            {/* Super Like lightning button */}
            <button onClick={handleSuperLike} className="flex flex-col items-center gap-1 group">
              <div className={cn(
                "p-2.5 rounded-full border transition-all duration-300",
                superLiked
                  ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 scale-105"
                  : "bg-black/40 border-white/10 hover:border-yellow-500/30 text-white hover:text-yellow-400"
              )}>
                <Zap className={cn("w-6 h-6", superLiked && "fill-yellow-400")} />
              </div>
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Супер</span>
            </button>

            <button onClick={handleLike} className="flex flex-col items-center gap-1">
              <div className={cn("p-2 rounded-full glass hover:scale-105 transition-transform", liked && "text-red-500")}>
                <Heart className={cn("w-6 h-6", liked && "fill-red-500")} />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(likesCount)}</span>
            </button>

            <button onClick={() => { onComment(video.id); soundEffects.playClick(); }} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-full glass hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(video.comments_count)}</span>
            </button>

            <button onClick={handleRepost} className="flex flex-col items-center gap-1">
              <div className={cn("p-2 rounded-full glass hover:scale-105 transition-transform", reposted && "text-green-400")}>
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatNumber(video.reposts_count)}</span>
            </button>

            <button onClick={() => soundEffects.playClick()} className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-full glass hover:scale-105 transition-transform">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
            </button>

            <button
              onClick={() => { setIsMuted(!isMuted); soundEffects.playClick(); }}
              className="p-2 rounded-full glass hover:scale-105 transition-transform"
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

      <div className="absolute top-4 left-4 text-white/60 text-xs bg-black/40 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
        {formatNumber(video.views_count)} просмотров
      </div>
    </div>
  );
}
