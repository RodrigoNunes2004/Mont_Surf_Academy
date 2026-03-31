import { requireSession } from "@/lib/server/session";
import { getBusinessTier, getTierContext } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "./shell";

function sanitizeLogoUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.pathname;
    }
  } catch {
    // Already a relative path — fine
  }
  return url;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const businessId = session.user.businessId!;
  const [tier, tierInfo, business] = await Promise.all([
    getBusinessTier(businessId),
    getTierContext(businessId),
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { name: true, logoUrl: true },
    }),
  ]);
  const whiteLabelEnabled = hasFeature(tier, "white-label");

  return (
    <DashboardShell
      sidebar={<DashboardSidebar role={session.user.role} />}
      tier={tier}
      tierInfo={tierInfo}
      businessBrand={{
        name: business.name,
        logoUrl: sanitizeLogoUrl(business.logoUrl),
        whiteLabelEnabled,
      }}
    >
      {children}
    </DashboardShell>
  );
}

