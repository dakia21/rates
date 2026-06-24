"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/contexts/theme-context";
import { soundEffects } from "@/lib/utils/sounds";

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const themeOptions = [
    { id: "midnight", name: "Midnight Neon", bg: "#0e0a17", accent: "#7c3aed" },
    { id: "light", name: "Classic Light", bg: "#f9f9fb", accent: "#6366f1" },
    { id: "emerald", name: "Emerald Oasis", bg: "#06130d", accent: "#10b981" },
    { id: "sakura", name: "Sakura Dream", bg: "#16080e", accent: "#ec4899" },
    { id: "cyberpunk", name: "Cyberpunk 2076", bg: "#050505", accent: "#facc15" },
    { id: "nordic", name: "Nordic Slate", bg: "#121822", accent: "#38bdf8" },
  ] as const;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundsEnabled(window.localStorage.getItem("rates_sounds_enabled") !== "false");
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    if (error) {
      toast(error, "error");
    } else {
      toast("Профиль обновлён", "success");
      soundEffects.playSent();
    }
    setSaving(false);
  };

  const handleToggleSounds = (enabled: boolean) => {
    setSoundsEnabled(enabled);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rates_sounds_enabled", enabled ? "true" : "false");
    }
    if (enabled) {
      setTimeout(() => {
        soundEffects.playSent();
      }, 50);
    }
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
      soundEffects.playSent();
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
      soundEffects.playSent();
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>
        <Card className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="xl" />
              <button
                onClick={() => {
                  avatarRef.current?.click();
                  soundEffects.playClick();
                }}
                className="absolute bottom-0 right-0 p-1.5 rounded-full gradient-bg text-white hover:scale-105 active:scale-95 transition-transform"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold">{profile.display_name}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => {
                  bannerRef.current?.click();
                  soundEffects.playClick();
                }}
              >
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

          <Button
            onClick={() => {
              handleSave();
              soundEffects.playClick();
            }}
            loading={saving}
          >
            Сохранить
          </Button>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Внешний вид и звуки</h2>
        <Card className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Выберите тему оформления</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    soundEffects.playClick();
                  }}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 ${
                    theme === opt.id
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                      : "border-border hover:border-muted-foreground/30 bg-card hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex gap-1.5 mb-2.5">
                    <span className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: opt.bg }} />
                    <span className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: opt.accent }} />
                  </div>
                  <span className="text-sm font-medium">{opt.name}</span>
                  {theme === opt.id && (
                    <span className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                      Активна
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <h3 className="font-semibold">Звуковые эффекты</h3>
              <p className="text-sm text-muted-foreground">Проигрывать приятные звуки при действиях в приложении</p>
            </div>
            <button
              onClick={() => handleToggleSounds(!soundsEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                soundsEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                  soundsEnabled ? "transform translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
