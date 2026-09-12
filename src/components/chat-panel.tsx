"use client";

import { LoaderCircle, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestions?: string[];
  handoff?: boolean;
};

export function ChatPanel({
  apiKey,
  welcome,
  botName = "Support",
  suggestions = [],
  className,
}: {
  apiKey: string;
  welcome: string;
  botName?: string;
  suggestions?: string[];
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcome,
      suggestions,
    },
  ]);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(message: string) {
    if (!message || pending) return;
    setLastFailed(message);
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
      setLastFailed(null);
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          citations: data.citations,
          suggestions: data.suggestions,
          handoff: data.handoff,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcome,
        suggestions,
      },
    ]);
    setConversationId(undefined);
    setError(null);
    setLastFailed(null);
    inputRef.current?.focus();
  }

  const latest = messages.at(-1);
  const chips =
    !pending && latest?.role === "assistant" ? (latest.suggestions ?? []) : [];

  return (
    <div
      className={cn(
        "flex h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div>
          <p className="text-sm font-medium">{botName}</p>
          <p className="text-muted-foreground text-xs">Answers from your docs</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={messages.length === 1 && !error}
        >
          <RotateCcw />
          New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="flex flex-col gap-3 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : message.handoff
                    ? "self-start border border-destructive/30 bg-destructive/10 text-foreground"
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
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border/70 px-3 pt-3">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border border-border bg-background px-2.5 py-1 text-left text-xs hover:bg-muted"
              onClick={() => send(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="text-destructive flex items-center justify-between gap-2 px-4 pt-2 text-xs">
          <p>{error}</p>
          {lastFailed ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => send(lastFailed)}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(value.trim());
        }}
        className="flex items-end gap-2 p-3"
      >
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(value.trim());
            }
          }}
          placeholder="Ask a question"
          disabled={pending}
          rows={1}
          className="min-h-10 max-h-28 resize-none"
          aria-label="Message"
        />
        <Button type="submit" disabled={pending || !value.trim()}>
          <Send />
          Send
        </Button>
      </form>
    </div>
  );
}
