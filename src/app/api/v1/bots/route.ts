import { z } from "zod";
import { badRequest, corsPreflight, json } from "@/lib/http";
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

export async function GET() {
  const bots = await listBots();
  return json({ bots });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid bot payload.");
  }
  const bot = await createBot(parsed.data);
  return json({ bot }, { status: 201 });
}
