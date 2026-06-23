import { createAdminClient } from "@/lib/supabase/admin";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { maxRequests: 100, windowMs: 60_000 },
  auth: { maxRequests: 10, windowMs: 60_000 },
  upload: { maxRequests: 20, windowMs: 60_000 },
  message: { maxRequests: 60, windowMs: 60_000 },
  like: { maxRequests: 100, windowMs: 60_000 },
  search: { maxRequests: 30, windowMs: 60_000 },
};

const memoryStore = new Map<string, { count: number; windowStart: number }>();

export async function checkRateLimit(
  identifier: string,
  action: string = "api"
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = RATE_LIMITS[action] || RATE_LIMITS.api;
  const key = `${identifier}:${action}`;
  const now = Date.now();

  const memoryEntry = memoryStore.get(key);
  if (memoryEntry) {
    if (now - memoryEntry.windowStart > config.windowMs) {
      memoryStore.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
    }

    if (memoryEntry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: memoryEntry.windowStart + config.windowMs,
      };
    }

    memoryEntry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - memoryEntry.count,
      resetAt: memoryEntry.windowStart + config.windowMs,
    };
  }

  memoryStore.set(key, { count: 1, windowStart: now });

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("action", action)
      .single();

    if (data) {
      const windowStart = new Date(data.window_start).getTime();
      if (now - windowStart > config.windowMs) {
        await supabase
          .from("rate_limits")
          .update({ count: 1, window_start: new Date().toISOString() })
          .eq("id", data.id);
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
      }

      if (data.count >= config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: windowStart + config.windowMs };
      }

      await supabase
        .from("rate_limits")
        .update({ count: data.count + 1 })
        .eq("id", data.id);

      return {
        allowed: true,
        remaining: config.maxRequests - data.count - 1,
        resetAt: windowStart + config.windowMs,
      };
    }

    await supabase.from("rate_limits").insert({
      identifier,
      action,
      count: 1,
      window_start: new Date().toISOString(),
    });
  } catch {
    // Fallback to memory-only rate limiting
  }

  return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
}

export function getRateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetAt.toString(),
  };
}
