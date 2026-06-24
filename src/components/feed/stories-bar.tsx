"use client";

import { useState, useEffect } from "react";
import { Plus, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { soundEffects } from "@/lib/utils/sounds";

interface Story {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  mediaUrl: string;
  caption: string;
}

export function StoriesBar() {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const stories: Story[] = [
    {
      id: "story-1",
      username: "maria_art",
      displayName: "Мария Соколова",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      mediaUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
      caption: "Моя новая картина готова! Оцените цвета 🎨✨",
    },
    {
      id: "story-2",
      username: "dmitry_dev",
      displayName: "Дмитрий Новиков",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      mediaUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
      caption: "Пишу код под неоновую подсветку 💻👾 #RatesAI",
    },
    {
      id: "story-3",
      username: "elena_travel",
      displayName: "Елена Морозова",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      mediaUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600",
      caption: "Утренний туман в горах просто невероятен 🌄🚶‍♀️",
    },
    {
      id: "story-4",
      username: "alex_music",
      displayName: "Александр Волков",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      mediaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
      caption: "Записываем новый гитарный трек на студии 🎸🎶",
    },
    {
      id: "story-5",
      username: "cyber_chef",
      displayName: "Нейро Кулинар",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      mediaUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
      caption: "Завтрак будущего: протеиновый тост с авокадо 🥑🚀",
    },
  ];

  useEffect(() => {
    if (selectedStoryIndex === null) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          // Go to next story or close
          if (selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
            return 0;
          } else {
            setSelectedStoryIndex(null);
            return 0;
          }
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedStoryIndex, stories.length]);

  const handleOpenStory = (index: number) => {
    soundEffects.playClick();
    setSelectedStoryIndex(index);
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

  return (
    <div className="w-full">
      {/* Stories list slider */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide py-2 px-1">
        {/* Current user: Add story */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-secondary/40 border border-border/40 flex items-center justify-center hover:border-primary/50 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white border-2 border-background">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Создать</span>
        </div>

        {/* Stories list */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            onClick={() => handleOpenStory(idx)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#7C4DFF] via-[#8B5CF6] to-[#A855F7] group-hover:scale-105 transition-transform duration-300">
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

            {/* Story Card Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={handleNextStory}
            >
              {/* Media Background */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stories[selectedStoryIndex].mediaUrl}
                alt={stories[selectedStoryIndex].caption}
                className="w-full h-full object-cover select-none pointer-events-none"
              />

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
              <div className="absolute top-7 inset-x-4 flex items-center gap-2.5 z-20 bg-gradient-to-b from-black/60 to-transparent p-2 rounded-2xl">
                <Avatar src={stories[selectedStoryIndex].avatarUrl} alt={stories[selectedStoryIndex].displayName} size="sm" />
                <div>
                  <h4 className="font-bold text-sm text-white">{stories[selectedStoryIndex].displayName}</h4>
                  <span className="text-[10px] text-white/70">@{stories[selectedStoryIndex].username}</span>
                </div>
              </div>

              {/* Caption Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white space-y-2 z-20">
                <p className="text-sm font-medium leading-relaxed drop-shadow">
                  {stories[selectedStoryIndex].caption}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
