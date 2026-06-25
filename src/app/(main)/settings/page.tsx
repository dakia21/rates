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
import { applyThemeColors } from "@/lib/utils/theme";

const bgPresets = [
  { name: "Deep Midnight", hex: "#0e0a17" },
  { name: "Deep Ocean", hex: "#070f1a" },
  { name: "Forest Emerald", hex: "#030f0a" },
  { name: "Plum Wine", hex: "#13060c" },
  { name: "Charcoal Gray", hex: "#15161c" },
  { name: "Cyberpunk Dark", hex: "#050505" },
  { name: "Snow White", hex: "#ffffff" },
  { name: "Cool Gray", hex: "#f3f4f6" },
  { name: "Cozy Sand", hex: "#faf7f0" },
  { name: "Mint Cream", hex: "#f0fbf7" },
  { name: "Sakura Dream", hex: "#fbf0f4" },
  { name: "Lavender Mist", hex: "#f3f0fb" },
];

const accentPresets = [
  { name: "Neon Purple", hex: "#7c3aed" },
  { name: "Indigo Blue", hex: "#4f46e5" },
  { name: "Electric Cyan", hex: "#06b6d4" },
  { name: "Teal Green", hex: "#0d9488" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Lime Green", hex: "#84cc16" },
  { name: "Cyber Yellow", hex: "#facc15" },
  { name: "Amber Gold", hex: "#f59e0b" },
  { name: "Sunset Orange", hex: "#f97316" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Hot Pink", hex: "#db2777" },
  { name: "Sakura Pink", hex: "#ec4899" },
];

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    profile_music_url: profile?.profile_music_url || "",
    profile_music_title: profile?.profile_music_title || "",
    profile_music_artist: profile?.profile_music_artist || "",
  });

  const musicPresets = [
    { name: "Lofi Ambient", artist: "Helix Lofi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Retro Synthwave", artist: "Helix Synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { name: "Ocean Breeze", artist: "Helix Chill", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  ];

  const [saving, setSaving] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [customBg, setCustomBg] = useState("#0e0a17");
  const [customPrimary, setCustomPrimary] = useState("#7c3aed");
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const themeOptions = [
    { id: "midnight", name: "Midnight Neon", bg: "#0e0a17", accent: "#7c3aed" },
    { id: "light", name: "Classic Light", bg: "#f9f9fb", accent: "#6366f1" },
    { id: "emerald", name: "Emerald Oasis", bg: "#06130d", accent: "#10b981" },
    { id: "sakura", name: "Sakura Dream", bg: "#16080e", accent: "#ec4899" },
    { id: "cyberpunk", name: "Cyberpunk 2076", bg: "#050505", accent: "#facc15" },
    { id: "nordic", name: "Nordic Slate", bg: "#121822", accent: "#38bdf8" },
    { id: "custom", name: "Свой стиль", bg: customBg, accent: customPrimary },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundsEnabled(window.localStorage.getItem("rates_sounds_enabled") !== "false");
      setCustomBg(window.localStorage.getItem("rates-custom-bg") || "#0e0a17");
      setCustomPrimary(window.localStorage.getItem("rates-custom-primary") || "#7c3aed");
    }
  }, []);

  const handleCustomBgChange = (hex: string) => {
    setCustomBg(hex);
    window.localStorage.setItem("rates-custom-bg", hex);
    setTheme("custom");
    applyThemeColors(hex, customPrimary);
  };

  const handleCustomPrimaryChange = (hex: string) => {
    setCustomPrimary(hex);
    window.localStorage.setItem("rates-custom-primary", hex);
    setTheme("custom");
    applyThemeColors(customBg, hex);
  };

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
                    setTheme(opt.id as any);
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

            {/* Custom Theme Builder UI */}
            <div className="pt-5 mt-5 border-t border-border/50 space-y-4">
              <h3 className="font-semibold text-sm">Продвинутая кастомизация оформления</h3>
              
              <div className="space-y-4">
                {/* Background Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Цвет фона страницы ({customBg})</span>
                    <label className="cursor-pointer text-primary text-xs hover:underline flex items-center gap-1.5 font-semibold">
                      <span>Свой цвет</span>
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => handleCustomBgChange(e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 overflow-hidden"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bgPresets.map((preset) => (
                      <button
                        key={preset.hex}
                        onClick={() => handleCustomBgChange(preset.hex)}
                        className={`w-7 h-7 rounded-full border relative transition-all active:scale-95 ${
                          customBg.toLowerCase() === preset.hex.toLowerCase() && theme === "custom"
                            ? "border-primary scale-110 shadow-md shadow-primary/20"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {customBg.toLowerCase() === preset.hex.toLowerCase() && theme === "custom" && (
                          <span className="absolute inset-0.5 rounded-full border border-white/60" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Акцентный цвет кнопок ({customPrimary})</span>
                    <label className="cursor-pointer text-primary text-xs hover:underline flex items-center gap-1.5 font-semibold">
                      <span>Свой цвет</span>
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 overflow-hidden"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {accentPresets.map((preset) => (
                      <button
                        key={preset.hex}
                        onClick={() => handleCustomPrimaryChange(preset.hex)}
                        className={`w-7 h-7 rounded-full border relative transition-all active:scale-95 ${
                          customPrimary.toLowerCase() === preset.hex.toLowerCase() && theme === "custom"
                            ? "border-primary scale-110 shadow-md shadow-primary/20"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {customPrimary.toLowerCase() === preset.hex.toLowerCase() && theme === "custom" && (
                          <span className="absolute inset-0.5 rounded-full border border-white/60" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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

      <div>
        <h2 className="text-2xl font-bold mb-6">Фоновая музыка профиля</h2>
        <Card className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Эта музыка будет тихо воспроизводиться, когда другие пользователи посещают ваш профиль.
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Быстрый выбор пресета</h3>
            <div className="flex flex-wrap gap-2">
              {musicPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      profile_music_url: preset.url,
                      profile_music_title: preset.name,
                      profile_music_artist: preset.artist,
                    });
                    soundEffects.playClick();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 transition-all active:scale-[0.98]"
                >
                  🎵 {preset.name} ({preset.artist})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Input
              label="URL аудиофайла (MP3)"
              value={form.profile_music_url}
              onChange={(e) => setForm({ ...form, profile_music_url: e.target.value })}
              placeholder="https://example.com/song.mp3"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Название трека"
                value={form.profile_music_title}
                onChange={(e) => setForm({ ...form, profile_music_title: e.target.value })}
                placeholder="Lofi Breeze"
              />
              <Input
                label="Исполнитель"
                value={form.profile_music_artist}
                onChange={(e) => setForm({ ...form, profile_music_artist: e.target.value })}
                placeholder="Lofi generator"
              />
            </div>
          </div>

          {form.profile_music_url && (
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl animate-spin-slow">💿</span>
                <div>
                  <p className="text-sm font-semibold">{form.profile_music_title || "Без названия"}</p>
                  <p className="text-xs text-muted-foreground">{form.profile_music_artist || "Неизвестен"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    profile_music_url: "",
                    profile_music_title: "",
                    profile_music_artist: "",
                  });
                  soundEffects.playClick();
                }}
                className="text-xs text-destructive hover:underline font-medium"
              >
                Очистить
              </button>
            </div>
          )}

          <Button
            onClick={() => {
              handleSave();
              soundEffects.playClick();
            }}
            loading={saving}
          >
            Сохранить настройки музыки
          </Button>
        </Card>
      </div>
    </div>
  );
}

