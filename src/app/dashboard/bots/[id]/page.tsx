import Link from "next/link";
import { notFound } from "next/navigation";
import { BotWorkspace } from "@/components/bot-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getPublicOrigin } from "@/lib/origin";
import { getBot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }, origin] = await Promise.all([
    params,
    searchParams,
    getPublicOrigin(),
  ]);
  const bot = await getBot(id);
  if (!bot) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← Bots
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-4xl">{bot.name}</h1>
            <Badge variant="outline">{bot.tone}</Badge>
            {bot.articles.length === 0 ? (
              <Badge variant="secondary">Needs knowledge</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            {bot.description || "Add a description in Settings."}
          </p>
        </div>
        <BotWorkspace bot={bot} origin={origin} initialTab={tab} />
      </main>
      <SiteFooter />
    </div>
  );
}
