"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/format";
import type { Bot } from "@/lib/types";

export function BotList({
  bots,
  counts,
}: {
  bots: Bot[];
  counts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bots;
    return bots.filter((bot) =>
      [bot.name, bot.description, bot.slug].join(" ").toLowerCase().includes(needle),
    );
  }, [bots, query]);

  if (bots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-8">
          <div>
            <h2 className="text-lg font-medium">No bots yet</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Create one, add a few articles, then paste the API key into your
              app.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/new">Create your first bot</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search bots"
        aria-label="Search bots"
        className="max-w-sm"
      />
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <h2 className="text-lg font-medium">No matching bots</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Try another name, or create a new bot.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((bot) => {
            const empty = bot.articles.length === 0;
            const href = empty
              ? `/dashboard/bots/${bot.id}?tab=knowledge`
              : `/dashboard/bots/${bot.id}`;
            return (
              <Link key={bot.id} href={href}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <Badge variant={empty ? "secondary" : "outline"}>
                      {empty
                        ? "Needs knowledge"
                        : `${bot.articles.length} articles`}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-muted-foreground grid gap-2 text-sm">
                    <p>{bot.description || "No description yet."}</p>
                    <p className="flex flex-wrap gap-x-3 text-xs">
                      <span className="font-mono">{bot.slug}</span>
                      <span>{counts[bot.id] ?? 0} chats</span>
                      <span>Updated {formatRelative(bot.updatedAt)}</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
