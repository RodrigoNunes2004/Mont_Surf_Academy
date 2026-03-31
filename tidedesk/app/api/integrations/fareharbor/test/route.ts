import { NextRequest, NextResponse } from "next/server";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { getFareHarborConfig } from "@/lib/fareharbor";
import { FareHarborClient, FareHarborError } from "@/integrations/fareharbor";

/**
 * POST /api/integrations/fareharbor/test
 * Tests the FareHarbor API connection using stored credentials.
 * Returns list of accessible company names on success.
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

  const config = await getFareHarborConfig(businessId);
  if (!config?.apiKey) {
    return NextResponse.json(
      { error: "FareHarbor API key not configured. Save your credentials first." },
      { status: 400 }
    );
  }

  try {
    const client = new FareHarborClient(config.apiKey);
    const result = await client.testConnection();
    return NextResponse.json({ ok: true, companies: result.companies });
  } catch (err) {
    if (err instanceof FareHarborError) {
      return NextResponse.json(
        { ok: false, error: err.message, status: err.status },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Connection failed" },
      { status: 500 }
    );
  }
}
