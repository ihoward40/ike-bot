import { v4 as uuidv4 } from 'uuid';
import {
  DocumentMetadata,
  DocumentType,
  ParsedDocument,
  ProcessingResult,
  ProcessingStatus,
  ProcessingOptions,
  ProcessingIssue,
  ExtractedEntity,
  EntityType,
} from './types';
import { logger } from '../config/logger';
import { supabase } from '../config/supabase';
import { AFVNotationDetector } from './AFVNotationDetector';
import { CommercialInstrumentParser } from './CommercialInstrumentParser';

/**
 * DocumentProcessor - Main document intelligence processing class
 * 
 * Integrates:
 * - Document type classification
 * - Entity extraction
 * - AFV notation detection
 * - Discharge eligibility calculation
 * - Supabase storage
 */
export class DocumentProcessor {
  private readonly log = logger.child({ component: 'DocumentProcessor' });
  private readonly afvDetector: AFVNotationDetector;
  private readonly instrumentParser: CommercialInstrumentParser;

  constructor() {
    this.afvDetector = new AFVNotationDetector();
    this.instrumentParser = new CommercialInstrumentParser();
  }

  /**
   * Process a document
   * 
   * @param text - Document text content
   * @param metadata - Optional document metadata
   * @param options - Processing options
   * @returns Processing result with parsed document
   */
  public async process(
    text: string,
    metadata?: Partial<DocumentMetadata>,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const traceId = uuidv4();
    
    this.log.info({ traceId }, 'Starting document processing');

    const errors: ProcessingIssue[] = [];
    const warnings: ProcessingIssue[] = [];

    // Set default options
    const opts: Required<ProcessingOptions> = {
      detectAFV: options.detectAFV ?? true,
      calculateDischarge: options.calculateDischarge ?? true,
      extractEntities: options.extractEntities ?? true,
      storeInDatabase: options.storeInDatabase ?? false,
      confidenceThreshold: options.confidenceThreshold ?? 0.7,
      includeRawData: options.includeRawData ?? false,
    };

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        errors.push({
          severity: 'error',
          code: 'EMPTY_DOCUMENT',
          message: 'Document text is empty',
        });
        return this.createErrorResult(errors, warnings, startTime);
      }

      // Classify document type
      const documentType = this.classifyDocument(text);
      const classificationConfidence = this.calculateClassificationConfidence(text, documentType);

      // Create document metadata
      const docMetadata: DocumentMetadata = {
        id: metadata?.id || uuidv4(),
        documentType,
        title: metadata?.title,
        createdAt: metadata?.createdAt || new Date(),
        updatedAt: new Date(),
        receivedDate: metadata?.receivedDate,
        source: metadata?.source,
        fileSize: text.length,
        mimeType: metadata?.mimeType || 'text/plain',
        storageLocation: metadata?.storageLocation,
      };

      // Parse commercial instrument (includes AFV detection if enabled)
      let afvNotation;
      let dischargeEligibility;
      
      if (opts.detectAFV || opts.calculateDischarge) {
        const parseResult = this.instrumentParser.parse(text, docMetadata.receivedDate);
        afvNotation = parseResult.afvNotation;
        dischargeEligibility = opts.calculateDischarge ? parseResult.dischargeEligibility : undefined;

        if (parseResult.afvNotation.found) {
          this.log.info({ 
            confidence: parseResult.afvNotation.confidence,
            type: parseResult.afvNotation.notationType,
          }, 'AFV notation detected');
        }
      }

      // Extract entities
      let entities: ExtractedEntity[] = [];
      if (opts.extractEntities) {
        entities = this.extractEntities(text, opts.confidenceThreshold);
        this.log.info({ entityCount: entities.length }, 'Entities extracted');
      }

      // Create parsed document
      const parsedDocument: ParsedDocument = {
        metadata: docMetadata,
        textContent: text,
        afvNotation,
        dischargeEligibility,
        entities,
        classificationConfidence,
        rawData: opts.includeRawData ? { traceId } : undefined,
      };

      // Store in database if requested
      if (opts.storeInDatabase) {
        try {
          await this.storeDocument(parsedDocument);
          this.log.info({ documentId: docMetadata.id }, 'Document stored in database');
        } catch (error) {
          const err = error as Error;
          warnings.push({
            severity: 'warning',
            code: 'STORAGE_FAILED',
            message: 'Failed to store document in database',
            details: err.message,
          });
          this.log.warn({ error: err }, 'Failed to store document');
        }
      }

      const processingTime = Date.now() - startTime;

      // Determine overall status
      let status = ProcessingStatus.SUCCESS;
      if (errors.length > 0) {
        status = ProcessingStatus.ERROR;
      } else if (warnings.length > 0) {
        status = ProcessingStatus.PARTIAL_SUCCESS;
      }

      this.log.info({
        traceId,
        status,
        processingTime,
        errorCount: errors.length,
        warningCount: warnings.length,
      }, 'Document processing completed');

      return {
        status,
        document: parsedDocument,
        errors,
        warnings,
        processingTime,
        timestamp: new Date(),
      };

    } catch (error) {
      const err = error as Error;
      this.log.error({ error: err, traceId }, 'Document processing failed');
      
      errors.push({
        severity: 'error',
        code: 'PROCESSING_ERROR',
        message: 'Unexpected error during document processing',
        details: err.message,
      });

      return this.createErrorResult(errors, warnings, startTime);
    }
  }

  /**
   * Classify document type
   * 
   * @param text - Document text
   * @returns Identified document type
   */
  private classifyDocument(text: string): DocumentType {
    return this.instrumentParser.identifyDocumentType(text);
  }

  /**
   * Calculate classification confidence
   * 
   * @param text - Document text
   * @param documentType - Identified document type
   * @returns Confidence score (0-1)
   */
  private calculateClassificationConfidence(text: string, documentType: DocumentType): number {
    // Simple heuristic: if document type is OTHER, confidence is lower
    if (documentType === DocumentType.OTHER) {
      return 0.3;
    }

    // Count relevant keywords for the document type
    const keywords = this.getDocumentTypeKeywords(documentType);
    let matchCount = 0;
    
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
    }

    // Normalize to 0-1 range
    const confidence = Math.min(0.95, 0.5 + (matchCount * 0.1));
    return confidence;
  }

  /**
   * Get keywords for document type
   */
  private getDocumentTypeKeywords(documentType: DocumentType): string[] {
    const keywordMap: Record<DocumentType, string[]> = {
      [DocumentType.PROMISSORY_NOTE]: ['promissory', 'promise to pay', 'borrower', 'lender'],
      [DocumentType.BILL_OF_EXCHANGE]: ['bill of exchange', 'draft', 'pay to the order'],
      [DocumentType.INVOICE]: ['invoice', 'amount due', 'payment'],
      [DocumentType.AFFIDAVIT]: ['affidavit', 'sworn', 'subscribed'],
      [DocumentType.NOTICE]: ['notice', 'notify', 'notification'],
      [DocumentType.COMMERCIAL_INSTRUMENT]: ['commercial', 'instrument', 'negotiable'],
      [DocumentType.CONTRACT]: ['contract', 'agreement', 'parties'],
      [DocumentType.CORRESPONDENCE]: ['letter', 'dear', 'sincerely'],
      [DocumentType.COURT_FILING]: ['court', 'plaintiff', 'defendant', 'judge'],
      [DocumentType.OTHER]: [],
    };

    return keywordMap[documentType] || [];
  }

  /**
   * Extract entities from document text
   * 
   * @param text - Document text
   * @param confidenceThreshold - Minimum confidence threshold
   * @returns Array of extracted entities
   */
  private extractEntities(text: string, confidenceThreshold: number): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract dates
    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/gi;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.DATE,
        value: match[0],
        confidence: 0.9,
        location: {
          charPosition: match.index,
          charRange: [match.index, match.index + match[0].length],
        },
      });
    }

    // Extract amounts
    const amountPattern = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD)/gi;
    while ((match = amountPattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.AMOUNT,
        value: match[0],
        confidence: 0.95,
        location: {
          charPosition: match.index,
          charRange: [match.index, match.index + match[0].length],
        },
      });
    }

    // Extract account numbers
    const accountPattern = /\b(?:account|acct)\.?\s*#?\s*(\d{4,})\b/gi;
    while ((match = accountPattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.ACCOUNT_NUMBER,
        value: match[1],
        confidence: 0.8,
        location: {
          charPosition: match.index,
          charRange: [match.index, match.index + match[0].length],
        },
      });
    }

    // Extract case numbers
    const casePattern = /\b(?:case|docket)\s*(?:no|number|#)\.?\s*([A-Z0-9-]+)\b/gi;
    while ((match = casePattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.CASE_NUMBER,
        value: match[1],
        confidence: 0.85,
        location: {
          charPosition: match.index,
          charRange: [match.index, match.index + match[0].length],
        },
      });
    }

    // Extract legal references
    const legalRefPattern = /\b\d+\s+U\.?S\.?C\.?\s+§?\s*\d+|\b\d+\s+C\.?F\.?R\.?\s+§?\s*\d+/gi;
    while ((match = legalRefPattern.exec(text)) !== null) {
      entities.push({
        type: EntityType.LEGAL_REFERENCE,
        value: match[0],
        confidence: 0.9,
        location: {
          charPosition: match.index,
          charRange: [match.index, match.index + match[0].length],
        },
      });
    }

    // Filter by confidence threshold
    return entities.filter(e => e.confidence >= confidenceThreshold);
  }

  /**
   * Store document in Supabase
   * 
   * @param document - Parsed document to store
   */
  private async storeDocument(document: ParsedDocument): Promise<void> {
    const { data, error } = await supabase
      .from('processed_documents')
      .insert({
        id: document.metadata.id,
        document_type: document.metadata.documentType,
        title: document.metadata.title,
        text_content: document.textContent,
        afv_found: document.afvNotation?.found || false,
        afv_confidence: document.afvNotation?.confidence || 0,
        discharge_eligible: document.dischargeEligibility?.isEligible || false,
        discharge_date: document.dischargeEligibility?.dischargeDate,
        classification_confidence: document.classificationConfidence,
        entity_count: document.entities.length,
        created_at: document.metadata.createdAt,
        updated_at: document.metadata.updatedAt,
      });

    if (error) {
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(
    errors: ProcessingIssue[],
    warnings: ProcessingIssue[],
    startTime: number
  ): ProcessingResult {
    return {
      status: ProcessingStatus.ERROR,
      errors,
      warnings,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}
