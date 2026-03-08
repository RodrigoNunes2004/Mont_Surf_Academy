import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const ACTIVE_BOOKING_STATUSES = ["BOOKED", "CHECKED_IN"] as ("BOOKED" | "CHECKED_IN")[];
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;

/**
 * GET /api/public/schools/[slug]/slots?lessonId=&date=
 * Returns available time slots for a lesson on a given date.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId")?.trim();
  const dateStr = searchParams.get("date")?.trim();

  if (!slug?.trim() || !lessonId || !dateStr) {
    return Response.json(
      { error: "slug, lessonId, and date are required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { slug: slug.trim() },
  });
  if (!business) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, businessId: business.id },
  });
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  const date = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosenDate = new Date(date);
  chosenDate.setHours(0, 0, 0, 0);
  if (chosenDate < today) {
    return Response.json(
      { error: "Date must be today or in the future" },
      { status: 400 }
    );
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayStart = new Date(year, month, day, DEFAULT_START_HOUR, 0, 0);
  const dayEnd = new Date(year, month, day, DEFAULT_END_HOUR, 0, 0);

  const now = new Date();
  const durationMinutes = lesson.durationMinutes ?? 60;
  const slots: { start: string; end: string; instructorId: string | null }[] =
    [];

  const instructors = await prisma.instructor.findMany({
    where: { businessId: business.id, isActive: true },
    select: { id: true },
  });

  if (instructors.length === 0) {
    return Response.json({ slots: [] });
  }

  const [instructorBookings, lessonBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        instructorId: { in: instructors.map((i) => i.id) },
        status: { in: ACTIVE_BOOKING_STATUSES },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { instructorId: true, startAt: true, endAt: true },
    }),
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        lessonId: lesson.id,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true, participants: true },
    }),
  ]);

  const capacity = lesson.capacity ?? 999;

  for (
    let slotStart = new Date(dayStart);
    slotStart < dayEnd;
    slotStart.setMinutes(slotStart.getMinutes() + durationMinutes)
  ) {
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);
    if (slotEnd > dayEnd) break;
    if (slotStart < now) continue;

    let assignedInstructor: string | null = null;
    for (const inst of instructors) {
      const hasOverlap = instructorBookings.some(
        (b) =>
          b.instructorId === inst.id &&
          b.startAt < slotEnd &&
          b.endAt > slotStart
      );
      if (!hasOverlap) {
        assignedInstructor = inst.id;
        break;
      }
    }

    if (!assignedInstructor) continue;

    const booked = lessonBookings
      .filter((b) => b.startAt < slotEnd && b.endAt > slotStart)
      .reduce((s, b) => s + b.participants, 0);
    if (booked >= capacity) continue;

    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      instructorId: assignedInstructor,
    });
  }

  return Response.json({ slots });
}
