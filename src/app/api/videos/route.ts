import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { videoSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const userId = searchParams.get("user_id");
  const offset = (page - 1) * limit;

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("videos")
    .select("*, profile:profiles!videos_user_id_fkey(*)", { count: "exact" })
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = supabase
      .from("videos")
      .select("*, profile:profiles!videos_user_id_fkey(*)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
  }

  const { data: videos, count, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let enrichedVideos = videos || [];

  if (user && enrichedVideos.length > 0) {
    const videoIds = enrichedVideos.map((v) => v.id);
    const authorIds = enrichedVideos.map((v) => v.user_id);

    const [{ data: likes }, { data: reposts }, { data: follows }] = await Promise.all([
      supabase.from("video_likes").select("video_id").eq("user_id", user.id).in("video_id", videoIds),
      supabase.from("video_reposts").select("video_id").eq("user_id", user.id).in("video_id", videoIds),
      supabase.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", authorIds),
    ]);

    const likedSet = new Set(likes?.map((l) => l.video_id));
    const repostedSet = new Set(reposts?.map((r) => r.video_id));
    const followingSet = new Set(follows?.map((f) => f.following_id));

    enrichedVideos = enrichedVideos.map((v) => ({
      ...v,
      is_liked: likedSet.has(v.id),
      is_reposted: repostedSet.has(v.id),
      is_following: followingSet.has(v.user_id),
    }));
  }

  return NextResponse.json({
    success: true,
    data: enrichedVideos,
    total: count,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
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
    return NextResponse.json(
      { success: false, error: "Слишком много запросов" },
      { status: 429, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt) }
    );
  }

  const body = await request.json();
  const parsed = videoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { title, description, tags, is_public } = parsed.data;

  if (!body.video_url) {
    return NextResponse.json({ success: false, error: "video_url обязателен" }, { status: 400 });
  }

  const { data: video, error } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title,
      description: description || "",
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url || null,
      duration: body.duration || 0,
      tags: tags || [],
      is_public: is_public ?? true,
    })
    .select("*, profile:profiles!videos_user_id_fkey(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: video }, { status: 201 });
}
