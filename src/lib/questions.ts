import type { Article, Bot } from "@/lib/types";

export function sampleQuestions(articles: Article[], limit = 4) {
  return articles.slice(0, limit).map((article) => article.title);
}

export function followUpSuggestions(
  bot: Bot,
  usedTitles: string[] = [],
  limit = 3,
) {
  const used = new Set(usedTitles.map((title) => title.toLowerCase()));
  return bot.articles
    .filter((article) => !used.has(article.title.toLowerCase()))
    .map((article) => article.title)
    .slice(0, limit);
}
