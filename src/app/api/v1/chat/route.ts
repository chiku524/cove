import { z } from "zod";
import { requireBot } from "@/lib/auth";
import { answerQuestion, toAssistantMessage } from "@/lib/engine";
import { badRequest, corsPreflight, json } from "@/lib/http";
import { createId } from "@/lib/ids";
import { appendMessages, upsertConversation } from "@/lib/store";

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
  const auth = await requireBot(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid chat payload.");
  }

  const conversation = await upsertConversation({
    id: parsed.data.conversationId,
    botId: auth.bot.id,
    metadata: parsed.data.metadata,
  });

  const userMessage = {
    id: createId("msg"),
    role: "user" as const,
    content: parsed.data.message,
    createdAt: new Date().toISOString(),
  };

  const answer = await answerQuestion({
    bot: auth.bot,
    message: parsed.data.message,
    history: conversation.messages,
  });
  const assistant = toAssistantMessage(answer);

  await appendMessages(conversation.id, [userMessage, assistant]);

  return json({
    reply: answer.reply,
    conversationId: conversation.id,
    citations: answer.citations,
    handoff: answer.handoff,
    engine: answer.engine,
  });
}
