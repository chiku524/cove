import { z } from "zod";
import { badRequest, corsPreflight, json, notFound } from "@/lib/http";
import { requireOwnedBot } from "@/lib/session";
import { deleteArticle, updateArticle } from "@/lib/store";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(12000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> },
) {
  const { id, articleId } = await params;
  const auth = await requireOwnedBot(request, id);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid article.");
  }
  const article = await updateArticle(id, articleId, parsed.data);
  if (!article) return notFound("Article");
  return json({ article });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> },
) {
  const { id, articleId } = await params;
  const auth = await requireOwnedBot(request, id);
  if (auth.error) return auth.error;
  const ok = await deleteArticle(id, articleId);
  if (!ok) return notFound("Article");
  return json({ ok: true });
}
