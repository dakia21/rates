"use client";

import { formatRelativeTime, formatFileSize } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { soundEffects } from "@/lib/utils/sounds";
import { File, Mic, Image as ImageIcon, Video, Smile } from "lucide-react";
import Image from "next/image";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [reactions, setReactions] = useState<{ emoji: string; count: number; reacted: boolean }[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const emojiOptions = ["👍", "❤️", "🔥", "😂", "🎉", "😢"];

  const handleReact = (emoji: string) => {
    soundEffects.playLike();
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.reacted) {
          const updated = prev.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r
          );
          return updated.filter((r) => r.count > 0);
        } else {
          return prev.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r
          );
        }
      } else {
        return [...prev, { emoji, count: 1, reacted: true }];
      }
    });
    setShowPicker(false);
  };

  const renderContent = () => {
    switch (message.type) {
      case "image":
        return message.media_url ? (
          <div className="rounded-xl overflow-hidden max-w-xs">
            <Image
              src={message.media_url}
              alt="Image"
              width={300}
              height={200}
              className="object-cover"
            />
          </div>
        ) : null;

      case "video":
        return message.media_url ? (
          <video src={message.media_url} controls className="rounded-xl max-w-xs max-h-60" />
        ) : null;

      case "voice":
        return message.media_url ? (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Mic className="w-4 h-4" />
            <audio src={message.media_url} controls className="flex-1 h-8" />
          </div>
        ) : null;

      case "file":
        return (
          <a
            href={message.media_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <File className="w-8 h-8 text-rates-500" />
            <div>
              <p className="text-sm font-medium truncate">{message.file_name}</p>
              {message.file_size && (
                <p className="text-xs text-muted-foreground">{formatFileSize(message.file_size)}</p>
              )}
            </div>
          </a>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  const typeIcon = message.type !== "text" ? {
    image: ImageIcon,
    video: Video,
    file: File,
    voice: Mic,
  }[message.type] : null;

  return (
    <div
      className={cn("flex gap-2 mb-3 relative group", isOwn && "flex-row-reverse")}
      onMouseLeave={() => setShowPicker(false)}
    >
      {!isOwn && (
        <Avatar
          src={message.sender?.avatar_url}
          alt={message.sender?.display_name || ""}
          size="sm"
          className="mt-1"
        />
      )}
      <div className={cn("max-w-[70%]", isOwn && "items-end")}>
        {!isOwn && message.sender && (
          <p className="text-xs text-muted-foreground mb-1 ml-1">{message.sender.display_name}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isOwn
              ? "gradient-bg text-white rounded-br-md"
              : "glass rounded-bl-md"
          )}
        >
          {message.reply_to && (
            <div className={cn("text-xs mb-2 pb-2 border-b", isOwn ? "border-white/20" : "border-border")}>
              <p className="font-medium">{message.reply_to.sender?.display_name}</p>
              <p className="opacity-70 truncate">{message.reply_to.content}</p>
            </div>
          )}
          {renderContent()}
        </div>

        {/* Display Reactions */}
        {reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1.5", isOwn ? "justify-end" : "justify-start")}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all duration-300 active:scale-90",
                  r.reacted
                    ? "bg-primary/15 border-primary/40 text-primary font-bold"
                    : "bg-secondary/40 border-border/50 text-foreground hover:bg-secondary/70"
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-[10px]">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn && "justify-end")}>
          {typeIcon && (() => { const Icon = typeIcon; return <Icon className="w-3 h-3 text-muted-foreground" />; })()}
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(message.created_at)}
            {message.is_edited && " (изменено)"}
          </span>
        </div>
      </div>

      {/* Emoji Reaction Trigger */}
      <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1 relative">
        <button
          onClick={() => {
            setShowPicker(!showPicker);
            soundEffects.playClick();
          }}
          className="p-1 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
        >
          <Smile className="w-4.5 h-4.5" />
        </button>

        {showPicker && (
          <div className={cn(
            "absolute z-35 bottom-full mb-1 bg-card border border-border/40 p-1.5 rounded-2xl shadow-xl flex gap-1.5 animate-in",
            isOwn ? "right-0" : "left-0"
          )}>
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-7 h-7 flex items-center justify-center text-sm hover:bg-secondary/70 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
