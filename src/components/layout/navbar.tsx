"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const { profile } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-30 glass border-b border-border/50 safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          {title ? (
            <span className="font-semibold text-lg">{title}</span>
          ) : (
            <span className="text-lg font-bold gradient-text">Rates</span>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/notifications" className="btn-ghost p-2 relative">
            <Bell className="w-5 h-5" />
          </Link>
          {profile && (
            <Link href={`/profile/${profile.username}`}>
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="sm" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
