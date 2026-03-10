/**
 * Surf lesson business rules – no lessons after 5pm (too dark for safe surfing).
 * All times are validated in the business's local timezone.
 */
import { toZonedTime } from "date-fns-tz";

/** Latest hour (0–23) a lesson can END in business local time. 17 = 5pm. */
export const LESSON_END_CUTOFF_HOUR = 17;

const DEFAULT_TZ = "Pacific/Auckland";

/**
 * Get the local hour (0–23) of a date in the given timezone.
 */
function getHourInTimezone(date: Date, tz: string): number {
  const zoned = toZonedTime(date, tz);
  return zoned.getHours();
}

/**
 * Validate that a lesson ends by 5pm in business local time.
 * Returns an error message if invalid, or null if valid.
 */
export function validateLessonEndTime(
  endAt: Date,
  timezone?: string | null
): string | null {
  if (!endAt || Number.isNaN(endAt.getTime())) return null;
  const tz = timezone?.trim() || DEFAULT_TZ;
  const hour = getHourInTimezone(endAt, tz);
  if (hour > LESSON_END_CUTOFF_HOUR) {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `Surf lessons must end by 5:00 PM (local time). This lesson would end at ${displayHour}:00 ${ampm}.`;
  }
  return null;
}

/**
 * Format a date in the business timezone for display.
 * Uses Intl for consistent formatting across server and client.
 */
export function formatInBusinessTimezone(
  date: Date | string,
  timezone?: string | null,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const tz = timezone?.trim() || DEFAULT_TZ;
  return new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: tz,
  }).format(d);
}
