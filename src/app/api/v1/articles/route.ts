import { requireBot } from "@/lib/auth";
import { corsPreflight, handlePublic, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  return handlePublic(async () => {
    const auth = await requireBot(request);
    if (auth.error) return auth.error;
    return json({
      articles: auth.bot.articles.map((article) => ({
        id: article.id,
        title: article.title,
        tags: article.tags,
      })),
    });
  });
}
