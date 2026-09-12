import { corsPreflight, json, notFound } from "@/lib/http";
import { getDemoBot } from "@/lib/store";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const bot = await getDemoBot();
  if (!bot) return notFound("Demo bot");
  return json({
    bot: {
      id: bot.id,
      name: bot.name,
      welcomeMessage: bot.welcomeMessage,
      description: bot.description,
    },
    apiKey: bot.apiKey,
  });
}
