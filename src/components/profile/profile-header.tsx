"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils/format";
import { soundEffects } from "@/lib/utils/sounds";
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
    <div className="relative space-y-4">
      {/* Banner */}
      <div className="h-44 md:h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-purple-500/20 border border-border/40 relative shadow-inner">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Info panel */}
      <div className="px-2 -mt-16 relative">
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
                <Button variant="secondary" size="sm" onClick={() => soundEffects.playClick()} className="rounded-xl">
                  <Settings className="w-4 h-4 mr-1" />
                  Настройки
                </Button>
              </Link>
            ) : isFollowing ? (
              <Button variant="outline" size="sm" onClick={() => { onUnfollow(); soundEffects.playClick(); }} className="rounded-xl">
                Отписаться
              </Button>
            ) : (
              <Button size="sm" onClick={() => { onFollow(); soundEffects.playClick(); }} className="rounded-xl">
                Подписаться
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            {profile.is_verified && (
              <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 text-sm text-foreground/90 max-w-xl leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="glass p-3.5 rounded-2xl text-center hover:scale-[1.03] transition-transform duration-300">
            <p className="font-extrabold text-xl text-primary">{formatNumber(profile.followers_count)}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Подписчики</p>
          </div>
          <div className="glass p-3.5 rounded-2xl text-center hover:scale-[1.03] transition-transform duration-300">
            <p className="font-extrabold text-xl text-primary">{formatNumber(profile.following_count)}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Подписки</p>
          </div>
          <div className="glass p-3.5 rounded-2xl text-center hover:scale-[1.03] transition-transform duration-300">
            <p className="font-extrabold text-xl text-primary">{formatNumber(profile.likes_count)}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Лайки</p>
          </div>
          <div className="glass p-3.5 rounded-2xl text-center hover:scale-[1.03] transition-transform duration-300">
            <p className="font-extrabold text-xl text-primary">{formatNumber(profile.videos_count)}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Видео</p>
          </div>
        </div>
      </div>
    </div>
  );
}
