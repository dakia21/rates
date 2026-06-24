import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ success: false, error: "username обязателен" }, { status: 400 });
  }

  try {
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    const { data: highlights, error } = await supabase
      .from("story_highlights")
      .select(`
        *,
        items:story_highlight_items(
          *,
          story:stories(*)
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: highlights });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, cover_url, story_ids } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Название обязательно" }, { status: 400 });
    }

    if (!story_ids || !Array.isArray(story_ids) || story_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Выберите хотя бы одну историю" }, { status: 400 });
    }

    // Create highlight folder
    const { data: highlight, error: highlightError } = await supabase
      .from("story_highlights")
      .insert({
        user_id: user.id,
        title: title.trim(),
        cover_url: cover_url || null,
      })
      .select()
      .single();

    if (highlightError) throw highlightError;

    // Add stories to highlight folder
    const itemsToInsert = story_ids.map((storyId: string) => ({
      highlight_id: highlight.id,
      story_id: storyId,
    }));

    const { error: itemsError } = await supabase
      .from("story_highlight_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, data: highlight }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
