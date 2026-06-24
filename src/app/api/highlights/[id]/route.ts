import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: highlight, error } = await supabase
      .from("story_highlights")
      .select(`
        *,
        items:story_highlight_items(
          *,
          story:stories(
            *,
            profile:profiles(*)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !highlight) {
      return NextResponse.json({ success: false, error: "Альбом не найден" }, { status: 404 });
    }

    // Format highlight items to match the Story format
    const formattedStories = (highlight.items || [])
      .map((item: any) => {
        const story = item.story;
        if (!story) return null;
        return {
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
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        ...highlight,
        stories: formattedStories,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
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

  try {
    const { error } = await supabase
      .from("story_highlights")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
