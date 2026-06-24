"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { soundEffects } from "@/lib/utils/sounds";

const navItems = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/feed?tab=foryou", icon: Sparkles, label: "Для вас" },
  { href: "/feed?tab=video", icon: Play, label: "Shorts" },
  { href: "/messages", icon: MessageCircle, label: "Сообщения" },
  { href: "/channels", icon: Radio, label: "Каналы" },
  { href: "/groups", icon: Users, label: "Группы" },
  { href: "/notifications", icon: Bell, label: "Уведомления" },
  { href: "/favorites", icon: Bookmark, label: "Избранное" },
  { href: "/settings", icon: Settings, label: "Настройки" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-border/50 p-4 bg-background/30 backdrop-blur-md">
      <Link href="/feed" onClick={() => soundEffects.playClick()} className="flex items-center gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="text-2xl font-bold gradient-text">Rates</span>
      </Link>

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
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => soundEffects.playClick()}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5 scale-[1.01]"
                  : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground hover:translate-x-0.5"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {(profile?.role === "admin" || profile?.role === "moderator") && (
          <Link
            href="/admin"
            onClick={() => soundEffects.playClick()}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary font-bold"
                : "text-muted-foreground hover:bg-secondary/45 hover:text-foreground hover:translate-x-0.5"
            )}
          >
            <Shield className="w-5 h-5" />
            <span>Админ</span>
          </Link>
        )}
      </nav>

      <div className="space-y-4 mt-auto pt-4 border-t border-border/40">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground font-medium">Оформление</span>
          <ThemeToggle />
        </div>

        {profile && (
          <div className="glass p-3 flex items-center gap-3 rounded-2xl border border-border/40 shadow-xl">
            <Link href={`/profile/${profile.username}`} onClick={() => soundEffects.playClick()}>
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" online={profile.is_online} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${profile.username}`} onClick={() => soundEffects.playClick()} className="font-semibold text-sm truncate block hover:text-primary transition-colors">
                {profile.display_name}
              </Link>
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
