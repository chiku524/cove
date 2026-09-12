import { answerQuestion, toAssistantMessage } from "@/lib/engine";
import { createId } from "@/lib/ids";
import {
  appendMessages,
  assertChatRoom,
  incrementChatUsage,
  upsertConversation,
} from "@/lib/store";
import type { Bot, ChatResponse } from "@/lib/types";

export async function runBotChat(
  bot: Bot,
  input: {
    message: string;
    conversationId?: string;
    metadata?: Record<string, string>;
  },
): Promise<ChatResponse> {
  if (bot.userId && !bot.isDemo) {
    await assertChatRoom(bot.userId);
  }

  const conversation = await upsertConversation({
    id: input.conversationId,
    botId: bot.id,
    metadata: input.metadata,
  });

  const userMessage = {
    id: createId("msg"),
    role: "user" as const,
    content: input.message,
    createdAt: new Date().toISOString(),
  };

  const answer = await answerQuestion({
    bot,
    message: input.message,
    history: conversation.messages,
  });
  const assistant = toAssistantMessage(answer);

  await appendMessages(conversation.id, [userMessage, assistant]);
  if (bot.userId && !bot.isDemo) {
    await incrementChatUsage(bot.userId).catch(() => undefined);
  }

  return {
    reply: answer.reply,
    conversationId: conversation.id,
    citations: answer.citations,
    suggestions: answer.suggestions,
    handoff: answer.handoff,
    engine: answer.engine,
  };
}
