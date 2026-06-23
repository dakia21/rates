import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .regex(/[A-Z]/, "Нужна хотя бы одна заглавная буква")
    .regex(/[0-9]/, "Нужна хотя бы одна цифра"),
  username: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(30, "Максимум 30 символов")
    .regex(/^[a-zA-Z0-9_]+$/, "Только буквы, цифры и _"),
  displayName: z.string().min(1, "Обязательное поле").max(100, "Максимум 100 символов"),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

export const videoSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  is_public: z.boolean().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Введите комментарий").max(1000),
  parent_id: z.string().uuid().optional(),
});

export const messageSchema = z.object({
  content: z.string().max(5000).optional(),
  type: z.enum(["text", "image", "video", "file", "voice"]).default("text"),
  reply_to_id: z.string().uuid().optional(),
});

export const channelSchema = z.object({
  name: z.string().min(1, "Введите название").max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Только буквы, цифры и _"),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(1, "Введите название").max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().optional(),
  max_members: z.number().min(2).max(1000).optional(),
});

export const reportSchema = z.object({
  type: z.enum(["spam", "harassment", "inappropriate", "copyright", "other"]),
  reason: z.string().min(10, "Минимум 10 символов").max(1000),
  reported_user_id: z.string().uuid().optional(),
  reported_video_id: z.string().uuid().optional(),
  reported_message_id: z.string().uuid().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1, "Введите запрос").max(100),
  type: z.enum(["all", "users", "channels", "groups", "videos"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ChannelInput = z.infer<typeof channelSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
