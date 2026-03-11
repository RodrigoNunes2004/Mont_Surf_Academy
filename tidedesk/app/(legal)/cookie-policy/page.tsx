import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | TideDesk",
  description: "TideDesk cookie policy – how we use cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <article className="space-y-6 text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed">
      <h1 className="text-3xl font-bold">Cookie Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2 className="text-xl font-semibold mt-8">1. What Are Cookies</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and keep you signed in.</p>

      <h2 className="text-xl font-semibold mt-8">2. Cookies We Use</h2>
      <h3 className="text-lg font-medium mt-6">2.1 Essential Cookies</h3>
      <p>These are required for the platform to work:</p>
      <ul>
        <li><strong>Session / authentication cookies</strong> – Keep you signed in</li>
        <li><strong>Security cookies</strong> – Protect against cross-site request forgery</li>
      </ul>
      <h3 className="text-lg font-medium mt-6">2.2 Functional Cookies</h3>
      <p>These improve your experience:</p>
      <ul>
        <li><strong>Preference cookies</strong> – Remember your settings (e.g. theme)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">3. Third-Party Cookies</h2>
      <p>We may use third-party services that set cookies:</p>
      <ul>
        <li><strong>Stripe</strong> – For payment processing</li>
        <li><strong>Analytics</strong> – If we add analytics (e.g. Vercel Analytics), they may use cookies</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8">4. Managing Cookies</h2>
      <p>You can control cookies through your browser settings. Disabling essential cookies may prevent you from using parts of TideDesk.</p>

      <h2 className="text-xl font-semibold mt-8">5. Contact</h2>
      <p>For questions: <a href="mailto:privacy@tidedesk.co.nz" className="text-primary underline">privacy@tidedesk.co.nz</a></p>
    </article>
  );
}
