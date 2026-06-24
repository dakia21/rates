"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  getSocket,
  onNewMessage,
  onNotification,
  onTypingStart,
  onTypingStop,
  onUserOnline,
  onUserOffline,
} from "@/lib/socket/client";
import type { Message, Notification } from "@/types";

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  newMessages: Message[];
  newNotifications: Notification[];
  clearNewMessages: () => void;
  clearNewNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    const unsubMessage = onNewMessage((msg) => {
      setNewMessages((prev) => [...prev, msg]);
    });

    const unsubNotification = onNotification((notif) => {
      setNewNotifications((prev) => [...prev, notif]);
    });

    const unsubTypingStart = onTypingStart(({ chatId, userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const chatTyping = new Set(next.get(chatId) || []);
        chatTyping.add(userId);
        next.set(chatId, chatTyping);
        return next;
      });
    });

    const unsubTypingStop = onTypingStop(({ chatId, userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const chatTyping = new Set(next.get(chatId) || []);
        chatTyping.delete(userId);
        if (chatTyping.size === 0) next.delete(chatId);
        else next.set(chatId, chatTyping);
        return next;
      });
    });

    const onOnlineList = (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    };

    socket.on("users:online_list", onOnlineList);

    const unsubOnline = onUserOnline(({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    const unsubOffline = onUserOffline(({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("users:online_list", onOnlineList);
      unsubMessage();
      unsubNotification();
      unsubTypingStart();
      unsubTypingStop();
      unsubOnline();
      unsubOffline();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        typingUsers,
        newMessages,
        newNotifications,
        clearNewMessages: () => setNewMessages([]),
        clearNewNotifications: () => setNewNotifications([]),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
