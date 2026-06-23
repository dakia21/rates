"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Users, Flag, Video, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";

interface AdminStats {
  users: number;
  videos: number;
  pendingReports: number;
  bannedUsers: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data.stats);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: "Пользователи", value: stats?.users || 0, icon: Users, href: "/admin/users", color: "text-blue-500" },
    { label: "Видео", value: stats?.videos || 0, icon: Video, href: "/admin/content", color: "text-purple-500" },
    { label: "Жалобы", value: stats?.pendingReports || 0, icon: Flag, href: "/admin/reports", color: "text-yellow-500" },
    { label: "Заблокированы", value: stats?.bannedUsers || 0, icon: Ban, href: "/admin/users", color: "text-red-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Админ-панель
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center !p-4">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-semibold">Пользователи</h3>
            <p className="text-sm text-muted-foreground">Управление, блокировки, роли</p>
          </Card>
        </Link>
        <Link href="/admin/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Flag className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold">Жалобы</h3>
            <p className="text-sm text-muted-foreground">Модерация жалоб</p>
          </Card>
        </Link>
        <Link href="/admin/content">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Video className="w-6 h-6 text-purple-500 mb-2" />
            <h3 className="font-semibold">Контент</h3>
            <p className="text-sm text-muted-foreground">Модерация видео</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
