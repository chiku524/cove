"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function safeNext(value: string | null) {
  if (value && value.startsWith("/dashboard")) return value;
  return "/dashboard";
}

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "sign-in" | "sign-up";
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(nextPath ?? null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ name, email, password })
          : await authClient.signIn.email({ email, password });
      if (result.error) {
        throw new Error(result.error.message || "Could not authenticate.");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not authenticate.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {mode === "sign-up" ? (
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nico"
            required
            autoComplete="name"
          />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending
          ? mode === "sign-up"
            ? "Creating account…"
            : "Signing in…"
          : mode === "sign-up"
            ? "Create account"
            : "Sign in"}
      </Button>
      <p className="text-muted-foreground text-sm">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link
              href={`/sign-in?next=${encodeURIComponent(next)}`}
              className="text-foreground underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Cove?{" "}
            <Link
              href={`/sign-up?next=${encodeURIComponent(next)}`}
              className="text-foreground underline"
            >
              Create a free account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
