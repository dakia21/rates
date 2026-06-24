"use client";

import { useEffect, useState } from "react";
import { Bookmark, Sparkles, Heart, MessageCircle, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils/format";
import { soundEffects } from "@/lib/utils/sounds";
import Link from "next/link";
import type { Video } from "@/types";

export default function FavoritesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "videos">("videos");

  useEffect(() => {
    async function loadLikedVideos() {
      try {
        const res = await fetch("/api/videos?limit=20");
        const data = await res.json();
        if (data.success) {
          // Filter videos to only show liked ones as bookmarks
          const liked = data.data.filter((v: Video) => v.is_liked);
          setVideos(liked);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLikedVideos();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border/40 p-6 flex items-center justify-between">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary fill-primary/15" />
            <h1 className="text-2xl font-bold">Избранное</h1>
          </div>
          <p className="text-sm text-muted-foreground">Сохраненные посты и медиафайлы для быстрого доступа</p>
        </div>
        <div className="hidden sm:block">
          <span className="text-4xl">🔖</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary/30 border border-border/40 rounded-2xl w-max">
        <button
          onClick={() => {
            setActiveTab("videos");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "videos"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="w-4 h-4" />
          Видеоролики ({videos.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("posts");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "posts"
              ? "bg-primary text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Публикации (0)
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activeTab === "videos" && videos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Link key={video.id} href="/feed" onClick={() => soundEffects.playClick()}>
              <div className="glass-card group cursor-pointer overflow-hidden rounded-2xl border border-border/40 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02]">
                {/* Poster / Cover */}
                <div className="relative aspect-[9/16] bg-black">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <Play className="w-12 h-12" />
                    </div>
                  )}

                  {/* Views count */}
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white">
                    {formatNumber(video.views_count)} просм.
                  </div>

                  {/* Creator Info Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end text-white">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Avatar src={video.profile?.avatar_url} alt={video.profile?.display_name || ""} size="xs" />
                      <span className="text-[11px] font-bold truncate">@{video.profile?.username}</span>
                    </div>
                    <p className="text-xs font-semibold truncate text-white/95">{video.title}</p>
                  </div>
                </div>

                {/* Footer Details */}
                <div className="p-3 bg-card flex items-center justify-around text-xs border-t border-border/20 text-muted-foreground">
                  <span className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    {video.likes_count}
                  </span>
                  <span className="flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {video.comments_count}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-2xl">
            {activeTab === "videos" ? "🎬" : "📝"}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">Здесь пока пусто</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {activeTab === "videos"
                ? "В избранном будут показываться видеоролики, которые вы лайкнули в ленте."
                : "Здесь будут отображаться посты каналов, которые вы сохранили в закладки."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
