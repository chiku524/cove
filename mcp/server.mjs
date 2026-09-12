#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = (process.env.COVE_URL || "http://127.0.0.1:43127").replace(
  /\/$/,
  "",
);
const API_KEY = process.env.COVE_API_KEY;

if (!API_KEY) {
  console.error("COVE_API_KEY is required");
  process.exit(1);
}

async function api(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Cove API ${response.status}`);
  }
  return data;
}

const server = new McpServer({
  name: "cove",
  version: "0.1.0",
});

server.registerTool(
  "cove_ask",
  {
    title: "Ask Cove",
    description:
      "Ask the Cove support bot a question grounded in its knowledge base.",
    inputSchema: {
      question: z.string().describe("The customer or teammate question"),
      conversationId: z
        .string()
        .optional()
        .describe("Optional conversation id to keep context"),
    },
  },
  async ({ question, conversationId }) => {
    const data = await api("/api/v1/chat", {
      message: question,
      conversationId,
    });
    const cites =
      data.citations?.length > 0
        ? `\n\nSources: ${data.citations.map((item) => item.title).join(", ")}`
        : "";
    return {
      content: [{ type: "text", text: `${data.reply}${cites}` }],
    };
  },
);

server.registerTool(
  "cove_search",
  {
    title: "Search Cove knowledge",
    description: "Search support articles without generating an answer.",
    inputSchema: {
      query: z.string(),
      limit: z.number().optional(),
    },
  },
  async ({ query, limit }) => {
    const data = await api("/api/v1/search", { query, limit: limit ?? 5 });
    const text =
      data.hits?.length > 0
        ? data.hits
            .map((hit) => `# ${hit.title} (${hit.score})\n${hit.snippet}`)
            .join("\n\n")
        : "No matching articles.";
    return { content: [{ type: "text", text }] };
  },
);

server.registerTool(
  "cove_list_articles",
  {
    title: "List Cove articles",
    description: "List knowledge article titles and tags for the connected bot.",
    inputSchema: {},
  },
  async () => {
    const response = await fetch(`${API_URL}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Cove API ${response.status}`);
    }
    const text =
      data.articles?.length > 0
        ? data.articles
            .map(
              (article) =>
                `- ${article.title}${article.tags?.length ? ` [${article.tags.join(", ")}]` : ""}`,
            )
            .join("\n")
        : "This bot has no articles yet.";
    return { content: [{ type: "text", text }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
