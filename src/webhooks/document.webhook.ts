/**
 * Document Webhook Handler
 * 
 * Handles webhook requests for document processing from external sources
 * like email services, file upload services, etc.
 */

import { Request, Response } from 'express';
import { DocumentIntelligenceService } from '../services/documentIntelligence.service';
import { DocumentType } from '../document-intelligence/types';
import { logger } from '../config/logger';

const documentService = new DocumentIntelligenceService();

/**
 * Handle document webhook requests
 * POST /webhooks/document
 */
export const handleDocumentWebhook = async (req: Request, res: Response) => {
  try {
    const { content, document_type, filename, source } = req.body;

    logger.info({
      source: source || 'unknown',
      filename,
      contentLength: content?.length || 0
    }, 'Document webhook received');

    if (!content) {
      return res.status(400).json({
        error: 'Document content is required'
      });
    }

    // Process the document
    const result = await documentService.processDocument({
      content,
      documentType: document_type as DocumentType,
      metadata: {
        filename,
        source: source || 'webhook',
        uploadedAt: new Date()
      }
    });

    logger.info({
      documentId: result.id,
      documentType: result.documentType,
      hasAFV: result.afvNotation.present,
      confidence: result.metadata.confidence
    }, 'Document processed successfully');

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'Document webhook processing failed');
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
