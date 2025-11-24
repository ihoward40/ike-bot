import { Router } from 'express';
import * as notionController from '../controllers/notionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All Notion routes require authentication
router.use(authenticateToken);

router.post('/activity', notionController.logActivity);
router.post('/filings', notionController.createFiling);
router.get('/database/:databaseId', notionController.getDatabase);
router.patch('/page/:pageId', notionController.updatePage);

export default router;
