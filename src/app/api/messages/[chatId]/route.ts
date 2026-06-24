import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validations/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { data: participant } = await supabase
    .from("chat_participants")
    .select("id")
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const before = searchParams.get("before");

  let query = supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(*), reactions:message_reactions(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const [{ data: messages, error }, { data: chat }] = await Promise.all([
    query,
    supabase
      .from("chats")
      .select("*, participants:chat_participants(*, profile:profiles(*))")
      .eq("id", chatId)
      .single(),
  ]);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase
    .from("chat_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .eq("user_id", user.id);

  return NextResponse.json({
    success: true,
    data: {
      chat,
      messages: (messages || []).reverse(),
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, "message");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много сообщений" }, { status: 429 });
  }

  const { data: participant } = await supabase
    .from("chat_participants")
    .select("id")
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { content, type, reply_to_id } = parsed.data;

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: user.id,
      type: type || "text",
      content: content || null,
      media_url: body.media_url || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
      duration: body.duration || null,
      reply_to_id: reply_to_id || null,
    })
    .select("*, sender:profiles!messages_sender_id_fkey(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase
    .from("chats")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", chatId);

  const { data: otherParticipants } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId)
    .neq("user_id", user.id);

  if (otherParticipants?.length) {
    const admin = createAdminClient();
    const { data: sender } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

    for (const p of otherParticipants) {
      await admin.from("notifications").insert({
        user_id: p.user_id,
        type: "message",
        title: "Новое сообщение",
        body: `${sender?.display_name}: ${content || "Медиафайл"}`,
        data: { chat_id: chatId, message_id: message.id },
      });
    }
  }

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
