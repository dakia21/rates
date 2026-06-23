import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { registerSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "База данных не подключена. Настройте Supabase — инструкция: /setup",
      },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimit = await checkRateLimit(ip, "auth");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много попыток. Подождите минуту." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { email, password, username, displayName } = parsed.data;

  try {
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: "Имя пользователя уже занято" }, { status: 400 });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName }
    });

    if (error) {
      const message =
        error.message.includes("fetch") || error.message.includes("ENOTFOUND")
          ? "Не удалось подключиться к Supabase. Проверьте URL и ключи в .env.local"
          : error.message;
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ success: false, error: "Не удалось создать пользователя" }, { status: 500 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        username,
        display_name: displayName,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Аккаунт создан! Войдите под своим именем пользователя.",
      hasSession: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка сервера";
    return NextResponse.json(
      {
        success: false,
        error: message.includes("fetch") || message.includes("Invalid API key")
          ? "Неверные ключи Supabase. Проверьте .env.local (инструкция: /setup)"
          : message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isSupabaseConfigured(),
  });
}
