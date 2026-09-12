"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { Skeleton } from "@/components/ui/skeleton";

export function LandingDemo() {
  const [demo, setDemo] = useState<{
    apiKey: string;
    welcome: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/demo")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Demo unavailable");
        setDemo({
          apiKey: data.apiKey,
          welcome: data.bot.welcomeMessage,
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Demo unavailable");
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-2xl border border-border bg-card px-6 text-center text-sm">
        {error}
      </div>
    );
  }

  if (!demo) {
    return <Skeleton className="h-[560px] rounded-2xl" />;
  }

  return <ChatPanel apiKey={demo.apiKey} welcome={demo.welcome} />;
}
