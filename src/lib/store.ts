import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createApiKey, createId, slugify } from "@/lib/ids";
import { createSeedBots } from "@/lib/seed";
import type {
  Article,
  Bot,
  Conversation,
  CreateArticleInput,
  CreateBotInput,
  StoreData,
  UpdateBotInput,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.bots) || !Array.isArray(parsed.conversations)) {
      throw new Error("invalid store");
    }
    return parsed;
  } catch {
    const seeded: StoreData = {
      bots: createSeedBots(),
      conversations: [],
    };
    await persist(seeded);
    return seeded;
  }
}

async function persist(data: StoreData) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function enqueue<T>(fn: (data: StoreData) => Promise<T> | T): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await readStore();
    return fn(data);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function listBots() {
  const data = await readStore();
  return data.bots;
}

export async function getBot(id: string) {
  const data = await readStore();
  return data.bots.find((bot) => bot.id === id || bot.slug === id) ?? null;
}

export async function getBotByApiKey(apiKey: string) {
  const data = await readStore();
  return data.bots.find((bot) => bot.apiKey === apiKey) ?? null;
}

export async function getDemoBot() {
  const data = await readStore();
  return data.bots.find((bot) => bot.isDemo) ?? data.bots[0] ?? null;
}

export async function createBot(input: CreateBotInput) {
  return enqueue(async (data) => {
    const now = new Date().toISOString();
    const name = input.name.trim();
    const bot: Bot = {
      id: createId("bot"),
      name,
      slug: uniqueSlug(data.bots, slugify(name)),
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
      articles: [],
      createdAt: now,
      updatedAt: now,
    };
    data.bots.unshift(bot);
    await persist(data);
    return bot;
  });
}

export async function updateBot(id: string, input: UpdateBotInput) {
  return enqueue(async (data) => {
    const bot = data.bots.find((item) => item.id === id);
    if (!bot) return null;
    if (input.name !== undefined) {
      bot.name = input.name.trim();
      bot.slug = uniqueSlug(
        data.bots.filter((item) => item.id !== id),
        slugify(bot.name),
      );
    }
    if (input.description !== undefined) bot.description = input.description.trim();
    if (input.instructions !== undefined) bot.instructions = input.instructions.trim();
    if (input.welcomeMessage !== undefined) {
      bot.welcomeMessage = input.welcomeMessage.trim();
    }
    if (input.handoffMessage !== undefined) {
      bot.handoffMessage = input.handoffMessage.trim();
    }
    if (input.tone !== undefined) bot.tone = input.tone;
    bot.updatedAt = new Date().toISOString();
    await persist(data);
    return bot;
  });
}

export async function deleteBot(id: string) {
  return enqueue(async (data) => {
    const index = data.bots.findIndex((bot) => bot.id === id);
    if (index === -1) return false;
    data.bots.splice(index, 1);
    data.conversations = data.conversations.filter((item) => item.botId !== id);
    await persist(data);
    return true;
  });
}

export async function rotateApiKey(id: string) {
  return enqueue(async (data) => {
    const bot = data.bots.find((item) => item.id === id);
    if (!bot) return null;
    bot.apiKey = createApiKey();
    bot.updatedAt = new Date().toISOString();
    await persist(data);
    return bot;
  });
}

export async function addArticle(botId: string, input: CreateArticleInput) {
  return enqueue(async (data) => {
    const bot = data.bots.find((item) => item.id === botId);
    if (!bot) return null;
    const article: Article = {
      id: createId("art"),
      title: input.title.trim(),
      body: input.body.trim(),
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    bot.articles.unshift(article);
    bot.updatedAt = article.updatedAt;
    await persist(data);
    return article;
  });
}

export async function updateArticle(
  botId: string,
  articleId: string,
  input: CreateArticleInput,
) {
  return enqueue(async (data) => {
    const bot = data.bots.find((item) => item.id === botId);
    const article = bot?.articles.find((item) => item.id === articleId);
    if (!bot || !article) return null;
    article.title = input.title.trim();
    article.body = input.body.trim();
    if (input.tags) {
      article.tags = input.tags.map((tag) => tag.trim()).filter(Boolean);
    }
    article.updatedAt = new Date().toISOString();
    bot.updatedAt = article.updatedAt;
    await persist(data);
    return article;
  });
}

export async function deleteArticle(botId: string, articleId: string) {
  return enqueue(async (data) => {
    const bot = data.bots.find((item) => item.id === botId);
    if (!bot) return false;
    const index = bot.articles.findIndex((item) => item.id === articleId);
    if (index === -1) return false;
    bot.articles.splice(index, 1);
    bot.updatedAt = new Date().toISOString();
    await persist(data);
    return true;
  });
}

export async function conversationCounts() {
  const data = await readStore();
  const counts: Record<string, number> = {};
  for (const conversation of data.conversations) {
    counts[conversation.botId] = (counts[conversation.botId] ?? 0) + 1;
  }
  return counts;
}

export async function getConversation(id: string) {
  const data = await readStore();
  return data.conversations.find((item) => item.id === id) ?? null;
}

export async function upsertConversation(input: {
  id?: string;
  botId: string;
  metadata?: Record<string, string>;
}) {
  return enqueue(async (data) => {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = data.conversations.find((item) => item.id === input.id);
      if (existing && existing.botId === input.botId) {
        if (input.metadata) {
          existing.metadata = { ...existing.metadata, ...input.metadata };
        }
        existing.updatedAt = now;
        await persist(data);
        return existing;
      }
    }
    const conversation: Conversation = {
      id: createId("conv"),
      botId: input.botId,
      messages: [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };
    data.conversations.unshift(conversation);
    await persist(data);
    return conversation;
  });
}

export async function appendMessages(
  conversationId: string,
  messages: Conversation["messages"],
) {
  return enqueue(async (data) => {
    const conversation = data.conversations.find(
      (item) => item.id === conversationId,
    );
    if (!conversation) return null;
    conversation.messages.push(...messages);
    conversation.updatedAt = new Date().toISOString();
    await persist(data);
    return conversation;
  });
}

function uniqueSlug(bots: Bot[], base: string) {
  let slug = base;
  let n = 2;
  const taken = new Set(bots.map((bot) => bot.slug));
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}
