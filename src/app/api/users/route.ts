import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ success: false, error: "username обязателен" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single();
    isFollowing = !!follow;
  }

  return NextResponse.json({
    success: true,
    data: {
      profile,
      videos: videos || [],
      is_following: isFollowing,
      is_own: user?.id === profile.id,
    },
  });
}
