import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TideDesk",
  description: "TideDesk terms of service – your agreement when using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <article className="space-y-6 text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2 className="text-xl font-semibold mt-8">1. Acceptance</h2>
      <p>By using TideDesk, you agree to these Terms of Service. If you do not agree, do not use the service.</p>

      <h2 className="text-xl font-semibold mt-8">2. Description of Service</h2>
      <p>TideDesk provides software-as-a-service for surf schools to manage bookings, equipment, instructors, customers, and payments. You are responsible for your use of the platform and compliance with all applicable laws.</p>

      <h2 className="text-xl font-semibold mt-8">3. Account &amp; Subscription</h2>
      <p>You must provide accurate information when registering. You are responsible for maintaining the security of your account. Subscription fees are billed monthly; a 30-day free trial is offered for new accounts.</p>

      <h2 className="text-xl font-semibold mt-8">4. Acceptable Use</h2>
      <p>You agree to use TideDesk only for lawful purposes. You must not misuse the service, attempt unauthorised access, or interfere with other users. See our <a href="/acceptable-use" className="text-primary underline">Acceptable Use Policy</a>.</p>

      <h2 className="text-xl font-semibold mt-8">5. Intellectual Property</h2>
      <p>TideDesk and its content are owned by us. You retain ownership of your data. We do not claim rights to your customer or business information.</p>

      <h2 className="text-xl font-semibold mt-8">6. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, TideDesk is provided &quot;as is&quot;. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.</p>

      <h2 className="text-xl font-semibold mt-8">7. Termination</h2>
      <p>You may cancel your subscription at any time. We may suspend or terminate your account for breach of these terms. Upon termination, your access will cease and data will be handled according to our data retention policy.</p>

      <h2 className="text-xl font-semibold mt-8">8. Changes</h2>
      <p>We may update these terms. We will notify you of material changes by email or through the platform. Continued use after changes constitutes acceptance.</p>

      <h2 className="text-xl font-semibold mt-8">9. Governing Law</h2>
      <p>These terms are governed by the laws of New Zealand. Any disputes shall be resolved in the courts of New Zealand.</p>

      <h2 className="text-xl font-semibold mt-8">10. Contact</h2>
      <p>For questions about these terms: <a href="mailto:legal@tidedesk.co.nz" className="text-primary underline">legal@tidedesk.co.nz</a></p>
    </article>
  );
}
