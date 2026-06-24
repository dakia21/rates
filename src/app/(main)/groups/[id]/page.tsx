"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber } from "@/lib/utils/format";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import type { Group, GroupMember } from "@/types";
import { useRouter } from "next/navigation";

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group & { members: GroupMember[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGroup(d.data);
        setLoading(false);
      });
  }, [id]);

  const handleJoin = async () => {
    const res = await fetch(`/api/groups/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });
    const data = await res.json();
    if (data.success) {
      toast("Вы вступили в группу", "success");
      const refresh = await fetch(`/api/groups/${id}`);
      const refreshData = await refresh.json();
      if (refreshData.success) setGroup(refreshData.data);
    } else {
      toast(data.error, "error");
    }
  };

  const handleLeave = async () => {
    const res = await fetch(`/api/groups/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    });
    if ((await res.json()).success) {
      toast("Вы покинули группу", "info");
      const refresh = await fetch(`/api/groups/${id}`);
      const refreshData = await refresh.json();
      if (refreshData.success) setGroup(refreshData.data);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.")) return;
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast("Группа успешно удалена", "success");
        router.push("/groups");
      } else {
        toast(data.error || "Ошибка при удалении группы", "error");
      }
    } catch (err) {
      toast("Не удалось удалить группу", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!group) return <div className="text-center py-16">Группа не найдена</div>;

  const roleLabels: Record<string, string> = {
    owner: "Владелец",
    admin: "Админ",
    moderator: "Модератор",
    member: "Участник",
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link href="/groups" className="btn-ghost inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <Avatar src={group.avatar_url} alt={group.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formatNumber(group.members_count)} / {group.max_members}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              {group.is_member ? (
                <>
                  {group.chat_id && (
                    <Link href={`/messages/${group.chat_id}`}>
                      <Button size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Чат
                      </Button>
                    </Link>
                  )}
                  {group.user_role === "owner" ? (
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={handleDeleteGroup}>
                      Удалить группу
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleLeave}>
                      Покинуть
                    </Button>
                  )}
                </>
              ) : (
                <Button size="sm" onClick={handleJoin}>
                  Вступить
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <h2 className="text-lg font-semibold mt-8 mb-4">Участники</h2>
      <div className="space-y-2">
        {group.members.map((member) => (
          <Card key={member.id} className="!p-4">
            <div className="flex items-center gap-3">
              <Avatar src={member.profile?.avatar_url} alt={member.profile?.display_name || ""} size="sm" />
              <div className="flex-1">
                <Link href={`/profile/${member.profile?.username}`} className="font-medium text-sm hover:text-rates-500">
                  {member.profile?.display_name}
                </Link>
                <p className="text-xs text-muted-foreground">@{member.profile?.username}</p>
              </div>
              <Badge variant={member.role === "owner" ? "primary" : "default"}>
                {roleLabels[member.role]}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
