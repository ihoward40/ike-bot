import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';

const router = Router();

// Make.com webhook endpoint (public - no auth required for webhooks)
router.post('/make', webhookController.handleMakeWebhook);

// Get webhook documentation
router.get('/make', webhookController.getMakeWebhookInfo);

export default router;
