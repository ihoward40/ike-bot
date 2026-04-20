import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import crypto from 'crypto';

/**
 * Handle webhooks from Make.com automation scenarios
 * Make.com sends JSON payloads with scenario data
 */
export const handleMakeWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Log the incoming webhook
    logger.info({
      scenario: payload.scenario_name,
      timestamp: new Date().toISOString(),
    }, 'Make.com webhook received');

    // Validate webhook has required fields
    if (!payload.action) {
      return res.status(400).json({ error: 'Missing action field' });
    }

    // Route to appropriate handler based on action
    switch (payload.action) {
      case 'create_beneficiary':
        await handleCreateBeneficiary(payload);
        break;
      case 'create_dispute':
        await handleCreateDispute(payload);
        break;
      case 'create_enforcement_packet':
        await handleCreateEnforcementPacket(payload);
        break;
      case 'billing_alert':
        await handleBillingAlert(payload);
        break;
      default:
        logger.info({ action: payload.action }, 'Unknown Make.com action');
    }

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      trace_id: payload.trace_id || crypto.randomUUID(),
      level: 'info',
      message: `Make.com webhook processed: ${payload.action}`,
      action: payload.action,
      metadata: payload,
    });

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    logger.error({ error }, 'Error processing Make.com webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handleCreateBeneficiary(payload: any) {
  const { data } = payload;
  await supabase.from('beneficiaries').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    relationship: data.relationship,
  });
}

async function handleCreateDispute(payload: any) {
  const { data } = payload;
  await supabase.from('credit_disputes').insert({
    beneficiary_id: data.beneficiary_id,
    creditor_name: data.creditor_name,
    dispute_reason: data.dispute_reason,
    dispute_type: data.dispute_type,
  });
}

async function handleCreateEnforcementPacket(payload: any) {
  const { data } = payload;
  await supabase.from('enforcement_packets').insert({
    beneficiary_id: data.beneficiary_id,
    packet_type: data.packet_type,
    target_agency: data.target_agency,
    status: 'pending',
  });
}

async function handleBillingAlert(payload: any) {
  const { data } = payload;
  await supabase.from('billing_events').insert({
    event_type: 'billing_alert',
    event_source: 'make.com',
    amount: data.amount,
    status: data.status,
    metadata: data,
  });
}
