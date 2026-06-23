import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, "like");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много запросов" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("video_likes")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("video_likes").delete().eq("id", existing.id);
    return NextResponse.json({ success: true, data: { liked: false } });
  }

  const { error } = await supabase.from("video_likes").insert({
    video_id: videoId,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { data: video } = await supabase
    .from("videos")
    .select("user_id, title")
    .eq("id", videoId)
    .single();

  if (video && video.user_id !== user.id) {
    const admin = createAdminClient();
    const { data: liker } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

    await admin.from("notifications").insert({
      user_id: video.user_id,
      type: "like",
      title: "Новый лайк",
      body: `${liker?.display_name} понравилось ваше видео "${video.title}"`,
      data: { video_id: videoId, user_id: user.id },
    });
  }

  return NextResponse.json({ success: true, data: { liked: true } });
}
