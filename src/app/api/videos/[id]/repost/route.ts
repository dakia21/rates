import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: existing } = await supabase
    .from("video_reposts")
    .select("id")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("video_reposts").delete().eq("id", existing.id);
    return NextResponse.json({ success: true, data: { reposted: false } });
  }

  const { error } = await supabase.from("video_reposts").insert({
    video_id: videoId,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { reposted: true } });
}
