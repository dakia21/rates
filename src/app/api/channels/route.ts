import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { channelSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: channels, count, error } = await supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey(*)", { count: "exact" })
    .eq("is_public", true)
    .order("subscribers_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let enriched = channels || [];

  if (user && enriched.length > 0) {
    const channelIds = enriched.map((c) => c.id);
    const { data: subs } = await supabase
      .from("channel_subscribers")
      .select("channel_id")
      .eq("user_id", user.id)
      .in("channel_id", channelIds);

    const subSet = new Set(subs?.map((s) => s.channel_id));
    enriched = enriched.map((c) => ({ ...c, is_subscribed: subSet.has(c.id) }));
  }

  return NextResponse.json({ success: true, data: enriched, total: count, hasMore: (count || 0) > offset + limit });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = channelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("username", parsed.data.username)
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: "Имя канала занято" }, { status: 400 });
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      username: parsed.data.username,
      description: parsed.data.description || "",
      is_public: parsed.data.is_public ?? true,
    })
    .select("*, owner:profiles!channels_owner_id_fkey(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("channel_subscribers").insert({
    channel_id: channel.id,
    user_id: user.id,
  });

  return NextResponse.json({ success: true, data: channel }, { status: 201 });
}
