"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSelectWithCreate } from "@/components/ui/customer-select-with-create";
import { Loader2 } from "lucide-react";

type Customer = { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
type Category = { id: string; name: string };
type Variant = {
  id: string;
  label: string;
  categoryId: string;
  category: { name: string };
};
type Business = {
  currency: string | null;
  chargesEnabled: boolean | null;
  stripeAccountId: string | null;
} | null;

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function BeachQuickRentalSection({
  customers,
  categories,
  variants,
  business,
}: {
  customers: Customer[];
  categories: Category[];
  variants: Variant[];
  business: Business;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priceTotal, setPriceTotal] = useState("");
  const [method, setMethod] = useState<"CASH" | "EFTPOS" | "CARD">("CASH");

  const now = useMemo(() => new Date(), []);
  const [startAt, setStartAt] = useState(toDateTimeLocalValue(now));
  const [endAt, setEndAt] = useState(toDateTimeLocalValue(addMinutes(now, 120)));

  const variantsForCategory = useMemo(
    () => variants.filter((v) => v.categoryId === categoryId),
    [variants, categoryId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        equipmentVariantId: variantId,
        quantity: Math.max(1, Math.trunc(Number(quantity)) || 1),
        priceTotal: Number(priceTotal) || 0,
        method,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }),
    });

    if (!res.ok) {
      setLoading(false);
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Failed to create rental.");
      return;
    }

    const { data: rental } = (await res.json()) as { data: { id: string; status: string } };

    if (method === "CARD") {
      const checkoutRes = await fetch("/api/payments/stripe/checkout/rental", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rentalId: rental.id }),
      });
      setLoading(false);

      if (!checkoutRes.ok) {
        const payload = (await checkoutRes.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Connect Stripe in Settings → Payment.");
        return;
      }

      const { url } = (await checkoutRes.json()) as { url?: string };
      if (url) {
        resetForm();
        router.refresh();
        window.location.assign(url);
        return;
      }
    }

    setLoading(false);
    resetForm();
    router.refresh();
  }

  function resetForm() {
    setCustomerId("");
    setCategoryId("");
    setVariantId("");
    setQuantity("1");
    setPriceTotal("");
    setMethod("CASH");
    const n = new Date();
    setStartAt(toDateTimeLocalValue(n));
    setEndAt(toDateTimeLocalValue(addMinutes(n, 120)));
  }

  const canSubmit =
    customerId &&
    variantId &&
    priceTotal &&
    Number(priceTotal) > 0 &&
    !loading;

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick rental</CardTitle>
        <p className="text-sm text-muted-foreground">
          New equipment rental
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="beach-customer">Customer</Label>
            <CustomerSelectWithCreate
              customers={customers}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder="Search or add…"
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <select
              className="flex min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setVariantId("");
              }}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Size / variant</Label>
            <select
              className="flex min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              disabled={!categoryId}
            >
              <option value="">{categoryId ? "Select…" : "Category first"}</option>
              {variantsForCategory.map((v: Variant) => (
                <option key={v.id} value={v.id}>
                  {v.category.name} {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="beach-qty">Qty</Label>
              <Input
                id="beach-qty"
                type="number"
                min={1}
                className="min-h-12"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beach-price">Price</Label>
              <Input
                id="beach-price"
                type="number"
                min={0}
                step="0.01"
                className="min-h-12"
                placeholder="0.00"
                value={priceTotal}
                onChange={(e) => setPriceTotal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment</Label>
            <select
              className="flex min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value as "CASH" | "EFTPOS" | "CARD")}
            >
              <option value="CASH">Cash</option>
              <option value="EFTPOS">EFTPOS</option>
              <option value="CARD">Card (Stripe)</option>
            </select>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="beach-action-btn min-h-14 w-full text-base font-semibold"
            disabled={!canSubmit}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Create rental"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
