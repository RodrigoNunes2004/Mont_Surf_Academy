import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import { handleFareHarborWebhookBooking } from "@/lib/fareharbor";
import { dispatchWebhook, buildBookingPayload } from "@/lib/webhooks/dispatch";
import type { FHBooking } from "@/integrations/fareharbor";

type ConfigPayload = { apiKey?: string; webhookSecret?: string };

/**
 * POST /api/webhooks/fareharbor
 * Receives booking events from FareHarbor.
 * FareHarbor sends a JSON body with { booking: FHBooking }.
 * Authenticated via HMAC signature in X-FareHarbor-Signature header
 * using the per-business webhookSecret.
 *
 * Query param ?business=<businessId> identifies the tenant.
 */
export async function POST(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("business")?.trim();
  if (!businessId) {
    return Response.json({ error: "Missing ?business param" }, { status: 400 });
  }

  const integration = await prisma.integration.findUnique({
    where: { businessId_provider: { businessId, provider: "FAREHARBOR" } },
  });

  if (!integration?.config || !integration.isActive) {
    return Response.json({ error: "Integration not configured" }, { status: 404 });
  }

  let config: ConfigPayload;
  try {
    config = JSON.parse(integration.config) as ConfigPayload;
  } catch {
    return Response.json({ error: "Invalid config" }, { status: 500 });
  }

  const body = await req.text();

  if (config.webhookSecret) {
    const secret = decrypt(config.webhookSecret);
    const signature = req.headers.get("x-fareharbor-signature") ?? "";
    const expected = createHmac("sha256", secret).update(body).digest("hex");

    if (signature !== expected && signature !== `sha256=${expected}`) {
      console.error("[FH Webhook] Invalid signature for business", businessId);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: { booking?: FHBooking };
  try {
    payload = JSON.parse(body) as { booking?: FHBooking };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.booking) {
    return Response.json({ error: "Missing booking object" }, { status: 400 });
  }

  try {
    const outcome = await handleFareHarborWebhookBooking(businessId, payload.booking);

    if (outcome === "created") {
      const externalRef = `fh:${payload.booking.uuid}`;
      const tdBooking = await prisma.booking.findFirst({
        where: { businessId, externalReference: externalRef },
        select: { id: true },
      });
      if (tdBooking) {
        const bookingPayload = await buildBookingPayload(tdBooking.id);
        if (bookingPayload) {
          dispatchWebhook(businessId, "booking.created", bookingPayload).catch((e) =>
            console.error("[FH Webhook] Outbound dispatch failed:", e)
          );
        }
      }
    }

    return Response.json({ received: true, outcome });
  } catch (err) {
    console.error("[FH Webhook] Handler error:", err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
