"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Plus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import type { Channel } from "@/types";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", description: "" });
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setChannels(d.data);
        setLoading(false);
      });
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setChannels((prev) => [data.data, ...prev]);
      setShowCreate(false);
      setForm({ name: "", username: "", description: "" });
      toast("Канал создан", "success");
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
          <Radio className="w-6 h-6" />
          Каналы
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Создать канал
        </Button>
      </div>

      {channels.length === 0 ? (
        <Card className="text-center py-16">
          <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Пока нет каналов</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel) => (
            <Link key={channel.id} href={`/channels/${channel.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <Avatar src={channel.avatar_url} alt={channel.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{channel.name}</h3>
                      {channel.is_verified && <Badge variant="primary">✓</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">@{channel.username}</p>
                    {channel.description && (
                      <p className="text-sm mt-2 line-clamp-2">{channel.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {formatNumber(channel.subscribers_count)} подписчиков
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Создать канал">
        <div className="space-y-4">
          <Input
            label="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Мой канал"
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            placeholder="my_channel"
          />
          <Textarea
            label="Описание"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="О чём ваш канал"
          />
          <Button className="w-full" onClick={handleCreate} loading={creating}>
            Создать
          </Button>
        </div>
      </Modal>
    </div>
  );
}
