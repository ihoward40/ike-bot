import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import crypto from 'crypto';

/**
 * Handle webhooks from email providers (SendGrid, Postmark)
 */

// SendGrid webhook handler
export const handleSendGridWebhook = async (req: Request, res: Response) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    logger.info({ eventCount: events.length }, 'SendGrid webhook received');

    for (const event of events) {
      await processSendGridEvent(event);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error processing SendGrid webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function processSendGridEvent(event: any) {
  // Log the event
  await supabase.from('agent_logs').insert({
    trace_id: crypto.randomUUID(),
    level: 'info',
    message: `SendGrid event: ${event.event}`,
    action: 'email_event',
    metadata: {
      event_type: event.event,
      email: event.email,
      timestamp: event.timestamp,
      sg_event_id: event.sg_event_id,
    },
  });

  // Handle specific event types
  switch (event.event) {
    case 'delivered':
      logger.info({ email: event.email }, 'Email delivered');
      break;
    case 'bounce':
    case 'dropped':
      logger.warn({ email: event.email, reason: event.reason }, 'Email failed');
      break;
    case 'open':
      logger.info({ email: event.email }, 'Email opened');
      break;
    case 'click':
      logger.info({ email: event.email }, 'Email link clicked');
      break;
  }
}

// Postmark webhook handler
export const handlePostmarkWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    logger.info({ recordType: event.RecordType }, 'Postmark webhook received');

    await processPostmarkEvent(event);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error processing Postmark webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function processPostmarkEvent(event: any) {
  // Log the event
  await supabase.from('agent_logs').insert({
    trace_id: crypto.randomUUID(),
    level: 'info',
    message: `Postmark event: ${event.RecordType}`,
    action: 'email_event',
    metadata: {
      record_type: event.RecordType,
      email: event.Email,
      message_id: event.MessageID,
      tag: event.Tag,
    },
  });

  // Handle specific record types
  switch (event.RecordType) {
    case 'Delivery':
      logger.info({ email: event.Email }, 'Email delivered');
      break;
    case 'Bounce':
      logger.warn({ email: event.Email, description: event.Description }, 'Email bounced');
      break;
    case 'Open':
      logger.info({ email: event.Email }, 'Email opened');
      break;
    case 'Click':
      logger.info({ email: event.Email }, 'Email link clicked');
      break;
  }
}

// Generic inbound email handler (for both SendGrid and Postmark)
export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    const email = req.body;

    logger.info({ from: email.from || email.From }, 'Inbound email received');

    // Log the inbound email
    await supabase.from('agent_logs').insert({
      trace_id: crypto.randomUUID(),
      level: 'info',
      message: 'Inbound email received',
      action: 'inbound_email',
      metadata: {
        from: email.from || email.From,
        to: email.to || email.To,
        subject: email.subject || email.Subject,
        timestamp: new Date().toISOString(),
      },
    });

    // Here you could add logic to:
    // - Parse email content
    // - Extract attachments
    // - Create billing events or disputes from email content
    // - Trigger automation workflows

    res.json({ success: true, message: 'Inbound email processed' });
  } catch (error: any) {
    logger.error({ error }, 'Error processing inbound email');
    res.status(500).json({ error: 'Email processing failed' });
  }
};
