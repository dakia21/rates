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

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const [
    { count: usersCount },
    { count: videosCount },
    { count: reportsCount },
    { count: bannedCount },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("videos").select("*", { count: "exact", head: true }),
    adminClient.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
  ]);

  const { data: recentVideos } = await adminClient
    .from("videos")
    .select("*, profile:profiles!videos_user_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        users: usersCount || 0,
        videos: videosCount || 0,
        pendingReports: reportsCount || 0,
        bannedUsers: bannedCount || 0,
      },
      recentVideos: recentVideos || [],
    },
  });
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Нет доступа" }, { status: 403 });
  }

  const { video_id } = await request.json();
  const adminClient = createAdminClient();

  await adminClient.from("videos").delete().eq("id", video_id);

  return NextResponse.json({ success: true });
}
