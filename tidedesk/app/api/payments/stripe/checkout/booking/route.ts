import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * POST /api/payments/stripe/checkout/booking
 * Creates a Stripe Checkout session for a booking. Payment goes to the surf school's connected account.
 */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  const businessId = session.user.businessId!;

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const bookingId = typeof b?.bookingId === "string" ? String(b.bookingId).trim() : "";

  if (!bookingId) {
    return Response.json({ error: "bookingId is required" }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, businessId },
      include: {
        lesson: { select: { id: true, title: true, price: true } },
        customer: { select: { firstName: true, lastName: true } },
        payments: {
          where: { provider: "STRIPE", status: "PAID" },
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.payments.length > 0) {
      return Response.json({ error: "Booking already paid" }, { status: 400 });
    }

    if (!booking.lesson) {
      return Response.json({ error: "Booking has no lesson" }, { status: 400 });
    }

    const business = (await prisma.business.findUnique({
      where: { id: businessId },
    })) as { stripeAccountId: string | null; chargesEnabled: boolean; currency: string | null } | null;

    if (!business?.stripeAccountId || !business.chargesEnabled) {
      return Response.json(
        { error: "Stripe Connect not set up. Connect in Settings → Payment." },
        { status: 400 },
      );
    }

    const stripeAccountId = business.stripeAccountId;
    const lessonPrice = Number(booking.lesson.price);
    const amountCents = Math.round(lessonPrice * booking.participants * 100);
    if (amountCents < 50) {
      return Response.json({ error: "Amount must be at least 0.50" }, { status: 400 });
    }

    const currency = (business.currency ?? "NZD").toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: `${booking.lesson.title} × ${booking.participants}`,
                description: `${booking.customer.firstName} ${booking.customer.lastName} • ${new Date(booking.startAt).toLocaleDateString()}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/bookings`,
        metadata: {
          bookingId,
          businessId,
        },
      },
      { stripeAccount: stripeAccountId },
    );

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout booking error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout";
    return Response.json({ error: message }, { status: 500 });
  }
}
