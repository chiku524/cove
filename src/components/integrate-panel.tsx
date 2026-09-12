"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CopyBlock } from "@/components/copy-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Bot } from "@/lib/types";

export function IntegratePanel({
  bot,
  origin,
}: {
  bot: Bot;
  origin: string;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const key = revealed ? bot.apiKey : maskKey(bot.apiKey);

  async function rotate() {
    setPending(true);
    try {
      const response = await fetch(`/api/v1/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotateKey: true }),
      });
      if (!response.ok) throw new Error("Could not rotate key");
      toast.success("API key rotated");
      setRevealed(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rotate failed");
    } finally {
      setPending(false);
    }
  }

  const curl = `curl -s ${origin}/api/v1/chat \\
  -H "Authorization: Bearer ${bot.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"How do I reset my password?"}'`;

  const sdk = `import { Cove } from "./sdk";

const cove = new Cove({
  apiKey: "${bot.apiKey}",
  baseUrl: "${origin}",
});

const { reply, citations } = await cove.chat({
  message: "How do I invite a teammate?",
});`;

  const mcp = `{
  "mcpServers": {
    "cove": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "env": {
        "COVE_URL": "${origin}",
        "COVE_API_KEY": "${bot.apiKey}"
      }
    }
  }
}`;

  const remote = `POST ${origin}/api/mcp
Authorization: Bearer ${bot.apiKey}
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cove_ask","arguments":{"question":"What plans do you offer?"}}}`;

  const embed = `<script
  src="${origin}/embed.js"
  data-api-key="${bot.apiKey}"
  data-base-url="${origin}"
></script>`;

  return (
    <div className="grid gap-4">
      <ApiTester apiKey={bot.apiKey} origin={origin} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API key</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <code className="bg-muted block overflow-x-auto rounded-lg px-3 py-2 font-mono text-sm">
            {key}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? "Hide" : "Reveal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(bot.apiKey);
                toast.success("API key copied");
              }}
            >
              Copy
            </Button>
            <Button type="button" variant="ghost" onClick={rotate} disabled={pending}>
              {pending ? "Rotating…" : "Rotate key"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">REST API</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyBlock code={curl} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">TypeScript SDK</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyBlock code={sdk} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MCP (stdio)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-muted-foreground text-sm">
            Drop this into your Cursor MCP config so agents can ask this bot.
          </p>
          <CopyBlock code={mcp} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MCP (HTTP)</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyBlock code={remote} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embed widget</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyBlock code={embed} />
        </CardContent>
      </Card>
    </div>
  );
}

function maskKey(value: string) {
  if (value.length < 12) return "•".repeat(value.length);
  return `${value.slice(0, 10)}…${value.slice(-4)}`;
}

function ApiTester({ apiKey, origin }: { apiKey: string; origin: string }) {
  const [message, setMessage] = useState("How do I get started?");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setResult(data.reply);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Try the API</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-muted-foreground text-sm">
          Sends the same POST your SDK will make to {origin}/api/v1/chat.
        </p>
        <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Test question"
          />
          <Button type="submit" disabled={pending || !message.trim()}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </form>
        {result ? (
          <p className="bg-muted rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
