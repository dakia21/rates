"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/utils/format";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import type { VideoComment } from "@/types";

interface CommentsSheetProps {
  videoId: string | null;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CommentsSheet({ videoId, onClose, onCommentAdded }: CommentsSheetProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!videoId) return;

    const fetchComments = async () => {
      setLoading(true);
      const res = await fetch(`/api/videos/${videoId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.data);
      setLoading(false);
    };

    fetchComments();
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !videoId) return;

    setSubmitting(true);
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setComments((prev) => [data.data, ...prev]);
      setContent("");
      onCommentAdded?.();
    } else {
      toast(data.error || "Ошибка", "error");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {videoId && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-lg max-h-[70vh] glass-card rounded-t-3xl lg:rounded-3xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-semibold">Комментарии</h3>
              <button onClick={onClose} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <Spinner className="py-8" />
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Пока нет комментариев</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      src={comment.profile?.avatar_url}
                      alt={comment.profile?.display_name || ""}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.profile?.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 select-text">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {profile && (
              <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 flex gap-2">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="input-field flex-1"
                  maxLength={1000}
                />
                <Button type="submit" size="icon" loading={submitting} disabled={!content.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
