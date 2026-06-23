"use client";

import { useState, useEffect, use } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileVideos } from "@/components/profile/profile-videos";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { Profile, Video } from "@/types";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isOwn, setIsOwn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/users?username=${username}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data.profile);
          setVideos(d.data.videos);
          setIsOwn(d.data.is_own);
          setIsFollowing(d.data.is_following);
        }
        setLoading(false);
      });
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: profile.id }),
    });
    const data = await res.json();
    if (data.success) {
      setIsFollowing(data.data.following);
      setProfile((prev) =>
        prev
          ? { ...prev, followers_count: prev.followers_count + (data.data.following ? 1 : -1) }
          : null
      );
      toast(data.data.following ? "Вы подписались" : "Вы отписались", "success");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-16">Пользователь не найден</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <ProfileHeader
        profile={profile}
        isOwn={isOwn}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onUnfollow={handleFollow}
      />
      <ProfileVideos videos={videos} username={username} />
    </div>
  );
}
