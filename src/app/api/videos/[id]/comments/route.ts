import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validations/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("video_comments")
    .select("*, profile:profiles!video_comments_user_id_fkey(*)")
    .eq("video_id", videoId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: comments });
}

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

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from("video_comments")
    .insert({
      video_id: videoId,
      user_id: user.id,
      content: parsed.data.content,
      parent_id: parsed.data.parent_id || null,
    })
    .select("*, profile:profiles!video_comments_user_id_fkey(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: comment }, { status: 201 });
}
