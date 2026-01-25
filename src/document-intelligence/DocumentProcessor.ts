/**
 * Document Processor
 * 
 * Main document processing class that orchestrates document type classification,
 * entity extraction, AFV notation detection, and commercial instrument parsing.
 */

import { v4 as uuidv4 } from 'uuid';
import { AFVNotationDetector } from './AFVNotationDetector';
import { CommercialInstrumentParser } from './CommercialInstrumentParser';
import {
  DocumentType,
  DocumentInput,
  DocumentProcessingResult,
  ExtractedEntity
} from './types';

export class DocumentProcessor {
  private afvDetector: AFVNotationDetector;
  private commercialParser: CommercialInstrumentParser;

  // Document type classification keywords
  private readonly DOCUMENT_TYPE_KEYWORDS: Record<string, string[]> = {
    [DocumentType.PROMISSORY_NOTE]: [
      'promissory note',
      'promise to pay',
      'borrower',
      'lender',
      'principal amount',
      'interest rate'
    ],
    [DocumentType.INVOICE]: [
      'invoice',
      'bill to',
      'invoice number',
      'invoice date',
      'due date',
      'payment terms'
    ],
    [DocumentType.BILL]: [
      'bill',
      'statement of charges',
      'amount due',
      'billing period',
      'account balance'
    ],
    [DocumentType.STATEMENT]: [
      'statement',
      'account statement',
      'balance',
      'transaction',
      'current balance',
      'previous balance'
    ],
    [DocumentType.NOTICE]: [
      'notice',
      'notification',
      'hereby notified',
      'take notice',
      'notice of'
    ],
    [DocumentType.DEMAND_LETTER]: [
      'demand',
      'demand letter',
      'payment demand',
      'immediate payment',
      'legal action',
      'failure to pay'
    ],
    [DocumentType.COURT_FILING]: [
      'court',
      'plaintiff',
      'defendant',
      'case number',
      'filed',
      'docket'
    ]
  };

  constructor() {
    this.afvDetector = new AFVNotationDetector();
    this.commercialParser = new CommercialInstrumentParser();
  }

  /**
   * Process a document through the full intelligence pipeline
   * @param input - Document input with content and optional metadata
   * @returns Complete document processing result
   */
  async processDocument(input: DocumentInput): Promise<DocumentProcessingResult> {
    const startTime = Date.now();
    const id = uuidv4();

    // Classify document type if not provided
    const documentType = input.documentType || this.classifyDocumentType(input.content);

    // Detect AFV notations
    const afvNotation = this.afvDetector.detectAFVNotation(input.content);

    // Extract entities
    const entities = this.extractEntities(input.content, documentType);

    // Parse as commercial instrument if applicable
    let commercialInstrument;
    if (this.isCommercialInstrument(documentType)) {
      commercialInstrument = this.commercialParser.parseCommercialInstrument(
        input.content,
        documentType
      );
    }

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(
      documentType,
      entities,
      afvNotation.confidence
    );

    const processingTime = Date.now() - startTime;

    return {
      id,
      documentType,
      entities,
      afvNotation,
      commercialInstrument,
      metadata: {
        processedAt: new Date(),
        processingTime,
        confidence
      }
    };
  }

  /**
   * Classify document type based on content analysis
   * @param content - Document text content
   * @returns Classified document type
   */
  classifyDocumentType(content: string): DocumentType {
    const contentLower = content.toLowerCase();
    const scores: Record<string, number> = {};

    // Calculate score for each document type
    for (const [docType, keywords] of Object.entries(this.DOCUMENT_TYPE_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword.replace(/\s+/g, '\\s+'), 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      scores[docType] = score;
    }

    // Find document type with highest score
    let maxScore = 0;
    let bestType = DocumentType.OTHER;

    for (const [docType, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestType = docType as DocumentType;
      }
    }

    // If no clear classification, return OTHER
    return maxScore > 0 ? bestType : DocumentType.OTHER;
  }

  /**
   * Extract all entities from document
   * @param content - Document text content
   * @param documentType - Type of document
   * @returns Array of extracted entities
   */
  private extractEntities(content: string, documentType: DocumentType): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Use commercial parser for entity extraction if applicable
    if (this.isCommercialInstrument(documentType)) {
      const result = this.commercialParser.parseCommercialInstrument(content, documentType);
      entities.push(...result.parties);
      entities.push(...result.amounts);
      entities.push(...result.dates);
      entities.push(...result.references);
    } else {
      // Basic entity extraction for non-commercial documents
      entities.push(...this.extractBasicEntities(content));
    }

    return entities;
  }

  /**
   * Extract basic entities without commercial instrument parsing
   * @param content - Document text content
   * @returns Array of extracted entities
   */
  private extractBasicEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract amounts
    const amountPattern = /\$[\d,]+\.?\d*/g;
    let match;
    while ((match = amountPattern.exec(content)) !== null) {
      entities.push({
        type: 'amount',
        value: match[0],
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    // Extract dates
    const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    while ((match = datePattern.exec(content)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        confidence: 0.8,
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    return entities;
  }

  /**
   * Check if document type is a commercial instrument
   * @param documentType - Type of document
   * @returns True if document is a commercial instrument
   */
  private isCommercialInstrument(documentType: DocumentType): boolean {
    return [
      DocumentType.PROMISSORY_NOTE,
      DocumentType.INVOICE,
      DocumentType.BILL,
      DocumentType.STATEMENT,
      DocumentType.DEMAND_LETTER
    ].includes(documentType);
  }

  /**
   * Calculate overall confidence score for document processing
   * @param documentType - Classified document type
   * @param entities - Extracted entities
   * @param afvConfidence - AFV detection confidence
   * @returns Overall confidence score (0-1)
   */
  private calculateOverallConfidence(
    documentType: DocumentType,
    entities: ExtractedEntity[],
    afvConfidence: number
  ): number {
    let score = 0;

    // Document type classification confidence
    if (documentType !== DocumentType.OTHER) {
      score += 0.3;
    } else {
      score += 0.1;
    }

    // Entity extraction confidence
    if (entities.length > 0) {
      const avgEntityConfidence =
        entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      score += avgEntityConfidence * 0.4;
    }

    // AFV detection confidence
    score += afvConfidence * 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Validate document content before processing
   * @param content - Document text content
   * @returns Validation result
   */
  validateDocumentContent(content: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Document content is empty');
    }

    if (content.length < 10) {
      errors.push('Document content is too short for meaningful analysis');
    }

    if (content.length > 10000000) {
      errors.push('Document content exceeds maximum size (10MB)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
