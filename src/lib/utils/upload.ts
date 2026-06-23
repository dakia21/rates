import { createClient } from "@/lib/supabase/client";

export type StorageBucket =
  | "avatars"
  | "banners"
  | "videos"
  | "thumbnails"
  | "messages"
  | "voice";

const BUCKET_CONFIG: Record<StorageBucket, { maxSize: number; allowedTypes: string[] }> = {
  avatars: { maxSize: 5 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
  banners: { maxSize: 10 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
  videos: { maxSize: 100 * 1024 * 1024, allowedTypes: ["video/mp4", "video/webm", "video/quicktime"] },
  thumbnails: { maxSize: 5 * 1024 * 1024, allowedTypes: ["image/jpeg", "image/png", "image/webp"] },
  messages: {
    maxSize: 50 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf", "application/zip"],
  },
  voice: { maxSize: 10 * 1024 * 1024, allowedTypes: ["audio/webm", "audio/ogg", "audio/mpeg", "audio/wav"] },
};

export function validateFile(file: File, bucket: StorageBucket): string | null {
  const config = BUCKET_CONFIG[bucket];

  if (file.size > config.maxSize) {
    return `Файл слишком большой. Максимум: ${Math.round(config.maxSize / 1024 / 1024)}MB`;
  }

  if (!config.allowedTypes.includes(file.type)) {
    return "Неподдерживаемый тип файла";
  }

  return null;
}

export async function uploadFile(
  file: File,
  bucket: StorageBucket,
  userId: string,
  fileName?: string
): Promise<{ url: string; path: string } | { error: string }> {
  const validationError = validateFile(file, bucket);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${fileName || `${Date.now()}.${ext}`}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: bucket === "avatars" || bucket === "banners",
  });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

export function generateThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        window.URL.revokeObjectURL(video.src);
        resolve(blob);
      }, "image/jpeg", 0.8);
    };
    video.onerror = () => resolve(null);
    video.src = URL.createObjectURL(file);
  });
}
