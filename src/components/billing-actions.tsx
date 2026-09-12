"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingActions({
  plan,
  hasCustomer,
}: {
  plan: "free" | "pro";
  hasCustomer: boolean;
}) {
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(path: "/api/stripe/checkout" | "/api/stripe/portal") {
    setPending(path.includes("checkout") ? "checkout" : "portal");
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Could not open Stripe.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Stripe.");
      setPending(null);
    }
  }

  return (
    <div className="grid gap-3">
      {plan === "free" ? (
        <Button
          onClick={() => start("/api/stripe/checkout")}
          disabled={pending !== null}
        >
          {pending === "checkout" ? "Redirecting to Stripe…" : "Upgrade to Pro — $19/month"}
        </Button>
      ) : null}
      {hasCustomer ? (
        <Button
          variant={plan === "pro" ? "default" : "outline"}
          onClick={() => start("/api/stripe/portal")}
          disabled={pending !== null}
        >
          {pending === "portal" ? "Opening portal…" : "Manage subscription"}
        </Button>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
