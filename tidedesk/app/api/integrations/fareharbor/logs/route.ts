import { NextRequest, NextResponse } from "next/server";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { prisma } from "@/lib/prisma";

const syncLogModel = (prisma as unknown as {
  syncLog: { findMany: (args: object) => Promise<Record<string, unknown>[]> };
}).syncLog;

/**
 * GET /api/integrations/fareharbor/logs
 * Returns the last 10 sync log entries for the current business.
 */
export async function GET(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const gated = await requireFeature(req, businessId, "integrations");
  if (gated) return gated;

  const logs = await syncLogModel.findMany({
    where: { businessId, provider: "FAREHARBOR" },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ data: logs });
}
