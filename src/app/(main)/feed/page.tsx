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
  HelpCircle,
  Flame,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { soundEffects } from "@/lib/utils/sounds";

interface Post {
  id: string;
  user: {
    displayName: string;
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  isSaved: boolean;
  time: string;
}

interface AIMessage {
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function FeedPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "foryou" | "video" | "ai">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
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

  // Initialize mock posts
  useEffect(() => {
    setPosts([
      {
        id: "post-1",
        user: {
          displayName: "Мария Соколова",
          username: "maria_art",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
          isVerified: true,
        },
        content: "Закончила эскиз для нового выставочного проекта в Москве! Сочетание темного фона и неонового фиолетового света выглядит потрясающе. Это вдохновило меня на оформление профиля в стиле Midnight Neon на Rates! 🎨💜",
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
        likes: 124,
        comments: 18,
        reposts: 9,
        isLiked: false,
        isSaved: false,
        time: "10 минут назад",
      },
      {
        id: "post-2",
        user: {
          displayName: "Дмитрий Новиков",
          username: "dmitry_dev",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
          isVerified: false,
        },
        content: "Вчера закончили оптимизацию серверов. Перевели лимиты Rate Limiting полностью на оперативную память в NodeJS (in-memory). Задержки на клики кнопок и переходы снизились в 10 раз! Скорость отклика теперь просто космическая 🚀💻",
        likes: 85,
        comments: 12,
        reposts: 5,
        isLiked: true,
        isSaved: true,
        time: "1 час назад",
      },
      {
        id: "post-3",
        user: {
          displayName: "Rates Official",
          username: "rates_news",
          avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
          isVerified: true,
        },
        content: "🔥 Крупное обновление Rates 2026 уже в эфире! Встречайте 6 потрясающих тем оформления, полностью переработанный стеклянный трехколоночный интерфейс с размытием фона и интерактивное звуковое сопровождение на базе Web Audio API. Какая ваша любимая тема? Напишите в комментариях!",
        likes: 540,
        comments: 92,
        reposts: 48,
        isLiked: false,
        isSaved: false,
        time: "3 часа назад",
      },
    ]);

    setAiMessages([
      {
        sender: "ai",
        text: "Привет! Я Rates AI ассистент. Чем я могу помочь тебе сегодня? Спроси меня о трендах, темах оформления или новых функциях сайта! 🧠✨",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const handleLikePost = (id: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          const nextLiked = !p.isLiked;
          if (nextLiked) {
            soundEffects.playLike();
          } else {
            soundEffects.playClick();
          }
          return {
            ...p,
            isLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleSavePost = (id: string) => {
    soundEffects.playClick();
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            isSaved: !p.isSaved,
          };
        }
        return p;
      })
    );
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

    // AI thinking delay (1.2s)
    setTimeout(() => {
      let replyText = "";

      if (inputVal.includes("тренд") || inputVal.includes("актуальн") || inputVal.includes("hashtag")) {
        replyText = "В трендах сейчас гремит #AI2026 и #RatesLaunch. Большинство постов посвящено нашему новому дизайну и встроенному звуковому синтезатору! 📈🔥";
      } else if (inputVal.includes("тема") || inputVal.includes("цвет") || inputVal.includes("дизайн")) {
        replyText = "У нас есть 6 премиум-тем оформления в 'Настройках': Midnight Neon, Classic Light, Emerald Oasis, Sakura Dream, Cyberpunk 2076 и Nordic Slate. Попробуй переключить их! 🎨✨";
      } else if (inputVal.includes("звук") || inputVal.includes("саунд")) {
        replyText = "Интерактивные звуки синтезируются прямо в браузере с помощью Web Audio API. Вы можете выключить или протестировать их на странице Настроек в разделе 'Внешний вид и звуки'. 🎶🔊";
      } else if (inputVal.includes("привет") || inputVal.includes("здравствуй") || inputVal.includes("hello")) {
        replyText = "Привет! Рад тебя слышать. Надеюсь, тебе нравится обновленный дизайн социальной сети Rates! Какие вопросы у тебя есть?";
      } else {
        replyText = "Здорово! Я постоянно обучаюсь и помогаю улучшать Rates. Совсем скоро я смогу анализировать твои посты и давать персональные рекомендации! 🚀🧠";
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
              {posts.map((post) => (
                <div key={post.id} className="glass-card p-4 space-y-4">
                  {/* Creator Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar src={post.user.avatarUrl} alt={post.user.displayName} size="md" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm hover:underline hover:text-primary cursor-pointer">
                            {post.user.displayName}
                          </span>
                          {post.user.isVerified && <CheckCircle className="w-4 h-4 text-primary fill-primary/10" />}
                        </div>
                        <span className="text-xs text-muted-foreground">@{post.user.username} • {post.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSavePost(post.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        post.isSaved ? "bg-primary/10 border-primary text-primary" : "border-border/50 hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${post.isSaved ? "fill-primary" : ""}`} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {/* Image Attachment */}
                  {post.imageUrl && (
                    <div className="relative overflow-hidden rounded-2xl border border-border/40 aspect-[16/10] bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.imageUrl} alt="attachment" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Post Interactions */}
                  <div className="flex items-center justify-around pt-3 border-t border-border/20 text-xs font-semibold text-muted-foreground">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-red-500/10 transition-colors ${
                        post.isLiked ? "text-red-500" : "hover:text-red-500"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() => soundEffects.playClick()}
                      className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>

                    <button
                      onClick={() => { soundEffects.playClick(); soundEffects.playSent(); }}
                      className="flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-green-500/10 hover:text-green-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.reposts}</span>
                    </button>
                  </div>
                </div>
              ))}
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
                  {[
                    { name: "Анна Смирнова", user: "anna_photo", sub: "3.4K подписчиков", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
                    { name: "Сергей Кузнецов", user: "kuznetsov_design", sub: "8.9K подписчиков", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" }
                  ].map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={rec.avatar} alt={rec.name} size="sm" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate">{rec.name}</h4>
                          <span className="text-[10px] text-muted-foreground block">@{rec.user}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { soundEffects.playClick(); soundEffects.playSent(); }}
                        className="text-[10px] bg-primary hover:bg-opacity-95 text-white font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Читать
                      </button>
                    </div>
                  ))}
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
