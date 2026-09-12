"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateBotDialog({
  triggerLabel = "New bot",
}: {
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create bot.");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/dashboard/bots/${data.bot.id}?tab=knowledge`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create bot.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onCreate} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Create a support bot</DialogTitle>
            <DialogDescription>
              Give it a name customers will see. You can add knowledge and an
              API key next.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="bot-name">Name</Label>
            <Input
              id="bot-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Help"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bot-desc">What it covers</Label>
            <Textarea
              id="bot-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Billing, account access, and onboarding for Acme Cloud."
              rows={3}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Creating…" : "Create bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
