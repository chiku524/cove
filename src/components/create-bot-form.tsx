"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { navigate } from "@/lib/nav";

export function CreateBotForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!name) {
      setError("Give the bot a name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/bots", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
        signal: AbortSignal.timeout(20_000),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Could not create bot.");
      }
      navigate(`/dashboard/bots/${payload.bot.id}?tab=knowledge`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create bot.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onCreate} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="new-bot-name">Name</Label>
        <Input
          id="new-bot-name"
          name="name"
          placeholder="Acme Help"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-bot-desc">What it covers</Label>
        <Textarea
          id="new-bot-desc"
          name="description"
          placeholder="Billing, account access, and onboarding for Acme Cloud."
          rows={3}
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create bot"}
      </Button>
    </form>
  );
}
