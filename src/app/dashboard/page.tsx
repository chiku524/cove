import Link from "next/link";
import { CreateBotDialog } from "@/components/create-bot-dialog";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listBots } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bots = await listBots();

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
        {bots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-8">
              <div>
                <h2 className="text-lg font-medium">No bots yet</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Create one, add a few articles, then paste the API key into
                  your app.
                </p>
              </div>
              <CreateBotDialog triggerLabel="Create your first bot" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bots.map((bot) => (
              <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <Badge variant="outline">
                      {bot.articles.length} articles
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-muted-foreground grid gap-2 text-sm">
                    <p>{bot.description || "No description yet."}</p>
                    <p className="font-mono text-xs">{bot.slug}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
