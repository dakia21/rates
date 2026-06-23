"use client";

import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Notification } from "@/types";

const typeIcons: Record<string, typeof Bell> = {
  message: MessageCircle,
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  repost: Share2,
  mention: Bell,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.data);
        setLoading(false);
      });
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Уведомления
        </h1>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Прочитать все
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Нет уведомлений</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card
                key={notif.id}
                className={`!p-4 transition-colors ${!notif.is_read ? "border-rates-500/30 bg-rates-500/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-secondary">
                    <Icon className="w-4 h-4 text-rates-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    {notif.body && <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-rates-500 shrink-0 mt-2" />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
