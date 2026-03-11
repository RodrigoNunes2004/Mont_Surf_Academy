import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/landing/site-footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get in touch with the TideDesk team for support, partnerships, or general enquiries.
        </p>
        <p className="text-sm">
          Email: <a href="mailto:support@tidedesk.co.nz" className="text-primary underline">support@tidedesk.co.nz</a>
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
