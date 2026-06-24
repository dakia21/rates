"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VideoPlayer } from "./video-player";
import { CommentsSheet } from "./comments-sheet";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { Video } from "@/types";
import { Play } from "lucide-react";

export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchVideos = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`/api/videos?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setVideos((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
      }
    } catch {
      toast("Ошибка загрузки видео", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(index);

            if (index >= videos.length - 3) {
              fetchVideos(Math.ceil(videos.length / 10) + 1);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [videos, fetchVideos]);

  const handleLike = async (videoId: string) => {
    await fetch(`/api/videos/${videoId}/like`, { method: "POST" });
  };

  const handleRepost = async (videoId: string) => {
    const res = await fetch(`/api/videos/${videoId}/repost`, { method: "POST" });
    const data = await res.json();
    if (data.success) toast("Репост опубликован", "success");
  };

  const handleFollow = async (userId: string) => {
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (data.success) toast("Вы подписались", "success");
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] lg:h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-semibold">Лента пуста</h2>
        <p className="text-muted-foreground">Загрузите первое видео или подпишитесь на других пользователей</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-[calc(100vh-4rem)] lg:h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            data-index={index}
            className="h-[calc(100vh-4rem)] lg:h-screen"
          >
            <VideoPlayer
              video={video}
              isActive={index === activeIndex}
              onLike={handleLike}
              onComment={setCommentsVideoId}
              onRepost={handleRepost}
              onFollow={handleFollow}
            />
          </div>
        ))}
      </div>

      <CommentsSheet
        videoId={commentsVideoId}
        onClose={() => setCommentsVideoId(null)}
      />
    </>
  );
}
