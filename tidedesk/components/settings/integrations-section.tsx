"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Integration = {
  id: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  hasConfig: boolean;
  companyShortname?: string;
};

type SyncLog = {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  itemsSynced: number;
  itemsSkipped: number;
  itemsFailed: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type Company = { shortname: string; name: string; currency: string };

export function IntegrationsSection() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [fareharbor, setFareharbor] = useState({
    apiKey: "",
    webhookSecret: "",
    companyShortname: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; companies?: string[] } | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const fhIntegration = integrations.find((i) => i.provider === "FAREHARBOR");

  const loadIntegrations = useCallback(async () => {
    const res = await fetch("/api/integrations");
    const json = (await res.json()) as { data?: Integration[] };
    if (json.data) {
      setIntegrations(json.data);
      const fh = json.data.find((i) => i.provider === "FAREHARBOR");
      if (fh?.companyShortname) {
        setFareharbor((f) => ({ ...f, companyShortname: fh.companyShortname ?? "" }));
      }
    }
  }, []);

  const loadSyncLogs = useCallback(async () => {
    const res = await fetch("/api/integrations/fareharbor/logs");
    if (res.ok) {
      const json = (await res.json()) as { data?: SyncLog[] };
      if (json.data) setSyncLogs(json.data);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
    loadSyncLogs();
  }, [loadIntegrations, loadSyncLogs]);

  async function saveFareHarbor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "FAREHARBOR",
          apiKey: fareharbor.apiKey.trim() || undefined,
          webhookSecret: fareharbor.webhookSecret.trim() || undefined,
          companyShortname: fareharbor.companyShortname.trim() || undefined,
          isActive: fareharbor.isActive,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Failed to save.");
        return;
      }
      setFareharbor((f) => ({ ...f, apiKey: "", webhookSecret: "" }));
      setSuccess("FareHarbor credentials saved.");
      router.refresh();
      await loadIntegrations();
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/fareharbor/test", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; companies?: string[]; error?: string };
      setTestResult(json);
      if (!json.ok) {
        setError(json.error ?? "Test failed");
      }
    } catch {
      setError("Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function fetchCompanies() {
    setLoadingCompanies(true);
    try {
      const res = await fetch("/api/integrations/fareharbor/companies");
      if (res.ok) {
        const json = (await res.json()) as { data?: Company[] };
        if (json.data) setCompanies(json.data);
      }
    } finally {
      setLoadingCompanies(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations/fareharbor/sync", { method: "POST" });
      const json = (await res.json()) as {
        data?: { synced: number; skipped: number; failed: number; errors: string[] };
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Sync failed");
        return;
      }
      if (json.data) {
        setSyncResult({
          synced: json.data.synced,
          skipped: json.data.skipped,
          failed: json.data.failed,
        });
      }
      await loadIntegrations();
      await loadSyncLogs();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-2 text-sm">
          {success}
        </div>
      )}

      {/* FareHarbor Integration */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">FareHarbor</h3>
            <p className="text-sm text-muted-foreground">
              Import bookings and payments from your FareHarbor account. Syncs
              automatically every 4 hours, or trigger manually below.
            </p>
          </div>
          {fhIntegration?.isActive && fhIntegration.hasConfig ? (
            <Badge variant="completed">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>

        {fhIntegration?.lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last sync: {new Date(fhIntegration.lastSyncAt).toLocaleString()}
          </p>
        )}

        {/* Credentials form */}
        <form onSubmit={saveFareHarbor} className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="fh-apiKey">API Key</Label>
            <Input
              id="fh-apiKey"
              type="password"
              placeholder="Paste your FareHarbor API key"
              value={fareharbor.apiKey}
              onChange={(e) => setFareharbor((f) => ({ ...f, apiKey: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fh-webhook">Webhook Secret (optional)</Label>
            <Input
              id="fh-webhook"
              type="password"
              placeholder="For webhook-based real-time sync"
              value={fareharbor.webhookSecret}
              onChange={(e) =>
                setFareharbor((f) => ({ ...f, webhookSecret: e.target.value }))
              }
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Webhook URL:{" "}
              <code className="bg-muted px-1 rounded text-xs">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/fareharbor?business=YOUR_BUSINESS_ID
              </code>
            </p>
          </div>

          {/* Company shortname */}
          <div className="grid gap-2">
            <Label htmlFor="fh-company">Company Shortname</Label>
            <div className="flex gap-2">
              <Input
                id="fh-company"
                placeholder="e.g. mount-surf-academy"
                value={fareharbor.companyShortname}
                onChange={(e) =>
                  setFareharbor((f) => ({ ...f, companyShortname: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchCompanies}
                disabled={loadingCompanies || !fhIntegration?.hasConfig}
              >
                {loadingCompanies ? "Loading…" : "Fetch"}
              </Button>
            </div>
            {companies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {companies.map((c) => (
                  <button
                    key={c.shortname}
                    type="button"
                    className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                    onClick={() =>
                      setFareharbor((f) => ({
                        ...f,
                        companyShortname: c.shortname,
                      }))
                    }
                  >
                    {c.name} ({c.shortname})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fh-active"
              checked={fareharbor.isActive}
              onChange={(e) =>
                setFareharbor((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="rounded border"
            />
            <Label htmlFor="fh-active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !fareharbor.apiKey.trim()}>
              {loading ? "Saving…" : "Connect / Update"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={testing || !fhIntegration?.hasConfig}
            >
              {testing ? "Testing…" : "Test Connection"}
            </Button>
          </div>
        </form>

        {/* Test result */}
        {testResult && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              testResult.ok
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {testResult.ok ? (
              <>
                Connection successful. Companies:{" "}
                {testResult.companies?.join(", ") || "none"}
              </>
            ) : (
              "Connection failed. Check your API key."
            )}
          </div>
        )}

        {/* Sync controls */}
        {fhIntegration?.hasConfig && fhIntegration.isActive && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Booking Sync</h4>
                <p className="text-xs text-muted-foreground">
                  Imports bookings from the last 30 days through 90 days ahead.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerSync}
                disabled={syncing}
              >
                {syncing ? "Syncing…" : "Sync Now"}
              </Button>
            </div>

            {syncResult && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                Sync complete: <strong>{syncResult.synced}</strong> imported,{" "}
                <strong>{syncResult.skipped}</strong> unchanged,{" "}
                <strong>{syncResult.failed}</strong> failed
              </div>
            )}

            {/* Sync history */}
            {syncLogs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Syncs</h4>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-1.5 font-medium">Date</th>
                        <th className="text-left px-3 py-1.5 font-medium">Status</th>
                        <th className="text-right px-3 py-1.5 font-medium">Imported</th>
                        <th className="text-right px-3 py-1.5 font-medium">Skipped</th>
                        <th className="text-right px-3 py-1.5 font-medium">Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="border-t">
                          <td className="px-3 py-1.5">
                            {new Date(log.startedAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5">
                            <Badge
                              variant={
                                log.status === "COMPLETED"
                                  ? "completed"
                                  : log.status === "RUNNING"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5 text-right">{log.itemsSynced}</td>
                          <td className="px-3 py-1.5 text-right">{log.itemsSkipped}</td>
                          <td className="px-3 py-1.5 text-right">{log.itemsFailed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stripe Connect */}
      <div className="rounded-lg border p-4">
        <h3 className="font-medium">Stripe Connect</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Accept card payments from customers. Configure in{" "}
          <a
            href="/settings?tab=payment"
            className="text-primary underline hover:no-underline"
          >
            Settings → Payment
          </a>
          .
        </p>
      </div>
    </div>
  );
}
