import { z } from "zod";
import { badRequest, corsPreflight, json, notFound, planLimit } from "@/lib/http";
import { PlanLimitError } from "@/lib/plans";
import { requireOwnedBot } from "@/lib/session";
import { addArticle } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(12000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireOwnedBot(request, id);
  if (auth.error) return auth.error;
  return json({ articles: auth.bot.articles });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireOwnedBot(request, id);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid article.");
  }
  try {
    const article = await addArticle(id, parsed.data);
    if (!article) return notFound("Bot");
    return json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return planLimit(error.code, error.message);
    }
    throw error;
  }
}
