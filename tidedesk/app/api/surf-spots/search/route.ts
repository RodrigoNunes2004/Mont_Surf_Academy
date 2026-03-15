import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  await requireSession();

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const search = `%${q}%`;
  // Adapter-based client loses SurfSpot in generated types; cast to access at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spots = await (prisma as any).surfSpot.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, latitude: true, longitude: true, region: true, country: true },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: spots });
}
