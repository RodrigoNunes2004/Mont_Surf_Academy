import { NextRequest, NextResponse } from "next/server";
import { resolveSession, rejectIfInstructor } from "@/app/api/_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { getFareHarborConfig } from "@/lib/fareharbor";
import { FareHarborClient, FareHarborError } from "@/integrations/fareharbor";

/**
 * GET /api/integrations/fareharbor/companies
 * Returns the list of FareHarbor companies accessible with stored credentials.
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

  const config = await getFareHarborConfig(businessId);
  if (!config?.apiKey) {
    return NextResponse.json(
      { error: "FareHarbor API key not configured" },
      { status: 400 }
    );
  }

  try {
    const client = new FareHarborClient(config.apiKey);
    const companies = await client.getCompanies();
    return NextResponse.json({
      data: companies.map((c) => ({
        shortname: c.shortname,
        name: c.name,
        currency: c.currency,
      })),
    });
  } catch (err) {
    if (err instanceof FareHarborError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 400 ? err.status : 500 });
    }
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
