import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    // Fetch the story to find out the owner
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("user_id")
      .eq("id", id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ success: false, error: "История не найдена" }, { status: 404 });
    }

    const isOwner = story.user_id === user.id;

    // Fetch sticker responses (publicly accessible so we can compute percentages/display answers)
    const { data: responses, error: respError } = await supabase
      .from("story_sticker_responses")
      .select("*, profile:profiles(*)")
      .eq("story_id", id);

    if (respError) throw respError;

    if (isOwner) {
      // Owner gets the list of viewers and sticker responses
      const { data: views, error: viewsError } = await supabase
        .from("story_views")
        .select("*, profile:profiles(*)")
        .eq("story_id", id);

      if (viewsError) throw viewsError;

      const viewersList = (views || []).map((v: any) => v.profile).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: {
          is_owner: true,
          viewers: viewersList,
          sticker_responses: responses || [],
        },
      });
    } else {
      // General user only gets sticker responses and viewers count
      const { count: viewersCount, error: countError } = await supabase
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .eq("story_id", id);

      if (countError) throw countError;

      return NextResponse.json({
        success: true,
        data: {
          is_owner: false,
          viewers_count: viewersCount || 0,
          sticker_responses: responses || [],
        },
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    // Insert view record (ignore unique constraint error)
    const { error } = await supabase
      .from("story_views")
      .insert({
        story_id: id,
        user_id: user.id,
      });

    if (error && error.code !== "23505") {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
