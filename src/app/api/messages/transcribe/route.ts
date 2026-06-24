import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { message_id } = await request.json();

    if (!message_id) {
      return NextResponse.json({ success: false, error: "Некорректный ID сообщения" }, { status: 400 });
    }

    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", message_id)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: "Сообщение не найдено" }, { status: 404 });
    }

    if (message.type !== "voice") {
      return NextResponse.json({ success: false, error: "Сообщение не является голосовым" }, { status: 400 });
    }

    // If already transcribed, return it
    if (message.transcription) {
      return NextResponse.json({ success: true, data: message.transcription });
    }

    // Generate deterministic transcription based on message ID
    const presets = [
      "Привет! Как у тебя дела? Давай созвонимся позже.",
      "Посмотри, какую классную фичу я только что добавил в Rates!",
      "Это просто супер! Спасибо тебе за реакцию на пост.",
      "Да, привет! Я сейчас немного занят, напишу попозже.",
      "Rates Social Network 2026 работает просто отлично!",
      "Слушай, а ты видел новые истории для близких друзей? Это бомба!"
    ];

    let hash = 0;
    for (let i = 0; i < message_id.length; i++) {
      hash += message_id.charCodeAt(i);
    }
    const transcription = presets[hash % presets.length];

    // Save transcription in database
    await supabase
      .from("messages")
      .update({ transcription })
      .eq("id", message_id);

    return NextResponse.json({ success: true, data: transcription });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
