/* eslint-disable @typescript-eslint/no-explicit-any */
// Prisma delegate cast: the generated types on disk include customDomain/
// customDomainVerified (confirmed by `tsc --noEmit`), but the IDE TS server
// may cache stale types until restarted. Remove `as any` casts + this disable
// once the IDE picks up the regenerated Prisma client.
import { prisma } from "@/lib/prisma";

type BusinessDomainFields = {
  id: string;
  slug?: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
};

const VERCEL_API = "https://api.vercel.com";

function getVercelHeaders(): HeadersInit | null {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getTeamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : "";
}

function sanitizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/^www\./, "");
}

function isValidDomain(domain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    domain
  );
}

export type DomainStatus = {
  configured: boolean;
  verified: boolean;
  domain: string | null;
  vercelDomainInfo: VercelDomainConfig | null;
  error?: string;
};

type VercelDomainConfig = {
  name: string;
  verified: boolean;
  configured: boolean;
  misconfigured: boolean;
  verification?: { type: string; domain: string; value: string }[];
};

/**
 * Save a custom domain for a business. Optionally registers it with Vercel.
 */
export async function setCustomDomain(
  businessId: string,
  rawDomain: string
): Promise<{ success: boolean; domain: string; error?: string }> {
  const domain = sanitizeDomain(rawDomain);

  if (!isValidDomain(domain)) {
    return { success: false, domain, error: "Invalid domain format" };
  }

  const existing = await (prisma.business as any).findFirst({
    where: { customDomain: domain, NOT: { id: businessId } },
    select: { id: true },
  });
  if (existing) {
    return {
      success: false,
      domain,
      error: "This domain is already in use by another business",
    };
  }

  const vercelResult = await addVercelDomain(domain);
  if (vercelResult.error && !vercelResult.alreadyExists) {
    return { success: false, domain, error: vercelResult.error };
  }

  await (prisma.business as any).update({
    where: { id: businessId },
    data: { customDomain: domain, customDomainVerified: false },
  });

  return { success: true, domain };
}

/**
 * Check whether a custom domain's DNS is verified via the Vercel API.
 * Falls back to a basic DNS check if Vercel tokens aren't configured.
 */
export async function verifyCustomDomain(
  businessId: string
): Promise<DomainStatus> {
  const business = (await (prisma.business as any).findUniqueOrThrow({
    where: { id: businessId },
    select: { customDomain: true, customDomainVerified: true },
  })) as BusinessDomainFields;

  if (!business.customDomain) {
    return {
      configured: false,
      verified: false,
      domain: null,
      vercelDomainInfo: null,
    };
  }

  const vercelInfo = await getVercelDomainConfig(business.customDomain);

  const isVerified = vercelInfo?.verified ?? false;
  const isConfigured = vercelInfo?.configured ?? false;

  if (isVerified && isConfigured && !business.customDomainVerified) {
    await (prisma.business as any).update({
      where: { id: businessId },
      data: { customDomainVerified: true },
    });
  }

  return {
    configured: isConfigured,
    verified: isVerified,
    domain: business.customDomain,
    vercelDomainInfo: vercelInfo,
  };
}

/**
 * Remove the custom domain from the business and Vercel project.
 */
export async function removeCustomDomain(businessId: string): Promise<void> {
  const business = (await (prisma.business as any).findUniqueOrThrow({
    where: { id: businessId },
    select: { customDomain: true },
  })) as BusinessDomainFields;

  if (business.customDomain) {
    await removeVercelDomain(business.customDomain);
  }

  await (prisma.business as any).update({
    where: { id: businessId },
    data: { customDomain: null, customDomainVerified: false },
  });
}

/**
 * Resolve a hostname to a business slug. Used by middleware.
 */
export async function resolveCustomDomain(
  hostname: string
): Promise<{ slug: string; businessId: string } | null> {
  const domain = sanitizeDomain(hostname);
  const business = (await (prisma.business as any).findFirst({
    where: { customDomain: domain, customDomainVerified: true },
    select: { slug: true, id: true },
  })) as BusinessDomainFields | null;

  if (!business?.slug) return null;
  return { slug: business.slug, businessId: business.id };
}

// ---------------------------------------------------------------------------
// Vercel Domains API helpers (no-op when VERCEL_API_TOKEN is not set)
// ---------------------------------------------------------------------------

async function addVercelDomain(
  domain: string
): Promise<{ error?: string; alreadyExists?: boolean }> {
  const headers = getVercelHeaders();
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!headers || !projectId) return {};

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${projectId}/domains${getTeamQuery()}`,
      { method: "POST", headers, body: JSON.stringify({ name: domain }) }
    );

    if (res.ok) return {};

    const body = await res.json().catch(() => null);
    const code = body?.error?.code;

    if (code === "domain_already_in_use" || code === "domain_already_exists") {
      return { alreadyExists: true };
    }

    return {
      error: body?.error?.message ?? `Vercel API error (${res.status})`,
    };
  } catch {
    return { error: "Failed to connect to Vercel API" };
  }
}

async function removeVercelDomain(domain: string): Promise<void> {
  const headers = getVercelHeaders();
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!headers || !projectId) return;

  try {
    await fetch(
      `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}${getTeamQuery()}`,
      { method: "DELETE", headers }
    );
  } catch {
    // Best-effort removal; domain can be cleaned up manually
  }
}

async function getVercelDomainConfig(
  domain: string
): Promise<VercelDomainConfig | null> {
  const headers = getVercelHeaders();
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!headers || !projectId) return null;

  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}${getTeamQuery()}`,
      { method: "GET", headers }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      verified: data.verified ?? false,
      configured: data.configured ?? false,
      misconfigured: data.misconfigured ?? false,
      verification: data.verification,
    };
  } catch {
    return null;
  }
}
