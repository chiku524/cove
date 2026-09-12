import { createId } from "@/lib/ids";
import { followUpSuggestions, sampleQuestions } from "@/lib/questions";
import type {
  Article,
  Bot,
  ChatMessage,
  ChatResponse,
  Citation,
  SearchHit,
} from "@/lib/types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "your",
  "our",
  "how",
  "can",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "was",
  "were",
  "will",
  "just",
  "about",
  "into",
  "than",
  "then",
  "them",
  "they",
  "does",
  "did",
  "get",
  "got",
  "any",
  "all",
  "also",
  "use",
  "using",
  "please",
]);

const HANDOFF =
  /\b(human|agent|person|someone|ticket|escalate|manager|call me)\b/i;
const GREETING = /^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/i;
const THANKS = /^(thanks|thank you|thx|cheers|great|perfect|awesome)\b/i;
const FOLLOW_UP =
  /^(and |also |what about|how (do|does|can|to)|is that|can i|do i|that|this|it\b)/i;

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

export function searchKnowledge(
  articles: Article[],
  query: string,
  limit = 5,
): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return articles
    .map((article) => {
      const titleTokens = tokenize(article.title);
      const bodyTokens = tokenize(article.body);
      const tagTokens = article.tags.map((tag) => tag.toLowerCase());
      let score = 0;

      for (const token of tokens) {
        if (titleTokens.includes(token)) score += 4;
        if (tagTokens.some((tag) => tag.includes(token))) score += 3;
        const bodyHits = bodyTokens.filter((item) => item === token).length;
        score += Math.min(bodyHits, 6) * 1.1;
        if (article.title.toLowerCase().includes(token)) score += 1.5;
      }

      const phrase = query.toLowerCase().trim();
      if (phrase.length > 6 && article.body.toLowerCase().includes(phrase)) {
        score += 6;
      }
      if (phrase.length > 6 && article.title.toLowerCase().includes(phrase)) {
        score += 8;
      }

      return {
        article,
        score,
        snippet: bestSnippet(article.body, tokens),
      };
    })
    .filter((hit) => hit.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function resolveQuery(message: string, history: ChatMessage[]) {
  const trimmed = message.trim();
  if (!FOLLOW_UP.test(trimmed)) return trimmed;
  const prior = [...history]
    .reverse()
    .find((item) => item.role === "user" && item.content.length > 12);
  if (!prior) return trimmed;
  return `${prior.content} ${trimmed}`;
}

export async function answerQuestion(input: {
  bot: Bot;
  message: string;
  history: ChatMessage[];
}): Promise<Omit<ChatResponse, "conversationId">> {
  const query = resolveQuery(input.message, input.history);
  const text = input.message.trim();

  if (GREETING.test(text) && text.split(/\s+/).length < 6) {
    return {
      reply: input.bot.welcomeMessage,
      citations: [],
      suggestions: sampleQuestions(input.bot.articles),
      handoff: false,
      engine: "retrieval",
    };
  }

  if (THANKS.test(text) && text.split(/\s+/).length < 8) {
    return {
      reply:
        input.bot.tone === "concise"
          ? "Glad that helped."
          : "Glad that helped. Ask another question anytime.",
      citations: [],
      suggestions: sampleQuestions(input.bot.articles, 3),
      handoff: false,
      engine: "retrieval",
    };
  }

  if (HANDOFF.test(text)) {
    return {
      reply: input.bot.handoffMessage,
      citations: [],
      suggestions: sampleQuestions(input.bot.articles, 3),
      handoff: true,
      engine: "retrieval",
    };
  }

  const hits = searchKnowledge(input.bot.articles, query, 3);
  if (hits.length === 0) {
    return {
      reply: emptyReply(input.bot, query),
      citations: [],
      suggestions: sampleQuestions(input.bot.articles, 3),
      handoff: true,
      engine: "retrieval",
    };
  }

  const citations: Citation[] = hits.map((hit) => ({
    articleId: hit.article.id,
    title: hit.article.title,
    score: Number(hit.score.toFixed(2)),
  }));
  const suggestions = followUpSuggestions(
    input.bot,
    citations.map((item) => item.title),
  );

  const llm = await maybeLlmAnswer(input.bot, query, hits);
  if (llm) {
    return {
      reply: llm,
      citations,
      suggestions,
      handoff: false,
      engine: "llm",
    };
  }

  return {
    reply: composeAnswer(input.bot, query, hits),
    citations,
    suggestions,
    handoff: hits[0].score < 5,
    engine: "retrieval",
  };
}

export function toAssistantMessage(
  reply: Omit<ChatResponse, "conversationId">,
): ChatMessage {
  return {
    id: createId("msg"),
    role: "assistant",
    content: reply.reply,
    citations: reply.citations,
    createdAt: new Date().toISOString(),
  };
}

function bestSnippet(body: string, tokens: string[]) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  let best = paragraphs[0] ?? body;
  let bestScore = -1;
  for (const paragraph of paragraphs) {
    const lower = paragraph.toLowerCase();
    const score = tokens.reduce(
      (sum, token) => sum + (lower.includes(token) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = paragraph;
      bestScore = score;
    }
  }
  return best.replace(/\s+/g, " ").slice(0, 320);
}

function composeAnswer(bot: Bot, query: string, hits: SearchHit[]) {
  const top = hits[0];
  const extras = hits.slice(1).filter((hit) => hit.score >= top.score * 0.55);
  const lead = leadIn(bot.tone, top.article.title);
  const body = top.snippet;
  const also =
    extras.length > 0
      ? `\n\nRelated: ${extras.map((hit) => hit.article.title).join(" · ")}`
      : "";

  if (bot.tone === "concise") {
    return `${body}${also}`;
  }

  const unsure =
    top.score < 6
      ? `\n\nIf this is not what you meant by “${truncate(query, 80)}”, say a bit more and I will look again.`
      : "";

  return `${lead}${body}${also}${unsure}`;
}

function leadIn(tone: Bot["tone"], title: string) {
  if (tone === "professional") {
    return `From “${title}”: `;
  }
  if (tone === "concise") return "";
  return `Here’s the relevant bit from ${title}. `;
}

function emptyReply(bot: Bot, query: string) {
  const titles = bot.articles.slice(0, 4).map((article) => article.title);
  const suggest =
    titles.length > 0
      ? ` I can help with ${joinAnd(titles)}.`
      : " This bot has no knowledge articles yet.";
  return `${bot.handoffMessage} I could not match “${truncate(query, 80)}”.${suggest}`;
}

function joinAnd(items: string[]) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function maybeLlmAnswer(bot: Bot, query: string, hits: SearchHit[]) {
  const key = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;

  const url = process.env.AI_GATEWAY_API_KEY
    ? "https://ai-gateway.vercel.sh/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const context = hits
    .map(
      (hit, index) =>
        `[${index + 1}] ${hit.article.title}\n${hit.article.body}`,
    )
    .join("\n\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.COVE_MODEL || "openai/gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `${bot.instructions}\nTone: ${bot.tone}. Use only the supplied articles. If they are insufficient, say so and offer this handoff: ${bot.handoffMessage}`,
          },
          {
            role: "user",
            content: `Question: ${query}\n\nArticles:\n${context}`,
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
