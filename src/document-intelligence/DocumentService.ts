import { supabase } from '../config/supabase';
import { DocumentProcessor } from './DocumentProcessor';
import {
  DocumentType,
  DocumentProcessingResult,
  DocumentMetadata
} from './types';
import { AppError } from '../middleware/errorHandler';

/**
 * DocumentService
 * 
 * Service layer for document intelligence operations with Supabase integration.
 * Handles document storage, processing, and retrieval.
 */
export class DocumentService {
  private readonly processor: DocumentProcessor;

  constructor() {
    this.processor = new DocumentProcessor();
  }

  /**
   * Process and store a document
   * 
   * @param content - The document content
   * @param documentType - Optional document type hint
   * @param beneficiaryId - Optional beneficiary ID to associate
   * @returns The stored document with processing results
   */
  public async processAndStore(
    content: string,
    documentType?: DocumentType,
    beneficiaryId?: string
  ): Promise<any> {
    try {
      // Log processing start
      const processingLogId = await this.logProcessingStart(content);

      // Process the document
      const result = await this.processor.processDocument(content, documentType);

      // Prepare document data for storage
      const documentData = this.prepareDocumentData(content, result, beneficiaryId);

      // Insert into database
      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        await this.logProcessingError(processingLogId, 'storage', error.message);
        throw new AppError(500, `Failed to store document: ${error.message}`);
      }

      // Log processing completion
      await this.logProcessingComplete(processingLogId, data.id);

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Document processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get a document by ID
   * 
   * @param documentId - The document ID
   * @returns The document with all processing results
   */
  public async getById(documentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
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
   * List documents with filtering
   * 
   * @param filters - Query filters
   * @returns List of documents with pagination
   */
  public async list(filters: {
    page?: number;
    limit?: number;
    documentType?: DocumentType;
    beneficiaryId?: string;
    afvPresent?: boolean;
    dischargeEligible?: boolean;
  }): Promise<any> {
    const {
      page = 1,
      limit = 10,
      documentType,
      beneficiaryId,
      afvPresent,
      dischargeEligible
    } = filters;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' });

    // Apply filters
    if (documentType) {
      query = query.eq('document_type', documentType);
    }
    if (beneficiaryId) {
      query = query.eq('beneficiary_id', beneficiaryId);
    }
    if (afvPresent !== undefined) {
      query = query.eq('afv_present', afvPresent);
    }
    if (dischargeEligible !== undefined) {
      query = query.eq('discharge_eligible', dischargeEligible);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, `Failed to fetch documents: ${error.message}`);
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
   * Find documents eligible for discharge
   * 
   * @param beneficiaryId - Optional beneficiary ID to filter by
   * @returns List of discharge-eligible documents
   */
  public async findDischargeEligible(beneficiaryId?: string): Promise<any[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('discharge_eligible', true);

    if (beneficiaryId) {
      query = query.eq('beneficiary_id', beneficiaryId);
    }

    const { data, error } = await query.order('discharge_date', { ascending: true });

    if (error) {
      throw new AppError(500, `Failed to fetch discharge-eligible documents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get processing log for a document
   * 
   * @param documentId - The document ID
   * @returns Processing log entries
   */
  public async getProcessingLog(documentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('document_processing_log')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, `Failed to fetch processing log: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Prepare document data for storage in Supabase
   * 
   * @param content - The document content
   * @param result - The processing result
   * @param beneficiaryId - Optional beneficiary ID
   * @returns Document data ready for insertion
   */
  private prepareDocumentData(
    content: string,
    result: DocumentProcessingResult,
    beneficiaryId?: string
  ): any {
    return {
      content,
      document_type: result.documentType,
      beneficiary_id: beneficiaryId,
      processing_confidence: result.confidence,
      entities: result.entities,
      parties: result.parties,
      dates: result.dates,
      amounts: result.amounts,
      references: result.references,
      afv_present: result.afvStatus?.present || false,
      afv_notation: result.afvStatus?.notation,
      afv_location: result.afvStatus?.location,
      afv_confidence: result.afvStatus?.confidence,
      afv_exempt_from_levy: result.afvStatus?.exemptFromLevy || false,
      discharge_eligible: result.dischargeEligibility?.eligible || false,
      discharge_days_remaining: result.dischargeEligibility?.daysRemaining,
      discharge_date: result.dischargeEligibility?.dischargeDate,
      discharge_reason: result.dischargeEligibility?.reason,
      compliance_issues: result.dischargeEligibility?.complianceIssues
    };
  }

  /**
   * Log the start of document processing
   * 
   * @param content - The document content
   * @returns Processing log ID
   */
  private async logProcessingStart(content: string): Promise<string> {
    // For now, return a dummy ID since we don't have the document_id yet
    // In a real implementation, we might use a temporary table or in-memory tracking
    return 'pending';
  }

  /**
   * Log processing completion
   * 
   * @param logId - The processing log ID
   * @param documentId - The document ID
   */
  private async logProcessingComplete(logId: string, documentId: string): Promise<void> {
    // Only log if we have a valid document ID
    if (documentId) {
      await supabase
        .from('document_processing_log')
        .insert({
          document_id: documentId,
          processing_stage: 'complete',
          status: 'completed'
        });
    }
  }

  /**
   * Log processing error
   * 
   * @param logId - The processing log ID
   * @param stage - The processing stage
   * @param error - The error message
   */
  private async logProcessingError(
    logId: string,
    stage: string,
    error: string
  ): Promise<void> {
    // For now, just log to console
    // In a real implementation, we'd store in the database
    console.error(`Document processing error at stage ${stage}:`, error);
  }
}
