import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notificationService";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

/**
 * GET /api/public/schools/[slug]/confirmation?bookingId=xxx | session_id=xxx
 * Returns booking details for the confirmation page.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId")?.trim();
  const sessionId = searchParams.get("session_id")?.trim();

  if (!slug?.trim()) {
    return Response.json({ error: "Slug is required" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: slug.trim() },
  });
  if (!business) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }

  let resolvedBookingId: string | null | undefined = bookingId || undefined;
  let session: Stripe.Checkout.Session | null = null;

  if (sessionId) {
    try {
      const stripe = getStripe();
      if (!business.stripeAccountId) {
        return Response.json(
          { error: "This school does not have payment configured" },
          { status: 400 }
        );
      }
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        stripeAccount: business.stripeAccountId,
      });
      const metadata = session.metadata as Record<string, string> | null;
      const bid = metadata?.bookingId?.trim();
      resolvedBookingId = resolvedBookingId || bid || undefined;
      const sessionBusinessId = metadata?.businessId?.trim();
      if (sessionBusinessId && sessionBusinessId !== business.id) {
        return Response.json(
          { error: "Session does not match this school" },
          { status: 400 }
        );
      }
    } catch {
      return Response.json(
        { error: "Invalid or expired session" },
        { status: 400 }
      );
    }
  }

  if (!resolvedBookingId) {
    return Response.json(
      { error: "bookingId or session_id required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id: resolvedBookingId, businessId: business.id },
    include: {
      lesson: { select: { title: true, price: true, durationMinutes: true } },
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  let paidPayment = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: "PAID" },
  });

  if (!paidPayment && session?.payment_status === "paid" && session?.metadata?.bookingId) {
    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (pi) {
      const existing = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: pi },
      });
      if (!existing) {
        try {
          await prisma.payment.create({
            data: {
              businessId: business.id,
              amount: (session.amount_total ?? 0) / 100,
              currency: (session.currency ?? "nzd").toUpperCase(),
              method: "ONLINE",
              provider: "STRIPE",
              status: "PAID",
              stripePaymentIntentId: pi,
              stripeSessionId: session.id,
              bookingId: resolvedBookingId!,
              rentalId: null,
            },
          });
          paidPayment = await prisma.payment.findFirst({
            where: { bookingId: booking.id, status: "PAID" },
          });
          if (paidPayment) {
            notificationService.sendPaymentReceipt(paidPayment.id).catch(() => {});
          }
          notificationService.sendBookingConfirmation(resolvedBookingId!).catch(() => {});
        } catch {
          // Webhook may process later
        }
      }
    }
  }

  return Response.json({
    booking: {
      id: booking.id,
      startAt: booking.startAt,
      endAt: booking.endAt,
      participants: booking.participants,
      status: booking.status,
    },
    lesson: booking.lesson
      ? {
          title: booking.lesson.title,
          price: Number(booking.lesson.price),
          durationMinutes: booking.lesson.durationMinutes,
        }
      : null,
    customer: {
      firstName: booking.customer.firstName,
      lastName: booking.customer.lastName,
      email: booking.customer.email,
      phone: booking.customer.phone,
    },
    paid: !!paidPayment,
  });
}
