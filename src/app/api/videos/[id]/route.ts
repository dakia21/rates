import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("*, profile:profiles!videos_user_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !video) {
    return NextResponse.json({ success: false, error: "Видео не найдено" }, { status: 404 });
  }

  await supabase
    .from("videos")
    .update({ views_count: video.views_count + 1 })
    .eq("id", id);

  return NextResponse.json({ success: true, data: { ...video, views_count: video.views_count + 1 } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
