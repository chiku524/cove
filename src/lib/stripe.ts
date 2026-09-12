import { randomBytes } from "crypto";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID,
  );
}

export function checkoutIntegrationId() {
  return `cove_pro_${randomBytes(4).toString("hex")}`;
}

export function planFromSubscriptionStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

const OPEN_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

export function hasOpenSubscription(
  subscriptionId?: string | null,
  status?: string | null,
) {
  return Boolean(subscriptionId && status && OPEN_SUBSCRIPTION_STATUSES.has(status));
}

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details") {
    const sub = parent.subscription_details?.subscription;
    if (typeof sub === "string") return sub;
    if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  }
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object") return legacy.id;
  return null;
}
