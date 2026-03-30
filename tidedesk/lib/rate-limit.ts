/**
 * Rate limiters for public/auth APIs.
 * Only active when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * and @upstash/ratelimit + @upstash/redis are installed.
 * Without Upstash, returns null and rate limiting is skipped.
 */
async function createSlidingWindowRateLimiter(
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
): Promise<{ limit: (id: string) => Promise<{ success: boolean }> } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit" as string);
    const { Redis } = await import("@upstash/redis" as string);
    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
    });
  } catch {
    return null;
  }
}

let publicRateLimiterPromise:
  | Promise<{ limit: (id: string) => Promise<{ success: boolean }> } | null>
  | undefined =
  undefined;
let authRateLimiterPromise:
  | Promise<{ limit: (id: string) => Promise<{ success: boolean }> } | null>
  | undefined =
  undefined;

export async function getPublicApiRateLimiter(): Promise<{
  limit: (id: string) => Promise<{ success: boolean }>;
} | null> {
  if (publicRateLimiterPromise === undefined) {
    publicRateLimiterPromise = createSlidingWindowRateLimiter(30, "1 m");
  }
  return publicRateLimiterPromise;
}

export async function getAuthRateLimiter(): Promise<{
  limit: (id: string) => Promise<{ success: boolean }>;
} | null> {
  if (authRateLimiterPromise === undefined) {
    authRateLimiterPromise = createSlidingWindowRateLimiter(10, "1 m");
  }
  return authRateLimiterPromise;
}

export function getRequestIdentifier(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function checkRateLimit(
  identifier: string
): Promise<{ ok: true } | { ok: false; res: Response }> {
  const limiter = await getPublicApiRateLimiter();
  if (!limiter) return { ok: true };

  const result = await limiter.limit(identifier);
  if (result.success) return { ok: true };
  return {
    ok: false,
    res: Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    ),
  };
}
