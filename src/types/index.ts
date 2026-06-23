export type UserRole = "user" | "moderator" | "admin";
export type MessageType = "text" | "image" | "video" | "file" | "voice";
export type ChatType = "private" | "group" | "channel";
export type GroupRole = "member" | "moderator" | "admin" | "owner";
export type NotificationType =
  | "message"
  | "like"
  | "comment"
  | "follow"
  | "repost"
  | "mention"
  | "system";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type ReportType =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "copyright"
  | "other";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  role: UserRole;
  is_verified: boolean;
  is_banned: boolean;
  followers_count: number;
  following_count: number;
  likes_count: number;
  videos_count: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  profile?: Profile;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_following?: boolean;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  is_muted: boolean;
  last_read_at: string;
  joined_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  media_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duration: number | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  reply_to?: Message;
}

export interface Channel {
  id: string;
  owner_id: string;
  name: string;
  username: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  subscribers_count: number;
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  is_subscribed?: boolean;
}

export interface ChannelPost {
  id: string;
  channel_id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  media_type: MessageType | null;
  video_id: string | null;
  is_pinned: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  video?: Video;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  chat_id: string | null;
  members_count: number;
  is_public: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  is_member?: boolean;
  user_role?: GroupRole;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_video_id: string | null;
  reported_message_id: string | null;
  type: ReportType;
  reason: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter?: Profile;
  reported_user?: Profile;
}

export interface SearchResults {
  users: Profile[];
  channels: Channel[];
  groups: Group[];
  videos: Video[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SocketEvents {
  "user:online": { userId: string };
  "user:offline": { userId: string };
  "typing:start": { chatId: string; userId: string; username: string };
  "typing:stop": { chatId: string; userId: string };
  "message:new": Message;
  "message:edit": Message;
  "message:delete": { messageId: string; chatId: string };
  "notification:new": Notification;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string; display_name: string };
        Update: Partial<Profile>;
      };
      videos: {
        Row: Video;
        Insert: Omit<Video, "id" | "created_at" | "updated_at" | "views_count" | "likes_count" | "comments_count" | "reposts_count">;
        Update: Partial<Video>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at" | "updated_at" | "is_edited" | "is_pinned">;
        Update: Partial<Message>;
      };
      channels: {
        Row: Channel;
        Insert: Omit<Channel, "id" | "created_at" | "updated_at" | "subscribers_count" | "is_verified">;
        Update: Partial<Channel>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "id" | "created_at" | "updated_at" | "members_count" | "chat_id">;
        Update: Partial<Group>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "is_read">;
        Update: Partial<Notification>;
      };
    };
  };
}
