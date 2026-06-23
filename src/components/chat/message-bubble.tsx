"use client";

import { formatRelativeTime, formatFileSize } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { File, Mic, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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
    <div className={cn("flex gap-2 mb-3", isOwn && "flex-row-reverse")}>
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
        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn && "justify-end")}>
          {typeIcon && (() => { const Icon = typeIcon; return <Icon className="w-3 h-3 text-muted-foreground" />; })()}
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(message.created_at)}
            {message.is_edited && " (изменено)"}
          </span>
        </div>
      </div>
    </div>
  );
}
