"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronRight, ChevronLeft, Upload, Users, Eye, Sparkles, Smile, MessageCircle, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { AnimatePresence, motion } from "framer-motion";
import { soundEffects } from "@/lib/utils/sounds";
import { getSocket } from "@/lib/socket/client";

interface Story {
  id: string;
  user_id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  mediaUrl: string;
  caption: string;
  created_at: string;
  expires_at?: string;
  is_close_friends?: boolean;
  sticker_type?: string | null;
  sticker_data?: any;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lowercase = url.toLowerCase();
  return (
    lowercase.endsWith(".mp4") ||
    lowercase.endsWith(".webm") ||
    lowercase.endsWith(".ogg") ||
    lowercase.endsWith(".mov") ||
    lowercase.includes("/videos/")
  );
}

export function StoriesBar() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Upload story state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [expiresIn, setExpiresIn] = useState("24h");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Story Stickers State (Poll / Question)
  const [stickerType, setStickerType] = useState<"poll" | "question" | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOpt1, setPollOpt1] = useState("Да");
  const [pollOpt2, setPollOpt2] = useState("Нет");
  const [questionPrompt, setQuestionPrompt] = useState("Задайте мне вопрос");

  // Close friends manager state
  const [isManageFriendsOpen, setIsManageFriendsOpen] = useState(false);
  const [closeFriends, setCloseFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Story views & responses details
  const [viewDetails, setViewDetails] = useState<any>({
    viewers: [],
    viewers_count: 0,
    sticker_responses: [],
    is_owner: false,
  });
  const [isViewersListOpen, setIsViewersListOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [questionAnswer, setQuestionAnswer] = useState("");

  const quickEmojis = ["👍", "❤️", "🔥", "😂", "🎉", "😢"];

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories");
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        setStories(result.data);
      } else {
        setStories([
          {
            id: "fallback-news",
            user_id: "system",
            username: "rates_news",
            displayName: "Rates News",
            avatarUrl: "",
            mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
            caption: "Rates 2026 уже в эфире! Встречайте новый дизайн",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Fetch view logs and responses when story opens
  useEffect(() => {
    if (selectedStoryIndex === null || stories[selectedStoryIndex].id === "fallback-news") {
      setViewDetails({ viewers: [], viewers_count: 0, sticker_responses: [], is_owner: false });
      return;
    }

    const story = stories[selectedStoryIndex];

    const logView = async () => {
      try {
        // 1. Post view log
        await fetch(`/api/stories/${story.id}/view`, { method: "POST" });

        // 2. Load view details
        const res = await fetch(`/api/stories/${story.id}/view`);
        const result = await res.json();
        if (result.success) {
          setViewDetails(result.data);
        }
      } catch (err) {
        console.error("Error viewing story details:", err);
      }
    };

    logView();
  }, [selectedStoryIndex, stories]);

  // Control stories autoplay progress
  useEffect(() => {
    if (selectedStoryIndex === null) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
            return 0;
          } else {
            setSelectedStoryIndex(null);
            return 0;
          }
        }
        return p + 2; // Increments by 2 every 100ms (5 seconds total duration)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedStoryIndex, stories.length]);

  const handleOpenStory = (index: number) => {
    soundEffects.playClick();
    setSelectedStoryIndex(index);
    setQuestionAnswer("");
  };

  const handleCloseStory = () => {
    soundEffects.playClick();
    setSelectedStoryIndex(null);
  };

  const handleNextStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (selectedStoryIndex !== null) {
      if (selectedStoryIndex < stories.length - 1) {
        setSelectedStoryIndex(selectedStoryIndex + 1);
      } else {
        setSelectedStoryIndex(null);
      }
    }
  };

  const handlePrevStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  const handleOpenUploadModal = () => {
    soundEffects.playClick();
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    if (uploading) return;
    soundEffects.playClick();
    setIsUploadModalOpen(false);
    clearUploadState();
  };

  const clearUploadState = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCaption("");
    setIsCloseFriends(false);
    setExpiresIn("24h");
    setUploadProgress(0);
    setStickerType(null);
    setPollQuestion("");
    setPollOpt1("Да");
    setPollOpt2("Нет");
    setQuestionPrompt("Задайте мне вопрос");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEffects.playClick();

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast("Пожалуйста, выберите фото или видео файл", "error");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast("Максимальный размер файла — 50MB", "error");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePublishStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const isVideo = selectedFile.type.startsWith("video/");
      const bucket = isVideo ? "videos" : "thumbnails";

      const uploadForm = new FormData();
      uploadForm.append("file", selectedFile);
      uploadForm.append("bucket", bucket);

      setUploadProgress(30);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Ошибка при загрузке медиафайла");
      }

      setUploadProgress(70);

      // Build sticker data if exists
      let sticker_data = null;
      if (stickerType === "poll") {
        sticker_data = {
          question: pollQuestion.trim() || "Опрос",
          opt1: pollOpt1.trim() || "Да",
          opt2: pollOpt2.trim() || "Нет",
        };
      } else if (stickerType === "question") {
        sticker_data = {
          prompt: questionPrompt.trim() || "Задайте мне вопрос",
        };
      }

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_url: uploadData.data.url,
          caption: caption.trim(),
          expires_in: expiresIn,
          is_close_friends: isCloseFriends,
          sticker_type: stickerType,
          sticker_data,
        }),
      });

      const storyData = await storyRes.json();
      if (!storyData.success) {
        throw new Error(storyData.error || "Ошибка при сохранении истории");
      }

      setUploadProgress(100);
      soundEffects.playSent();
      toast("История опубликована!", "success");
      setIsUploadModalOpen(false);
      clearUploadState();
      fetchStories();
    } catch (err: any) {
      console.error(err);
      toast(err.message || "Не удалось опубликовать историю", "error");
    } finally {
      setUploading(false);
    }
  };

  // Close friends managers
  const handleOpenFriends = async () => {
    soundEffects.playClick();
    setIsManageFriendsOpen(true);
    fetchCloseFriends();
  };

  const fetchCloseFriends = async () => {
    try {
      const res = await fetch("/api/users/close-friends");
      const result = await res.json();
      if (result.success) {
        setCloseFriends(result.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUsers = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${val}&type=users`);
      const result = await res.json();
      if (result.success) {
        setSearchResults(result.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const toggleCloseFriend = async (friendId: string) => {
    soundEffects.playClick();
    try {
      const res = await fetch("/api/users/close-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCloseFriends();
        toast(result.data.added ? "Пользователь добавлен в Близкие друзья 💚" : "Пользователь удален из Близких друзей");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Story Reactions
  const triggerEmojiSplash = (emoji: string) => {
    const id = Date.now();
    const x = Math.random() * 80 + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    // Remove after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const handleQuickReaction = async (emoji: string) => {
    if (selectedStoryIndex === null) return;
    const story = stories[selectedStoryIndex];

    triggerEmojiSplash(emoji);
    soundEffects.playLike();

    try {
      // 1. Create DM chat with owner
      const chatRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: story.user_id }),
      });
      const chatData = await chatRes.json();
      if (!chatData.success) throw new Error(chatData.error);

      const chatId = chatData.data.id;

      // 2. Send emoji message
      const msgRes = await fetch(`/api/messages/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Ответил на историю: ${emoji}`,
          type: "text",
        }),
      });
      const msgData = await msgRes.json();
      if (msgData.success) {
        getSocket().emit("message:send", msgData.data);
        toast("Реакция отправлена в чат!", "success");
      }
    } catch (err) {
      console.error("Error sending story reaction message:", err);
    }
  };

  // Sticker Responses
  const handleStickerVote = async (choice: "opt1" | "opt2") => {
    if (selectedStoryIndex === null) return;
    const story = stories[selectedStoryIndex];
    soundEffects.playClick();

    try {
      const res = await fetch(`/api/stories/${story.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: choice }),
      });
      const result = await res.json();
      if (result.success) {
        soundEffects.playSent();
        // Reload details to update percentage immediately
        const detailRes = await fetch(`/api/stories/${story.id}/view`);
        const detailData = await detailRes.json();
        if (detailData.success) setViewDetails(detailData.data);
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionAnswer.trim() || selectedStoryIndex === null) return;
    const story = stories[selectedStoryIndex];

    try {
      const res = await fetch(`/api/stories/${story.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: questionAnswer.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        soundEffects.playSent();
        toast("Вопрос отправлен!", "success");
        setQuestionAnswer("");
        // Reload details
        const detailRes = await fetch(`/api/stories/${story.id}/view`);
        const detailData = await detailRes.json();
        if (detailData.success) setViewDetails(detailData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderStickerOverlay = (story: Story) => {
    if (!story.sticker_type || !story.sticker_data) return null;

    const responses = viewDetails.sticker_responses || [];
    const hasVoted = responses.some((r: any) => r.user_id === profile?.id);
    const myVote = responses.find((r: any) => r.user_id === profile?.id)?.response;

    if (story.sticker_type === "poll") {
      const opt1Count = responses.filter((r: any) => r.response === "opt1").length;
      const opt2Count = responses.filter((r: any) => r.response === "opt2").length;
      const totalVotes = responses.length;
      const pct1 = totalVotes > 0 ? Math.round((opt1Count / totalVotes) * 100) : 0;
      const pct2 = totalVotes > 0 ? 100 - pct1 : 0;

      return (
        <div
          className="absolute inset-x-6 top-1/3 z-20 glass-card p-4 rounded-3xl border border-white/20 text-center shadow-xl space-y-4 max-w-sm mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-bold text-white text-base leading-tight">
            {story.sticker_data.question}
          </p>

          <div className="space-y-2.5">
            {hasVoted ? (
              <div className="grid grid-cols-2 gap-2 text-sm font-bold text-white select-none">
                <div
                  className={`relative p-3.5 rounded-xl border flex items-center justify-between overflow-hidden ${
                    myVote === "opt1" ? "border-primary bg-primary/25" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-500"
                    style={{ width: `${pct1}%` }}
                  />
                  <span className="relative z-10">{story.sticker_data.opt1}</span>
                  <span className="relative z-10 text-xs">{pct1}%</span>
                </div>
                <div
                  className={`relative p-3.5 rounded-xl border flex items-center justify-between overflow-hidden ${
                    myVote === "opt2" ? "border-primary bg-primary/25" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-500"
                    style={{ width: `${pct2}%` }}
                  />
                  <span className="relative z-10">{story.sticker_data.opt2}</span>
                  <span className="relative z-10 text-xs">{pct2}%</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStickerVote("opt1")}
                  className="p-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/25 active:scale-95 transition-all text-sm font-bold text-white"
                >
                  {story.sticker_data.opt1}
                </button>
                <button
                  type="button"
                  onClick={() => handleStickerVote("opt2")}
                  className="p-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/25 active:scale-95 transition-all text-sm font-bold text-white"
                >
                  {story.sticker_data.opt2}
                </button>
              </div>
            )}
            {totalVotes > 0 && (
              <p className="text-[10px] text-white/50">{totalVotes} проголосовало</p>
            )}
          </div>
        </div>
      );
    }

    if (story.sticker_type === "question") {
      const isMyStory = story.user_id === profile?.id;
      return (
        <div
          className="absolute inset-x-6 top-1/3 z-20 glass-card p-4 rounded-3xl border border-white/20 text-center shadow-xl space-y-4 max-w-sm mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-bold text-white text-base leading-tight">
            {story.sticker_data.prompt}
          </p>

          {isMyStory ? (
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[10px] text-white/60">
              Пользователи увидят этот стикер и смогут задать вопросы. Ответы появятся в меню просмотров.
            </div>
          ) : (
            <form onSubmit={handleQuestionSubmit} className="flex gap-2">
              <input
                type="text"
                value={questionAnswer}
                onChange={(e) => setQuestionAnswer(e.target.value)}
                placeholder="Напишите ответ..."
                className="flex-1 rounded-xl bg-white/10 border border-white/25 px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={!questionAnswer.trim()}
                className="px-3 rounded-xl bg-white text-black hover:bg-white/80 active:scale-95 transition-all text-xs font-bold disabled:opacity-40"
              >
                Отправить
              </button>
            </form>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full">
      {/* Stories list slider */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide py-2 px-1">
        {/* Current user: Add story */}
        <div
          onClick={handleOpenUploadModal}
          className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-border/40 group-hover:bg-gradient-to-tr group-hover:from-[#7C4DFF] group-hover:via-[#8B5CF6] group-hover:to-[#A855F7] transition-all duration-300">
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden">
                {profile ? (
                  <Avatar src={profile.avatar_url} alt={profile.display_name} size="lg" />
                ) : (
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-tr from-[#7C4DFF] to-[#A855F7] flex items-center justify-center text-white border-2 border-background shadow-sm">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Создать
          </span>
        </div>

        {/* Stories list */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            onClick={() => handleOpenStory(idx)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div
              className={`relative p-[3px] rounded-full group-hover:scale-105 transition-transform duration-300 ${
                story.is_close_friends
                  ? "bg-gradient-to-tr from-[#22c55e] via-[#4ade80] to-[#10b981]" // Green border ring for close friends stories
                  : "bg-gradient-to-tr from-[#7C4DFF] via-[#8B5CF6] to-[#A855F7]"
              }`}
            >
              <div className="p-[2px] bg-background rounded-full">
                <Avatar src={story.avatarUrl} alt={story.displayName} size="lg" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors max-w-[70px] truncate">
              {story.displayName.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Stories View Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <button
              onClick={handleCloseStory}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous Navigation */}
            {selectedStoryIndex > 0 && (
              <button
                onClick={handlePrevStory}
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white backdrop-blur-sm transition-all hidden md:block"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Navigation */}
            <button
              onClick={handleNextStory}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white backdrop-blur-sm transition-all hidden md:block"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Floating Emojis Splash */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
              <AnimatePresence>
                {floatingEmojis.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: "100%", x: `${item.x}%`, scale: 0.8, opacity: 1 }}
                    animate={{ y: "-10%", scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="absolute bottom-0 text-3xl drop-shadow-lg"
                  >
                    {item.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Story Card Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950"
              onClick={handleNextStory}
            >
              {/* Media Background */}
              {isVideoUrl(stories[selectedStoryIndex].mediaUrl) ? (
                <video
                  src={stories[selectedStoryIndex].mediaUrl}
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <img
                  src={stories[selectedStoryIndex].mediaUrl}
                  alt={stories[selectedStoryIndex].caption}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              )}

              {/* Interactive Sticker Overlay */}
              {renderStickerOverlay(stories[selectedStoryIndex])}

              {/* Progress Bars */}
              <div className="absolute top-3 inset-x-4 flex gap-1.5 z-20">
                {stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{
                        width:
                          idx < selectedStoryIndex
                            ? "100%"
                            : idx === selectedStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* User Details Overlay */}
              <div className="absolute top-7 inset-x-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent p-2 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={stories[selectedStoryIndex].avatarUrl}
                    alt={stories[selectedStoryIndex].displayName}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-sm text-white">{stories[selectedStoryIndex].displayName}</h4>
                      {stories[selectedStoryIndex].is_close_friends && (
                        <span className="text-[9px] bg-[#22c55e] text-white font-bold px-1 py-0.5 rounded">ЗБ</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70">@{stories[selectedStoryIndex].username}</span>
                  </div>
                </div>
              </div>

              {/* Left bottom: Viewers list count button (if owner) */}
              {viewDetails.is_owner && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playClick();
                    setIsViewersListOpen(true);
                  }}
                  className="absolute bottom-16 left-4 z-40 bg-black/60 hover:bg-black/80 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs backdrop-blur-sm font-semibold active:scale-95 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{viewDetails.viewers.length} просмотров</span>
                </button>
              )}

              {/* Right bottom: Quick reactions bar */}
              {!viewDetails.is_owner && stories[selectedStoryIndex].id !== "fallback-news" && (
                <div
                  className="absolute bottom-16 inset-x-4 z-40 bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl py-2 px-3 flex justify-between items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-semibold text-white/60">Реакция:</span>
                  <div className="flex gap-1.5">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleQuickReaction(emoji)}
                        className="text-lg hover:scale-125 hover:rotate-6 active:scale-95 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption Overlay */}
              {stories[selectedStoryIndex].caption && (
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 z-20">
                  <p className="text-sm font-medium leading-relaxed drop-shadow">
                    {stories[selectedStoryIndex].caption}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewers List & Answers Modal */}
      <Modal open={isViewersListOpen} onClose={() => setIsViewersListOpen(false)} title="Просмотры истории">
        <div className="space-y-4 p-1 max-h-[400px] overflow-y-auto pr-1">
          {/* Question sticker answers (if question sticker responses exist) */}
          {viewDetails.sticker_responses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-primary flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>Ответы на вопросы ({viewDetails.sticker_responses.length})</span>
              </h3>
              <div className="space-y-2">
                {viewDetails.sticker_responses.map((resp: any) => (
                  <div key={resp.id} className="p-3 rounded-2xl bg-secondary/35 border border-border/40 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar src={resp.profile?.avatar_url} size="xs" />
                      <span className="text-xs font-bold">@{resp.profile?.username}</span>
                    </div>
                    <p className="text-xs text-foreground bg-black/10 p-2 rounded-lg italic">
                      "{resp.response}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewers profiles list */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Посмотрели</span>
            </h3>
            {viewDetails.viewers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Просмотров пока нет</p>
            ) : (
              <div className="space-y-2.5">
                {viewDetails.viewers.map((viewer: any) => (
                  <div key={viewer.id} className="flex items-center gap-3">
                    <Avatar src={viewer.avatar_url} size="sm" />
                    <div>
                      <p className="text-xs font-bold leading-none">{viewer.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">@{viewer.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Upload Story Modal */}
      <Modal open={isUploadModalOpen} onClose={handleCloseUploadModal} title="Создать историю">
        <div className="space-y-5 p-1 max-h-[85vh] overflow-y-auto pr-1">
          {/* Media Select / Preview */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 group min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/40 border border-border/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">Выберите фото или видео</p>
                <p className="text-xs text-muted-foreground">До 50MB (JPG, PNG, MP4, MOV)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-black max-h-[220px] flex items-center justify-center">
              {selectedFile?.type.startsWith("video/") ? (
                <video src={previewUrl} autoPlay muted loop className="max-h-[220px] w-auto object-contain" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-h-[220px] w-auto object-contain" />
              )}
              <button
                type="button"
                onClick={clearUploadState}
                disabled={uploading}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Settings Section (Close friends, Expiry) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expiry Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Срок действия
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                disabled={uploading}
                className="w-full rounded-xl border border-border/50 bg-secondary/25 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              >
                <option value="1m">1 минута (тест)</option>
                <option value="1h">1 час</option>
                <option value="12h">12 часов</option>
                <option value="24h">24 часа (по умолчанию)</option>
                <option value="3d">3 дня</option>
                <option value="7d">7 дней</option>
              </select>
            </div>

            {/* Close Friends Toggle */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between bg-secondary/25 border border-border/50 rounded-xl px-3.5 py-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCloseFriends}
                    onChange={(e) => {
                      setIsCloseFriends(e.target.checked);
                      soundEffects.playClick();
                    }}
                    disabled={uploading}
                    className="rounded text-green-500 border-border bg-transparent w-4.5 h-4.5 focus:ring-0 cursor-pointer"
                  />
                  <span>Близкие друзья 💚</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenFriends}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  Список
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Stickers Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Интерактивный стикер
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStickerType(stickerType === "poll" ? null : "poll");
                  soundEffects.playClick();
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  stickerType === "poll"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-secondary/20 border-border hover:bg-secondary/40"
                }`}
              >
                📊 Опрос
              </button>
              <button
                type="button"
                onClick={() => {
                  setStickerType(stickerType === "question" ? null : "question");
                  soundEffects.playClick();
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  stickerType === "question"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-secondary/20 border-border hover:bg-secondary/40"
                }`}
              >
                ❓ Вопрос
              </button>
            </div>

            {/* Sticker Customizer inputs */}
            {stickerType === "poll" && (
              <div className="p-4 rounded-2xl bg-secondary/25 border border-border/40 space-y-3">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Задайте вопрос..."
                  maxLength={50}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={pollOpt1}
                    onChange={(e) => setPollOpt1(e.target.value)}
                    placeholder="Вариант 1"
                    maxLength={15}
                    className="bg-background border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45"
                  />
                  <input
                    type="text"
                    value={pollOpt2}
                    onChange={(e) => setPollOpt2(e.target.value)}
                    placeholder="Вариант 2"
                    maxLength={15}
                    className="bg-background border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45"
                  />
                </div>
              </div>
            )}

            {stickerType === "question" && (
              <div className="p-4 rounded-2xl bg-secondary/25 border border-border/40 space-y-2">
                <input
                  type="text"
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                  placeholder="Задайте вопрос..."
                  maxLength={55}
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45"
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Подпись к истории
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Добавьте подпись..."
              maxLength={200}
              disabled={uploading}
              rows={2}
              className="w-full rounded-xl border border-border/50 bg-secondary/25 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground">{caption.length}/200</span>
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Загрузка истории...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C4DFF] to-[#A855F7] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={handleCloseUploadModal} disabled={uploading}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handlePublishStory}
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              Опубликовать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Close Friends Modal */}
      <Modal open={isManageFriendsOpen} onClose={() => setIsManageFriendsOpen(false)} title="Близкие друзья">
        <div className="space-y-4 p-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            placeholder="Поиск по имени или никнейму..."
            className="w-full rounded-xl border border-border/50 bg-secondary/25 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />

          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {searchQuery.trim() ? (
              // Search Results
              searching ? (
                <div className="text-center text-xs text-muted-foreground py-6">Поиск...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-6">Ничего не найдено</div>
              ) : (
                searchResults.map((user) => {
                  const isFriend = closeFriends.some((cf) => cf.id === user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} size="sm" />
                        <div>
                          <p className="text-xs font-bold leading-none">{user.display_name}</p>
                          <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCloseFriend(user.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          isFriend
                            ? "bg-green-500/10 border-green-500/35 text-green-500"
                            : "bg-secondary/40 border-border/50 text-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {isFriend ? "Друг 💚" : "Добавить ➕"}
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              // Current Close Friends list
              closeFriends.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-6">Ваш список близких друзей пуст</div>
              ) : (
                closeFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={friend.avatar_url} size="sm" />
                      <div>
                        <p className="text-xs font-bold leading-none">{friend.display_name}</p>
                        <p className="text-[10px] text-muted-foreground">@{friend.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCloseFriend(friend.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-green-500/10 border-green-500/35 text-green-500 hover:bg-destructive/10 hover:border-destructive/35 hover:text-destructive transition-colors group"
                    >
                      <span className="group-hover:hidden">Друг 💚</span>
                      <span className="hidden group-hover:inline">Удалить ❌</span>
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
