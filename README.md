# Cove

Live: [cove-rho-lac.vercel.app](https://cove-rho-lac.vercel.app) · Source: [github.com/chiku524/cove](https://github.com/chiku524/cove)

Cove is an AI support-bot service you can drop into a product. Create a bot, teach it your docs, then call it from a **REST API**, a **TypeScript SDK**, or **MCP**.

It ships with a working dashboard, a seeded Northstar Help bot, and a retrieval engine so chat works without an LLM key. Set `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` if you want model-generated replies over the same articles.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). Production is on Vercel at [https://cove-rho-lac.vercel.app](https://cove-rho-lac.vercel.app). Pushes to `main` on GitHub deploy automatically.

- `/` — live demo against the seeded bot
- `/dashboard` — create bots, edit knowledge, copy integration snippets
- `/docs` — API, SDK, MCP, and embed notes

Bots are stored in `.data/store.json` locally. Delete that file to reseed. On Vercel the store uses `/tmp`, so data resets across cold starts — fine for the demo, add a database before you rely on it in production.

## Integrate

Every bot has an API key (`cove_live_...`). Chat and MCP require it.

### REST

```bash
curl -s http://127.0.0.1:43127/api/v1/chat \
  -H "Authorization: Bearer cove_live_..." \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I reset my password?"}'
```

Useful routes:

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/chat` | bot key | Answer a question |
| `POST` | `/api/v1/search` | bot key | Search articles |
| `GET` | `/api/v1/conversations/:id` | bot key | Replay a thread |
| `GET/POST` | `/api/v1/bots` | none | List / create bots |
| `POST` | `/api/mcp` | bot key | MCP JSON-RPC |

### TypeScript SDK

Copy `sdk/index.ts` into your app:

```ts
import { Cove } from "./sdk";

const cove = new Cove({
  apiKey: process.env.COVE_API_KEY!,
  baseUrl: "http://127.0.0.1:43127",
});

const { reply, citations, suggestions } = await cove.chat({
  message: "How do I invite a teammate?",
});
```

### MCP

Stdio server for Cursor and other clients:

```bash
COVE_URL=http://127.0.0.1:43127 \
COVE_API_KEY=cove_live_... \
npm run mcp
```

```json
{
  "mcpServers": {
    "cove": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "env": {
        "COVE_URL": "http://127.0.0.1:43127",
        "COVE_API_KEY": "cove_live_..."
      }
    }
  }
}
```

HTTP JSON-RPC lives at `/api/mcp`. Tools: `cove_ask`, `cove_search`, `cove_list_articles`.

### Embed

```html
<script
  src="http://127.0.0.1:43127/embed.js"
  data-api-key="cove_live_..."
  data-base-url="http://127.0.0.1:43127"
></script>
```

## Optional LLM

Without a model key, Cove retrieves articles and composes a cited answer. With `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY`, it still retrieves first, then asks the model to answer only from those articles.
