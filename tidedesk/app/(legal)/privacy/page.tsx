import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TideDesk",
  description: "TideDesk privacy policy – how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-6 text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2 className="text-xl font-semibold mt-8">1. Introduction</h2>
      <p>
        TideDesk (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the TideDesk platform for surf schools. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
      </p>

      <h2 className="text-xl font-semibold mt-8">2. Information We Collect</h2>
      <h3 className="text-lg font-medium mt-6">2.1 Account Information</h3>
      <p>When you register, we collect your name, email address, password (hashed), and business details.</p>
      <h3 className="text-lg font-medium mt-6">2.2 Usage Data</h3>
      <p>We collect information about how you use the platform, including booking data, payment information (processed via Stripe), and customer records you create.</p>
      <h3 className="text-lg font-medium mt-6">2.3 Device &amp; Log Data</h3>
      <p>We automatically collect IP address, browser type, and access logs for security and analytics.</p>

      <h2 className="text-xl font-semibold mt-8">3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process payments and send transaction emails</li>
        <li>Respond to support requests</li>
        <li>Send product updates and legal notices</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">4. Data Sharing</h2>
      <p>We share data only with:</p>
      <ul>
        <li><strong>Stripe</strong> – Payment processing</li>
        <li><strong>Resend</strong> – Transactional emails</li>
        <li><strong>Hosting providers</strong> – Vercel, Neon (database)</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2 className="text-xl font-semibold mt-8">5. Data Retention</h2>
      <p>We retain your data for as long as your account is active. Upon deletion, we remove or anonymise data within a reasonable period, except where we must retain it for legal reasons.</p>

      <h2 className="text-xl font-semibold mt-8">6. Your Rights</h2>
      <p>Depending on your location, you may have the right to access, correct, delete, or port your data. Contact us at the address below to exercise these rights.</p>

      <h2 className="text-xl font-semibold mt-8">7. Cookies</h2>
      <p>We use essential cookies for authentication and security. See our <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a> for details.</p>

      <h2 className="text-xl font-semibold mt-8">8. Contact</h2>
      <p>For privacy-related questions: <a href="mailto:privacy@tidedesk.co.nz" className="text-primary underline">privacy@tidedesk.co.nz</a></p>
    </article>
  );
}
