import { z } from "zod";
import { badRequest, corsPreflight, json, notFound } from "@/lib/http";
import { deleteBot, getBot, rotateApiKey, updateBot } from "@/lib/store";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(280).optional(),
  instructions: z.string().max(4000).optional(),
  welcomeMessage: z.string().max(400).optional(),
  handoffMessage: z.string().max(400).optional(),
  tone: z.enum(["friendly", "professional", "concise"]).optional(),
  rotateKey: z.boolean().optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bot = await getBot(id);
  if (!bot) return notFound("Bot");
  return json({ bot });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid update.");
  }
  const { rotateKey, ...patch } = parsed.data;
  const bot = rotateKey ? await rotateApiKey(id) : await updateBot(id, patch);
  if (!bot) return notFound("Bot");
  return json({ bot });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteBot(id);
  if (!ok) return notFound("Bot");
  return json({ ok: true });
}
