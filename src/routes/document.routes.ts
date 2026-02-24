import { Router } from 'express';
import {
  processDocument,
  getDocument,
  listDocuments,
  getDischargeEligibleDocuments,
  getDocumentProcessingLog
} from '../controllers/document.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route POST /api/documents/process
 * @description Process a document using the Document Intelligence Module
 */
router.post('/process', asyncHandler(processDocument));

/**
 * @route GET /api/documents
 * @description List documents with optional filtering
 */
router.get('/', asyncHandler(listDocuments));

/**
 * @route GET /api/documents/discharge-eligible
 * @description Get documents eligible for discharge
 */
router.get('/discharge-eligible', asyncHandler(getDischargeEligibleDocuments));

/**
 * @route GET /api/documents/:id
 * @description Get a document by ID
 */
router.get('/:id', asyncHandler(getDocument));

/**
 * @route GET /api/documents/:id/processing-log
 * @description Get processing log for a document
 */
router.get('/:id/processing-log', asyncHandler(getDocumentProcessingLog));

export default router;
