"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, ChevronRight, ChevronLeft, FolderHeart } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { soundEffects } from "@/lib/utils/sounds";

interface Highlight {
  id: string;
  title: string;
  cover_url: string | null;
  stories: any[];
}

interface ProfileHighlightsProps {
  username: string;
  isOwn: boolean;
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

export function ProfileHighlights({ username, isOwn }: ProfileHighlightsProps) {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);
  const [selectedStoryIdx, setSelectedStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [archivedStories, setArchivedStories] = useState<any[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchHighlights = async () => {
    try {
      const res = await fetch(`/api/highlights?username=${username}`);
      const result = await res.json();
      if (result.success) {
        // Formatted to have nested stories from items
        const list = (result.data || []).map((h: any) => {
          const stories = (h.items || [])
            .map((item: any) => item.story)
            .filter(Boolean);
          return {
            id: h.id,
            title: h.title,
            cover_url: h.cover_url || (stories[0]?.media_url || ""),
            stories,
          };
        });
        setHighlights(list.filter((h: any) => h.stories.length > 0));
      }
    } catch (err) {
      console.error("Error fetching highlights:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadArchive = async () => {
    setLoadingArchive(true);
    try {
      const res = await fetch("/api/stories/archive");
      const result = await res.json();
      if (result.success) {
        setArchivedStories(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching archive:", err);
    } finally {
      setLoadingArchive(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [username]);

  // Autoplay handler for playing highlights
  useEffect(() => {
    if (selectedStoryIdx === null || !activeHighlight) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (selectedStoryIdx < activeHighlight.stories.length - 1) {
            setSelectedStoryIdx(selectedStoryIdx + 1);
            return 0;
          } else {
            // End of highlight
            setSelectedStoryIdx(null);
            setActiveHighlight(null);
            return 0;
          }
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedStoryIdx, activeHighlight]);

  const handleOpenHighlight = (h: Highlight) => {
    soundEffects.playClick();
    if (h.stories.length === 0) return;
    setActiveHighlight(h);
    setSelectedStoryIdx(0);
  };

  const handleCloseHighlight = () => {
    soundEffects.playClick();
    setActiveHighlight(null);
    setSelectedStoryIdx(null);
  };

  const handleNextStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (activeHighlight && selectedStoryIdx !== null) {
      if (selectedStoryIdx < activeHighlight.stories.length - 1) {
        setSelectedStoryIdx(selectedStoryIdx + 1);
      } else {
        setActiveHighlight(null);
        setSelectedStoryIdx(null);
      }
    }
  };

  const handlePrevStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (selectedStoryIdx !== null && selectedStoryIdx > 0) {
      setSelectedStoryIdx(selectedStoryIdx - 1);
    }
  };

  const handleOpenCreateModal = () => {
    soundEffects.playClick();
    setIsCreateOpen(true);
    loadArchive();
  };

  const handleCloseCreateModal = () => {
    if (creating) return;
    soundEffects.playClick();
    setIsCreateOpen(false);
    setSelectedStoryIds([]);
    setHighlightTitle("");
  };

  const toggleStorySelection = (storyId: string) => {
    soundEffects.playClick();
    setSelectedStoryIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleCreate = async () => {
    if (!highlightTitle.trim()) {
      toast("Введите название", "error");
      return;
    }
    if (selectedStoryIds.length === 0) {
      toast("Выберите хотя бы одну историю", "error");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: highlightTitle.trim(),
          story_ids: selectedStoryIds,
        }),
      });
      const result = await res.json();
      if (result.success) {
        soundEffects.playSent();
        toast("Альбом добавлен в Актуальное!", "success");
        setIsCreateOpen(false);
        setSelectedStoryIds([]);
        setHighlightTitle("");
        fetchHighlights();
      } else {
        toast(result.error || "Не удалось создать альбом", "error");
      }
    } catch (err: any) {
      toast(err.message || "Ошибка", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHighlight = async (e: React.MouseEvent, highlightId: string) => {
    e.stopPropagation();
    if (!confirm("Вы уверены, что хотите удалить этот альбом?")) return;

    soundEffects.playClick();
    try {
      const res = await fetch(`/api/highlights/${highlightId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast("Альбом удалён", "success");
        fetchHighlights();
      } else {
        toast(result.error, "error");
      }
    } catch (err) {
      toast("Ошибка при удалении", "error");
    }
  };

  if (loading) return null;

  return (
    <div className="w-full py-4 border-b border-border/40">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
        {/* Add Highlight folder (Only if Own Profile) */}
        {isOwn && (
          <div
            onClick={handleOpenCreateModal}
            className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 hover:bg-secondary/40 transition-all duration-300">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Добавить
            </span>
          </div>
        )}

        {/* Highlights List */}
        {highlights.map((h) => (
          <div
            key={h.id}
            onClick={() => handleOpenHighlight(h)}
            className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0 relative"
          >
            <div className="relative p-[2px] rounded-full border border-border group-hover:scale-105 group-hover:border-primary/50 transition-all duration-300">
              <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                {h.cover_url ? (
                  <img src={h.cover_url} alt={h.title} className="w-full h-full object-cover" />
                ) : (
                  <FolderHeart className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors max-w-[62px] truncate">
              {h.title}
            </span>

            {/* Delete button for Owner */}
            {isOwn && (
              <button
                type="button"
                onClick={(e) => handleDeleteHighlight(e, h.id)}
                className="absolute top-0 right-0 p-0.5 rounded-full bg-destructive text-white hover:scale-110 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Playback Highlight Viewer Modal */}
      <AnimatePresence>
        {activeHighlight && selectedStoryIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <button
              onClick={handleCloseHighlight}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous Navigation */}
            {selectedStoryIdx > 0 && (
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

            {/* Story Card */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950"
              onClick={handleNextStory}
            >
              {/* Media Background */}
              {isVideoUrl(activeHighlight.stories[selectedStoryIdx].mediaUrl) ? (
                <video
                  src={activeHighlight.stories[selectedStoryIdx].mediaUrl}
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <img
                  src={activeHighlight.stories[selectedStoryIdx].mediaUrl}
                  alt={activeHighlight.stories[selectedStoryIdx].caption}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              )}

              {/* Progress Bars */}
              <div className="absolute top-3 inset-x-4 flex gap-1.5 z-20">
                {activeHighlight.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{
                        width:
                          idx < selectedStoryIdx
                            ? "100%"
                            : idx === selectedStoryIdx
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* User Details */}
              <div className="absolute top-7 inset-x-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent p-2 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={activeHighlight.stories[selectedStoryIdx].avatarUrl || ""}
                    alt={activeHighlight.title}
                    size="sm"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-white">{activeHighlight.title}</h4>
                    <span className="text-[9px] text-white/60">Актуальное</span>
                  </div>
                </div>
              </div>

              {/* Caption Overlay */}
              {activeHighlight.stories[selectedStoryIdx].caption && (
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 z-20">
                  <p className="text-sm font-medium leading-relaxed drop-shadow">
                    {activeHighlight.stories[selectedStoryIdx].caption}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <Modal open={isCreateOpen} onClose={handleCloseCreateModal} title="Создать актуальное">
        <div className="space-y-5 p-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Название альбома
            </label>
            <input
              type="text"
              value={highlightTitle}
              onChange={(e) => setHighlightTitle(e.target.value)}
              placeholder="Путешествия, Еда, Код..."
              maxLength={15}
              disabled={creating}
              className="w-full rounded-xl border border-border/50 bg-secondary/25 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Выберите истории из архива
            </label>
            {loadingArchive ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                Загрузка архива...
              </div>
            ) : archivedStories.length === 0 ? (
              <div className="h-32 border border-dashed border-border/60 rounded-xl flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                Архив историй пуст. Сначала опубликуйте хотя бы одну историю в профиле!
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {archivedStories.map((story) => {
                  const isSelected = selectedStoryIds.includes(story.id);
                  return (
                    <div
                      key={story.id}
                      onClick={() => toggleStorySelection(story.id)}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${
                        isSelected ? "border-primary scale-[0.98] ring-2 ring-primary/20" : "border-border/40 opacity-70"
                      }`}
                    >
                      {isVideoUrl(story.media_url) ? (
                        <video src={story.media_url} muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={story.media_url} alt="Archive" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] bg-black/40">
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={handleCloseCreateModal} disabled={creating}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !highlightTitle.trim() || selectedStoryIds.length === 0}
              loading={creating}
            >
              Создать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
