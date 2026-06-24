-- SQL migration for all new features (Reactions, Close Friends, Viewers, Expiry, Highlights, Persistent Message Reactions, Collabs, Stickers, Super Likes, Themes, Profile Music)

-- 0. Ensure stories table exists
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories policies (checking if they exist by dropping first or using safety checks)
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
CREATE POLICY "Stories are viewable by everyone" 
  ON public.stories 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can create stories" ON public.stories;
CREATE POLICY "Users can create stories" 
  ON public.stories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" 
  ON public.stories 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 1. Expiry, Close Friends, and Stickers support on Stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_close_friends BOOLEAN DEFAULT FALSE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS sticker_type VARCHAR(50);
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS sticker_data JSONB;

-- Set default expires_at for existing rows to 24 hours after creation
UPDATE public.stories SET expires_at = created_at + INTERVAL '24 hours' WHERE expires_at IS NULL;
ALTER TABLE public.stories ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE public.stories ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- 2. Collabs support on Videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS co_author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Super Likes and Profile Personalization support on Profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_accent VARCHAR(50) DEFAULT 'purple';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_music_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_music_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_music_artist TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_super_like_at TIMESTAMPTZ;

-- 4. Super Likes support on Video Likes table
ALTER TABLE public.video_likes ADD COLUMN IF NOT EXISTS is_super_like BOOLEAN DEFAULT FALSE;

-- 5. Close Friends table
CREATE TABLE IF NOT EXISTS public.close_friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable Row Level Security (RLS) on close_friends
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Close Friends policies
DROP POLICY IF EXISTS "Users can view their own close friends list" ON public.close_friends;
CREATE POLICY "Users can view their own close friends list"
  ON public.close_friends
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add close friends" ON public.close_friends;
CREATE POLICY "Users can add close friends"
  ON public.close_friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove close friends" ON public.close_friends;
CREATE POLICY "Users can remove close friends"
  ON public.close_friends
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Story Views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Story Views policies
DROP POLICY IF EXISTS "Story authors and viewers can view story views" ON public.story_views;
CREATE POLICY "Story authors and viewers can view story views"
  ON public.story_views
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT user_id FROM public.stories WHERE id = story_id)
  );

DROP POLICY IF EXISTS "Users can register a story view" ON public.story_views;
CREATE POLICY "Users can register a story view"
  ON public.story_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Story Highlights table
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on story_highlights
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

-- Story Highlights policies
DROP POLICY IF EXISTS "Anyone can view story highlights" ON public.story_highlights;
CREATE POLICY "Anyone can view story highlights"
  ON public.story_highlights
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own story highlights" ON public.story_highlights;
CREATE POLICY "Users can create their own story highlights"
  ON public.story_highlights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own story highlights" ON public.story_highlights;
CREATE POLICY "Users can update their own story highlights"
  ON public.story_highlights
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story highlights" ON public.story_highlights;
CREATE POLICY "Users can delete their own story highlights"
  ON public.story_highlights
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Story Highlight Items table
CREATE TABLE IF NOT EXISTS public.story_highlight_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);

-- Enable RLS on story_highlight_items
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Story Highlight Items policies
DROP POLICY IF EXISTS "Anyone can view story highlight items" ON public.story_highlight_items;
CREATE POLICY "Anyone can view story highlight items"
  ON public.story_highlight_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add items to their highlights" ON public.story_highlight_items;
CREATE POLICY "Users can add items to their highlights"
  ON public.story_highlight_items
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.story_highlights WHERE id = highlight_id)
  );

DROP POLICY IF EXISTS "Users can remove items from their highlights" ON public.story_highlight_items;
CREATE POLICY "Users can remove items from their highlights"
  ON public.story_highlight_items
  FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM public.story_highlights WHERE id = highlight_id)
  );

-- 9. Story Sticker Responses table
CREATE TABLE IF NOT EXISTS public.story_sticker_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS on story_sticker_responses
ALTER TABLE public.story_sticker_responses ENABLE ROW LEVEL SECURITY;

-- Story Sticker Responses policies
DROP POLICY IF EXISTS "Anyone can view sticker responses" ON public.story_sticker_responses;
CREATE POLICY "Anyone can view sticker responses"
  ON public.story_sticker_responses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can submit sticker responses" ON public.story_sticker_responses;
CREATE POLICY "Users can submit sticker responses"
  ON public.story_sticker_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. Message Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Message Reactions policies
DROP POLICY IF EXISTS "Anyone in the chat can view message reactions" ON public.message_reactions;
CREATE POLICY "Anyone in the chat can view message reactions"
  ON public.message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      JOIN public.messages m ON m.chat_id = cp.chat_id
      WHERE m.id = message_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add reaction to messages" ON public.message_reactions;
CREATE POLICY "Users can add reaction to messages"
  ON public.message_reactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants cp
      JOIN public.messages m ON m.chat_id = cp.chat_id
      WHERE m.id = message_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove reaction from messages" ON public.message_reactions;
CREATE POLICY "Users can remove reaction from messages"
  ON public.message_reactions
  FOR DELETE
  USING (
    auth.uid() = user_id
  );
