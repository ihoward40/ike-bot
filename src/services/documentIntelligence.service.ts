/**
 * Document Intelligence Service
 * 
 * Service layer for document processing operations with Supabase integration.
 */

import { supabase } from '../config/supabase';
import { DocumentProcessor } from '../document-intelligence/DocumentProcessor';
import { DocumentInput, DocumentProcessingResult } from '../document-intelligence/types';
import { AppError } from '../middleware/errorHandler';

export class DocumentIntelligenceService {
  private processor: DocumentProcessor;

  constructor() {
    this.processor = new DocumentProcessor();
  }

  /**
   * Process a document and store results in database
   * @param input - Document input with content and metadata
   * @returns Document processing result
   */
  async processDocument(input: DocumentInput): Promise<DocumentProcessingResult> {
    // Validate document content
    const validation = this.processor.validateDocumentContent(input.content);
    if (!validation.valid) {
      throw new AppError(400, `Invalid document: ${validation.errors.join(', ')}`);
    }

    // Process the document
    const result = await this.processor.processDocument(input);

    // Store in database
    try {
      await this.storeProcessingResult(result, input);
    } catch (error) {
      // Log error but don't fail the processing
      console.error('Failed to store processing result:', error);
    }

    return result;
  }

  /**
   * Store document processing result in Supabase
   * @param result - Processing result
   * @param input - Original input
   */
  private async storeProcessingResult(
    result: DocumentProcessingResult,
    input: DocumentInput
  ): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .insert({
        id: result.id,
        content: input.content,
        type: result.documentType,
        afv_status: result.commercialInstrument?.afvStatus || {
          hasAFV: result.afvNotation.present,
          afvNotations: result.afvNotation.notations
        },
        discharge_eligibility: result.commercialInstrument?.dischargeEligibility || null,
        entities: result.entities,
        metadata: {
          ...input.metadata,
          ...result.metadata,
          confidence: result.metadata.confidence
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new AppError(500, `Failed to store document: ${error.message}`);
    }
  }

  /**
   * Retrieve a processed document by ID
   * @param id - Document ID
   * @returns Stored document data
   */
  async getDocumentById(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(404, 'Document not found');
      }
      throw new AppError(500, `Failed to fetch document: ${error.message}`);
    }

    return data;
  }

  /**
   * List processed documents with optional filtering
   * @param filters - Optional filters for querying
   * @returns List of documents with pagination
   */
  async listDocuments(filters?: {
    page?: number;
    limit?: number;
    documentType?: string;
    hasAFV?: boolean;
  }) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100);
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('documents')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.documentType) {
      queryBuilder = queryBuilder.eq('type', filters.documentType);
    }

    if (filters?.hasAFV !== undefined) {
      queryBuilder = queryBuilder.eq('afv_status->>hasAFV', filters.hasAFV);
    }

    const { data, error, count } = await queryBuilder
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
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  /**
   * Delete a document by ID
   * @param id - Document ID
   */
  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, `Failed to delete document: ${error.message}`);
    }

    return { success: true };
  }
}
