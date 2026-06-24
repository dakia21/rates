"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, MoreVertical, Pin } from "lucide-react";
import Link from "next/link";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { joinChat, leaveChat, onNewMessage, onMessageReaction, getSocket, onChatActiveUsers, onChatUserJoined, onChatUserLeft } from "@/lib/socket/client";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { useToast } from "@/components/ui/toast";
import { soundEffects } from "@/lib/utils/sounds";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import type { Message, Chat } from "@/types";

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const { typingUsers, onlineUsers } = useSocket();
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const pinned = messages.find((m) => m.is_pinned);
    if (pinned) {
      setPinnedMessage(pinned);
    } else if (messages.length > 0 && !pinnedMessage) {
      setPinnedMessage(messages[0]);
    }
  }, [messages, pinnedMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${chatId}`);
    const data = await res.json();
    if (data.success) {
      setMessages(data.data.messages);
      setChat(data.data.chat);
    }
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    joinChat(chatId);

    const unsub = onNewMessage((msg) => {
      if (msg.chat_id === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== profile?.id) {
          soundEffects.playReceived();
        }
      }
    });

    const unsubReactions = onMessageReaction(({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    const unsubActiveList = onChatActiveUsers(({ chatId: cId, activeUserIds }) => {
      if (cId === chatId) {
        setActiveUsers(new Set(activeUserIds));
      }
    });

    const unsubUserJoined = onChatUserJoined(({ chatId: cId, userId }) => {
      if (cId === chatId) {
        setActiveUsers((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      }
    });

    const unsubUserLeft = onChatUserLeft(({ chatId: cId, userId }) => {
      if (cId === chatId) {
        setActiveUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    });

    return () => {
      leaveChat(chatId);
      unsub();
      unsubReactions();
      unsubActiveList();
      unsubUserJoined();
      unsubUserLeft();
    };
  }, [chatId, fetchMessages, profile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (data: Parameters<typeof MessageInput>[0]["onSend"] extends (d: infer T) => unknown ? T : never) => {
    const res = await fetch(`/api/messages/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.data.id)) return prev;
        return [...prev, result.data];
      });
      getSocket().emit("message:send", result.data);
      soundEffects.playSent();
    }
  };

  const getChatName = () => {
    if (chat?.name) return chat.name;
    const other = chat?.participants?.find((p) => p.user_id !== profile?.id);
    return other?.profile?.display_name || "Чат";
  };

  const getOtherUser = () => chat?.participants?.find((p) => p.user_id !== profile?.id);
  const otherUser = getOtherUser();
  const isOnline = otherUser ? onlineUsers.has(otherUser.user_id) : false;
  const isActiveInChat = otherUser ? activeUsers.has(otherUser.user_id) : false;
  const typing = typingUsers.get(chatId);

  const getStatusText = () => {
    if (typing && typing.size > 0) return "печатает...";
    if (isActiveInChat) return "в чате";
    if (isOnline) return "в сети";
    if (otherUser?.profile?.last_seen) {
      return `был(а) в сети ${formatRelativeTime(otherUser.profile.last_seen)}`;
    }
    return "не в сети";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border/50 glass">
        <Link href="/messages" className="lg:hidden btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar src={otherUser?.profile?.avatar_url || chat?.avatar_url} alt={getChatName()} size="md" online={isOnline} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{getChatName()}</h2>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
        <button className="btn-ghost p-2">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {pinnedMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/15 text-xs gap-3 animate-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-primary font-bold flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 fill-primary/10 rotate-45" />
              Закреплённое:
            </span>
            <span className="truncate text-foreground/90 font-medium">{pinnedMessage.content || "Медиафайл"}</span>
          </div>
          <button
            onClick={() => {
              setPinnedMessage(null);
              soundEffects.playClick();
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground font-bold px-2 py-0.5 rounded-lg hover:bg-secondary/40"
          >
            Скрыть
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === profile?.id} />
        ))}
        <TypingIndicator chatId={chatId} />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput chatId={chatId} onSend={handleSend} />
    </div>
  );
}
