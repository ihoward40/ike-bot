import { Router } from 'express';
import { DocumentIntelligenceController } from '../controllers/documentIntelligence.controller';

/**
 * Document Intelligence API Routes
 * 
 * Endpoints:
 * - POST /api/document-intelligence/process - Process a document
 * - GET /api/document-intelligence - List processed documents
 * - GET /api/document-intelligence/search - Search documents
 * - GET /api/document-intelligence/discharge-eligible - Get discharge-eligible documents
 * - GET /api/document-intelligence/:id - Get a specific document
 * - DELETE /api/document-intelligence/:id - Delete a document
 */

const router = Router();
const controller = new DocumentIntelligenceController();

// Process a document
router.post('/process', controller.processDocument);

// Search documents
router.get('/search', controller.searchDocuments);

// Get discharge-eligible documents
router.get('/discharge-eligible', controller.getDischargeEligible);

// List documents (must be after specific routes to avoid conflicts)
router.get('/', controller.listDocuments);

// Get specific document
router.get('/:id', controller.getDocument);

// Delete document
router.delete('/:id', controller.deleteDocument);

export default router;
