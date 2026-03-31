import { requireSession } from "@/lib/server/session";
import { getBusinessTier, getTierContext } from "@/lib/tiers/get-business-tier";
import { hasFeature } from "@/lib/tiers";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "./shell";

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
        logoUrl: business.logoUrl,
        whiteLabelEnabled,
      }}
    >
      {children}
    </DashboardShell>
  );
}

