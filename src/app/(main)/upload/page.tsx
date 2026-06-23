"use client";

import { useState, useRef } from "react";
import { Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getVideoDuration, generateThumbnail } from "@/lib/utils/upload";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

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
      toast("Видео опубликовано!", "success");
      router.push("/feed");
    } else {
      toast(data.error, "error");
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6" />
        Загрузить видео
      </h1>

      <Card className="space-y-6">
        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-rates-500/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-rates-500"
          >
            <Video className="w-12 h-12" />
            <span className="font-medium">Выберите видео</span>
            <span className="text-sm">MP4, WebM до 100MB</span>
          </button>
        ) : (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
            <video src={preview} controls className="w-full h-full object-contain" />
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
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
          placeholder="Название видео"
        />
        <Textarea
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание видео"
        />
        <Input
          label="Теги"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="тег1, тег2, тег3"
        />

        {uploading && (
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="gradient-bg h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleUpload}
          loading={uploading}
          disabled={!file || !title.trim()}
        >
          Опубликовать
        </Button>
      </Card>
    </div>
  );
}
