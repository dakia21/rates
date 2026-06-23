"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    if (error) toast(error, "error");
    else toast("Профиль обновлён", "success");
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      await updateProfile({ avatar_url: data.data.url } as never);
      toast("Аватар обновлён", "success");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "banners");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      await updateProfile({ banner_url: data.data.url } as never);
      toast("Баннер обновлён", "success");
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>

      <Card className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={profile.avatar_url} alt={profile.display_name} size="xl" />
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full gradient-bg text-white"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-semibold">{profile.display_name}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <Button variant="ghost" size="sm" className="mt-1" onClick={() => bannerRef.current?.click()}>
              <ImageIcon className="w-4 h-4 mr-1" />
              Изменить баннер
            </Button>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>
        </div>

        <Input
          label="Имя"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
        <Input
          label="Имя пользователя"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
        />
        <Textarea
          label="О себе"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Расскажите о себе..."
        />

        <Button onClick={handleSave} loading={saving}>
          Сохранить
        </Button>
      </Card>
    </div>
  );
}
