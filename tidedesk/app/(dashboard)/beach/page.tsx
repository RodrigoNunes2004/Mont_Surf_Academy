import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus, RentalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaffOrOwner } from "@/lib/server/role";
import { getBusinessTier } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import {
  BeachCheckInSection,
  BeachReturnSection,
  BeachQuickRentalSection,
} from "@/components/beach";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function BeachPage() {
  const session = await requireStaffOrOwner();

  const businessId = session.user.businessId!;
  const tier = await getBusinessTier(businessId);
  if (!hasFeature(tier, "pos")) {
    redirect("/pricing");
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayBookings, activeRentals, customers, categories, variants, business] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          businessId,
          status: BookingStatus.BOOKED,
          startAt: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { startAt: "asc" },
        take: 30,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          lesson: {
            select: { title: true, durationMinutes: true } as {
              title: boolean;
              durationMinutes: boolean;
            },
          },
        },
      }),
      prisma.rental.findMany({
        where: {
          businessId,
          status: { in: [RentalStatus.ACTIVE, RentalStatus.OVERDUE] },
        },
        orderBy: { startAt: "asc" },
        take: 30,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          equipmentVariant: {
            select: { label: true, category: { select: { name: true } } },
          },
          equipmentCategory: { select: { name: true } },
        },
      }),
      prisma.customer.findMany({
        where: { businessId, archivedAt: null } as never,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 100,
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      }),
      prisma.equipmentCategory.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.equipmentVariant.findMany({
        where: { businessId },
        orderBy: [{ category: { name: "asc" } }, { label: "asc" }],
        select: { id: true, label: true, categoryId: true, category: { select: { name: true } } },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { currency: true, chargesEnabled: true, stripeAccountId: true },
      }),
    ]);

  const bookingsForClient = todayBookings.map((b) => ({
    id: b.id,
    startAt: b.startAt,
    customer: b.customer,
    lesson: b.lesson,
  }));

  const rentalsForClient = activeRentals.map((r) => ({
    id: r.id,
    startAt: r.startAt,
    quantity: r.quantity,
    customer: r.customer,
    equipmentLabel: r.equipmentVariant
      ? `${r.equipmentVariant.category.name} ${r.equipmentVariant.label}`
      : r.equipmentCategory?.name ?? "—",
    status: r.status,
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Beach mode</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <BeachCheckInSection bookings={bookingsForClient} />
        <BeachReturnSection rentals={rentalsForClient} />
        <BeachQuickRentalSection
          customers={customers}
          categories={categories}
          variants={variants}
          business={business}
        />
      </div>
    </div>
  );
}
