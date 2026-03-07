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
 * POST /api/payments/stripe/checkout/rental
 * Creates a Stripe Checkout session for a rental. Payment goes to the surf school's connected account.
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
  const rentalId = typeof b?.rentalId === "string" ? String(b.rentalId).trim() : "";

  if (!rentalId) {
    return Response.json({ error: "rentalId is required" }, { status: 400 });
  }

  try {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, businessId },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        equipmentVariant: {
          select: { label: true, category: { select: { name: true } } },
        },
        payment: { select: { id: true } },
      },
    });

    if (!rental) {
      return Response.json({ error: "Rental not found" }, { status: 404 });
    }

    if (rental.payment) {
      return Response.json({ error: "Rental already paid" }, { status: 400 });
    }

    if (rental.status !== "PENDING") {
      return Response.json(
        { error: "Rental is not awaiting payment" },
        { status: 400 },
      );
    }

    const priceTotal = rental.priceTotal ? Number(rental.priceTotal) : 0;
    if (priceTotal <= 0) {
      return Response.json({ error: "Rental has no price" }, { status: 400 });
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
    const amountCents = Math.round(priceTotal * 100);
    if (amountCents < 50) {
      return Response.json({ error: "Amount must be at least 0.50" }, { status: 400 });
    }

    const currency = (business.currency ?? "NZD").toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const productName = rental.equipmentVariant
      ? `${rental.equipmentVariant.category.name} ${rental.equipmentVariant.label}`
      : "Equipment rental";
    const description = `${rental.customer.firstName} ${rental.customer.lastName} • ${new Date(rental.startAt).toLocaleDateString()} • x${rental.quantity}`;

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
                name: productName,
                description,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/rentals?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/rentals`,
        metadata: {
          rentalId,
          businessId,
        },
      },
      { stripeAccount: stripeAccountId },
    );

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout rental error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout";
    return Response.json({ error: message }, { status: 500 });
  }
}
