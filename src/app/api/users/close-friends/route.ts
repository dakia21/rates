import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("close_friends")
      .select("*, friend:profiles(*)")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const friendsList = (data || []).map((cf: any) => cf.friend).filter(Boolean);

    return NextResponse.json({ success: true, data: friendsList });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { friend_id } = await request.json();

    if (!friend_id || friend_id === user.id) {
      return NextResponse.json({ success: false, error: "Некорректный ID друга" }, { status: 400 });
    }

    const { data: existing, error: existError } = await supabase
      .from("close_friends")
      .select("id")
      .eq("user_id", user.id)
      .eq("friend_id", friend_id)
      .maybeSingle();

    if (existing) {
      // Remove
      const { error: deleteError } = await supabase
        .from("close_friends")
        .delete()
        .eq("user_id", user.id)
        .eq("friend_id", friend_id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true, data: { added: false } });
    } else {
      // Add
      const { error: insertError } = await supabase
        .from("close_friends")
        .insert({
          user_id: user.id,
          friend_id,
        });

      if (insertError) throw insertError;
      return NextResponse.json({ success: true, data: { added: true } });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
