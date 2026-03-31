import { NextResponse, type NextRequest } from "next/server";
import { resolveCustomDomain } from "@/lib/custom-domain";

/**
 * GET /api/internal/resolve-domain?host=book.example.com
 * Used by middleware to map a custom domain hostname to a business slug.
 * Returns { slug, businessId } or 404.
 */
export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host");
  if (!host) {
    return NextResponse.json({ error: "host is required" }, { status: 400 });
  }

  const result = await resolveCustomDomain(host);
  if (!result) {
    return NextResponse.json(
      { error: "Domain not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { data: result },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
