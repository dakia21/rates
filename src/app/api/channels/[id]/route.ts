import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: channel, error } = await supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !channel) {
    return NextResponse.json({ success: false, error: "Канал не найден" }, { status: 404 });
  }

  const { data: posts } = await supabase
    .from("channel_posts")
    .select("*, author:profiles!channel_posts_author_id_fkey(*)")
    .eq("channel_id", id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  let isSubscribed = false;
  if (user) {
    const { data: sub } = await supabase
      .from("channel_subscribers")
      .select("id")
      .eq("channel_id", id)
      .eq("user_id", user.id)
      .single();
    isSubscribed = !!sub;
  }

  return NextResponse.json({
    success: true,
    data: { ...channel, is_subscribed: isSubscribed, posts: posts || [] },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "subscribe") {
    const { data: existing } = await supabase
      .from("channel_subscribers")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("channel_subscribers").delete().eq("id", existing.id);
      return NextResponse.json({ success: true, data: { subscribed: false } });
    }

    await supabase.from("channel_subscribers").insert({
      channel_id: channelId,
      user_id: user.id,
    });

    return NextResponse.json({ success: true, data: { subscribed: true } });
  }

  if (body.action === "post") {
    const { data: channel } = await supabase
      .from("channels")
      .select("owner_id")
      .eq("id", channelId)
      .single();

    if (!channel || channel.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: "Нет прав" }, { status: 403 });
    }

    const { data: post, error } = await supabase
      .from("channel_posts")
      .insert({
        channel_id: channelId,
        author_id: user.id,
        content: body.content || null,
        media_url: body.media_url || null,
        media_type: body.media_type || null,
        video_id: body.video_id || null,
        is_pinned: body.is_pinned || false,
      })
      .select("*, author:profiles!channel_posts_author_id_fkey(*)")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  }

  return NextResponse.json({ success: false, error: "Неизвестное действие" }, { status: 400 });
}
