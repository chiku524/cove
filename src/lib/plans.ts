export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  bots: number;
  articles: number;
  chatsPerMonth: number;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    bots: 1,
    articles: 8,
    chatsPerMonth: 200,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$19 / month",
    bots: 25,
    articles: 500,
    chatsPerMonth: 20_000,
  },
};

export function isPlan(value: string | null | undefined): value is PlanId {
  return value === "free" || value === "pro";
}

export function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class PlanLimitError extends Error {
  constructor(
    public code: "bot_limit" | "article_limit" | "chat_limit",
    message: string,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}
