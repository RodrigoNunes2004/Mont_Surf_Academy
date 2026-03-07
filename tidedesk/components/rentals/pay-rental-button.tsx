"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export function PayRentalButton({
  rentalId,
  amount,
  disabled,
}: {
  rentalId: string;
  amount: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe/checkout/rental", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rentalId }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok) {
        alert(data?.error ?? "Failed to create payment link");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handlePay}
      disabled={disabled || loading}
      className="gap-1.5"
    >
      <CreditCard className="size-3.5" />
      {loading ? "Redirecting…" : `Pay ${amount}`}
    </Button>
  );
}
