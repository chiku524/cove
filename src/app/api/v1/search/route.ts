import { z } from "zod";
import { requireBot } from "@/lib/auth";
import { searchKnowledge } from "@/lib/engine";
import { badRequest, corsPreflight, json } from "@/lib/http";

export const dynamic = "force-dynamic";

const schema = z.object({
  query: z.string().trim().min(1).max(400),
  limit: z.number().int().min(1).max(20).optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const auth = await requireBot(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid search payload.");
  }
  const hits = searchKnowledge(
    auth.bot.articles,
    parsed.data.query,
    parsed.data.limit ?? 5,
  );
  return json({
    hits: hits.map((hit) => ({
      articleId: hit.article.id,
      title: hit.article.title,
      tags: hit.article.tags,
      snippet: hit.snippet,
      score: Number(hit.score.toFixed(2)),
    })),
  });
}
