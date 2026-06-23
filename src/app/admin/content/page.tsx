"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import type { Video } from "@/types";

export default function AdminContentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVideos(d.data.recentVideos);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (videoId: string) => {
    const res = await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: videoId }),
    });
    if ((await res.json()).success) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      toast("Видео удалено", "success");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/admin" className="btn-ghost inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-bold mb-6">Модерация контента</h1>

      <div className="space-y-2">
        {videos.map((video) => (
          <Card key={video.id} className="!p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-24 rounded-lg bg-secondary overflow-hidden shrink-0">
                {video.thumbnail_url && (
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{video.title}</p>
                <p className="text-sm text-muted-foreground">@{video.profile?.username}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(video.created_at)}</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(video.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
