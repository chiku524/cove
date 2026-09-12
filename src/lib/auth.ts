import { json } from "@/lib/http";
import { getBotByApiKey } from "@/lib/store";
import type { Bot } from "@/lib/types";

export function readApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer?.trim() || request.headers.get("x-api-key")?.trim() || "";
}

export async function requireBot(
  request: Request,
): Promise<
  { bot: Bot; error?: undefined } | { bot?: undefined; error: Response }
> {
  const apiKey = readApiKey(request);
  if (!apiKey) {
    return {
      error: json(
        {
          error: "missing_api_key",
          message:
            "Send your Cove API key as Authorization: Bearer cove_live_...",
        },
        { status: 401 },
      ),
    };
  }
  const bot = await getBotByApiKey(apiKey);
  if (!bot) {
    return {
      error: json(
        { error: "invalid_api_key", message: "No bot matches that API key." },
        { status: 401 },
      ),
    };
  }
  return { bot };
}
