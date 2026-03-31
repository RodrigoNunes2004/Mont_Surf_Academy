import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveSession, rejectIfInstructor } from "../_lib/tenant";

const ALLOWED_KEYS = [
  "name",
  "location",
  "contactEmail",
  "phone",
  "address",
  "timezone",
  "currency",
  "logoUrl",
  "defaultPaymentMethod",
  "latitude",
  "longitude",
  "windguruSpotId",
  "onlineBookingEnabled",
  "onlineBookingMessage",
  "businessHoursOpen",
  "businessHoursClose",
] as const;

const VALID_PAYMENT_METHODS = Object.values(PaymentMethod);

function sanitizeLogoUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.pathname;
    }
  } catch {
    // Already a relative path
  }
  return url;
}

function toSafeBusinessResponse(
  business: Awaited<ReturnType<typeof prisma.business.findUnique>>
) {
  if (!business) return null;

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    location: business.location,
    contactEmail: business.contactEmail,
    phone: business.phone,
    address: business.address,
    timezone: business.timezone,
    currency: business.currency,
    logoUrl: sanitizeLogoUrl(business.logoUrl),
    latitude: business.latitude != null ? Number(business.latitude) : null,
    longitude: business.longitude != null ? Number(business.longitude) : null,
    windguruSpotId: business.windguruSpotId,
    defaultPaymentMethod: business.defaultPaymentMethod,
    onlineBookingEnabled: business.onlineBookingEnabled,
    onlineBookingMessage: business.onlineBookingMessage,
    businessHoursOpen: business.businessHoursOpen,
    businessHoursClose: business.businessHoursClose,
    stripeConnected: !!business.stripeAccountId,
    chargesEnabled: business.chargesEnabled,
    payoutsEnabled: business.payoutsEnabled,
    detailsSubmitted: business.detailsSubmitted,
    updatedAt: business.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: toSafeBusinessResponse(business) });
}

export async function PATCH(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    const val = body[key];
    if (val === undefined) continue;
    if (key === "defaultPaymentMethod") {
      if (typeof val !== "string" || !VALID_PAYMENT_METHODS.includes(val as PaymentMethod)) {
        return NextResponse.json(
          { error: `defaultPaymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(", ")}` },
          { status: 400 },
        );
      }
      data[key] = val;
    } else if (key === "name" && typeof val === "string") {
      if (!val.trim()) {
        return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
      }
      data[key] = val.trim();
    } else if (
      [
        "location",
        "contactEmail",
        "phone",
        "address",
        "timezone",
        "currency",
        "logoUrl",
        "onlineBookingMessage",
      ].includes(key)
    ) {
      data[key] = typeof val === "string" ? val.trim() || null : null;
    } else if (key === "onlineBookingEnabled") {
      data[key] = val === true || val === "true";
    } else if (key === "businessHoursOpen" || key === "businessHoursClose") {
      if (val === null || val === "" || val === undefined) {
        data[key] = null;
      } else {
        const n = typeof val === "number" ? val : Number(val);
        if (!Number.isInteger(n) || n < 0 || n > 23) {
          return NextResponse.json(
            { error: `${key} must be an integer 0–23.` },
            { status: 400 }
          );
        }
        data[key] = n;
      }
    } else if (key === "latitude") {
      if (val === null || val === "") {
        data[key] = null;
      } else {
        const n = typeof val === "number" ? val : Number(val);
        if (!Number.isFinite(n) || n < -90 || n > 90) {
          return NextResponse.json(
            { error: "latitude must be a number between -90 and 90." },
            { status: 400 },
          );
        }
        data[key] = n;
      }
    } else if (key === "longitude") {
      if (val === null || val === "") {
        data[key] = null;
      } else {
        const n = typeof val === "number" ? val : Number(val);
        if (!Number.isFinite(n) || n < -180 || n > 180) {
          return NextResponse.json(
            { error: "longitude must be a number between -180 and 180." },
            { status: 400 },
          );
        }
        data[key] = n;
      }
    } else if (key === "windguruSpotId") {
      data[key] = typeof val === "string" && val.trim() ? val.trim() : null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const business = await prisma.business.update({
      where: { id: businessId },
      data: data as Parameters<typeof prisma.business.update>[0]["data"],
    });
    return NextResponse.json({ data: toSafeBusinessResponse(business) });
  } catch (err) {
    console.error("[PATCH /api/business] Prisma error:", err);
    return NextResponse.json(
      { error: "Failed to update business." },
      { status: 500 },
    );
  }
}

