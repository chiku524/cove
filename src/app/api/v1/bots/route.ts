import { z } from "zod";
import { badRequest, corsPreflight, json, planLimit } from "@/lib/http";
import { PlanLimitError } from "@/lib/plans";
import { requireUser } from "@/lib/session";
import { createBot, listBots } from "@/lib/store";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(280).optional(),
  instructions: z.string().max(4000).optional(),
  welcomeMessage: z.string().max(400).optional(),
  handoffMessage: z.string().max(400).optional(),
  tone: z.enum(["friendly", "professional", "concise"]).optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const bots = await listBots(auth.user.id);
  return json({ bots });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid bot payload.");
  }
  try {
    const bot = await createBot(auth.user.id, parsed.data);
    return json({ bot }, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return planLimit(error.code, error.message);
    }
    throw error;
  }
}
