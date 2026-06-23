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
  const status = searchParams.get("status") || "pending";

  const adminClient = createAdminClient();

  const { data: reports, error } = await adminClient
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(*),
      reported_user:profiles!reports_reported_user_id_fkey(*)
    `)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: reports });
}

export async function PATCH(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const body = await request.json();
  const adminClient = createAdminClient();

  await adminClient
    .from("reports")
    .update({
      status: body.status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", body.report_id);

  if (body.status === "resolved" && body.ban_user && body.reported_user_id) {
    await adminClient
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", body.reported_user_id);
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_user_id: body.reported_user_id || null,
      reported_video_id: body.reported_video_id || null,
      reported_message_id: body.reported_message_id || null,
      type: body.type,
      reason: body.reason,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: report }, { status: 201 });
}
