import { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook configuration error' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Webhook signature verification failed');
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Log the webhook event
  logger.info({ eventType: event.type }, 'Stripe webhook received');

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        logger.info({ eventType: event.type }, 'Unhandled Stripe event type');
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error({ error }, 'Error processing Stripe webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await supabase.from('billing_events').insert({
    event_type: 'payment_intent.succeeded',
    event_source: 'stripe',
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'succeeded',
    stripe_event_id: paymentIntent.id,
    metadata: {
      customer: paymentIntent.customer,
      description: paymentIntent.description,
    },
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  await supabase.from('billing_events').insert({
    event_type: 'payment_intent.failed',
    event_source: 'stripe',
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'failed',
    stripe_event_id: paymentIntent.id,
    metadata: {
      customer: paymentIntent.customer,
      last_payment_error: paymentIntent.last_payment_error,
    },
  });
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  await supabase.from('billing_events').insert({
    event_type: 'charge.succeeded',
    event_source: 'stripe',
    amount: charge.amount / 100,
    currency: charge.currency.toUpperCase(),
    status: 'succeeded',
    stripe_event_id: charge.id,
    metadata: {
      customer: charge.customer,
      description: charge.description,
    },
  });
}

async function handleChargeFailed(charge: Stripe.Charge) {
  await supabase.from('billing_events').insert({
    event_type: 'charge.failed',
    event_source: 'stripe',
    amount: charge.amount / 100,
    currency: charge.currency.toUpperCase(),
    status: 'failed',
    stripe_event_id: charge.id,
    metadata: {
      customer: charge.customer,
      failure_message: charge.failure_message,
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  await supabase.from('billing_events').insert({
    event_type: 'invoice.payment_succeeded',
    event_source: 'stripe',
    amount: (invoice.amount_paid || 0) / 100,
    currency: invoice.currency?.toUpperCase() || 'USD',
    status: 'succeeded',
    stripe_event_id: invoice.id,
    metadata: {
      customer: invoice.customer,
      subscription: (invoice as any).subscription,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await supabase.from('billing_events').insert({
    event_type: 'invoice.payment_failed',
    event_source: 'stripe',
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency?.toUpperCase() || 'USD',
    status: 'failed',
    stripe_event_id: invoice.id,
    metadata: {
      customer: invoice.customer,
      subscription: (invoice as any).subscription,
    },
  });
}
