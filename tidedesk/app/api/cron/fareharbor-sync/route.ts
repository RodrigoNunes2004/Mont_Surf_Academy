import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/server/cron-auth";
import { syncFareHarborBookings } from "@/lib/fareharbor";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";

/**
 * Vercel Cron — sync FareHarbor bookings for all businesses with an active integration.
 * Runs every 4 hours. Only syncs businesses on Premium tier (integrations feature).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrations = await prisma.integration.findMany({
    where: { provider: "FAREHARBOR", isActive: true, config: { not: null } },
    select: { businessId: true },
  });

  const results: Record<
    string,
    { synced: number; skipped: number; failed: number; errors: string[] }
  > = {};

  for (const { businessId } of integrations) {
    const tier = await getBusinessTier(businessId);
    if (!hasFeature(tier, "integrations")) {
      results[businessId] = {
        synced: 0,
        skipped: 0,
        failed: 0,
        errors: ["Skipped — not on Premium tier"],
      };
      continue;
    }

    try {
      results[businessId] = await syncFareHarborBookings(businessId);
    } catch (err) {
      results[businessId] = {
        synced: 0,
        skipped: 0,
        failed: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      };
    }
  }

  return Response.json({
    businesses: integrations.length,
    results,
  });
}
