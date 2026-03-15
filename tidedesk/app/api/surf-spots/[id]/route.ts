import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();

  const { id } = await params;
  const spotId = Number(id);
  if (!Number.isInteger(spotId)) {
    return NextResponse.json({ error: "Invalid spot ID." }, { status: 400 });
  }

  // Adapter-based client loses SurfSpot in generated types; cast to access at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spot = await (prisma as any).surfSpot.findUnique({
    where: { id: spotId },
    select: { id: true, name: true, latitude: true, longitude: true, region: true, country: true },
  });

  if (!spot) {
    return NextResponse.json({ error: "Spot not found." }, { status: 404 });
  }

  return NextResponse.json({ data: spot });
}
