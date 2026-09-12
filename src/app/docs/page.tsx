import { CopyBlock } from "@/components/copy-block";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const origin = await getPublicOrigin();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10">
        <div>
          <h1 className="font-heading text-4xl">Integrate Cove</h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            Cove is a single service with three doors: REST, TypeScript SDK, and
            MCP. Every request is scoped to one bot by its API key.
          </p>
          <nav className="text-muted-foreground mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <a href="#rest" className="hover:text-foreground">
              REST
            </a>
            <a href="#sdk" className="hover:text-foreground">
              SDK
            </a>
            <a href="#mcp" className="hover:text-foreground">
              MCP
            </a>
            <a href="#embed" className="hover:text-foreground">
              Embed
            </a>
            <a href="#llm" className="hover:text-foreground">
              Optional LLM
            </a>
            <a href="#accounts" className="hover:text-foreground">
              Accounts
            </a>
          </nav>
        </div>

        <section id="rest" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">1. REST API</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Send a customer message to <code>/api/v1/chat</code>. Pass the same
            <code> conversationId</code> to keep follow-ups in context. The
            response includes <code>citations</code> and{" "}
            <code>suggestions</code> for follow-up chips.
          </p>
          <CopyBlock
            code={`curl -s ${origin}/api/v1/chat \\
  -H "Authorization: Bearer cove_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message":"How do I reset my password?"}'`}
          />
          <p className="text-muted-foreground text-sm">
            Search without answering: <code>POST /api/v1/search</code> with{" "}
            <code>{`{ "query": "billing" }`}</code>.
          </p>
        </section>

        <section id="sdk" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">2. TypeScript SDK</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Copy <code>sdk/index.ts</code> into your app. It is a thin fetch
            wrapper with no runtime dependencies.
          </p>
          <CopyBlock
            code={`import { Cove } from "./sdk";

const cove = new Cove({
  apiKey: process.env.COVE_API_KEY!,
  baseUrl: "${origin}",
});

const result = await cove.chat({
  message: "How do I invite a teammate?",
  metadata: { userId: "user_123" },
});

console.log(result.reply, result.citations, result.suggestions);`}
          />
        </section>

        <section id="mcp" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">3. MCP</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Point Cursor or another MCP client at the stdio server, or POST
            JSON-RPC to <code>/api/mcp</code>. Tools: <code>cove_ask</code>,{" "}
            <code>cove_search</code>, <code>cove_list_articles</code>.
          </p>
          <CopyBlock
            code={`{
  "mcpServers": {
    "cove": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "env": {
        "COVE_URL": "${origin}",
        "COVE_API_KEY": "cove_live_..."
      }
    }
  }
}`}
          />
          <CopyBlock
            code={`curl -s ${origin}/api/mcp \\
  -H "Authorization: Bearer cove_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}
          />
        </section>

        <section id="embed" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">4. Embed widget</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Drop this script on any page for a floating Ask button. The key is
            treated as a publishable widget key.
          </p>
          <CopyBlock
            code={`<script
  src="${origin}/embed.js"
  data-api-key="cove_live_..."
  data-base-url="${origin}"
></script>`}
          />
        </section>

        <section id="llm" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">Optional LLM</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cove answers from your articles with a retrieval engine so the demo
            works without a model key. Set <code>AI_GATEWAY_API_KEY</code> or{" "}
            <code>OPENAI_API_KEY</code> to generate replies with an LLM while
            still grounding on the same knowledge base.
          </p>
        </section>

        <section id="accounts" className="grid scroll-mt-20 gap-3">
          <h2 className="text-xl font-medium">Accounts and plans</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Creating and editing bots requires a signed-in Cove account. Chat,
            search, and MCP still authenticate with the bot API key so agents
            and widgets do not need a user session. Free includes one bot, eight
            articles, and 200 chats per month. Pro is $19/month.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
