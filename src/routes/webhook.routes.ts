import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// Make.com webhook endpoint (public - no auth required for webhooks, but rate limited)
router.post('/make', webhookLimiter, webhookController.handleMakeWebhook);

// Get webhook documentation
router.get('/make', webhookController.getMakeWebhookInfo);

export default router;
