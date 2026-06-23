import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signToken } from "@/lib/auth/jwt";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user.id)
    .single();

  const token = await signToken({
    sub: user.id,
    username: profile?.username || "user",
    role: profile?.role || "user",
  });

  return NextResponse.json({ success: true, data: { token } });
}
