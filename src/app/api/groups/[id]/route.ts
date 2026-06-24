import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: group, error } = await supabase
    .from("groups")
    .select("*, owner:profiles!groups_owner_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !group) {
    return NextResponse.json({ success: false, error: "Группа не найдена" }, { status: 404 });
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("*, profile:profiles(*)")
    .eq("group_id", id)
    .order("joined_at", { ascending: true });

  let userRole = null;
  let isMember = false;
  if (user) {
    const member = members?.find((m) => m.user_id === user.id);
    isMember = !!member;
    userRole = member?.role;
  }

  return NextResponse.json({
    success: true,
    data: { ...group, members: members || [], is_member: isMember, user_role: userRole },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "join") {
    const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();

    if (!group) {
      return NextResponse.json({ success: false, error: "Группа не найдена" }, { status: 404 });
    }

    if (group.members_count >= group.max_members) {
      return NextResponse.json({ success: false, error: "Группа переполнена" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: "Вы уже в группе" }, { status: 400 });
    }

    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member",
    });

    if (group.chat_id) {
      await supabase.from("chat_participants").insert({
        chat_id: group.chat_id,
        user_id: user.id,
      });
    }

    return NextResponse.json({ success: true, data: { joined: true } });
  }

  if (body.action === "leave") {
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .neq("role", "owner");

    const { data: group } = await supabase.from("groups").select("chat_id").eq("id", groupId).single();

    if (group?.chat_id) {
      await supabase
        .from("chat_participants")
        .delete()
        .eq("chat_id", group.chat_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true, data: { left: true } });
  }

  if (body.action === "update_role") {
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
      return NextResponse.json({ success: false, error: "Нет прав" }, { status: 403 });
    }

    await supabase
      .from("group_members")
      .update({ role: body.role })
      .eq("group_id", groupId)
      .eq("user_id", body.user_id);

    return NextResponse.json({ success: true });
  }

  if (body.action === "remove_member") {
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!myMembership || !["owner", "admin", "moderator"].includes(myMembership.role)) {
      return NextResponse.json({ success: false, error: "Нет прав" }, { status: 403 });
    }

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", body.user_id)
      .neq("role", "owner");

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Неизвестное действие" }, { status: 400 });
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

  const { data: group, error: fetchError } = await supabase
    .from("groups")
    .select("owner_id, chat_id")
    .eq("id", id)
    .single();

  if (fetchError || !group) {
    return NextResponse.json({ success: false, error: "Группа не найдена" }, { status: 404 });
  }

  if (group.owner_id !== user.id) {
    return NextResponse.json({ success: false, error: "Только владелец может удалить группу" }, { status: 403 });
  }

  // Delete associated chat if it exists (cascade will delete messages and participants)
  if (group.chat_id) {
    await supabase.from("chats").delete().eq("id", group.chat_id);
  }

  const { error: deleteError } = await supabase
    .from("groups")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Группа успешно удалена" });
}
