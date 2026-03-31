import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAuthRateLimiter,
  getPublicApiRateLimiter,
  getRequestIdentifier,
} from "@/lib/rate-limit";

const isDev = process.env.NODE_ENV !== "production";

function getAppHostname(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  try {
    return new URL(url).hostname;
  } catch {
    return "localhost";
  }
}

function isCustomDomainRequest(hostname: string): boolean {
  const appHost = getAppHostname();
  if (hostname === appHost) return false;
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  if (hostname.endsWith(".vercel.app")) return false;
  return true;
}

function buildCsp(options?: { allowEmbedding?: boolean }) {
  // Next.js injects several inline <script> tags for hydration/routing that
  // don't reliably receive the nonce attribute across all versions and
  // adapters. Nonce-only script-src blocks these scripts and breaks the
  // page. Using 'unsafe-inline' without a nonce is the standard production
  // approach for Next.js apps — XSS protection is handled at the
  // application layer (React auto-escaping, input sanitisation, etc.).
  // The nonce is still generated and forwarded in x-nonce for any
  // first-party <Script nonce={nonce}> components that opt into it.
  const scriptSrc = ["'self'", "'unsafe-inline'", "https://js.stripe.com"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://r.stripe.com https://m.stripe.network https://api.stormglass.io",
    "frame-src 'self' https://www.windguru.cz https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    `frame-ancestors ${options?.allowEmbedding ? "*" : "'self'"}`,
    "manifest-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hostname = req.headers.get("host")?.split(":")[0] ?? "localhost";

  // ------------------------------------------------------------------
  // Custom domain rewrite: resolve host → business slug, rewrite path
  // Skip internal API to avoid loops and skip static/API paths.
  // ------------------------------------------------------------------
  if (
    isCustomDomainRequest(hostname) &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/favicon")
  ) {
    const resolveUrl = new URL(
      `/api/internal/resolve-domain?host=${encodeURIComponent(hostname)}`,
      req.url
    );

    try {
      const res = await fetch(resolveUrl, {
        headers: { "x-internal-secret": process.env.CRON_SECRET ?? "" },
      });

      if (res.ok) {
        const json = (await res.json()) as {
          data?: { slug: string; businessId: string };
        };
        const slug = json?.data?.slug;

        if (slug) {
          let rewritePath: string;
          if (pathname === "/" || pathname === "") {
            rewritePath = `/book/${slug}`;
          } else if (pathname === "/confirmation" || pathname.startsWith("/confirmation")) {
            rewritePath = `/book/${slug}/confirmation`;
          } else {
            rewritePath = `/book/${slug}${pathname}`;
          }

          const rewriteUrl = new URL(rewritePath, req.url);
          rewriteUrl.search = req.nextUrl.search;

          const nonce = btoa(crypto.randomUUID());
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set("x-nonce", nonce);
          requestHeaders.set("x-custom-domain", hostname);

          const response = NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders },
          });
          response.headers.set(
            "Content-Security-Policy",
            buildCsp({ allowEmbedding: true })
          );
          return response;
        }
      }
    } catch {
      // Domain resolution failed; fall through to normal routing
    }
  }

  // ------------------------------------------------------------------
  // Standard flow: CSP + rate limiting
  // ------------------------------------------------------------------
  const requestHeaders = new Headers(req.headers);
  const nonce = btoa(crypto.randomUUID());
  requestHeaders.set("x-nonce", nonce);

  const limiter = pathname.startsWith("/api/public/")
    ? await getPublicApiRateLimiter()
    : pathname.startsWith("/api/auth/")
      ? await getAuthRateLimiter()
      : null;
  if (!limiter) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set(
      "Content-Security-Policy",
      buildCsp({ allowEmbedding: pathname.startsWith("/book/") })
    );
    return response;
  }

  const identifier = getRequestIdentifier(req.headers);

  const result = await limiter.limit(identifier);
  if (!result.success) {
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set(
      "Content-Security-Policy",
      buildCsp({ allowEmbedding: pathname.startsWith("/book/") })
    );
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    "Content-Security-Policy",
    buildCsp({ allowEmbedding: pathname.startsWith("/book/") })
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
