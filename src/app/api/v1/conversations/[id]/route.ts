import { requireBot } from "@/lib/auth";
import { corsPreflight, json, notFound } from "@/lib/http";
import { getConversation } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBot(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation || conversation.botId !== auth.bot.id) {
    return notFound("Conversation");
  }
  return json({ conversation });
}
