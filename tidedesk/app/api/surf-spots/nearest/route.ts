import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { findNearestSpot } from "@/lib/surf/findNearestSpot";

export async function GET(req: NextRequest) {
  await requireSession();

  const latParam = req.nextUrl.searchParams.get("lat");
  const lonParam = req.nextUrl.searchParams.get("lon");

  const lat = latParam != null ? Number(latParam) : NaN;
  const lon = lonParam != null ? Number(lonParam) : NaN;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "Valid latitude (lat) required." }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Valid longitude (lon) required." }, { status: 400 });
  }

  const spot = await findNearestSpot(lat, lon);
  if (!spot) {
    return NextResponse.json({ error: "No surf spots in database." }, { status: 404 });
  }

  return NextResponse.json({ data: spot });
}
