# Cove

Live: [covetechnologies.vercel.app](https://covetechnologies.vercel.app) · Source: [github.com/chiku524/cove](https://github.com/chiku524/cove)

Cove is an AI support-bot service you can drop into a product. Create a bot, teach it your docs, then call it from a **REST API**, a **TypeScript SDK**, or **MCP**.

It ships with a working dashboard, a seeded Northstar Help demo, and a retrieval engine so chat works without an LLM key. Set `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` if you want model-generated replies over the same articles.

Accounts, durable storage, and billing are included so you can list Cove on developer directories and sell Pro through Stripe Checkout.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill DATABASE_URL, BETTER_AUTH_SECRET, and Stripe keys
npx dotenv -e .env.local -- drizzle-kit push
npm run db:seed
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). Production is on Vercel at [https://covetechnologies.vercel.app](https://covetechnologies.vercel.app). Pushes to `main` on GitHub deploy automatically.

- `/` — live demo against the seeded Northstar bot
- `/sign-up` — create an account (email + password)
- `/dashboard` — your bots, knowledge, and integration snippets
- `/dashboard/billing` — Free vs Pro, Stripe Checkout and Customer Portal
- `/docs` — API, SDK, MCP, and embed notes

## Auth, storage, and billing

These are the pieces a marketplace checkout path needs:

| Piece | What Cove uses |
| --- | --- |
| Auth | Better Auth, email and password, session cookies |
| Durable storage | Neon Postgres via Drizzle (`bots`, `articles`, conversations, usage) |
| Billing | Stripe Checkout subscriptions + Customer Portal + webhooks |

**Free:** 1 bot, 8 articles, 200 chats / month.  
**Pro:** $19 / month, 25 bots, 500 articles, 20,000 chats / month.

Bot CRUD is scoped to the signed-in user. Chat, search, and MCP stay API-key authenticated so widgets and agents do not need a Cove login.

The public Northstar demo is seeded into Postgres (`bot_northstar`, key `cove_live_demo_northstar`) and is not part of anyone’s plan limits.

Customers pay in the dashboard under **Billing → Upgrade to Pro**. That opens Stripe Checkout for the $19/month Cove Pro subscription. After they subscribe, **Manage subscription** opens the Customer Portal.

The Stripe sandbox is claimed. Test with card `4242 4242 4242 4242`, any future expiry, and any CVC. Live charges need Stripe Dashboard activation and live keys in Vercel (`STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`).

If you will charge US or EU customers, enable Stripe Tax and add a registration before turning on automatic tax. Stripe collects no tax until a registration is active. See [Collect taxes for recurring payments](https://docs.stripe.com/billing/taxes/collect-taxes).

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
| `GET/POST` | `/api/v1/bots` | session | List / create your bots |
| `POST` | `/api/mcp` | bot key | MCP JSON-RPC |
| `POST` | `/api/stripe/checkout` | session | Start Pro Checkout |
| `POST` | `/api/stripe/webhook` | Stripe signature | Apply subscription status |

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
