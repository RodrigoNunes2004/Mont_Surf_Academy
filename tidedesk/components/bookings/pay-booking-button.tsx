"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export function PayBookingButton({
  bookingId,
  amount,
  disabled,
}: {
  bookingId: string;
  amount: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe/checkout/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId }),
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
