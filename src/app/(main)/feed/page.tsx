"use client";

import { useState, useEffect } from "react";
import { StoriesBar } from "@/components/feed/stories-bar";
import { VideoFeed } from "@/components/feed/video-feed";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  CheckCircle,
  Flame,
  TrendingUp,
  Play,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { soundEffects } from "@/lib/utils/sounds";
import type { Video } from "@/types";

interface AIMessage {
  sender: "user" | "ai";
  text: string;
  time: string;
}

interface RecommendedUser {
  id: string;
  name: string;
  user: string;
  sub: string;
  avatar: string;
}

export default function FeedPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "foryou" | "video" | "ai">("posts");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [recUsers, setRecUsers] = useState<RecommendedUser[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  // Load active tab from window search parameter (e.g. ?tab=video)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "video" || tab === "foryou" || tab === "posts" || tab === "ai") {
        setActiveTab(tab);
      }
    }
  }, []);

  // Listen to custom tab change events from RightSidebar AI button
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab === "ai" || tab === "video" || tab === "foryou" || tab === "posts") {
        setActiveTab(tab);
      }
    };
    window.addEventListener("switch-feed-tab", handleSwitchTab);
    return () => window.removeEventListener("switch-feed-tab", handleSwitchTab);
  }, []);

  // Fetch real videos from the database
  async function loadVideos() {
    setLoadingVideos(true);
    try {
      const res = await fetch("/api/videos?limit=15");
      const data = await res.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (err) {
      console.error("Error loading videos for feed:", err);
    } finally {
      setLoadingVideos(false);
    }
  }

  useEffect(() => {
    loadVideos();

    setAiMessages([
      {
        sender: "ai",
        text: "Привет! Я Rates AI ассистент. Чем я могу помочь тебе сегодня? Спроси меня о трендах, темах оформления или новых функциях сайта!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Load recommended users from Database
  useEffect(() => {
    const supabase = createClient();
    async function loadRecs() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", profile?.id || "")
          .limit(4);
        
        if (data) {
          setRecUsers(
            data.map((p) => ({
              id: p.id,
              name: p.display_name,
              user: p.username,
              sub: `${p.followers_count} подписчиков`,
              avatar: p.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (profile?.id) {
      loadRecs();
    }
  }, [profile?.id]);

  const handleLikeVideo = async (id: string) => {
    try {
      const video = videos.find((v) => v.id === id);
      if (!video) return;

      const res = await fetch(`/api/videos/${id}/like`, { method: "POST" });
      const result = await res.json();
      if (result.success) {
        const nextLiked = !video.is_liked;
        if (nextLiked) {
          soundEffects.playLike();
        } else {
          soundEffects.playClick();
        }

        setVideos(
          videos.map((v) =>
            v.id === id
              ? {
                  ...v,
                  is_liked: nextLiked,
                  likes_count: v.likes_count + (nextLiked ? 1 : -1),
                }
              : v
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowRec = async (userId: string) => {
    soundEffects.playClick();
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        soundEffects.playSent();
        setRecUsers(recUsers.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAIMessage = () => {
    if (!aiInput.trim()) return;

    soundEffects.playSent();
    const userMsg: AIMessage = {
      sender: "user",
      text: aiInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    const inputVal = aiInput.toLowerCase();
    setAiInput("");
    setAiTyping(true);

    setTimeout(() => {
      let replyText = "";

      if (inputVal.includes("тренд") || inputVal.includes("актуальн") || inputVal.includes("hashtag")) {
        replyText = "В трендах сейчас гремит #AI2026 и #RatesLaunch. Большинство постов посвящено нашему новому дизайну и встроенному звуковому синтезатору!";
      } else if (inputVal.includes("тема") || inputVal.includes("цвет") || inputVal.includes("дизайн")) {
        replyText = "У нас есть 6 премиум-тем оформления в 'Настройках': Midnight Neon, Classic Light, Emerald Oasis, Sakura Dream, Cyberpunk 2076 and Nordic Slate. Попробуй переключить их!";
      } else if (inputVal.includes("звук") || inputVal.includes("саунд")) {
        replyText = "Интерактивные звуки синтезируются прямо в браузере с помощью Web Audio API. Вы можете выключить или протестировать их на странице Настроек в разделе 'Внешний вид и звуки'.";
      } else if (inputVal.includes("привет") || inputVal.includes("здравствуй") || inputVal.includes("hello")) {
        replyText = "Привет! Рад тебя слышать. Надеюсь, тебе нравится обновленный дизайн Rates! Чем могу помочь?";
      } else {
        replyText = "Здорово! Я постоянно обучаюсь и помогаю улучшать Rates. Совсем скоро я смогу анализировать твои посты и давать персональные рекомендации!";
      }

      const aiMsg: AIMessage = {
        sender: "ai",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAiMessages((prev) => [...prev, aiMsg]);
      setAiTyping(false);
      soundEffects.playReceived();
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Stories list */}
      <div className="glass-card p-4 rounded-3xl">
        <StoriesBar />
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-1.5 p-1.5 bg-secondary/35 border border-border/40 rounded-2xl w-full">
        {(["posts", "foryou", "video", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              soundEffects.playClick();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/25"
            }`}
          >
            {tab === "posts" && "Лента"}
            {tab === "foryou" && "Для вас"}
            {tab === "video" && "Shorts"}
            {tab === "ai" && "AI Чат"}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === "posts" && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {loadingVideos ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : videos.length > 0 ? (
                videos.map((video) => (
                  <div key={video.id} className="glass-card p-4 space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={video.profile?.avatar_url} alt={video.profile?.display_name || ""} size="md" />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-sm hover:underline hover:text-primary cursor-pointer">
                              {video.profile?.display_name}
                            </span>
                            {video.profile?.is_verified && <CheckCircle className="w-4 h-4 text-primary fill-primary/10" />}
                          </div>
                          <span className="text-xs text-muted-foreground">@{video.profile?.username} • {new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-sm mb-1">{video.title}</h3>
                      {video.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{video.description}</p>
                      )}
                    </div>

                    {/* Inline Video Player or Image Post */}
                    {video.video_url === "text-post" ? (
                      video.thumbnail_url && (
                        <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[16/10] bg-secondary/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    ) : (
                      video.video_url && (
                        <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[16/10] bg-black">
                          <video
                            src={video.video_url}
                            poster={video.thumbnail_url || undefined}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )
                    )}

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {video.tags.map((tag) => (
                          <span key={tag} className="text-xs text-primary font-semibold">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Post Interactions */}
                    <div className="flex items-center justify-around pt-3 border-t border-border/20 text-xs font-semibold text-muted-foreground">
                      <button
                        onClick={() => handleLikeVideo(video.id)}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-red-500/10 transition-colors ${
                          video.is_liked ? "text-red-500" : "hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${video.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                        <span>{video.likes_count}</span>
                      </button>

                      <button
                        onClick={() => soundEffects.playClick()}
                        className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{video.comments_count}</span>
                      </button>

                      <button
                        onClick={async () => {
                          soundEffects.playClick();
                          try {
                            const res = await fetch(`/api/videos/${video.id}/repost`, { method: "POST" });
                            const data = await res.json();
                            if (data.success) {
                              soundEffects.playSent();
                              setVideos(
                                videos.map((v) =>
                                  v.id === video.id
                                    ? {
                                        ...v,
                                        is_reposted: true,
                                        reposts_count: v.reposts_count + 1,
                                      }
                                    : v
                                )
                              );
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-green-500/10 transition-colors ${
                          video.is_reposted ? "text-green-400" : "hover:text-green-400"
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{video.reposts_count}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card p-12 text-center rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">Постов пока нет</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Будьте первым, кто опубликует видео! Перейдите на вкладку «Создать» на панели.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "foryou" && (
            <motion.div
              key="foryou"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* CURATED RECOMMENDATIONS */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 fill-red-500/20" />
                  <h3 className="font-bold text-base">Рекомендации для вас</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Мы подобрали авторов и сообщества, которые могут вам понравиться. Основано на вашей активности.
                </p>

                {/* Users recommendations row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {recUsers.length > 0 ? (
                    recUsers.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={rec.avatar} alt={rec.name} size="sm" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs truncate">{rec.name}</h4>
                            <span className="text-[10px] text-muted-foreground block">@{rec.user}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFollowRec(rec.id)}
                          className="text-[10px] bg-primary hover:bg-opacity-95 text-white font-bold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Читать
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center col-span-2 py-4">Нет новых авторов для подписки</p>
                  )}
                </div>
              </div>

              {/* HOT TOPIC CARD */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base">Популярное событие</h3>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/40 space-y-2">
                  <span className="text-[10px] font-bold text-primary tracking-wider uppercase">Событие сегодня</span>
                  <h4 className="font-extrabold text-sm">Обсуждение AI-помощника Rates</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Подключайтесь к открытому тестированию AI-ассистента на вкладке «AI Чат». Задавайте вопросы о трендах и получайте сводку новостей.
                  </p>
                  <button
                    onClick={() => { setActiveTab("ai"); soundEffects.playClick(); }}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1"
                  >
                    Перейти к чату →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-black"
            >
              <VideoFeed />
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="glass-card flex flex-col h-[550px] overflow-hidden"
            >
              {/* AI Chat Header */}
              <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-primary/20">
                  <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200/20" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    Rates AI Помощник
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </h3>
                  <span className="text-xs text-muted-foreground">ИИ-ассистент социальной сети</span>
                </div>
              </div>

              {/* Message log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none shadow-md shadow-primary/10"
                          : "bg-secondary/40 border border-border/40 text-foreground rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className={`text-[9px] block text-right mt-1.5 ${msg.sender === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {aiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/40 border border-border/40 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input Footer */}
              <div className="p-3 border-t border-border/40 bg-secondary/10 flex items-center gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAIMessage()}
                  placeholder="Спросите об актуальных темах, дизайне или звуках..."
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60 transition-all"
                />
                <button
                  onClick={handleSendAIMessage}
                  className="p-2.5 rounded-xl gradient-bg text-white shadow-md shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
