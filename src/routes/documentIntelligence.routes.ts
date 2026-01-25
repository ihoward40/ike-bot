/**
 * Document Intelligence Routes
 * 
 * API routes for document processing and analysis.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DocumentIntelligenceController } from '../controllers/documentIntelligence.controller';

const router = Router();
const controller = new DocumentIntelligenceController();

/**
 * POST /api/document-intelligence/process
 * Process a document through the intelligence pipeline
 */
router.post('/process', (req: Request, res: Response, next: NextFunction) => 
  controller.processDocument(req, res, next)
);

/**
 * GET /api/document-intelligence/documents
 * List processed documents with filters
 */
router.get('/documents', (req: Request, res: Response, next: NextFunction) => 
  controller.listDocuments(req, res, next)
);

/**
 * GET /api/document-intelligence/documents/:id
 * Get a specific processed document
 */
router.get('/documents/:id', (req: Request, res: Response, next: NextFunction) => 
  controller.getDocument(req, res, next)
);

/**
 * DELETE /api/document-intelligence/documents/:id
 * Delete a processed document
 */
router.delete('/documents/:id', (req: Request, res: Response, next: NextFunction) => 
  controller.deleteDocument(req, res, next)
);

export default router;
