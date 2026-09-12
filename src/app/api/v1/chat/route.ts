import { z } from "zod";
import { requireBot } from "@/lib/auth";
import { runBotChat } from "@/lib/chat";
import { badRequest, corsPreflight, handlePublic, json, planLimit } from "@/lib/http";
import { PlanLimitError } from "@/lib/plans";

export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  return handlePublic(async () => {
    const auth = await requireBot(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid chat payload.");
    }

    try {
      const answer = await runBotChat(auth.bot, parsed.data);
      return json(answer);
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return planLimit(error.code, error.message);
      }
      throw error;
    }
  });
}
