import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { user_id } = await request.json();

  if (!user_id || user_id === user.id) {
    return NextResponse.json({ success: false, error: "Некорректный пользователь" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", user_id)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return NextResponse.json({ success: true, data: { following: false } });
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: user_id,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: follower } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

  await admin.from("notifications").insert({
    user_id,
    type: "follow",
    title: "Новый подписчик",
    body: `${follower?.display_name} подписался на вас`,
    data: { user_id: user.id },
  });

  return NextResponse.json({ success: true, data: { following: true } });
}
