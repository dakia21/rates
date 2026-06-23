import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { data: participations } = await supabase
    .from("chat_participants")
    .select("chat_id, last_read_at")
    .eq("user_id", user.id);

  if (!participations?.length) {
    return NextResponse.json({ success: true, data: [] });
  }

  const chatIds = participations.map((p) => p.chat_id);

  const { data: chats, error } = await supabase
    .from("chats")
    .select(`
      *,
      participants:chat_participants(
        *,
        profile:profiles(*)
      )
    `)
    .in("id", chatIds)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const enrichedChats = await Promise.all(
    (chats || []).map(async (chat) => {
      const participation = participations.find((p) => p.chat_id === chat.id);

      const { data: lastMessage } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chat.id)
        .gt("created_at", participation?.last_read_at || "1970-01-01")
        .neq("sender_id", user.id);

      return {
        ...chat,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
      };
    })
  );

  return NextResponse.json({ success: true, data: enrichedChats });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { participant_id } = await request.json();

  if (!participant_id || participant_id === user.id) {
    return NextResponse.json({ success: false, error: "Некорректный участник" }, { status: 400 });
  }

  const { data: userChats } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", user.id);

  if (userChats?.length) {
    for (const uc of userChats) {
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("chat_id", uc.chat_id);

      if (
        participants?.length === 2 &&
        participants.some((p) => p.user_id === participant_id) &&
        participants.some((p) => p.user_id === user.id)
      ) {
        const { data: existingChat } = await supabase
          .from("chats")
          .select("*")
          .eq("id", uc.chat_id)
          .eq("type", "private")
          .single();

        if (existingChat) {
          return NextResponse.json({ success: true, data: existingChat });
        }
      }
    }
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({ type: "private", created_by: user.id })
    .select()
    .single();

  if (chatError) {
    return NextResponse.json({ success: false, error: chatError.message }, { status: 500 });
  }

  await supabase.from("chat_participants").insert([
    { chat_id: chat.id, user_id: user.id },
    { chat_id: chat.id, user_id: participant_id },
  ]);

  return NextResponse.json({ success: true, data: chat }, { status: 201 });
}
