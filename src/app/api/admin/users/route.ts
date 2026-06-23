import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) return null;

  return user;
}

export async function GET(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const adminClient = createAdminClient();

  const { data: users, count } = await adminClient
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ success: true, data: users, total: count });
}

export async function PATCH(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const body = await request.json();
  const adminClient = createAdminClient();

  if (body.action === "ban") {
    await adminClient
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", body.user_id);

    return NextResponse.json({ success: true });
  }

  if (body.action === "unban") {
    await adminClient
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", body.user_id);

    return NextResponse.json({ success: true });
  }

  if (body.action === "set_role") {
    await adminClient
      .from("profiles")
      .update({ role: body.role })
      .eq("id", body.user_id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Неизвестное действие" }, { status: 400 });
}
