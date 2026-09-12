import Link from "next/link";
import { BillingActions } from "@/components/billing-actions";
import { PlanUsage } from "@/components/plan-usage";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { getWorkspaceUsage } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const [{ checkout }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  if (!user) return null;
  const usage = await getWorkspaceUsage(user.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <div>
          <Link
            href="/dashboard"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            ← Bots
          </Link>
          <h1 className="font-heading mt-3 text-4xl">Billing</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Free is enough to list Cove and ship a first bot. Pro is for teams
            that need more bots, articles, and monthly chat volume.
          </p>
        </div>
        {checkout === "success" ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            Checkout finished. Pro unlocks as soon as Stripe confirms the
            subscription.
          </p>
        ) : null}
        {checkout === "canceled" ? (
          <p className="text-muted-foreground text-sm">
            Checkout was canceled. You are still on {usage.plan.name}.
          </p>
        ) : null}
        <PlanUsage usage={usage} />
        <div className="grid gap-4 md:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <Card
              key={plan.id}
              className={plan.id === usage.plan.id ? "border-primary/60" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{plan.name}</span>
                  <span className="text-sm font-normal">{plan.priceLabel}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-2 text-sm">
                <p>{plan.bots} bot{plan.bots === 1 ? "" : "s"}</p>
                <p>{plan.articles.toLocaleString()} articles</p>
                <p>{plan.chatsPerMonth.toLocaleString()} chats / month</p>
                {plan.id === usage.plan.id ? (
                  <p className="text-foreground pt-2 text-xs font-medium">
                    Current plan
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        <BillingActions
          plan={user.plan}
          hasCustomer={Boolean(user.stripeCustomerId)}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Test payments use Stripe Checkout. In this sandbox, card{" "}
          <span className="font-mono text-foreground">4242 4242 4242 4242</span>,
          any future expiry, and any CVC will succeed. Live charges need a
          claimed Stripe account and live keys.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          If you will charge US or EU customers, enable Stripe Tax and add a
          registration before turning on automatic tax. Stripe collects no tax
          until a registration is active. See{" "}
          <a
            className="underline"
            href="https://docs.stripe.com/billing/taxes/collect-taxes"
            target="_blank"
            rel="noreferrer"
          >
            Collect taxes for recurring payments
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
