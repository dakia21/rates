"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import type { Group } from "@/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGroups(d.data);
        setLoading(false);
      });
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setGroups((prev) => [data.data, ...prev]);
      setShowCreate(false);
      toast("Группа создана", "success");
    } else {
      toast(data.error, "error");
    }
    setCreating(false);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Группы
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Создать группу
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <Avatar src={group.avatar_url} alt={group.name} size="lg" />
                <div className="flex-1">
                  <h3 className="font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {formatNumber(group.members_count)} участников
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Создать группу">
        <div className="space-y-4">
          <Input
            label="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button className="w-full" onClick={handleCreate} loading={creating}>
            Создать
          </Button>
        </div>
      </Modal>
    </div>
  );
}
