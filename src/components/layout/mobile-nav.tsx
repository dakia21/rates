"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Radio, Users, Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const mobileNavItems = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/messages", icon: MessageCircle, label: "Чаты" },
  { href: "/upload", icon: Upload, label: "Создать", accent: true },
  { href: "/channels", icon: Radio, label: "Каналы" },
  { href: "/search", icon: Search, label: "Поиск" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-4"
              >
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-rates-500/30">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                isActive ? "text-rates-500" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
