/**
 * Returns the app's base URL for links in emails, Stripe redirects, etc.
 * Handles common misconfigurations: "null", "undefined", empty string.
 */
export function getAppBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ];
  for (const u of candidates) {
    const s = typeof u === "string" ? u.trim() : "";
    if (
      s &&
      s !== "null" &&
      s !== "undefined" &&
      (s.startsWith("http://") || s.startsWith("https://"))
    ) {
      return s.replace(/\/$/, "");
    }
  }
  return "http://localhost:3000";
}
