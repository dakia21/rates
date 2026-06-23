"use client";

import { io, Socket } from "socket.io-client";
import type { Message, Notification } from "@/types";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket(token: string, userId: string) {
  const s = getSocket();
  if (s.connected) return s;

  s.auth = { token, userId };
  s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinChat(chatId: string) {
  getSocket().emit("chat:join", chatId);
}

export function leaveChat(chatId: string) {
  getSocket().emit("chat:leave", chatId);
}

export function sendTypingStart(chatId: string) {
  getSocket().emit("typing:start", { chatId });
}

export function sendTypingStop(chatId: string) {
  getSocket().emit("typing:stop", { chatId });
}

export function onNewMessage(callback: (message: Message) => void) {
  getSocket().on("message:new", callback);
  return () => getSocket().off("message:new", callback);
}

export function onMessageEdit(callback: (message: Message) => void) {
  getSocket().on("message:edit", callback);
  return () => getSocket().off("message:edit", callback);
}

export function onMessageDelete(callback: (data: { messageId: string; chatId: string }) => void) {
  getSocket().on("message:delete", callback);
  return () => getSocket().off("message:delete", callback);
}

export function onTypingStart(callback: (data: { chatId: string; userId: string; username: string }) => void) {
  getSocket().on("typing:start", callback);
  return () => getSocket().off("typing:start", callback);
}

export function onTypingStop(callback: (data: { chatId: string; userId: string }) => void) {
  getSocket().on("typing:stop", callback);
  return () => getSocket().off("typing:stop", callback);
}

export function onUserOnline(callback: (data: { userId: string }) => void) {
  getSocket().on("user:online", callback);
  return () => getSocket().off("user:online", callback);
}

export function onUserOffline(callback: (data: { userId: string }) => void) {
  getSocket().on("user:offline", callback);
  return () => getSocket().off("user:offline", callback);
}

export function onNotification(callback: (notification: Notification) => void) {
  getSocket().on("notification:new", callback);
  return () => getSocket().off("notification:new", callback);
}
