import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { message_id, emoji } = await request.json();

    if (!message_id || !emoji) {
      return NextResponse.json({ success: false, error: "Некорректные параметры" }, { status: 400 });
    }

    // Verify message exists and user is participant in the chat
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("chat_id")
      .eq("id", message_id)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: "Сообщение не найдено" }, { status: 404 });
    }

    const { data: participant, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", message.chat_id)
      .eq("user_id", user.id)
      .single();

    if (partError || !participant) {
      return NextResponse.json({ success: false, error: "Нет доступа к этому чату" }, { status: 403 });
    }

    // Check if this reaction already exists
    const { data: existing } = await supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", message_id)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single();

    if (existing) {
      // Toggle off: delete
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", message_id)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      // Toggle on: insert (first delete any other reaction by this user on this message, if we want 1 reaction max per user, or keep it to allow multiple)
      // Usually, 1 reaction max per user is clean and fits typical chat behavior. Let's delete other reactions by this user on this message.
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", message_id)
        .eq("user_id", user.id);

      await supabase
        .from("message_reactions")
        .insert({
          message_id,
          user_id: user.id,
          emoji,
        });
    }

    // Fetch updated reactions
    const { data: reactions, error: fetchError } = await supabase
      .from("message_reactions")
      .select("id, message_id, user_id, emoji")
      .eq("message_id", message_id);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: reactions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
