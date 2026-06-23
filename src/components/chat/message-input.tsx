"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, X, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendTypingStart, sendTypingStop } from "@/lib/socket/client";
import { uploadFile } from "@/lib/utils/upload";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";

interface MessageInputProps {
  chatId: string;
  onSend: (data: {
    content?: string;
    type: string;
    media_url?: string;
    file_name?: string;
    file_size?: number;
    duration?: number;
  }) => Promise<void>;
}

export function MessageInput({ chatId, onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleTyping = () => {
    sendTypingStart(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStop(chatId), 2000);
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    await onSend({ content: content.trim(), type: "text" });
    setContent("");
    sendTypingStop(chatId);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSending(true);
    const bucket = file.type.startsWith("image/")
      ? "messages"
      : file.type.startsWith("video/")
        ? "messages"
        : file.type.startsWith("audio/")
          ? "voice"
          : "messages";

    const result = await uploadFile(file, bucket, profile.id);
    if ("error" in result) {
      toast(result.error, "error");
      setSending(false);
      return;
    }

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "voice"
          : "file";

    await onSend({
      type,
      media_url: result.url,
      file_name: file.name,
      file_size: file.size,
    });
    setSending(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        if (!profile) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        const result = await uploadFile(file, "voice", profile.id);
        if ("url" in result) {
          await onSend({ type: "voice", media_url: result.url, duration: 0 });
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      toast("Нет доступа к микрофону", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setMediaRecorder(null);
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="p-4 border-t border-border/50 glass">
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf,.zip,.doc,.docx"
          onChange={handleFileUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost p-2.5 shrink-0"
          disabled={sending}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {recording ? (
          <button onClick={stopRecording} className="btn-ghost p-2.5 shrink-0 text-destructive animate-pulse">
            <Square className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button onClick={startRecording} className="btn-ghost p-2.5 shrink-0" disabled={sending}>
            <Mic className="w-5 h-5" />
          </button>
        )}

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          className="input-field flex-1 min-h-[44px] max-h-32 resize-none py-2.5"
          rows={1}
          disabled={sending}
        />

        <Button onClick={handleSend} size="icon" loading={sending} disabled={!content.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
