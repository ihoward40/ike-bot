import { Router } from 'express';
import authRoutes from './auth.routes';
import webhookRoutes from './webhook.routes';
import notionRoutes from './notion.routes';
import { createCrudRoutes } from './crud.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'IKE-BOT API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/notion', notionRoutes);

// CRUD routes for different resources
router.use('/filings', createCrudRoutes('filings', true));
router.use('/documents', createCrudRoutes('documents', true));
router.use('/logs', createCrudRoutes('logs', true));

export default router;
