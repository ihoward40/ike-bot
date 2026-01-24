import { Request, Response } from 'express';
import { DocumentIntelligenceService } from '../services/documentIntelligence.service';
import { ProcessingOptions } from '../document-intelligence/types';
import { logger } from '../config/logger';

/**
 * DocumentIntelligenceController - Handles HTTP requests for document intelligence operations
 */
export class DocumentIntelligenceController {
  private readonly service: DocumentIntelligenceService;
  private readonly log = logger.child({ controller: 'DocumentIntelligenceController' });

  constructor() {
    this.service = new DocumentIntelligenceService();
  }

  /**
   * Process a document
   * POST /api/document-intelligence/process
   * 
   * Body:
   * {
   *   text: string,
   *   metadata?: { title?, documentType?, receivedDate?, source? },
   *   options?: { detectAFV?, calculateDischarge?, extractEntities?, storeInDatabase? }
   * }
   */
  processDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, metadata, options } = req.body;

      if (!text) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Document text is required',
        });
        return;
      }

      // Process the document
      const result = await this.service.processDocument(text, metadata, options as ProcessingOptions);

      // Return appropriate status based on result
      if (result.status === 'error') {
        res.status(500).json({
          error: 'Processing Error',
          message: 'Document processing failed',
          result,
        });
        return;
      }

      res.status(200).json({
        message: 'Document processed successfully',
        result,
      });
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to process document');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };

  /**
   * Get a processed document by ID
   * GET /api/document-intelligence/:id
   */
  getDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Document ID is required',
        });
        return;
      }

      const document = await this.service.getProcessedDocument(id);
      res.status(200).json({ data: document });
    } catch (error) {
      const err = error as any;
      
      if (err.statusCode === 404) {
        res.status(404).json({
          error: 'Not Found',
          message: err.message,
        });
        return;
      }

      this.log.error({ error: err }, 'Failed to get document');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };

  /**
   * List processed documents with filtering and pagination
   * GET /api/document-intelligence
   * 
   * Query params:
   * - page: number
   * - limit: number
   * - documentType: string
   * - afvFound: boolean
   * - dischargeEligible: boolean
   */
  listDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, documentType, afvFound, dischargeEligible } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        documentType: documentType as string,
        afvFound: afvFound === 'true' ? true : afvFound === 'false' ? false : undefined,
        dischargeEligible: dischargeEligible === 'true' ? true : dischargeEligible === 'false' ? false : undefined,
      };

      const result = await this.service.listProcessedDocuments(filters);
      res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to list documents');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };

  /**
   * Search documents by text content
   * GET /api/document-intelligence/search
   * 
   * Query params:
   * - q: string (search query)
   * - limit: number
   */
  searchDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit } = req.query;

      if (!q) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Search query (q) is required',
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string) : 10;
      const results = await this.service.searchDocuments(q as string, searchLimit);

      res.status(200).json({ data: results });
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Search failed');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };

  /**
   * Get discharge-eligible documents
   * GET /api/document-intelligence/discharge-eligible
   */
  getDischargeEligible = async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await this.service.getDischargeEligibleDocuments();
      res.status(200).json({ data: documents });
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to get discharge-eligible documents');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };

  /**
   * Delete a processed document
   * DELETE /api/document-intelligence/:id
   */
  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Document ID is required',
        });
        return;
      }

      await this.service.deleteProcessedDocument(id);
      res.status(200).json({
        message: 'Document deleted successfully',
      });
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to delete document');
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  };
}
