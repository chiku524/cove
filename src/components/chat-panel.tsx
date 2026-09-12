"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export function ChatPanel({
  apiKey,
  welcome,
  className,
}: {
  apiKey: string;
  welcome: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: welcome },
  ]);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message || pending) return;
    setValue("");
    setError(null);
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: "user", content: message },
    ]);
    setPending(true);
    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "The bot could not answer.");
      }
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          citations: data.citations,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-muted text-foreground",
              )}
            >
              {message.content}
              {message.citations && message.citations.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.citations.map((citation) => (
                    <Badge
                      key={citation.articleId}
                      variant="outline"
                      className="border-border/70 bg-background/40 font-normal"
                    >
                      {citation.title}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {pending ? (
            <div className="text-muted-foreground flex items-center gap-2 self-start px-1 text-xs">
              <LoaderCircle className="size-3.5 animate-spin" />
              Searching the knowledge base
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      {error ? (
        <p className="text-destructive px-4 pb-2 text-xs">{error}</p>
      ) : null}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask about billing, invites, API tokens…"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !value.trim()}>
          <Send />
          Send
        </Button>
      </form>
    </div>
  );
}
