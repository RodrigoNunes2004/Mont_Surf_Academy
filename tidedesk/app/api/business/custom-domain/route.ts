import { NextResponse, type NextRequest } from "next/server";
import { resolveSession, rejectIfInstructor } from "../../_lib/tenant";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import {
  setCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
} from "@/lib/custom-domain";

/**
 * GET /api/business/custom-domain
 * Returns current domain status + verification info.
 */
export async function GET(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "white-label")) {
    return NextResponse.json(
      { error: "Custom domains require a Premium plan." },
      { status: 403 }
    );
  }

  const status = await verifyCustomDomain(businessId);
  return NextResponse.json({ data: status });
}

/**
 * POST /api/business/custom-domain
 * Body: { domain: "book.example.com" }
 * Saves the domain and registers it with Vercel (if configured).
 */
export async function POST(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "white-label")) {
    return NextResponse.json(
      { error: "Custom domains require a Premium plan." },
      { status: 403 }
    );
  }

  let body: { domain?: string };
  try {
    body = (await req.json()) as { domain?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.domain || typeof body.domain !== "string") {
    return NextResponse.json(
      { error: "domain is required." },
      { status: 400 }
    );
  }

  const result = await setCustomDomain(businessId, body.domain);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    data: { domain: result.domain, verified: false },
  });
}

/**
 * DELETE /api/business/custom-domain
 * Removes the custom domain from the business and Vercel.
 */
export async function DELETE(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  await removeCustomDomain(businessId);
  return NextResponse.json({ data: { removed: true } });
}
