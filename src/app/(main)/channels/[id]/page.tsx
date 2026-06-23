"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Pin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import type { Channel, ChannelPost } from "@/types";

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [channel, setChannel] = useState<Channel & { posts: ChannelPost[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchChannel = async () => {
    const res = await fetch(`/api/channels/${id}`);
    const data = await res.json();
    if (data.success) setChannel(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChannel();
  }, [id]);

  const handleSubscribe = async () => {
    const res = await fetch(`/api/channels/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe" }),
    });
    const data = await res.json();
    if (data.success) {
      setChannel((prev) =>
        prev
          ? {
              ...prev,
              is_subscribed: data.data.subscribed,
              subscribers_count: prev.subscribers_count + (data.data.subscribed ? 1 : -1),
            }
          : null
      );
    }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/channels/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "post", content: postContent }),
    });
    const data = await res.json();
    if (data.success) {
      setChannel((prev) =>
        prev ? { ...prev, posts: [data.data, ...prev.posts] } : null
      );
      setPostContent("");
      toast("Пост опубликован", "success");
    }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!channel) {
    return <div className="text-center py-16">Канал не найден</div>;
  }

  const isOwner = profile?.id === channel.owner_id;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4">
        <Link href="/channels" className="btn-ghost inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>

        <Card>
          <div className="flex items-start gap-4">
            <Avatar src={channel.avatar_url} alt={channel.name} size="xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{channel.name}</h1>
              <p className="text-muted-foreground">@{channel.username}</p>
              {channel.description && <p className="mt-2">{channel.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatNumber(channel.subscribers_count)} подписчиков
                </span>
              </div>
              {!isOwner && (
                <Button
                  className="mt-4"
                  variant={channel.is_subscribed ? "outline" : "primary"}
                  onClick={handleSubscribe}
                >
                  {channel.is_subscribed ? "Отписаться" : "Подписаться"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {isOwner && (
          <Card className="mt-4">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Написать пост..."
            />
            <Button className="mt-3" onClick={handlePost} loading={posting} disabled={!postContent.trim()}>
              Опубликовать
            </Button>
          </Card>
        )}

        <div className="mt-6 space-y-4">
          {channel.posts.map((post) => (
            <Card key={post.id}>
              {post.is_pinned && (
                <div className="flex items-center gap-1 text-xs text-rates-500 mb-2">
                  <Pin className="w-3 h-3" />
                  Закреплено
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={post.author?.avatar_url} alt={post.author?.display_name || ""} size="sm" />
                <span className="font-medium text-sm">{post.author?.display_name}</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
              </div>
              {post.content && <p className="text-sm">{post.content}</p>}
              {post.media_url && (
                <img src={post.media_url} alt="" className="mt-2 rounded-xl max-h-80 object-cover" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
