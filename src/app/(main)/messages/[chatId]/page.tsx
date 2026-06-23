"use client";

import { ChatWindow } from "@/components/chat/chat-window";
import { use } from "react";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen max-w-4xl mx-auto">
      <ChatWindow chatId={chatId} />
    </div>
  );
}
