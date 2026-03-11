import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSession } from "@/app/api/_lib/tenant";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { getCachedOrFetchWeather } from "@/modules/weather";

/**
 * GET /api/weather/forecast
 * Returns marine forecast (wind, swell) for the business location.
 * Requires Premium (windguru feature) and business lat/lng.
 */
export async function GET(req: NextRequest) {
  const { businessId } = await resolveSession(req);
  if (!businessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "windguru")) {
    return Response.json(
      { error: "WindGuru / marine forecast requires Premium" },
      { status: 403 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business?.latitude || !business?.longitude) {
    return Response.json({
      data: [],
      message: "Set latitude and longitude in Settings → Business to see forecast",
    });
  }

  const lat = Number(business.latitude);
  const lng = Number(business.longitude);
  const hours = 24;

  const snapshots = await getCachedOrFetchWeather(businessId, lat, lng, hours);

  const data = snapshots.map((s) => ({
    timestamp: s.timestamp.toISOString(),
    windSpeed: s.windSpeed,
    swellHeight: s.swellHeight,
    tideLevel: s.tideLevel,
  }));

  const windguruSpotId =
    (business as { windguruSpotId?: string | null }).windguruSpotId?.trim() ||
    null;

  return Response.json({
    data,
    windguruSpotId,
  });
}
