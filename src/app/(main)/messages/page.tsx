"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { Chat } from "@/types";
import { MessageCircle, Plus } from "lucide-react";
import { onNewMessage } from "@/lib/socket/client";

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [username, setUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchChats = async () => {
    const res = await fetch("/api/chats");
    const data = await res.json();
    if (data.success) setChats(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();

    const unsub = onNewMessage((msg) => {
      setChats((prev) => {
        const chatIdx = prev.findIndex((c) => c.id === msg.chat_id);
        if (chatIdx === -1) {
          fetchChats();
          return prev;
        }

        const next = [...prev];
        const chat = { ...next[chatIdx] };
        chat.last_message = msg;
        chat.last_message_at = msg.created_at;
        chat.unread_count = (chat.unread_count ?? 0) + 1;

        next.splice(chatIdx, 1);
        return [chat, ...next];
      });
    });

    return () => {
      unsub();
    };
  }, []);

  const handleCreateChat = async () => {
    if (!username.trim()) return;
    setCreating(true);

    const userRes = await fetch(`/api/search?q=${username.trim()}&type=users`);
    const userData = await userRes.json();
    const user = userData.data?.users?.[0];

    if (!user) {
      toast("Пользователь не найден", "error");
      setCreating(false);
      return;
    }

    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: user.id }),
    });
    const data = await res.json();

    if (data.success) {
      setChats((prev) => [data.data, ...prev]);
      setShowNewChat(false);
      setUsername("");
      toast("Чат создан", "success");
    } else {
      toast(data.error, "error");
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Сообщения
        </h1>
        <Button size="sm" onClick={() => setShowNewChat(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Новый чат
        </Button>
      </div>

      <ChatList chats={chats} />

      <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="Новый чат">
        <div className="space-y-4">
          <Input
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
          />
          <Button className="w-full" onClick={handleCreateChat} loading={creating}>
            Начать чат
          </Button>
        </div>
      </Modal>
    </div>
  );
}
