"use client";

import { useSocket } from "@/contexts/socket-context";
import { useAuth } from "@/contexts/auth-context";

interface TypingIndicatorProps {
  chatId: string;
}

export function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const { typingUsers } = useSocket();
  const { profile } = useAuth();

  const typing = typingUsers.get(chatId);
  if (!typing || typing.size === 0) return null;

  const others = [...typing].filter((id) => id !== profile?.id);
  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-rates-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-rates-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-rates-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-xs text-muted-foreground">печатает...</span>
    </div>
  );
}
