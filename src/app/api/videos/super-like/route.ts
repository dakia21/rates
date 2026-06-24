import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { video_id } = await request.json();

    if (!video_id) {
      return NextResponse.json({ success: false, error: "Некорректный ID видео" }, { status: 400 });
    }

    // Get profile to check super like limit
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("last_super_like_at")
      .eq("id", user.id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ success: false, error: "Профиль не найден" }, { status: 404 });
    }

    // Check strict 24-hour limit
    if (profile.last_super_like_at) {
      const lastSuperLike = new Date(profile.last_super_like_at).getTime();
      const diffHours = (Date.now() - lastSuperLike) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return NextResponse.json({
          success: false,
          error: `Вы уже использовали Супер-лайк сегодня. Пожалуйста, подождите еще ${Math.ceil(24 - diffHours)} ч.`,
        }, { status: 400 });
      }
    }

    // Check if user already liked the video
    const { data: existingLike } = await supabase
      .from("video_likes")
      .select("id, is_super_like")
      .eq("video_id", video_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingLike) {
      // 1. Insert new super like
      const { error: insertError } = await supabase
        .from("video_likes")
        .insert({
          video_id,
          user_id: user.id,
          is_super_like: true,
        });

      if (insertError) throw insertError;

      // 2. Increment video likes count
      const { data: video } = await supabase
        .from("videos")
        .select("likes_count")
        .eq("id", video_id)
        .single();

      await supabase
        .from("videos")
        .update({ likes_count: (video?.likes_count || 0) + 1 })
        .eq("id", video_id);
    } else if (!existingLike.is_super_like) {
      // 1. Upgrade existing like to super like
      const { error: updateLikeError } = await supabase
        .from("video_likes")
        .update({ is_super_like: true })
        .eq("id", existingLike.id);

      if (updateLikeError) throw updateLikeError;
    } else {
      return NextResponse.json({ success: false, error: "Вы уже поставили Супер-лайк этому видео" }, { status: 400 });
    }

    // Update profile's last_super_like_at
    const { error: updateProfError } = await supabase
      .from("profiles")
      .update({
        last_super_like_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateProfError) throw updateProfError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
