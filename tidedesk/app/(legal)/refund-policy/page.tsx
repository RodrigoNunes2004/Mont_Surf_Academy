import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | TideDesk",
  description: "TideDesk refund policy – how we handle subscription and payment refunds.",
};

export default function RefundPolicyPage() {
  return (
    <article className="space-y-6 text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2 className="text-xl font-semibold mt-8">1. Subscription Fees</h2>
      <p>TideDesk subscription fees are billed monthly in advance. If you cancel during a billing period, you retain access until the end of that period. We do not provide prorated refunds for partial months.</p>

      <h2 className="text-xl font-semibold mt-8">2. Free Trial</h2>
      <p>New accounts receive a 30-day free trial. You will not be charged until the trial ends. Cancel anytime before the trial ends to avoid charges.</p>

      <h2 className="text-xl font-semibold mt-8">3. Refund Requests</h2>
      <p>Refund requests for subscription fees may be considered on a case-by-case basis within 14 days of the charge. Contact us at <a href="mailto:support@tidedesk.co.nz" className="text-primary underline">support@tidedesk.co.nz</a> with your account details and reason for the request.</p>

      <h2 className="text-xl font-semibold mt-8">4. Payments Processed Through TideDesk</h2>
      <p>Payments for lessons, rentals, or equipment (collected by your surf school via TideDesk) are between you and the surf school. Refunds for those transactions are at the discretion of the surf school. TideDesk does not control or guarantee refunds for third-party transactions.</p>

      <h2 className="text-xl font-semibold mt-8">5. Stripe Disputes</h2>
      <p>If you believe a charge was made in error, you may also contact Stripe or your bank. We will cooperate with legitimate dispute processes.</p>

      <h2 className="text-xl font-semibold mt-8">6. Contact</h2>
      <p>For refund enquiries: <a href="mailto:support@tidedesk.co.nz" className="text-primary underline">support@tidedesk.co.nz</a></p>
    </article>
  );
}
