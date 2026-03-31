"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Trash2,
  RefreshCcw,
  Copy,
  ExternalLink,
} from "lucide-react";

type DomainStatus = {
  configured: boolean;
  verified: boolean;
  domain: string | null;
  vercelDomainInfo: {
    name: string;
    verified: boolean;
    configured: boolean;
    misconfigured: boolean;
    verification?: { type: string; domain: string; value: string }[];
  } | null;
  error?: string;
};

export function CustomDomainSection() {
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/business/custom-domain");
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data);
      }
    } catch {
      // Silently fail; user sees empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleSave() {
    if (!newDomain.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save domain.");
        return;
      }
      setNewDomain("");
      await fetchStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      await fetchStatus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this custom domain? Your booking page will revert to the default TideDesk URL.")) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch("/api/business/custom-domain", {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to remove domain.");
        return;
      }
      setStatus(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasDomain = !!status?.domain;
  const isVerified = status?.verified && status?.configured;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5" />
          Custom Domain
        </CardTitle>
        <CardDescription>
          Use your own domain for the public booking page instead of{" "}
          <code className="text-xs">tidedesk.app/book/your-slug</code>.
          Requires a Premium plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {!hasDomain ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-domain"
                  placeholder="book.yourbusiness.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <Button onClick={handleSave} disabled={saving || !newDomain.trim()}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a subdomain (e.g.{" "}
                <code className="font-mono">book.yourdomain.com</code>) or
                apex domain. You&apos;ll need to configure DNS after adding it.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Domain status badge */}
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-muted-foreground" />
                <div>
                  <a
                    href={`https://${status.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium hover:underline"
                  >
                    {status.domain}
                    <ExternalLink className="size-3" />
                  </a>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-green-600" />
                        <span className="text-green-700 dark:text-green-400">
                          Verified &amp; Active
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="size-3.5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">
                          Pending DNS verification
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCcw className="mr-1 size-3.5" />
                      Check
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={removing}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {removing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* DNS instructions (show when not yet verified) */}
            {!isVerified && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <h4 className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-200">
                  DNS Configuration Required
                </h4>
                <p className="mb-4 text-xs text-amber-700 dark:text-amber-300">
                  Add the following DNS record with your domain provider to
                  point your domain to TideDesk.
                </p>

                <DnsRecordTable
                  domain={status.domain!}
                  verification={status.vercelDomainInfo?.verification}
                  onCopy={handleCopy}
                  copied={copied}
                />

                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                  DNS changes can take up to 48 hours to propagate. Click
                  &quot;Check&quot; to verify once configured.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DnsRecordTable({
  domain,
  verification,
  onCopy,
  copied,
}: {
  domain: string;
  verification?: { type: string; domain: string; value: string }[];
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  const isSubdomain = domain.split(".").length > 2;

  const records = verification?.length
    ? verification.map((v) => ({
        type: v.type.toUpperCase(),
        name: v.domain,
        value: v.value,
      }))
    : [
        {
          type: isSubdomain ? "CNAME" : "A",
          name: isSubdomain ? domain.split(".")[0] : "@",
          value: isSubdomain ? "cname.vercel-dns.com" : "76.76.21.21",
        },
      ];

  return (
    <div className="overflow-x-auto rounded border bg-white dark:bg-slate-900">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-2 font-medium text-muted-foreground">Type</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">Value</th>
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2 font-mono">{r.type}</td>
              <td className="px-3 py-2 font-mono">{r.name}</td>
              <td className="px-3 py-2 font-mono">{r.value}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onCopy(r.value)}
                  className="rounded p-1 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copy value"
                >
                  {copied ? (
                    <CheckCircle2 className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
