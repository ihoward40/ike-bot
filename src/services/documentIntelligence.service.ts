import { DocumentProcessor } from '../document-intelligence/DocumentProcessor';
import { 
  ProcessingOptions, 
  ProcessingResult,
  DocumentMetadata,
} from '../document-intelligence/types';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

/**
 * DocumentIntelligenceService - Service layer for document intelligence operations
 * 
 * Provides high-level API for document processing and management
 * Follows the existing service pattern in the codebase
 */
export class DocumentIntelligenceService {
  private readonly log = logger.child({ service: 'DocumentIntelligenceService' });
  private readonly processor: DocumentProcessor;

  constructor() {
    this.processor = new DocumentProcessor();
  }

  /**
   * Process a document with AFV detection and analysis
   * 
   * @param text - Document text content
   * @param metadata - Optional document metadata
   * @param options - Processing options
   * @returns Processing result
   */
  async processDocument(
    text: string,
    metadata?: Partial<DocumentMetadata>,
    options?: ProcessingOptions
  ): Promise<ProcessingResult> {
    try {
      this.log.info({ metadata }, 'Processing document');
      
      const result = await this.processor.process(text, metadata, options);
      
      this.log.info({ 
        status: result.status,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
      }, 'Document processing completed');

      return result;
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Document processing failed');
      throw new AppError(500, `Document processing failed: ${err.message}`);
    }
  }

  /**
   * Get a processed document by ID
   * 
   * @param id - Document ID
   * @returns Processed document data
   */
  async getProcessedDocument(id: string) {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new AppError(404, `Document not found: ${error.message}`);
      }

      return data;
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err, documentId: id }, 'Failed to get document');
      throw error;
    }
  }

  /**
   * List processed documents with filtering and pagination
   * 
   * @param filters - Optional filters
   * @returns List of processed documents
   */
  async listProcessedDocuments(filters?: {
    page?: number;
    limit?: number;
    documentType?: string;
    afvFound?: boolean;
    dischargeEligible?: boolean;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('processed_documents')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.documentType) {
        query = query.eq('document_type', filters.documentType);
      }
      if (filters?.afvFound !== undefined) {
        query = query.eq('afv_found', filters.afvFound);
      }
      if (filters?.dischargeEligible !== undefined) {
        query = query.eq('discharge_eligible', filters.dischargeEligible);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new AppError(500, `Failed to list documents: ${error.message}`);
      }

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to list documents');
      throw error;
    }
  }

  /**
   * Search documents by text content
   * 
   * @param searchText - Text to search for
   * @param limit - Maximum number of results
   * @returns Array of matching documents
   */
  async searchDocuments(searchText: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .textSearch('text_content', searchText)
        .limit(limit);

      if (error) {
        throw new AppError(500, `Search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err, searchText }, 'Document search failed');
      throw error;
    }
  }

  /**
   * Get discharge-eligible documents
   * 
   * @returns Array of discharge-eligible documents
   */
  async getDischargeEligibleDocuments() {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .eq('discharge_eligible', true)
        .order('discharge_date', { ascending: true });

      if (error) {
        throw new AppError(500, `Failed to get discharge-eligible documents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err }, 'Failed to get discharge-eligible documents');
      throw error;
    }
  }

  /**
   * Delete a processed document
   * 
   * @param id - Document ID
   */
  async deleteProcessedDocument(id: string) {
    try {
      const { error } = await supabase
        .from('processed_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(500, `Failed to delete document: ${error.message}`);
      }

      this.log.info({ documentId: id }, 'Document deleted');
    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err, documentId: id }, 'Failed to delete document');
      throw error;
    }
  }
}
