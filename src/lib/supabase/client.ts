import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/_supabase`
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createBrowserClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
