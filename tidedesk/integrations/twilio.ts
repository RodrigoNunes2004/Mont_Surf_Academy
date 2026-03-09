/**
 * Twilio integration – SMS sending.
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in env.
 */

async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;

  const { Twilio } = await import("twilio");
  return new Twilio(accountSid, authToken);
}

export type SmsResult = { ok: true } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    const msg = "TWILIO_PHONE_NUMBER not set";
    console.warn("Twilio:", msg);
    return { ok: false, error: msg };
  }

  const client = await getTwilioClient();
  if (!client) {
    const msg = "Credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)";
    console.warn("Twilio:", msg);
    return { ok: false, error: msg };
  }

  try {
    await client.messages.create({ to, from, body });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Twilio SMS error:", err);
    return { ok: false, error: message };
  }
}
