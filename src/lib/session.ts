import { headers } from "next/headers";
import { getAuth } from "@/lib/auth-server";
import { notFound, unauthorized } from "@/lib/http";
import { isPlan, type PlanId } from "@/lib/plans";
import { getBot, getUserRecord } from "@/lib/store";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
};

export async function getCurrentUser(
  request?: Request,
): Promise<SessionUser | null> {
  const headerStore = request?.headers ?? (await headers());
  const session = await getAuth().api.getSession({ headers: headerStore });
  if (!session?.user) return null;
  const record = await getUserRecord(session.user.id);
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    plan: isPlan(record?.plan) ? record.plan : "free",
    stripeCustomerId: record?.stripeCustomerId ?? null,
    stripeSubscriptionId: record?.stripeSubscriptionId ?? null,
    stripeSubscriptionStatus: record?.stripeSubscriptionStatus ?? null,
  };
}

export async function requireUser(request?: Request): Promise<
  | { user: SessionUser; error?: undefined }
  | { user?: undefined; error: Response }
> {
  const user = await getCurrentUser(request);
  if (!user) {
    return { error: unauthorized("Sign in to manage bots.") };
  }
  return { user };
}

export async function requireOwnedBot(
  request: Request,
  id: string,
): Promise<
  | { user: SessionUser; bot: NonNullable<Awaited<ReturnType<typeof getBot>>>; error?: undefined }
  | { user?: undefined; bot?: undefined; error: Response }
> {
  const auth = await requireUser(request);
  if (auth.error) return auth;
  const bot = await getBot(id);
  if (!bot || bot.userId !== auth.user.id) {
    return { error: notFound("Bot") };
  }
  return { user: auth.user, bot };
}
