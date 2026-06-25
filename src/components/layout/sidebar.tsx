"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  MessageCircle,
  Radio,
  Users,
  Search,
  Bell,
  Settings,
  Upload,
  Shield,
  LogOut,
  Sparkles,
  Play,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { soundEffects } from "@/lib/utils/sounds";

const navItems = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/feed?tab=foryou", icon: Sparkles, label: "Для вас" },
  { href: "/feed?tab=video", icon: Play, label: "Shorts" },
  { href: "/upload", icon: Upload, label: "Создать" },
  { href: "/messages", icon: MessageCircle, label: "Сообщения" },
  { href: "/channels", icon: Radio, label: "Каналы" },
  { href: "/groups", icon: Users, label: "Группы" },
  { href: "/notifications", icon: Bell, label: "Уведомления" },
  { href: "/favorites", icon: Bookmark, label: "Избранное" },
  { href: "/settings", icon: Settings, label: "Настройки" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { newNotifications } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications?unread=true&limit=1");
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Error fetching unread notifications count:", err);
      }
    };

    fetchUnreadCount();
  }, [profile, pathname, newNotifications.length]);

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-border/50 p-3 bg-background/30 backdrop-blur-md">
      <div
        onClick={() => {
          soundEffects.playClick();
          router.push("/feed");
        }}
        className="flex items-center gap-3 px-4 py-4 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="text-2xl font-bold gradient-text">Rates</span>
      </div>

      {/* Global Search Bar */}
      <div className="px-2 mb-4 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Глобальный поиск..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-2xl bg-secondary/40 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const query = (e.target as HTMLInputElement).value;
              soundEffects.playClick();
              window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }
          }}
        />
      </div>

      <nav className="flex-1 space-y-1 mt-2 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href.includes("?") && pathname + window.location.search === item.href);
          const isNotifications = item.href === "/notifications";
          return (
            <div
              key={item.href}
              onClick={() => {
                soundEffects.playClick();
                router.push(item.href);
              }}
              className={cn(
                "cursor-pointer flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative",
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5 scale-[1.01]"
                  : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground hover:translate-x-0.5"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span>{item.label}</span>
              {isNotifications && unreadCount > 0 && (
                <span className="ml-auto text-xs bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}

        {(profile?.role === "admin" || profile?.role === "moderator") && (
          <div
            onClick={() => {
              soundEffects.playClick();
              router.push("/admin");
            }}
            className={cn(
              "cursor-pointer flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground hover:translate-x-0.5"
            )}
          >
            <Shield className="w-5 h-5" />
            <span>Админ</span>
          </div>
        )}
      </nav>

      <div className="space-y-4 mt-auto pt-4 border-t border-border/40">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground font-medium">Оформление</span>
          <ThemeToggle />
        </div>

        {profile && (
          <div className="glass p-3 flex items-center gap-3 rounded-2xl border border-border/40 shadow-xl">
            <div
              onClick={() => {
                soundEffects.playClick();
                router.push(`/profile/${profile.username}`);
              }}
              className="cursor-pointer"
            >
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" online={profile.is_online} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                onClick={() => {
                  soundEffects.playClick();
                  router.push(`/profile/${profile.username}`);
                }}
                className="cursor-pointer font-semibold text-sm truncate block hover:text-primary transition-colors"
              >
                {profile.display_name}
              </div>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            </div>
            <button onClick={() => { signOut(); soundEffects.playClick(); }} className="btn-ghost p-2 text-muted-foreground hover:text-destructive rounded-xl">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
