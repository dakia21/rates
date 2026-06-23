import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groupSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: groups, count, error } = await supabase
    .from("groups")
    .select("*, owner:profiles!groups_owner_id_fkey(*)", { count: "exact" })
    .eq("is_public", true)
    .order("members_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let enriched = groups || [];

  if (user && enriched.length > 0) {
    const groupIds = enriched.map((g) => g.id);
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", user.id)
      .in("group_id", groupIds);

    const memberMap = new Map(members?.map((m) => [m.group_id, m.role]));
    enriched = enriched.map((g) => ({
      ...g,
      is_member: memberMap.has(g.id),
      user_role: memberMap.get(g.id),
    }));
  }

  return NextResponse.json({ success: true, data: enriched, total: count });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = groupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: chat } = await supabase
    .from("chats")
    .insert({ type: "group", name: parsed.data.name, created_by: user.id })
    .select()
    .single();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || "",
      owner_id: user.id,
      chat_id: chat?.id,
      is_public: parsed.data.is_public ?? true,
      max_members: parsed.data.max_members || 200,
    })
    .select("*, owner:profiles!groups_owner_id_fkey(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  if (chat) {
    await supabase.from("chat_participants").insert({
      chat_id: chat.id,
      user_id: user.id,
    });
  }

  return NextResponse.json({ success: true, data: group }, { status: 201 });
}
