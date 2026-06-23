"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data);
        setLoading(false);
      });
  }, []);

  const handleAction = async (userId: string, action: string, role?: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action, role }),
    });
    if ((await res.json()).success) {
      toast("Действие выполнено", "success");
      const refresh = await fetch("/api/admin/users");
      const data = await refresh.json();
      if (data.success) setUsers(data.data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/admin" className="btn-ghost inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-bold mb-6">Пользователи</h1>

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id} className="!p-4">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar_url} alt={user.display_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{user.display_name}</p>
                  <Badge variant={user.role === "admin" ? "primary" : "default"}>{user.role}</Badge>
                  {user.is_banned && <Badge variant="danger">Заблокирован</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {user.is_banned ? (
                  <Button size="sm" variant="outline" onClick={() => handleAction(user.id, "unban")}>
                    Разблокировать
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => handleAction(user.id, "ban")}>
                    Блок
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
