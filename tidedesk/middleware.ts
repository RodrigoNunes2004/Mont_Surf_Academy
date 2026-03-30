import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAuthRateLimiter,
  getPublicApiRateLimiter,
  getRequestIdentifier,
} from "@/lib/rate-limit";

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string, options?: { allowEmbedding?: boolean }) {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://js.stripe.com",
  ];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://r.stripe.com https://m.stripe.network",
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
      buildCsp(nonce, { allowEmbedding: pathname.startsWith("/book/") })
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
      buildCsp(nonce, { allowEmbedding: pathname.startsWith("/book/") })
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
    buildCsp(nonce, { allowEmbedding: pathname.startsWith("/book/") })
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
