/**
 * Document Intelligence Controller
 * 
 * Handles HTTP requests for document processing operations.
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentIntelligenceService } from '../services/documentIntelligence.service';
import { DocumentType } from '../document-intelligence/types';

const documentService = new DocumentIntelligenceService();

export class DocumentIntelligenceController {
  /**
   * Process a document through the intelligence pipeline
   * POST /api/document-intelligence/process
   */
  async processDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, document_type, filename, source } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'Document content is required'
        });
      }

      const result = await documentService.processDocument({
        content,
        documentType: document_type as DocumentType,
        metadata: {
          filename,
          source,
          uploadedAt: new Date()
        }
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a processed document by ID
   * GET /api/document-intelligence/documents/:id
   */
  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);
      res.status(200).json(document);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List processed documents with filters
   * GET /api/document-intelligence/documents
   */
  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = '1',
        limit = '10',
        document_type,
        has_afv
      } = req.query;

      const result = await documentService.listDocuments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        documentType: document_type as string,
        hasAFV: has_afv === 'true' ? true : has_afv === 'false' ? false : undefined
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a processed document
   * DELETE /api/document-intelligence/documents/:id
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await documentService.deleteDocument(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
