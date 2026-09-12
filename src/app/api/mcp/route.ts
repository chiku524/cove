import { requireBot } from "@/lib/auth";
import { corsPreflight, handlePublic, json } from "@/lib/http";
import { handleMcp } from "@/lib/mcp-protocol";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  return handlePublic(async () => {
    const auth = await requireBot(request);
    if (auth.error) return auth.error;
    return json({
      name: "cove",
      version: "0.1.0",
      protocol: "json-rpc-2.0",
      bot: { id: auth.bot.id, name: auth.bot.name },
      tools: ["cove_ask", "cove_search", "cove_list_articles"],
    });
  });
}

export async function POST(request: Request) {
  return handlePublic(async () => {
    const auth = await requireBot(request);
    if (auth.error) return auth.error;
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        },
        { status: 400 },
      );
    }
    const response = await handleMcp(auth.bot, payload);
    if (!response) return new Response(null, { status: 204 });
    return json(response);
  });
}
