import type Stripe from "stripe";
import { getPublicOrigin } from "@/lib/origin";
import { requireUser } from "@/lib/session";
import { updateUserBilling } from "@/lib/store";
import {
  checkoutIntegrationId,
  getStripe,
  stripeConfigured,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  if (!stripeConfigured()) {
    return Response.json(
      {
        error: "billing_unavailable",
        message: "Stripe is not configured on this environment yet.",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const origin = await getPublicOrigin();
  let customerId = auth.user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email,
      name: auth.user.name,
      metadata: { userId: auth.user.id },
    });
    customerId = customer.id;
    await updateUserBilling(auth.user.id, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/dashboard/billing?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=canceled`,
    client_reference_id: auth.user.id,
    metadata: { userId: auth.user.id },
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    subscription_data: {
      metadata: { userId: auth.user.id },
    },
    integration_identifier: checkoutIntegrationId(),
  } as Stripe.Checkout.SessionCreateParams);

  if (!session.url) {
    return Response.json(
      { error: "checkout_failed", message: "Stripe did not return a checkout URL." },
      { status: 502 },
    );
  }

  return Response.json({ url: session.url });
}
