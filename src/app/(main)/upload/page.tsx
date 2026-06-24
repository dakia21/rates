"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Video as VideoIcon, X, BarChart2, Heart, MessageSquare, Trash2, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { getVideoDuration, generateThumbnail } from "@/lib/utils/upload";
import { soundEffects } from "@/lib/utils/sounds";
import type { Video } from "@/types";

export default function UploadPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upload" | "post" | "studio">("upload");

  // Post form state
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const postFileRef = useRef<HTMLInputElement>(null);
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Content studio state
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loadingMyVideos, setLoadingMyVideos] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      toast("Выберите видеофайл", "error");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setUploading(true);
    setProgress(10);

    const videoForm = new FormData();
    videoForm.append("file", file);
    videoForm.append("bucket", "videos");

    const videoRes = await fetch("/api/upload", { method: "POST", body: videoForm });
    const videoData = await videoRes.json();

    if (!videoData.success) {
      toast(videoData.error, "error");
      setUploading(false);
      return;
    }

    setProgress(50);

    const duration = await getVideoDuration(file);
    const thumbnailBlob = await generateThumbnail(file);
    let thumbnailUrl = null;

    if (thumbnailBlob) {
      const thumbForm = new FormData();
      thumbForm.append("file", new File([thumbnailBlob], "thumb.jpg", { type: "image/jpeg" }));
      thumbForm.append("bucket", "thumbnails");
      const thumbRes = await fetch("/api/upload", { method: "POST", body: thumbForm });
      const thumbData = await thumbRes.json();
      if (thumbData.success) thumbnailUrl = thumbData.data.url;
    }

    setProgress(75);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        video_url: videoData.data.url,
        thumbnail_url: thumbnailUrl,
        duration,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });

    const data = await res.json();
    setProgress(100);

    if (data.success) {
      toast("Видео успешно опубликовано!", "success");
      soundEffects.playSent();
      // Clear form
      setFile(null);
      setPreview(null);
      setTitle("");
      setDescription("");
      setTags("");
      setActiveTab("studio");
    } else {
      toast(data.error, "error");
    }
    setUploading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast("Выберите изображение", "error");
      return;
    }

    setPostImageFile(selected);
    setPostImagePreview(URL.createObjectURL(selected));
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim()) {
      toast("Введите название поста", "error");
      return;
    }

    setPosting(true);
    let thumbnailUrl = null;

    try {
      if (postImageFile) {
        const imgForm = new FormData();
        imgForm.append("file", postImageFile);
        imgForm.append("bucket", "thumbnails");
        const imgRes = await fetch("/api/upload", { method: "POST", body: imgForm });
        const imgData = await imgRes.json();
        if (imgData.success) {
          thumbnailUrl = imgData.data.url;
        } else {
          toast(imgData.error || "Ошибка загрузки картинки", "error");
          setPosting(false);
          return;
        }
      }

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle.trim(),
          description: postDescription.trim(),
          video_url: "text-post",
          thumbnail_url: thumbnailUrl,
          duration: 0,
          tags: postTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast("Пост успешно опубликован!", "success");
        soundEffects.playSent();
        // Clear form
        setPostTitle("");
        setPostDescription("");
        setPostTags("");
        setPostImageFile(null);
        setPostImagePreview(null);
        setActiveTab("studio");
      } else {
        toast(data.error || "Ошибка создания поста", "error");
      }
    } catch (err) {
      toast("Ошибка соединения", "error");
    } finally {
      setPosting(false);
    }
  };

  // Fetch my uploaded videos
  const loadMyVideos = async () => {
    if (!profile) return;
    setLoadingMyVideos(true);
    try {
      const res = await fetch(`/api/videos?user_id=${profile.id}`);
      const data = await res.json();
      if (data.success) {
        setMyVideos(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyVideos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "studio" && profile) {
      loadMyVideos();
    }
  }, [activeTab, profile]);

  const handleDeleteVideo = async (id: string) => {
    soundEffects.playClick();
    if (!confirm("Вы действительно хотите удалить это видео?")) return;

    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast("Видео удалено", "success");
        soundEffects.playSent();
        setMyVideos(myVideos.filter((v) => v.id !== id));
      } else {
        toast(data.error || "Ошибка удаления", "error");
      }
    } catch (err) {
      toast("Ошибка соединения", "error");
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border/40 p-6 flex items-center justify-between">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative">
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Панель автора</h1>
          </div>
          <p className="text-sm text-muted-foreground">Загружайте видео, публикуйте посты, управляйте публикациями и отслеживайте статистику</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary/30 border border-border/40 rounded-2xl w-max">
        <button
          onClick={() => {
            setActiveTab("upload");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "upload"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-4 h-4" />
          Загрузить видео
        </button>
        <button
          onClick={() => {
            setActiveTab("post");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "post"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Создать пост
        </button>
        <button
          onClick={() => {
            setActiveTab("studio");
            soundEffects.playClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === "studio"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Мой контент ({activeTab === "studio" ? myVideos.length : "..."})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "upload" ? (
        <Card className="space-y-6 max-w-2xl">
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary bg-secondary/10"
            >
              <VideoIcon className="w-12 h-12" />
              <span className="font-medium">Выберите видеофайл</span>
              <span className="text-xs">MP4, WebM до 100MB</span>
            </button>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <video src={preview} controls className="w-full h-full object-contain" />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  soundEffects.playClick();
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

          <Input
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назовите ваше видео"
          />
          <Textarea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Добавьте описание..."
          />
          <Input
            label="Теги"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="тег1, тег2, тег3 (через запятую)"
          />

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Загрузка...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="gradient-bg h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleUpload}
            loading={uploading}
            disabled={!file || !title.trim()}
          >
            Опубликовать видео
          </Button>
        </Card>
      ) : activeTab === "post" ? (
        <Card className="space-y-6 max-w-2xl">
          {!postImagePreview ? (
            <button
              onClick={() => postFileRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary bg-secondary/10"
            >
              <Upload className="w-12 h-12" />
              <span className="font-medium">Добавить изображение к посту (необязательно)</span>
              <span className="text-xs">PNG, JPG, WebP до 10MB</span>
            </button>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={postImagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
              <button
                onClick={() => {
                  setPostImageFile(null);
                  setPostImagePreview(null);
                  soundEffects.playClick();
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          <Input
            label="Заголовок поста"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            placeholder="Введите название поста"
          />
          <Textarea
            label="Текст поста"
            value={postDescription}
            onChange={(e) => setPostDescription(e.target.value)}
            placeholder="О чем вы хотите рассказать?"
          />
          <Input
            label="Теги"
            value={postTags}
            onChange={(e) => setPostTags(e.target.value)}
            placeholder="тег1, тег2, тег3 (через запятую)"
          />

          <Button
            className="w-full"
            onClick={handleCreatePost}
            loading={posting}
            disabled={!postTitle.trim()}
          >
            Опубликовать пост
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {loadingMyVideos ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : myVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myVideos.map((video) => (
                <div key={video.id} className="glass-card p-4 flex gap-4 border border-border/40 rounded-2xl relative group/card">
                  {/* Thumbnail / Preview */}
                  <div className="relative w-24 h-36 rounded-xl overflow-hidden bg-black flex-shrink-0">
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : video.video_url === "text-post" ? (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <Play className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info & Stats */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm truncate">{video.title}</h4>
                      {video.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
                      )}
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-primary" />
                        <span>{video.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />
                        <span>{video.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-accent" />
                        <span>{video.comments_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="absolute top-4 right-4 p-2 rounded-xl border border-border/40 hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                <VideoIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Вы ещё ничего не опубликовали</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Перейдите во вкладку «Загрузить видео» и поделитесь своим первым контентом.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
