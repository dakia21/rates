"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Radio, CheckCircle, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { createClient } from "@/lib/supabase/client";
import { soundEffects } from "@/lib/utils/sounds";

interface Trend {
  tag: string;
  category: string;
  postsCount: string;
}

interface RecommendedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  status: string;
}

interface RecommendedChannel {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  subscribersCount: number;
  isVerified: boolean;
  isSubscribed?: boolean;
}

interface RecommendedGroup {
  id: string;
  name: string;
  membersCount: number;
  avatarUrl?: string;
  isMember?: boolean;
}

export function RightSidebar() {
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();
  const [onlineProfiles, setOnlineProfiles] = useState<RecommendedUser[]>([]);
  const [channels, setChannels] = useState<RecommendedChannel[]>([]);
  const [groups, setGroups] = useState<RecommendedGroup[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadRightSidebarData() {
      try {
        // 1. Load online users or latest active profiles from Supabase
        const { data: activeUsers } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", profile?.id || "")
          .order("last_seen", { ascending: false })
          .limit(4);

        if (activeUsers) {
          setOnlineProfiles(
            activeUsers.map((u) => ({
              id: u.id,
              username: u.username,
              displayName: u.display_name,
              avatarUrl: u.avatar_url || undefined,
              isVerified: u.is_verified || false,
              status: u.is_online || onlineUsers.has(u.id) ? "в сети" : "не в сети",
            }))
          );
        }

        // 2. Load channels from API
        const channelsRes = await fetch("/api/channels?limit=3");
        const channelsData = await channelsRes.json();
        if (channelsData.success) {
          setChannels(
            channelsData.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              username: c.username,
              avatarUrl: c.avatar_url || undefined,
              subscribersCount: c.subscribers_count || 0,
              isVerified: c.is_verified || false,
              isSubscribed: c.is_subscribed || false,
            }))
          );
        }

        // 3. Load groups from API
        const groupsRes = await fetch("/api/groups?limit=3");
        const groupsData = await groupsRes.json();
        if (groupsData.success) {
          setGroups(
            groupsData.data.map((g: any) => ({
              id: g.id,
              name: g.name,
              membersCount: g.members_count || 0,
              avatarUrl: g.avatar_url || undefined,
              isMember: g.is_member || false,
            }))
          );
        }

        // 4. Load all videos to compute real-time popular tags
        const videosRes = await fetch("/api/videos?limit=50");
        const videosData = await videosRes.json();
        if (videosData.success && videosData.data.length > 0) {
          const tagMap = new Map<string, number>();
          videosData.data.forEach((v: any) => {
            if (v.tags && Array.isArray(v.tags)) {
              v.tags.forEach((tag: string) => {
                const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
                tagMap.set(cleanTag, (tagMap.get(cleanTag) || 0) + 1);
              });
            }
          });

          // Sort tags by frequency
          const sortedTags = Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({
              tag,
              category: "Тренды • В эфире",
              postsCount: `${count} роликов`,
            }));

          // Fallback if no tags in DB
          if (sortedTags.length > 0) {
            setTrends(sortedTags);
          } else {
            setTrends([
              { tag: "#AI2026", category: "Технологии • Популярное", postsCount: "0 роликов" },
              { tag: "#RatesSocial", category: "Тренды • Rates", postsCount: "0 роликов" },
            ]);
          }
        } else {
          setTrends([
            { tag: "#RatesPlatform", category: "Тренды • Новое", postsCount: "0 роликов" },
          ]);
        }
      } catch (err) {
        console.error("Error loading RightSidebar data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRightSidebarData();
  }, [profile?.id, onlineUsers]);

  const handleFollowChannel = async (id: string) => {
    soundEffects.playClick();
    try {
      const isSubscribed = channels.find((c) => c.id === id)?.isSubscribed;
      const res = await fetch(`/api/channels/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });
      const data = await res.json();
      if (data.success) {
        soundEffects.playSent();
        setChannels(
          channels.map((c) =>
            c.id === id
              ? {
                  ...c,
                  isSubscribed: data.data.subscribed,
                  subscribersCount: c.subscribersCount + (data.data.subscribed ? 1 : -1),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinGroup = async (id: string) => {
    soundEffects.playClick();
    try {
      const isMember = groups.find((g) => g.id === id)?.isMember;
      const res = await fetch(`/api/groups/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isMember ? "leave" : "join" }),
      });
      const data = await res.json();
      if (data.success) {
        soundEffects.playSent();
        setGroups(
          groups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  isMember: data.data.joined || false,
                  membersCount: g.membersCount + (data.data.joined ? 1 : -1),
                }
              : g
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-[350px] h-screen sticky top-0 p-4 space-y-6 overflow-y-auto border-l border-border/40 bg-background/50 backdrop-blur-md">
      
      {/* Widget: Who is online */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Пользователи онлайн
          </h3>
          <span className="text-xs bg-green-500/10 text-green-400 font-semibold px-2 py-0.5 rounded-full">
            {onlineProfiles.filter((u) => u.status === "в сети").length}
          </span>
        </div>
        <div className="space-y-3">
          {onlineProfiles.length > 0 ? (
            onlineProfiles.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
                  {user.status === "в сети" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer">
                      {user.displayName}
                    </span>
                    {user.isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/10" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Нет активных пользователей</p>
          )}
        </div>
      </div>

      {/* Widget: Trends */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Актуальные темы
        </h3>
        <div className="space-y-3.5">
          {trends.map((trend) => (
            <div key={trend.tag} className="flex flex-col cursor-pointer group">
              <span className="text-xs text-muted-foreground">{trend.category}</span>
              <span className="font-bold text-sm group-hover:text-primary transition-colors">
                {trend.tag}
              </span>
              <span className="text-[11px] text-muted-foreground/80 mt-0.5">{trend.postsCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Widget: Recommended Channels */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Radio className="w-4 h-4 text-accent" />
          Рекомендуемые каналы
        </h3>
        <div className="space-y-3">
          {channels.length > 0 ? (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={channel.avatarUrl} alt={channel.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-0.5">
                      <span className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer">
                        {channel.name}
                      </span>
                      {channel.isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/10" />}
                    </div>
                    <span className="text-xs text-muted-foreground">@{channel.username} • {channel.subscribersCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowChannel(channel.id)}
                  className={`flex items-center justify-center p-1.5 rounded-full border transition-all ${
                    channel.isSubscribed
                      ? "bg-primary border-primary text-white"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform duration-300 ${channel.isSubscribed ? "rotate-45" : ""}`} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Рекомендации отсутствуют</p>
          )}
        </div>
      </div>

      {/* Widget: Active Groups */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Активные группы
        </h3>
        <div className="space-y-3">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={group.avatarUrl} alt={group.name} size="sm" />
                  <div className="min-w-0">
                    <span className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer block">
                      {group.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{group.membersCount} участников</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                    group.isMember
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "border-border hover:border-purple-500/50 text-foreground hover:text-purple-400"
                  }`}
                >
                  {group.isMember ? "Выйти" : "Войти"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Групп пока нет</p>
          )}
        </div>
      </div>

      {/* Widget: AI Assistant Section */}
      <div className="relative overflow-hidden rounded-3xl gradient-bg p-4 text-white shadow-xl shadow-primary/20 space-y-3">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <h4 className="font-bold text-sm uppercase tracking-wider">Rates AI Помощник</h4>
        </div>
        <p className="text-xs text-white/80 leading-relaxed">
          Используйте искусственный интеллект для поиска популярных тем, краткого пересказа чатов и создания контента.
        </p>
        <button
          onClick={() => {
            soundEffects.playClick();
            const feedTabEvent = new CustomEvent("switch-feed-tab", { detail: "ai" });
            window.dispatchEvent(feedTabEvent);
          }}
          className="flex items-center gap-1 text-xs bg-white text-primary hover:bg-opacity-90 font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
        >
          Запустить ИИ
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </aside>
  );
}
