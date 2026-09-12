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
