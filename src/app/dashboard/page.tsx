import { BotList } from "@/components/bot-list";
import { CreateBotDialog } from "@/components/create-bot-dialog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { conversationCounts, listBots } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [bots, counts] = await Promise.all([listBots(), conversationCounts()]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-4xl">Bots</h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm">
              Each bot has its own knowledge base, API key, SDK snippet, and MCP
              endpoint.
            </p>
          </div>
          <CreateBotDialog />
        </div>
        <BotList bots={bots} counts={counts} />
      </main>
      <SiteFooter />
    </div>
  );
}
