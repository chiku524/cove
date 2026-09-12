import type Stripe from "stripe";
import {
  findUserByStripeCustomer,
  findUserByStripeSubscription,
  getUserRecord,
  updateUserBilling,
} from "@/lib/store";
import {
  getStripe,
  planFromSubscriptionStatus,
  subscriptionIdFromInvoice,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function applySubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId?: string | null,
) {
  await updateUserBilling(userId, {
    plan: planFromSubscriptionStatus(subscription.status),
    stripeCustomerId: customerId ?? (typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null),
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
  });
}

async function resolveUserId(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  if (input.userId) {
    const existing = await getUserRecord(input.userId);
    if (existing) return existing.id;
  }
  if (input.customerId) {
    const byCustomer = await findUserByStripeCustomer(input.customerId);
    if (byCustomer) return byCustomer.id;
  }
  if (input.subscriptionId) {
    const bySub = await findUserByStripeSubscription(input.subscriptionId);
    if (bySub) return bySub.id;
  }
  return null;
}

async function applyInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  const userId = await resolveUserId({
    userId: invoice.metadata?.userId ?? invoice.parent?.subscription_details?.metadata?.userId,
    customerId,
    subscriptionId,
  });
  if (!userId) return;
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await applySubscription(userId, subscription, customerId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "webhook_unconfigured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = await resolveUserId({
      userId: session.client_reference_id ?? session.metadata?.userId,
      customerId:
        typeof session.customer === "string" ? session.customer : session.customer?.id,
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id,
    });
    if (userId && session.subscription) {
      const subscription =
        typeof session.subscription === "string"
          ? await getStripe().subscriptions.retrieve(session.subscription)
          : session.subscription;
      await applySubscription(
        userId,
        subscription,
        typeof session.customer === "string" ? session.customer : session.customer?.id,
      );
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused" ||
    event.type === "customer.subscription.resumed"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = await resolveUserId({
      userId: subscription.metadata?.userId,
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id,
      subscriptionId: subscription.id,
    });
    if (userId) {
      await applySubscription(userId, subscription);
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    await applyInvoice(event.data.object as Stripe.Invoice);
  }

  return Response.json({ received: true });
}
