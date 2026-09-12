import { requireBot } from "@/lib/auth";
import { corsPreflight, handlePublic, json } from "@/lib/http";
import { sampleQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  return handlePublic(async () => {
    const auth = await requireBot(request);
    if (auth.error) return auth.error;
    return json({
      bot: {
        id: auth.bot.id,
        name: auth.bot.name,
        welcomeMessage: auth.bot.welcomeMessage,
        suggestions: sampleQuestions(auth.bot.articles),
      },
    });
  });
}
