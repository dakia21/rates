import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  // Load who has this user in their Close Friends list
  const allowedAuthors = new Set<string>();
  if (user) {
    const { data: closeFriendOf } = await supabase
      .from("close_friends")
      .select("user_id")
      .eq("friend_id", user.id);
    if (closeFriendOf) {
      closeFriendOf.forEach((item: any) => allowedAuthors.add(item.user_id));
    }
    allowedAuthors.add(user.id); // User can see their own close friends stories
  }

  // Fetch all stories where expires_at is greater than current time
  const { data: stories, error } = await supabase
    .from("stories")
    .select("*, profile:profiles(*)")
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Filter out close friends stories that this user doesn't have permission to see
  const filteredStories = (stories || []).filter((story: any) => {
    if (!story.is_close_friends) return true;
    if (!user) return false;
    return allowedAuthors.has(story.user_id);
  });

  // Map to the Story interface
  const formattedStories = filteredStories.map((story: any) => ({
    id: story.id,
    user_id: story.user_id,
    username: story.profile?.username || "unknown",
    displayName: story.profile?.display_name || "Unknown User",
    avatarUrl: story.profile?.avatar_url || "",
    mediaUrl: story.media_url,
    caption: story.caption || "",
    created_at: story.created_at,
    expires_at: story.expires_at,
    is_close_friends: story.is_close_friends,
    sticker_type: story.sticker_type,
    sticker_data: story.sticker_data,
  }));

  return NextResponse.json({
    success: true,
    data: formattedStories,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, "upload");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много запросов" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { media_url, caption, expires_in, is_close_friends, sticker_type, sticker_data } = body;

    if (!media_url) {
      return NextResponse.json({ success: false, error: "URL медиафайла обязателен" }, { status: 400 });
    }

    // Calculate expires_at
    let durationMs = 24 * 60 * 60 * 1000; // default 24h
    if (expires_in === "1m") durationMs = 1 * 60 * 1000;
    else if (expires_in === "1h") durationMs = 1 * 60 * 60 * 1000;
    else if (expires_in === "12h") durationMs = 12 * 60 * 60 * 1000;
    else if (expires_in === "24h") durationMs = 24 * 60 * 60 * 1000;
    else if (expires_in === "3d") durationMs = 3 * 24 * 60 * 60 * 1000;
    else if (expires_in === "7d") durationMs = 7 * 24 * 60 * 60 * 1000;

    const expires_at = new Date(Date.now() + durationMs).toISOString();

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        media_url,
        caption: caption || "",
        expires_at,
        is_close_friends: is_close_friends || false,
        sticker_type: sticker_type || null,
        sticker_data: sticker_data || null,
      })
      .select("*, profile:profiles(*)")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formattedStory = {
      id: story.id,
      user_id: story.user_id,
      username: story.profile?.username || user.email?.split("@")[0] || "user",
      displayName: story.profile?.display_name || "User",
      avatarUrl: story.profile?.avatar_url || "",
      mediaUrl: story.media_url,
      caption: story.caption || "",
      created_at: story.created_at,
      expires_at: story.expires_at,
      is_close_friends: story.is_close_friends,
      sticker_type: story.sticker_type,
      sticker_data: story.sticker_data,
    };

    return NextResponse.json({ success: true, data: formattedStory }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
