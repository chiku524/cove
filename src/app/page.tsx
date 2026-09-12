import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Plug } from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { sampleQuestions } from "@/lib/questions";
import { getDemoBot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const demo = await getDemoBot();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-12 md:py-16">
        <section className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="pt-2">
            <p className="text-primary mb-4 text-xs font-medium tracking-[0.18em] uppercase">
              Support infrastructure
            </p>
            <h1 className="font-heading text-[2.6rem] leading-[1.05] text-pretty sm:text-6xl">
              An AI support bot you can drop into any product.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">
              Cove is a small support service: write knowledge articles, get a
              bot, then call it from a REST API, a TypeScript SDK, or MCP.
              No extra help-desk tab for your users.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">Read the integration docs</Link>
              </Button>
            </div>
            <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
              <li className="rounded-xl border border-border bg-card p-4">
                <Plug className="text-primary mb-2 size-4" />
                <strong className="block">API</strong>
                <span className="text-muted-foreground">
                  One POST to /api/v1/chat with a bearer key.
                </span>
              </li>
              <li className="rounded-xl border border-border bg-card p-4">
                <Code2 className="text-primary mb-2 size-4" />
                <strong className="block">SDK</strong>
                <span className="text-muted-foreground">
                  cove.chat() and cove.search() from any TypeScript app.
                </span>
              </li>
              <li className="rounded-xl border border-border bg-card p-4">
                <BookOpen className="text-primary mb-2 size-4" />
                <strong className="block">MCP</strong>
                <span className="text-muted-foreground">
                  Tools for Cursor and other agents: ask, search, list.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground mb-3 text-xs tracking-wide uppercase">
              Live demo{demo ? ` · ${demo.name}` : ""}
            </p>
            {demo ? (
              <ChatPanel
                apiKey={demo.apiKey}
                welcome={demo.welcomeMessage}
                botName={demo.name}
                suggestions={sampleQuestions(demo.articles)}
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-2xl border border-border bg-card px-6 text-center text-sm">
                Create a bot in the dashboard to start the live demo.
              </div>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              Tap a suggestion or ask about billing, invites, or API tokens.
            </p>
          </div>
        </section>

        <section className="grid gap-6">
          <h2 className="font-heading text-3xl">Three steps, then ship it</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-border bg-card p-5">
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                01
              </p>
              <h3 className="mt-2 text-base font-medium">Create a bot</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Name it, set the tone, and write a welcome line customers will
                see in the widget.
              </p>
            </li>
            <li className="rounded-2xl border border-border bg-card p-5">
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                02
              </p>
              <h3 className="mt-2 text-base font-medium">Teach it your docs</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Add short articles. Cove cites the ones it used, and suggests
                the next question to ask.
              </p>
            </li>
            <li className="rounded-2xl border border-border bg-card p-5">
              <p className="text-primary text-xs font-medium tracking-wide uppercase">
                03
              </p>
              <h3 className="mt-2 text-base font-medium">Call it from anywhere</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Copy the API key into curl, the TypeScript SDK, MCP, or a one-line
                embed script.
              </p>
            </li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
