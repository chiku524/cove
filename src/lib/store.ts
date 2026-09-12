import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  articles,
  bots,
  conversations,
  messages,
  usageMonth,
  user,
} from "@/db/schema";
import { createApiKey, createId, slugify } from "@/lib/ids";
import {
  currentMonth,
  isPlan,
  PLANS,
  PlanLimitError,
  type Plan,
} from "@/lib/plans";
import { createSeedBots } from "@/lib/seed";
import type {
  Article,
  Bot,
  Conversation,
  CreateArticleInput,
  CreateBotInput,
  Tone,
  UpdateBotInput,
} from "@/lib/types";

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

async function articlesFor(botIds: string[]): Promise<Map<string, Article[]>> {
  const map = new Map<string, Article[]>();
  if (botIds.length === 0) return map;
  const rows = await getDb()
    .select()
    .from(articles)
    .where(inArray(articles.botId, botIds))
    .orderBy(desc(articles.updatedAt));
  for (const row of rows) {
    const list = map.get(row.botId) ?? [];
    list.push({
      id: row.id,
      title: row.title,
      body: row.body,
      tags: row.tags ?? [],
      updatedAt: toIso(row.updatedAt),
    });
    map.set(row.botId, list);
  }
  return map;
}

function toBot(
  row: typeof bots.$inferSelect,
  botArticles: Article[] = [],
): Bot {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    instructions: row.instructions,
    welcomeMessage: row.welcomeMessage,
    handoffMessage: row.handoffMessage,
    tone: row.tone as Tone,
    apiKey: row.apiKey,
    isDemo: row.isDemo,
    articles: botArticles,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

async function hydrate(row: typeof bots.$inferSelect): Promise<Bot> {
  const map = await articlesFor([row.id]);
  return toBot(row, map.get(row.id) ?? []);
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base;
  let n = 2;
  while (true) {
    const [existing] = await getDb()
      .select({ id: bots.id })
      .from(bots)
      .where(eq(bots.slug, slug))
      .limit(1);
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function getPlanForUser(userId: string): Promise<Plan> {
  const [row] = await getDb()
    .select({ plan: user.plan })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return PLANS[isPlan(row?.plan) ? row.plan : "free"];
}

export async function getWorkspaceUsage(userId: string) {
  const db = getDb();
  const plan = await getPlanForUser(userId);
  const month = currentMonth();
  const userBots = await db
    .select({ id: bots.id })
    .from(bots)
    .where(eq(bots.userId, userId));
  const botIds = userBots.map((bot) => bot.id);
  const articleRows =
    botIds.length === 0
      ? []
      : await db
          .select({ id: articles.id })
          .from(articles)
          .where(inArray(articles.botId, botIds));
  const [usage] = await db
    .select()
    .from(usageMonth)
    .where(and(eq(usageMonth.userId, userId), eq(usageMonth.month, month)))
    .limit(1);
  return {
    plan,
    month,
    bots: userBots.length,
    articles: articleRows.length,
    chats: usage?.chats ?? 0,
  };
}

async function assertBotRoom(userId: string) {
  const usage = await getWorkspaceUsage(userId);
  if (usage.bots >= usage.plan.bots) {
    throw new PlanLimitError(
      "bot_limit",
      `${usage.plan.name} includes ${usage.plan.bots} bot${usage.plan.bots === 1 ? "" : "s"}. Upgrade to Pro to add more.`,
    );
  }
}

async function assertArticleRoom(userId: string) {
  const usage = await getWorkspaceUsage(userId);
  if (usage.articles >= usage.plan.articles) {
    throw new PlanLimitError(
      "article_limit",
      `${usage.plan.name} includes ${usage.plan.articles} articles. Upgrade to Pro for 500.`,
    );
  }
}

export async function assertChatRoom(userId: string) {
  const usage = await getWorkspaceUsage(userId);
  if (usage.chats >= usage.plan.chatsPerMonth) {
    throw new PlanLimitError(
      "chat_limit",
      `${usage.plan.name} includes ${usage.plan.chatsPerMonth.toLocaleString()} chats this month. Upgrade to Pro to keep answering.`,
    );
  }
}

export async function incrementChatUsage(userId: string) {
  const db = getDb();
  const month = currentMonth();
  const [existing] = await db
    .select()
    .from(usageMonth)
    .where(and(eq(usageMonth.userId, userId), eq(usageMonth.month, month)))
    .limit(1);
  if (existing) {
    await db
      .update(usageMonth)
      .set({ chats: sql`${usageMonth.chats} + 1` })
      .where(eq(usageMonth.id, existing.id));
    return;
  }
  await db.insert(usageMonth).values({
    id: createId("usage"),
    userId,
    month,
    chats: 1,
  });
}

export async function listBots(userId: string) {
  const rows = await getDb()
    .select()
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(desc(bots.updatedAt));
  const map = await articlesFor(rows.map((row) => row.id));
  return rows.map((row) => toBot(row, map.get(row.id) ?? []));
}

export async function getBot(id: string) {
  const [row] = await getDb()
    .select()
    .from(bots)
    .where(eq(bots.id, id))
    .limit(1);
  if (row) return hydrate(row);
  const [bySlug] = await getDb()
    .select()
    .from(bots)
    .where(eq(bots.slug, id))
    .limit(1);
  return bySlug ? hydrate(bySlug) : null;
}

export async function getBotByApiKey(apiKey: string) {
  const [row] = await getDb()
    .select()
    .from(bots)
    .where(eq(bots.apiKey, apiKey))
    .limit(1);
  return row ? hydrate(row) : null;
}

export async function ensureDemoBot() {
  const existing = await getBot("bot_northstar");
  if (existing) return existing;
  const seed = createSeedBots()[0];
  if (!seed) throw new Error("Demo seed is missing.");
  await getDb().insert(bots).values({
    id: seed.id,
    userId: null,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    instructions: seed.instructions,
    welcomeMessage: seed.welcomeMessage,
    handoffMessage: seed.handoffMessage,
    tone: seed.tone,
    apiKey: seed.apiKey,
    isDemo: true,
    createdAt: new Date(seed.createdAt),
    updatedAt: new Date(seed.updatedAt),
  });
  if (seed.articles.length > 0) {
    await getDb().insert(articles).values(
      seed.articles.map((article) => ({
        id: article.id,
        botId: seed.id,
        title: article.title,
        body: article.body,
        tags: article.tags,
        updatedAt: new Date(article.updatedAt),
      })),
    );
  }
  return seed;
}

export async function getDemoBot() {
  await ensureDemoBot();
  const [row] = await getDb()
    .select()
    .from(bots)
    .where(eq(bots.isDemo, true))
    .limit(1);
  return row ? hydrate(row) : null;
}

export async function createBot(userId: string, input: CreateBotInput) {
  await assertBotRoom(userId);
  const now = new Date();
  const name = input.name.trim();
  const bot = {
    id: createId("bot"),
    userId,
    name,
    slug: await uniqueSlug(slugify(name)),
    description: input.description?.trim() ?? "",
    instructions:
      input.instructions?.trim() ||
      `You are ${name}, a support bot. Answer only from the knowledge base. If you are unsure, offer a handoff.`,
    welcomeMessage:
      input.welcomeMessage?.trim() ||
      `Hi — I am ${name}. Ask a question and I will answer from the docs.`,
    handoffMessage:
      input.handoffMessage?.trim() ||
      "I do not have a confident answer. Please contact your support team.",
    tone: input.tone ?? "friendly",
    apiKey: createApiKey(),
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(bots).values(bot);
  return toBot(bot, []);
}

export async function updateBot(id: string, input: UpdateBotInput) {
  const current = await getBot(id);
  if (!current) return null;
  const name = input.name !== undefined ? input.name.trim() : current.name;
  const slug =
    input.name !== undefined ? await uniqueSlug(slugify(name), id) : current.slug;
  const [row] = await getDb()
    .update(bots)
    .set({
      name,
      slug,
      description:
        input.description !== undefined
          ? input.description.trim()
          : current.description,
      instructions:
        input.instructions !== undefined
          ? input.instructions.trim()
          : current.instructions,
      welcomeMessage:
        input.welcomeMessage !== undefined
          ? input.welcomeMessage.trim()
          : current.welcomeMessage,
      handoffMessage:
        input.handoffMessage !== undefined
          ? input.handoffMessage.trim()
          : current.handoffMessage,
      tone: input.tone ?? current.tone,
      updatedAt: new Date(),
    })
    .where(eq(bots.id, id))
    .returning();
  return row ? hydrate(row) : null;
}

export async function deleteBot(id: string) {
  const deleted = await getDb().delete(bots).where(eq(bots.id, id)).returning({
    id: bots.id,
  });
  return deleted.length > 0;
}

export async function rotateApiKey(id: string) {
  const [row] = await getDb()
    .update(bots)
    .set({ apiKey: createApiKey(), updatedAt: new Date() })
    .where(eq(bots.id, id))
    .returning();
  return row ? hydrate(row) : null;
}

export async function addArticle(botId: string, input: CreateArticleInput) {
  const bot = await getBot(botId);
  if (!bot) return null;
  if (bot.userId) await assertArticleRoom(bot.userId);
  const now = new Date();
  const article = {
    id: createId("art"),
    botId,
    title: input.title.trim(),
    body: input.body.trim(),
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    updatedAt: now,
  };
  await getDb().insert(articles).values(article);
  await getDb().update(bots).set({ updatedAt: now }).where(eq(bots.id, botId));
  return {
    id: article.id,
    title: article.title,
    body: article.body,
    tags: article.tags,
    updatedAt: toIso(now),
  };
}

export async function updateArticle(
  botId: string,
  articleId: string,
  input: CreateArticleInput,
) {
  const now = new Date();
  const [row] = await getDb()
    .update(articles)
    .set({
      title: input.title.trim(),
      body: input.body.trim(),
      ...(input.tags
        ? { tags: input.tags.map((tag) => tag.trim()).filter(Boolean) }
        : {}),
      updatedAt: now,
    })
    .where(and(eq(articles.id, articleId), eq(articles.botId, botId)))
    .returning();
  if (!row) return null;
  await getDb().update(bots).set({ updatedAt: now }).where(eq(bots.id, botId));
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    updatedAt: toIso(row.updatedAt),
  };
}

export async function deleteArticle(botId: string, articleId: string) {
  const deleted = await getDb()
    .delete(articles)
    .where(and(eq(articles.id, articleId), eq(articles.botId, botId)))
    .returning({ id: articles.id });
  if (deleted.length === 0) return false;
  await getDb()
    .update(bots)
    .set({ updatedAt: new Date() })
    .where(eq(bots.id, botId));
  return true;
}

export async function conversationCounts(botIds: string[]) {
  const counts: Record<string, number> = {};
  if (botIds.length === 0) return counts;
  const rows = await getDb()
    .select({
      botId: conversations.botId,
      count: sql<number>`count(*)::int`,
    })
    .from(conversations)
    .where(inArray(conversations.botId, botIds))
    .groupBy(conversations.botId);
  for (const row of rows) counts[row.botId] = Number(row.count);
  return counts;
}

async function hydrateConversation(
  row: typeof conversations.$inferSelect,
): Promise<Conversation> {
  const rows = await getDb()
    .select()
    .from(messages)
    .where(eq(messages.conversationId, row.id))
    .orderBy(messages.createdAt);
  return {
    id: row.id,
    botId: row.botId,
    metadata: row.metadata ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    messages: rows.map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      citations: (message.citations as Conversation["messages"][number]["citations"]) ?? undefined,
      createdAt: toIso(message.createdAt),
    })),
  };
}

export async function getConversation(id: string) {
  const [row] = await getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return row ? hydrateConversation(row) : null;
}

export async function upsertConversation(input: {
  id?: string;
  botId: string;
  metadata?: Record<string, string>;
}) {
  const now = new Date();
  if (input.id) {
    const [existing] = await getDb()
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, input.id), eq(conversations.botId, input.botId)),
      )
      .limit(1);
    if (existing) {
      const [updated] = await getDb()
        .update(conversations)
        .set({
          metadata: input.metadata
            ? { ...(existing.metadata ?? {}), ...input.metadata }
            : existing.metadata,
          updatedAt: now,
        })
        .where(eq(conversations.id, existing.id))
        .returning();
      if (updated) return hydrateConversation(updated);
    }
  }
  const row = {
    id: createId("conv"),
    botId: input.botId,
    metadata: input.metadata ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(conversations).values(row);
  return hydrateConversation(row);
}

export async function appendMessages(
  conversationId: string,
  next: Conversation["messages"],
) {
  if (next.length > 0) {
    await getDb().insert(messages).values(
      next.map((message) => ({
        id: message.id,
        conversationId,
        role: message.role,
        content: message.content,
        citations: message.citations,
        createdAt: new Date(message.createdAt),
      })),
    );
  }
  await getDb()
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
  return getConversation(conversationId);
}

export async function updateUserBilling(
  userId: string,
  values: {
    plan?: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeSubscriptionStatus?: string | null;
  },
) {
  await getDb()
    .update(user)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

export async function findUserByStripeCustomer(customerId: string) {
  const [row] = await getDb()
    .select()
    .from(user)
    .where(eq(user.stripeCustomerId, customerId))
    .limit(1);
  return row ?? null;
}

export async function findUserByStripeSubscription(subscriptionId: string) {
  const [row] = await getDb()
    .select()
    .from(user)
    .where(eq(user.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return row ?? null;
}

export async function getUserRecord(userId: string) {
  const [row] = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}
