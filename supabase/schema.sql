-- Rates Social Network - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'file', 'voice');
CREATE TYPE chat_type AS ENUM ('private', 'group', 'channel');
CREATE TYPE group_role AS ENUM ('member', 'moderator', 'admin', 'owner');
CREATE TYPE notification_type AS ENUM ('message', 'like', 'comment', 'follow', 'repost', 'mention', 'system');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE report_type AS ENUM ('spam', 'harassment', 'inappropriate', 'copyright', 'other');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  banner_url TEXT,
  role user_role DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video likes
CREATE TABLE video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video comments
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video reposts
CREATE TABLE video_reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type chat_type NOT NULL DEFAULT 'private',
  name VARCHAR(100),
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat participants
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT FALSE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type message_type DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  duration INTEGER,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  banner_url TEXT,
  subscribers_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel subscribers
CREATE TABLE channel_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Channel posts
CREATE TABLE channel_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type message_type,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  members_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  reported_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  type report_type NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, action)
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_username_trgm ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_channels_username ON channels(username);
CREATE INDEX idx_channel_posts_channel ON channel_posts(channel_id);
CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_reports_status ON reports(status);

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update video like counts
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    UPDATE profiles SET likes_count = likes_count + 1 WHERE id = (SELECT user_id FROM videos WHERE id = NEW.video_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.video_id;
    UPDATE profiles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = (SELECT user_id FROM videos WHERE id = OLD.video_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update video comment counts
CREATE OR REPLACE FUNCTION update_video_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update video repost counts
CREATE OR REPLACE FUNCTION update_video_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET reposts_count = reposts_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update channel subscriber counts
CREATE OR REPLACE FUNCTION update_channel_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels SET subscribers_count = subscribers_count + 1 WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channels SET subscribers_count = GREATEST(subscribers_count - 1, 0) WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update group member counts
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update video count on profile
CREATE OR REPLACE FUNCTION update_profile_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET videos_count = videos_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET videos_count = GREATEST(videos_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_follow_change AFTER INSERT OR DELETE ON follows FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
CREATE TRIGGER on_video_like_change AFTER INSERT OR DELETE ON video_likes FOR EACH ROW EXECUTE FUNCTION update_video_like_count();
CREATE TRIGGER on_video_comment_change AFTER INSERT OR DELETE ON video_comments FOR EACH ROW EXECUTE FUNCTION update_video_comment_count();
CREATE TRIGGER on_video_repost_change AFTER INSERT OR DELETE ON video_reposts FOR EACH ROW EXECUTE FUNCTION update_video_repost_count();
CREATE TRIGGER on_channel_subscriber_change AFTER INSERT OR DELETE ON channel_subscribers FOR EACH ROW EXECUTE FUNCTION update_channel_subscriber_count();
CREATE TRIGGER on_group_member_change AFTER INSERT OR DELETE ON group_members FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
CREATE TRIGGER on_video_change AFTER INSERT OR DELETE ON videos FOR EACH ROW EXECUTE FUNCTION update_profile_video_count();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Videos policies
CREATE POLICY "Public videos are viewable by everyone" ON videos FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- Video likes policies
CREATE POLICY "Anyone can view likes" ON video_likes FOR SELECT USING (true);
CREATE POLICY "Users can like videos" ON video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike videos" ON video_likes FOR DELETE USING (auth.uid() = user_id);

-- Video comments policies
CREATE POLICY "Anyone can view comments" ON video_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON video_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON video_comments FOR DELETE USING (auth.uid() = user_id);

-- Video reposts policies
CREATE POLICY "Anyone can view reposts" ON video_reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON video_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can undo repost" ON video_reposts FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Helper function to check chat participation (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_uuid AND user_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Chats policies
CREATE POLICY "Participants can view chats" ON chats FOR SELECT USING (
  auth.uid() = created_by OR
  public.is_chat_participant(id, auth.uid())
);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Chat participants policies
CREATE POLICY "Participants can view members" ON chat_participants FOR SELECT USING (
  public.is_chat_participant(chat_id, auth.uid())
);
CREATE POLICY "Users can join chats" ON chat_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.chats WHERE id = chat_id AND created_by = auth.uid())
);

-- Messages policies
CREATE POLICY "Chat participants can view messages" ON messages FOR SELECT USING (
  public.is_chat_participant(chat_id, auth.uid())
);
CREATE POLICY "Chat participants can send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  public.is_chat_participant(chat_id, auth.uid())
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Channels policies
CREATE POLICY "Public channels viewable" ON channels FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "Users can create channels" ON channels FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update channels" ON channels FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete channels" ON channels FOR DELETE USING (auth.uid() = owner_id);

-- Channel subscribers policies
CREATE POLICY "Anyone can view subscribers" ON channel_subscribers FOR SELECT USING (true);
CREATE POLICY "Users can subscribe" ON channel_subscribers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsubscribe" ON channel_subscribers FOR DELETE USING (auth.uid() = user_id);

-- Channel posts policies
CREATE POLICY "Anyone can view channel posts" ON channel_posts FOR SELECT USING (true);
CREATE POLICY "Channel owners can post" ON channel_posts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (SELECT 1 FROM channels WHERE id = channel_id AND owner_id = auth.uid())
);
CREATE POLICY "Authors can update posts" ON channel_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete posts" ON channel_posts FOR DELETE USING (auth.uid() = author_id);

-- Groups policies
CREATE POLICY "Public groups viewable" ON groups FOR SELECT USING (
  is_public = true OR
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update groups" ON groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete groups" ON groups FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Members can view group members" ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('messages', 'messages', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voice', 'voice', true);

-- Storage policies
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
