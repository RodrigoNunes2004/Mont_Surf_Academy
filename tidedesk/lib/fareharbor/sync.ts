/**
 * FareHarbor → TideDesk sync engine.
 * Imports bookings from FareHarbor into the TideDesk booking model.
 * Deduplicates via Booking.externalReference = "fh:{uuid}".
 */

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";
import {
  FareHarborClient,
  FareHarborError,
  type FHBooking,
} from "@/integrations/fareharbor";
import { dispatchWebhook, buildBookingPayload } from "@/lib/webhooks/dispatch";
import type { BookingStatus, IntegrationProvider } from "@prisma/client";

type SyncLogRow = {
  id: string;
  businessId: string;
  provider: string;
  direction: string;
  status: string;
  itemsSynced: number;
  itemsSkipped: number;
  itemsFailed: number;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

// Neon adapter doesn't expose all model delegates to the IDE TS server.
// Same workaround as lib/webhooks/dispatch.ts uses for webhookEndpoint.
const syncLogModel = (prisma as unknown as {
  syncLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<SyncLogRow>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<SyncLogRow>;
  };
}).syncLog;

type ConfigPayload = {
  apiKey?: string;
  webhookSecret?: string;
  companyShortname?: string;
};

const EXTERNAL_PREFIX = "fh:";

type SyncResult = {
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
};

/** Get the decrypted FareHarbor config for a business. */
export async function getFareHarborConfig(
  businessId: string
): Promise<ConfigPayload | null> {
  const integration = await prisma.integration.findUnique({
    where: {
      businessId_provider: { businessId, provider: "FAREHARBOR" as IntegrationProvider },
    },
  });
  if (!integration?.config || !integration.isActive) return null;

  try {
    const parsed = JSON.parse(integration.config) as ConfigPayload;
    if (!parsed.apiKey) return null;
    return {
      ...parsed,
      apiKey: decrypt(parsed.apiKey),
      webhookSecret: parsed.webhookSecret ? decrypt(parsed.webhookSecret) : undefined,
    };
  } catch {
    return null;
  }
}

/** Map FareHarbor booking status to TideDesk BookingStatus. */
function mapStatus(fhStatus: FHBooking["status"]): BookingStatus {
  switch (fhStatus) {
    case "booked":
      return "BOOKED";
    case "cancelled":
      return "CANCELLED";
    case "rebooked":
      return "CANCELLED";
    case "no-show":
      return "NO_SHOW";
    default:
      return "BOOKED";
  }
}

/** Total participants across all customer line items. */
function countParticipants(fhBooking: FHBooking): number {
  return fhBooking.customers.length || 1;
}

/**
 * Find or create a TideDesk Customer from FareHarbor contact info.
 * Matches by email first, then by name+phone.
 */
async function resolveCustomer(
  businessId: string,
  contact: FHBooking["contact"]
): Promise<string> {
  const email = contact.email?.trim().toLowerCase() || null;
  const nameParts = (contact.name || "Guest").trim().split(/\s+/);
  const firstName = nameParts[0] || "Guest";
  const lastName = nameParts.slice(1).join(" ") || "";

  if (email) {
    const existing = await prisma.customer.findFirst({
      where: { businessId, email },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  if (firstName && contact.phone) {
    const existing = await prisma.customer.findFirst({
      where: { businessId, firstName, phone: contact.phone },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const customer = await prisma.customer.create({
    data: {
      businessId,
      firstName,
      lastName,
      email,
      phone: contact.phone || null,
      notes: "Imported from FareHarbor",
    },
  });
  return customer.id;
}

/**
 * Import a single FareHarbor booking into TideDesk.
 * Returns true if created/updated, false if skipped (already synced).
 */
async function importBooking(
  businessId: string,
  fhBooking: FHBooking
): Promise<"created" | "updated" | "skipped"> {
  const externalRef = `${EXTERNAL_PREFIX}${fhBooking.uuid}`;
  const status = mapStatus(fhBooking.status);

  const existing = await prisma.booking.findFirst({
    where: { businessId, externalReference: externalRef },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status !== status) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: { status },
      });
      return "updated";
    }
    return "skipped";
  }

  const customerId = await resolveCustomer(businessId, fhBooking.contact);

  const startAt = new Date(fhBooking.availability.start_at);
  const endAt = new Date(fhBooking.availability.end_at);
  const participants = countParticipants(fhBooking);
  const amountPaidCents = fhBooking.amount_paid ?? 0;
  const receiptTotalCents = fhBooking.receipt_total ?? 0;
  const depositPaid = amountPaidCents / 100;
  const balanceRemaining =
    receiptTotalCents > amountPaidCents
      ? (receiptTotalCents - amountPaidCents) / 100
      : null;

  const newBooking = await prisma.booking.create({
    data: {
      businessId,
      customerId,
      startAt,
      endAt,
      participants,
      status,
      externalReference: externalRef,
      depositPaid,
      balanceRemaining,
    },
  });

  if (amountPaidCents > 0 && status !== "CANCELLED") {
    await prisma.payment.create({
      data: {
        businessId,
        amount: depositPaid,
        currency: "NZD",
        method: "ONLINE",
        provider: "FAREHARBOR",
        status: "PAID",
        externalReference: `fh_pay:${fhBooking.uuid}`,
        bookingId: newBooking.id,
      },
    });
  }

  const payload = await buildBookingPayload(newBooking.id);
  if (payload) {
    dispatchWebhook(businessId, "booking.synced", {
      ...payload,
      source: "fareharbor",
      fareharbor_uuid: fhBooking.uuid,
    }).catch((e) => console.error("[FH Sync] Webhook dispatch failed:", e));
  }

  return "created";
}

/**
 * Run a full sync for a business: fetch bookings from FareHarbor
 * for the given date range and import them.
 */
export async function syncFareHarborBookings(
  businessId: string,
  options?: { dateStart?: string; dateEnd?: string }
): Promise<SyncResult> {
  const config = await getFareHarborConfig(businessId);
  if (!config?.apiKey) {
    return { synced: 0, skipped: 0, failed: 0, errors: ["FareHarbor not configured"] };
  }

  const shortname = config.companyShortname;
  if (!shortname) {
    return { synced: 0, skipped: 0, failed: 0, errors: ["Company shortname not set"] };
  }

  const syncLog = await syncLogModel.create({
    data: {
      businessId,
      provider: "FAREHARBOR",
      direction: "INBOUND",
      status: "RUNNING",
    },
  });

  const result: SyncResult = { synced: 0, skipped: 0, failed: 0, errors: [] };

  try {
    const client = new FareHarborClient(config.apiKey);

    const now = new Date();
    const dateStart =
      options?.dateStart ??
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    const dateEnd =
      options?.dateEnd ?? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    const bookings = await client.getBookings(shortname, dateStart, dateEnd);

    for (const fhBooking of bookings) {
      try {
        const outcome = await importBooking(businessId, fhBooking);
        if (outcome === "created" || outcome === "updated") {
          result.synced++;
        } else {
          result.skipped++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push(
          `Booking ${fhBooking.uuid}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    await syncLogModel.update({
      where: { id: syncLog.id },
      data: {
        status: result.failed > 0 && result.synced === 0 ? "FAILED" : "COMPLETED",
        itemsSynced: result.synced,
        itemsSkipped: result.skipped,
        itemsFailed: result.failed,
        error: result.errors.length > 0 ? result.errors.join("\n") : null,
        finishedAt: new Date(),
      },
    });

    await prisma.integration.update({
      where: {
        businessId_provider: { businessId, provider: "FAREHARBOR" },
      },
      data: { lastSyncAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(message);

    await syncLogModel.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    });

    if (err instanceof FareHarborError && err.status === 401) {
      result.errors.push("Invalid API credentials — check your FareHarbor API key");
    }
  }

  return result;
}

/**
 * Handle a single inbound FareHarbor webhook booking event.
 * Called from the webhook route when FareHarbor POSTs a booking update.
 */
export async function handleFareHarborWebhookBooking(
  businessId: string,
  fhBooking: FHBooking
): Promise<"created" | "updated" | "skipped"> {
  return importBooking(businessId, fhBooking);
}
