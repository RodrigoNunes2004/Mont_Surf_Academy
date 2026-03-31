import { NextRequest, NextResponse } from "next/server";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { syncFareHarborBookings } from "@/lib/fareharbor";

/**
 * POST /api/integrations/fareharbor/sync
 * Triggers a manual FareHarbor booking sync for the current business.
 * Premium-gated.
 */
export async function POST(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const gated = await requireFeature(req, businessId, "integrations");
  if (gated) return gated;

  try {
    const result = await syncFareHarborBookings(businessId);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[FH Manual Sync] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
