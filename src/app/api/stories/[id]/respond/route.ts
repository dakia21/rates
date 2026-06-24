import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { response } = await request.json();

    if (!response || response.trim() === "") {
      return NextResponse.json({ success: false, error: "Ответ не может быть пустым" }, { status: 400 });
    }

    // Save or update response
    const { error } = await supabase
      .from("story_sticker_responses")
      .upsert(
        {
          story_id: id,
          user_id: user.id,
          response: response.trim(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "story_id,user_id" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
