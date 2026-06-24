"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Radio, CheckCircle, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
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
  subscribersCount: string;
  isVerified: boolean;
}

interface RecommendedGroup {
  id: string;
  name: string;
  membersCount: string;
  avatarUrl?: string;
}

export function RightSidebar() {
  const { profile } = useAuth();
  const { onlineUsers } = useSocket();
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);

  // Mock trends
  const trends: Trend[] = [
    { tag: "#AI2026", category: "Технологии • Популярное", postsCount: "42.8K постов" },
    { tag: "#RatesLaunch", category: "Тренды • Rates", postsCount: "18.5K постов" },
    { tag: "#ShortsChallenge", category: "Видео • Челлендж", postsCount: "25.1K роликов" },
    { tag: "#CyberpunkVibes", category: "Игры • Обсуждаемое", postsCount: "12.3K постов" },
    { tag: "#SakuraDream", category: "Арт • Эстетика", postsCount: "8.9K постов" },
  ];

  // Mock active online users (to simulate a busy network)
  const mockOnlineUsers: RecommendedUser[] = [
    { id: "mock-1", username: "maria_art", displayName: "Мария Соколова", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isVerified: true, status: "смотрит Shorts" },
    { id: "mock-2", username: "dmitry_dev", displayName: "Дмитрий Новиков", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isVerified: false, status: "пишет в AI Chat" },
    { id: "mock-3", username: "elena_travel", displayName: "Елена Морозова", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", isVerified: true, status: "в сети" },
    { id: "mock-4", username: "alex_music", displayName: "Александр Волков", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", isVerified: false, status: "выкладывает ролик" },
  ];

  // Mock recommended channels
  const recommendedChannels: RecommendedChannel[] = [
    { id: "ch-1", name: "Science & Tech", username: "scitech", avatarUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150", subscribersCount: "145K", isVerified: true },
    { id: "ch-2", name: "AI Art Generation", username: "ai_art", avatarUrl: "https://images.unsplash.com/photo-1547891654-e66ed7edd96c?w=150", subscribersCount: "89K", isVerified: true },
    { id: "ch-3", name: "Music Live Rates", username: "music_rates", avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150", subscribersCount: "62K", isVerified: false },
  ];

  // Mock recommended groups
  const recommendedGroups: RecommendedGroup[] = [
    { id: "gr-1", name: "Rates Developers", membersCount: "12,430 участников", avatarUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150" },
    { id: "gr-2", name: "Cinema Fan Club", membersCount: "8,920 участников", avatarUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150" },
    { id: "gr-3", name: "Design & UX Inspiration", membersCount: "5,410 участников", avatarUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150" },
  ];

  const handleFollow = (id: string) => {
    soundEffects.playClick();
    if (followedIds.includes(id)) {
      setFollowedIds(followedIds.filter(fId => fId !== id));
    } else {
      setFollowedIds([...followedIds, id]);
      soundEffects.playSent();
    }
  };

  const handleJoinGroup = (id: string) => {
    soundEffects.playClick();
    if (joinedGroupIds.includes(id)) {
      setJoinedGroupIds(joinedGroupIds.filter(gId => gId !== id));
    } else {
      setJoinedGroupIds([...joinedGroupIds, id]);
      soundEffects.playSent();
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-[350px] h-screen sticky top-0 p-4 space-y-6 overflow-y-auto border-l border-border/40 bg-background/50 backdrop-blur-md">
      
      {/* Widget: Who is online / Friends Activity */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Друзья онлайн
          </h3>
          <span className="text-xs bg-green-500/10 text-green-400 font-semibold px-2 py-0.5 rounded-full">
            {mockOnlineUsers.length + onlineUsers.size}
          </span>
        </div>
        <div className="space-y-3">
          {mockOnlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 group/item">
              <div className="relative">
                <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
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
          ))}
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
          {recommendedChannels.map((channel) => (
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
                onClick={() => handleFollow(channel.id)}
                className={`flex items-center justify-center p-1.5 rounded-full border transition-all ${
                  followedIds.includes(channel.id)
                    ? "bg-primary border-primary text-white"
                    : "border-border hover:border-primary/50 text-foreground"
                }`}
              >
                <Plus className={`w-3.5 h-3.5 transition-transform duration-300 ${followedIds.includes(channel.id) ? "rotate-45" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Widget: Active Groups */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Активные группы
        </h3>
        <div className="space-y-3">
          {recommendedGroups.map((group) => (
            <div key={group.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={group.avatarUrl} alt={group.name} size="sm" />
                <div className="min-w-0">
                  <span className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer block">
                    {group.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{group.membersCount}</span>
                </div>
              </div>
              <button
                onClick={() => handleJoinGroup(group.id)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                  joinedGroupIds.includes(group.id)
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "border-border hover:border-purple-500/50 text-foreground hover:text-purple-400"
                }`}
              >
                {joinedGroupIds.includes(group.id) ? "Внутри" : "Войти"}
              </button>
            </div>
          ))}
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
            // We can dispatch a custom event or navigate to AI chat tab
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
