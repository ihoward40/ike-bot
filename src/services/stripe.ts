import Stripe from "stripe";
import { config } from "../config";
import { logger } from "../middleware/logger";

let stripeClient: Stripe | null = null;

if (config.stripe.secretKey) {
  stripeClient = new Stripe(config.stripe.secretKey, {
    apiVersion: "2025-11-17.clover",
  });
}

export interface PaymentIntentOptions {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export const createPaymentIntent = async (
  options: PaymentIntentOptions
): Promise<Stripe.PaymentIntent | null> => {
  if (!stripeClient) {
    logger.warn("Stripe API key not configured.");
    return null;
  }

  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: options.amount,
      currency: options.currency || "usd",
      customer: options.customerId,
      metadata: options.metadata || {},
    });

    logger.info(`Payment intent created: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error: any) {
    logger.error("Failed to create payment intent", error);
    throw new Error(`Stripe payment intent failed: ${error.message}`);
  }
};

export const createCustomer = async (
  email: string,
  name?: string
): Promise<Stripe.Customer | null> => {
  if (!stripeClient) {
    logger.warn("Stripe API key not configured.");
    return null;
  }

  try {
    const customer = await stripeClient.customers.create({
      email,
      name,
    });

    logger.info(`Stripe customer created: ${customer.id}`);
    return customer;
  } catch (error: any) {
    logger.error("Failed to create Stripe customer", error);
    throw new Error(`Stripe customer creation failed: ${error.message}`);
  }
};

export const verifyWebhook = (
  payload: string | Buffer,
  signature: string
): Stripe.Event | null => {
  if (!stripeClient || !config.stripe.webhookSecret) {
    logger.warn("Stripe webhook secret not configured.");
    return null;
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
    return event;
  } catch (error: any) {
    logger.error("Stripe webhook verification failed", error);
    return null;
  }
};
