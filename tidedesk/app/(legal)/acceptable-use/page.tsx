import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | TideDesk",
  description: "TideDesk acceptable use policy – rules for using our platform.",
};

export default function AcceptableUsePage() {
  return (
    <article className="space-y-6 text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold">Acceptable Use Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2 className="text-xl font-semibold mt-8">1. Purpose</h2>
      <p>This Acceptable Use Policy (&quot;AUP&quot;) sets out the rules for using TideDesk. By using the service, you agree to comply with this AUP.</p>

      <h2 className="text-xl font-semibold mt-8">2. Permitted Use</h2>
      <p>TideDesk is intended for surf schools and similar businesses to:</p>
      <ul>
        <li>Manage lesson and rental bookings</li>
        <li>Track equipment and inventory</li>
        <li>Store customer and instructor data</li>
        <li>Process payments for lessons and rentals</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">3. Prohibited Activities</h2>
      <p>You must not:</p>
      <ul>
        <li>Use the service for any illegal purpose or in violation of any laws</li>
        <li>Attempt to gain unauthorised access to other accounts, systems, or data</li>
        <li>Reverse engineer, decompile, or attempt to extract source code</li>
        <li>Use automated tools (bots, scrapers) without our prior written consent</li>
        <li>Transmit malware, spam, or harmful content</li>
        <li>Interfere with or disrupt the service or its infrastructure</li>
        <li>Share your account credentials or allow unauthorised access</li>
        <li>Use the service to harass, defame, or harm others</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">4. Data &amp; Content</h2>
      <p>You are responsible for the accuracy and legality of the data you enter. You must not upload content that infringes others&apos; rights or contains confidential information you are not authorised to process.</p>

      <h2 className="text-xl font-semibold mt-8">5. Enforcement</h2>
      <p>We may suspend or terminate accounts that violate this AUP. We reserve the right to investigate suspected violations and to report unlawful activity to authorities.</p>

      <h2 className="text-xl font-semibold mt-8">6. Changes</h2>
      <p>We may update this AUP. Continued use after changes constitutes acceptance. Material changes will be communicated via email or through the platform.</p>

      <h2 className="text-xl font-semibold mt-8">7. Contact</h2>
      <p>To report violations: <a href="mailto:legal@tidedesk.co.nz" className="text-primary underline">legal@tidedesk.co.nz</a></p>
    </article>
  );
}
