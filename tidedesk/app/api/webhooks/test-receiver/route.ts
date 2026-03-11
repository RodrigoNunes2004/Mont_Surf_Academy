import { NextRequest } from "next/server";

/**
 * TEST ONLY: Receives webhook payloads and logs them to the server console.
 * Use this URL as your webhook endpoint to see what TideDesk sends:
 *   http://localhost:3000/api/webhooks/test-receiver
 *
 * 1. Add this URL in Settings → API → Webhooks
 * 2. Create a booking (or trigger a payment)
 * 3. Watch your Next.js terminal — you'll see the payload logged
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-tidedesk-signature");
  const event = req.headers.get("x-tidedesk-event");

  const payload = (() => {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  })();

  console.log("\n---------- TIDEDESK WEBHOOK RECEIVED ----------");
  console.log("Event:", event);
  console.log("Signature:", signature);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("------------------------------------------------\n");

  return new Response("OK", { status: 200 });
}
