export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes("placeholder") &&
    !url.includes("your-project") &&
    !url.includes("YOUR_PROJECT_REF") &&
    !key.includes("placeholder") &&
    !key.includes("your-anon-key")
  );
}

export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;

  return "Supabase не настроен. Откройте /setup и следуйте инструкции по подключению базы данных.";
}
