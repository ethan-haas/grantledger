import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

export const stripe = new Stripe(getServerEnv().STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});
