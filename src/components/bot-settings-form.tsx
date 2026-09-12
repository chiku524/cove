"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Bot, Tone } from "@/lib/types";

const TONES: { id: Tone; label: string }[] = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "concise", label: "Concise" },
];

export function BotSettingsForm({ bot }: { bot: Bot }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: bot.name,
    description: bot.description,
    instructions: bot.instructions,
    welcomeMessage: bot.welcomeMessage,
    handoffMessage: bot.handoffMessage,
    tone: bot.tone,
  });
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/v1/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Save failed");
      toast.success("Bot settings saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label>Tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Button
              key={tone.id}
              type="button"
              size="sm"
              variant={form.tone === tone.id ? "default" : "outline"}
              onClick={() =>
                setForm((current) => ({ ...current, tone: tone.id }))
              }
            >
              {tone.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="welcome">Welcome message</Label>
        <Textarea
          id="welcome"
          rows={3}
          value={form.welcomeMessage}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              welcomeMessage: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="handoff">Handoff message</Label>
        <Textarea
          id="handoff"
          rows={3}
          value={form.handoffMessage}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              handoffMessage: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          rows={6}
          value={form.instructions}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              instructions: event.target.value,
            }))
          }
        />
      </div>
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
