"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils/format";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isOwn: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}

export function ProfileHeader({ profile, isOwn, isFollowing, onFollow, onUnfollow }: ProfileHeaderProps) {
  return (
    <div className="relative">
      <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-rates-500/20 to-purple-500/20">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="px-4 -mt-16 relative">
        <div className="flex items-end justify-between">
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name}
            size="xl"
            online={profile.is_online}
            className="ring-4 ring-background"
          />
          <div className="flex gap-2 mb-2">
            {isOwn ? (
              <Link href="/settings">
                <Button variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Настройки
                </Button>
              </Link>
            ) : isFollowing ? (
              <Button variant="outline" size="sm" onClick={onUnfollow}>
                Отписаться
              </Button>
            ) : (
              <Button size="sm" onClick={onFollow}>
                Подписаться
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            {profile.is_verified && (
              <span className="text-rates-500 text-sm">✓</span>
            )}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 text-sm">{profile.bio}</p>
          )}
        </div>

        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="font-bold text-lg">{formatNumber(profile.followers_count)}</p>
            <p className="text-xs text-muted-foreground">Подписчики</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{formatNumber(profile.following_count)}</p>
            <p className="text-xs text-muted-foreground">Подписки</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{formatNumber(profile.likes_count)}</p>
            <p className="text-xs text-muted-foreground">Лайки</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{formatNumber(profile.videos_count)}</p>
            <p className="text-xs text-muted-foreground">Видео</p>
          </div>
        </div>
      </div>
    </div>
  );
}
