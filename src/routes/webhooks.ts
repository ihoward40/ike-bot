import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { supabase } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { verifyWebhook } from "../services/stripe";
import { logger } from "../middleware/logger";

const router = Router();

// Generic webhook ingestion endpoint
router.post(
  "/ingest",
  asyncHandler(async (req: Request, res: Response) => {
    const { event_type, payload, source } = req.body;

    if (!event_type || !payload || !source) {
      throw new AppError(400, "Missing required webhook fields");
    }

    const { data, error } = await supabase
      .from("webhook_events")
      .insert([
        {
          event_type,
          payload,
          source,
          processed: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw new AppError(500, error.message);

    logger.info(`Webhook received: ${event_type} from ${source}`);
    res.status(201).json({ webhook_event: data, message: "Webhook received" });
  })
);

// Stripe webhook endpoint
router.post(
  "/stripe",
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      throw new AppError(400, "Missing stripe-signature header");
    }

    const rawBody = JSON.stringify(req.body);
    const event = verifyWebhook(rawBody, signature);

    if (!event) {
      throw new AppError(400, "Invalid webhook signature");
    }

    // Store webhook event
    await supabase.from("webhook_events").insert([
      {
        event_type: event.type,
        payload: event.data,
        source: "stripe",
        processed: false,
        created_at: new Date().toISOString(),
      },
    ]);

    logger.info(`Stripe webhook received: ${event.type}`);

    // Handle specific event types
    switch (event.type) {
      case "payment_intent.succeeded":
        logger.info("Payment succeeded", event.data.object);
        break;
      case "payment_intent.payment_failed":
        logger.error("Payment failed", event.data.object);
        break;
      case "customer.created":
        logger.info("Customer created", event.data.object);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, event_type: event.type });
  })
);

// Get all webhook events
router.get(
  "/events",
  asyncHandler(async (req: Request, res: Response) => {
    const { source, processed } = req.query;
    let query = supabase.from("webhook_events").select("*");

    if (source) query = query.eq("source", source);
    if (processed !== undefined) query = query.eq("processed", processed === "true");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    res.json({ webhook_events: data });
  })
);

// Mark webhook event as processed
router.put(
  "/events/:id/process",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError(500, error.message);
    res.json({ webhook_event: data });
  })
);

export default router;
