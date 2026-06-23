"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { useSocket } from "@/contexts/socket-context";
import { useAuth } from "@/contexts/auth-context";
import type { Chat } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ChatListProps {
  chats: Chat[];
  activeChatId?: string;
}

export function ChatList({ chats, activeChatId }: ChatListProps) {
  const { onlineUsers, typingUsers } = useSocket();
  const { profile } = useAuth();

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    const other = chat.participants?.find((p) => p.user_id !== profile?.id);
    return other?.profile?.display_name || "Чат";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar_url) return chat.avatar_url;
    const other = chat.participants?.find((p) => p.user_id !== profile?.id);
    return other?.profile?.avatar_url;
  };

  const isOtherOnline = (chat: Chat) => {
    const other = chat.participants?.find((p) => p.user_id !== profile?.id);
    return other ? onlineUsers.has(other.user_id) : false;
  };

  const getTypingText = (chatId: string) => {
    const typing = typingUsers.get(chatId);
    if (!typing || typing.size === 0) return null;
    return "печатает...";
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-muted-foreground">Нет сообщений</p>
        <p className="text-sm text-muted-foreground mt-1">Начните новый диалог</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {chats.map((chat) => {
        const typing = getTypingText(chat.id);
        return (
          <Link
            key={chat.id}
            href={`/messages/${chat.id}`}
            className={cn(
              "flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors",
              activeChatId === chat.id && "bg-rates-500/5"
            )}
          >
            <Avatar
              src={getChatAvatar(chat)}
              alt={getChatName(chat)}
              size="md"
              online={chat.type === "private" ? isOtherOnline(chat) : undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{getChatName(chat)}</span>
                {chat.last_message && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatRelativeTime(chat.last_message_at)}
                  </span>
                )}
              </div>
              <p className={cn("text-sm truncate mt-0.5", typing ? "text-rates-500" : "text-muted-foreground")}>
                {typing || chat.last_message?.content || "Нет сообщений"}
              </p>
            </div>
            {(chat.unread_count ?? 0) > 0 && (
              <span className="w-5 h-5 rounded-full gradient-bg text-white text-xs flex items-center justify-center shrink-0">
                {chat.unread_count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
