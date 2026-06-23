import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const parsed = searchSchema.safeParse({
    q: searchParams.get("q"),
    type: searchParams.get("type") || "all",
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { q, type, page, limit } = parsed.data;
  const offset = ((page || 1) - 1) * (limit || 20);
  const searchTerm = `%${q}%`;

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimit = await checkRateLimit(ip, "search");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много запросов" }, { status: 429 });
  }

  const results: {
    users: unknown[];
    channels: unknown[];
    groups: unknown[];
    videos: unknown[];
  } = { users: [], channels: [], groups: [], videos: [] };

  if (type === "all" || type === "users") {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
      .eq("is_banned", false)
      .range(offset, offset + (limit || 20) - 1);
    results.users = data || [];
  }

  if (type === "all" || type === "channels") {
    const { data } = await supabase
      .from("channels")
      .select("*, owner:profiles!channels_owner_id_fkey(*)")
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .eq("is_public", true)
      .range(offset, offset + (limit || 20) - 1);
    results.channels = data || [];
  }

  if (type === "all" || type === "groups") {
    const { data } = await supabase
      .from("groups")
      .select("*, owner:profiles!groups_owner_id_fkey(*)")
      .ilike("name", searchTerm)
      .eq("is_public", true)
      .range(offset, offset + (limit || 20) - 1);
    results.groups = data || [];
  }

  if (type === "all" || type === "videos") {
    const { data } = await supabase
      .from("videos")
      .select("*, profile:profiles!videos_user_id_fkey(*)")
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq("is_public", true)
      .range(offset, offset + (limit || 20) - 1);
    results.videos = data || [];
  }

  return NextResponse.json({ success: true, data: results });
}
