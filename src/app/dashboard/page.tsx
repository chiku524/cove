import Link from "next/link";
import { BotList } from "@/components/bot-list";
import { CreateBotDialog } from "@/components/create-bot-dialog";
import { PlanUsage } from "@/components/plan-usage";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/session";
import { conversationCounts, getWorkspaceUsage, listBots } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const bots = await listBots(user.id);
  const [counts, usage] = await Promise.all([
    conversationCounts(bots.map((bot) => bot.id)),
    getWorkspaceUsage(user.id),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-4xl">Bots</h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm">
              Each bot has its own knowledge base, API key, SDK snippet, and MCP
              endpoint. These stay in your account.
            </p>
          </div>
          <CreateBotDialog disabled={usage.bots >= usage.plan.bots} />
        </div>
        <PlanUsage usage={usage} />
        {usage.bots >= usage.plan.bots ? (
          <p className="text-muted-foreground text-sm">
            You are on the bot limit for {usage.plan.name}.{" "}
            <Link href="/dashboard/billing" className="text-foreground underline">
              Upgrade to Pro
            </Link>{" "}
            to add more.
          </p>
        ) : null}
        <BotList bots={bots} counts={counts} />
      </main>
      <SiteFooter />
    </div>
  );
}
