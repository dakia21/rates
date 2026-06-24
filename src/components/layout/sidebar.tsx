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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { soundEffects } from "@/lib/utils/sounds";

const navItems = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/messages", icon: MessageCircle, label: "Сообщения" },
  { href: "/channels", icon: Radio, label: "Каналы" },
  { href: "/groups", icon: Users, label: "Группы" },
  { href: "/search", icon: Search, label: "Поиск" },
  { href: "/notifications", icon: Bell, label: "Уведомления" },
  { href: "/upload", icon: Upload, label: "Загрузить" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-border/50 p-4">
      <Link href="/feed" onClick={() => soundEffects.playClick()} className="flex items-center gap-3 px-4 py-6">
        <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <span className="text-2xl font-bold gradient-text">Rates</span>
      </Link>

      <nav className="flex-1 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => soundEffects.playClick()}
              className={cn(isActive ? "nav-item-active" : "nav-item")}
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
            className={cn(pathname.startsWith("/admin") ? "nav-item-active" : "nav-item")}
          >
            <Shield className="w-5 h-5" />
            <span>Админ</span>
          </Link>
        )}
      </nav>

      <div className="space-y-2 mt-auto">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <Link href="/settings" onClick={() => soundEffects.playClick()} className="btn-ghost p-2.5">
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {profile && (
          <div className="glass-card p-3 flex items-center gap-3">
            <Link href={`/profile/${profile.username}`} onClick={() => soundEffects.playClick()}>
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="md" online={profile.is_online} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${profile.username}`} onClick={() => soundEffects.playClick()} className="font-medium text-sm truncate block hover:text-rates-500 transition-colors">
                {profile.display_name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
            </div>
            <button onClick={() => { signOut(); soundEffects.playClick(); }} className="btn-ghost p-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
