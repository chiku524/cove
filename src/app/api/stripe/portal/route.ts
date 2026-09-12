import { getPublicOrigin } from "@/lib/origin";
import { requireUser } from "@/lib/session";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  if (!stripeConfigured() || !auth.user.stripeCustomerId) {
    return Response.json(
      {
        error: "portal_unavailable",
        message: "No Stripe customer is on file yet. Start a Pro checkout first.",
      },
      { status: 400 },
    );
  }

  const origin = await getPublicOrigin();
  const session = await getStripe().billingPortal.sessions.create({
    customer: auth.user.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return Response.json({ url: session.url });
}
