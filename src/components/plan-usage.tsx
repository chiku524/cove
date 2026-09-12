import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Plan } from "@/lib/plans";

export function PlanUsage({
  usage,
}: {
  usage: {
    plan: Plan;
    month: string;
    bots: number;
    articles: number;
    chats: number;
  };
}) {
  const items = [
    { label: "Bots", used: usage.bots, max: usage.plan.bots },
    { label: "Articles", used: usage.articles, max: usage.plan.articles },
    { label: "Chats this month", used: usage.chats, max: usage.plan.chatsPerMonth },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{usage.plan.name} plan</p>
            <Badge variant="outline">{usage.plan.priceLabel}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Usage for {usage.month}.{" "}
            {usage.plan.id === "free" ? (
              <Link href="/dashboard/billing" className="text-foreground underline">
                Upgrade to Pro
              </Link>
            ) : (
              <Link href="/dashboard/billing" className="text-foreground underline">
                Manage billing
              </Link>
            )}
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-muted-foreground text-xs">{item.label}</dt>
              <dd className="font-medium">
                {item.used.toLocaleString()} / {item.max.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
