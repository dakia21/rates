import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(user.id, "upload");
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: "Слишком много загрузок" }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bucket = (formData.get("bucket") as string) || "videos";

  if (!file) {
    return NextResponse.json({ success: false, error: "Файл не найден" }, { status: 400 });
  }

  const allowedBuckets = ["avatars", "banners", "videos", "thumbnails", "messages", "voice"];
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ success: false, error: "Недопустимый bucket" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: bucket === "avatars" || bucket === "banners",
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    success: true,
    data: { url: publicUrl, path, bucket },
  });
}
