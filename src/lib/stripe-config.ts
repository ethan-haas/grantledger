import { getClientEnv } from "@/lib/env";

function getStripePrices() {
  const env = getClientEnv();
  return {
    monthly: env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    annual: env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID,
  };
}

export const STRIPE_PRICES = getStripePrices();

export const PLAN_DETAILS = {
  monthly: {
    name: "Monthly" as const,
    price: 149,
    interval: "month" as const,
    priceId: STRIPE_PRICES.monthly,
  },
  annual: {
    name: "Annual" as const,
    price: 1490,
    interval: "year" as const,
    priceId: STRIPE_PRICES.annual,
    savings: "Save $298/year",
  },
};
