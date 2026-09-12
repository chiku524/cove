import { answerQuestion } from "@/lib/engine";
import { searchKnowledge } from "@/lib/engine";
import type { Bot } from "@/lib/types";

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const PROTOCOL = "2024-11-05";

export async function handleMcp(bot: Bot, payload: JsonRpc) {
  const id = payload.id ?? null;
  const method = payload.method ?? "";

  if (method === "initialize") {
    return result(id, {
      protocolVersion: PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: { name: "cove", version: "0.1.0" },
    });
  }

  if (method === "notifications/initialized" || method === "initialized") {
    return null;
  }

  if (method === "ping") {
    return result(id, {});
  }

  if (method === "tools/list") {
    return result(id, { tools: tools() });
  }

  if (method === "tools/call") {
    const name = String(payload.params?.name ?? "");
    const args = (payload.params?.arguments ?? {}) as Record<string, unknown>;
    try {
      const text = await callTool(bot, name, args);
      return result(id, {
        content: [{ type: "text", text }],
      });
    } catch (error) {
      return result(id, {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Tool failed",
          },
        ],
        isError: true,
      });
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Unknown method: ${method}` },
  };
}

function result(id: string | number | null, value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}

function tools() {
  return [
    {
      name: "cove_ask",
      description:
        "Ask the Cove support bot a question. Answers are grounded in the bot knowledge base.",
      inputSchema: {
        type: "object",
        properties: {
          question: { type: "string", description: "Customer question" },
        },
        required: ["question"],
      },
    },
    {
      name: "cove_search",
      description: "Search the support knowledge base without generating an answer.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
    {
      name: "cove_list_articles",
      description: "List knowledge article titles and tags for the connected bot.",
      inputSchema: { type: "object", properties: {} },
    },
  ];
}

async function callTool(
  bot: Bot,
  name: string,
  args: Record<string, unknown>,
) {
  if (name === "cove_ask") {
    const question = String(args.question ?? "").trim();
    if (!question) throw new Error("question is required");
    const answer = await answerQuestion({
      bot,
      message: question,
      history: [],
    });
    const cites =
      answer.citations.length > 0
        ? `\n\nSources: ${answer.citations.map((item) => item.title).join(", ")}`
        : "";
    return `${answer.reply}${cites}`;
  }

  if (name === "cove_search") {
    const query = String(args.query ?? "").trim();
    const limit = Number(args.limit ?? 5);
    const hits = searchKnowledge(bot.articles, query, limit);
    if (hits.length === 0) return "No matching articles.";
    return hits
      .map(
        (hit) =>
          `# ${hit.article.title} (${hit.score.toFixed(1)})\n${hit.snippet}`,
      )
      .join("\n\n");
  }

  if (name === "cove_list_articles") {
    if (bot.articles.length === 0) return "This bot has no articles yet.";
    return bot.articles
      .map(
        (article) =>
          `- ${article.title}${article.tags.length ? ` [${article.tags.join(", ")}]` : ""}`,
      )
      .join("\n");
  }

  throw new Error(`Unknown tool: ${name}`);
}
