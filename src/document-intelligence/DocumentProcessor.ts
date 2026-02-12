import { AFVNotationDetector } from './AFVNotationDetector';
import { CommercialInstrumentParser } from './CommercialInstrumentParser';
import {
  DocumentType,
  DocumentEntity,
  DocumentProcessingResult,
  Party
} from './types';

/**
 * DocumentProcessor
 * 
 * Main class for processing legal documents. Handles document type classification,
 * entity extraction, and integration with AFV detection and commercial instrument
 * parsing capabilities.
 */
export class DocumentProcessor {
  private readonly afvDetector: AFVNotationDetector;
  private readonly instrumentParser: CommercialInstrumentParser;

  constructor() {
    this.afvDetector = new AFVNotationDetector();
    this.instrumentParser = new CommercialInstrumentParser();
  }

  /**
   * Process a document and extract all relevant information
   * 
   * @param documentContent - The full text content of the document
   * @param documentType - Optional document type hint (will classify if not provided)
   * @returns Complete document processing result
   */
  public async processDocument(
    documentContent: string,
    documentType?: DocumentType
  ): Promise<DocumentProcessingResult> {
    // Classify document type if not provided
    const classifiedType = documentType || this.classifyDocumentType(documentContent);

    // Extract entities
    const entities = this.extractEntities(documentContent);

    // Extract specific entity types
    const parties = this.extractParties(entities, documentContent, classifiedType);
    const dates = this.extractDates(entities);
    const amounts = this.extractAmounts(entities);
    const references = this.extractReferences(entities);

    // Detect AFV notation
    const afvStatus = this.afvDetector.detectAFVNotation(documentContent);

    // If this is a commercial instrument, perform full analysis
    let dischargeEligibility;
    if (this.isCommercialInstrument(classifiedType)) {
      const analysis = await this.instrumentParser.analyzeInstrument(
        documentContent,
        classifiedType
      );
      dischargeEligibility = analysis.dischargeEligibility;
    }

    // Calculate overall confidence
    const confidence = this.calculateProcessingConfidence(
      classifiedType,
      entities,
      afvStatus
    );

    return {
      documentType: classifiedType,
      entities,
      parties,
      dates,
      amounts,
      references,
      afvStatus: afvStatus.present ? afvStatus : undefined,
      dischargeEligibility,
      confidence
    };
  }

  /**
   * Classify the type of a document based on its content
   * 
   * @param documentContent - The full text content of the document
   * @returns The classified document type
   */
  public classifyDocumentType(documentContent: string): DocumentType {
    const contentLower = documentContent.toLowerCase();

    // Check for invoice indicators
    if (
      contentLower.includes('invoice') ||
      (contentLower.includes('amount due') && contentLower.includes('invoice number'))
    ) {
      return DocumentType.INVOICE;
    }

    // Check for bill indicators
    if (
      contentLower.includes('bill') ||
      (contentLower.includes('amount due') && contentLower.includes('account number'))
    ) {
      return DocumentType.BILL;
    }

    // Check for summons indicators
    if (
      contentLower.includes('summons') ||
      contentLower.includes('you are hereby summoned')
    ) {
      return DocumentType.SUMMONS;
    }

    // Check for complaint indicators
    if (
      contentLower.includes('complaint') ||
      (contentLower.includes('plaintiff') && contentLower.includes('defendant'))
    ) {
      return DocumentType.COMPLAINT;
    }

    // Check for promissory note indicators
    if (
      contentLower.includes('promissory note') ||
      (contentLower.includes('promise to pay') && contentLower.includes('principal'))
    ) {
      return DocumentType.PROMISSORY_NOTE;
    }

    // Check for contract indicators
    if (
      contentLower.includes('agreement') ||
      contentLower.includes('contract') ||
      (contentLower.includes('party of the first part') && contentLower.includes('party of the second part'))
    ) {
      return DocumentType.CONTRACT;
    }

    // Check for notice indicators
    if (
      contentLower.includes('notice') ||
      contentLower.includes('you are hereby notified')
    ) {
      return DocumentType.NOTICE;
    }

    return DocumentType.UNKNOWN;
  }

  /**
   * Extract entities from document content
   * 
   * @param documentContent - The full text content of the document
   * @returns Array of extracted entities
   */
  private extractEntities(documentContent: string): DocumentEntity[] {
    const entities: DocumentEntity[] = [];

    // Extract dates
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})\b/gi;
    let match;
    while ((match = datePattern.exec(documentContent)) !== null) {
      entities.push({
        type: 'date',
        value: match[1],
        confidence: 0.9,
        location: {
          start: match.index,
          end: match.index + match[1].length
        }
      });
    }

    // Extract amounts
    const amountPattern = /\$\s*([\d,]+\.?\d*)/g;
    while ((match = amountPattern.exec(documentContent)) !== null) {
      entities.push({
        type: 'amount',
        value: match[0],
        confidence: 0.95,
        location: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    // Extract reference numbers
    const referencePatterns = [
      /\b(?:Account|Invoice|Case|Reference)\s*#?\s*:?\s*([A-Z0-9\-]+)/gi,
      /\b([A-Z]{2,}\d{6,})\b/g
    ];

    for (const pattern of referencePatterns) {
      while ((match = pattern.exec(documentContent)) !== null) {
        entities.push({
          type: 'reference',
          value: match[1],
          confidence: 0.85,
          location: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }

    return entities;
  }

  /**
   * Extract parties from entities and document content
   * 
   * @param entities - Extracted entities
   * @param documentContent - The full text content
   * @param documentType - The document type
   * @returns Array of parties
   */
  private extractParties(
    entities: DocumentEntity[],
    documentContent: string,
    documentType: DocumentType
  ): Party[] {
    const parties: Party[] = [];

    // Use the instrument parser for commercial instruments
    if (this.isCommercialInstrument(documentType)) {
      const instrumentParties = this.instrumentParser['extractParties'](
        documentContent,
        documentType
      );
      return instrumentParties;
    }

    // Generic party extraction for other document types
    const partyPatterns = [
      { pattern: /\bPlaintiff:\s*([^\n]+)/i, role: 'plaintiff' as const },
      { pattern: /\bDefendant:\s*([^\n]+)/i, role: 'defendant' as const },
      { pattern: /\bFrom:\s*([^\n]+)/i, role: 'sender' as const },
      { pattern: /\bTo:\s*([^\n]+)/i, role: 'recipient' as const }
    ];

    for (const { pattern, role } of partyPatterns) {
      const match = documentContent.match(pattern);
      if (match) {
        parties.push({
          name: match[1].trim(),
          role
        });
      }
    }

    return parties;
  }

  /**
   * Extract dates from entities
   * 
   * @param entities - Extracted entities
   * @returns Array of dates
   */
  private extractDates(entities: DocumentEntity[]): Date[] {
    return entities
      .filter(e => e.type === 'date')
      .map(e => new Date(e.value))
      .filter(d => !isNaN(d.getTime()));
  }

  /**
   * Extract amounts from entities
   * 
   * @param entities - Extracted entities
   * @returns Array of amounts
   */
  private extractAmounts(entities: DocumentEntity[]): number[] {
    return entities
      .filter(e => e.type === 'amount')
      .map(e => parseFloat(e.value.replace(/[$,]/g, '')))
      .filter(a => !isNaN(a) && a > 0);
  }

  /**
   * Extract references from entities
   * 
   * @param entities - Extracted entities
   * @returns Array of reference numbers
   */
  private extractReferences(entities: DocumentEntity[]): string[] {
    return entities
      .filter(e => e.type === 'reference')
      .map(e => e.value);
  }

  /**
   * Check if document type is a commercial instrument
   * 
   * @param documentType - The document type to check
   * @returns True if it's a commercial instrument
   */
  private isCommercialInstrument(documentType: DocumentType): boolean {
    const commercialTypes = [
      DocumentType.BILL,
      DocumentType.INVOICE,
      DocumentType.PROMISSORY_NOTE,
      DocumentType.NOTICE
    ];
    return commercialTypes.includes(documentType);
  }

  /**
   * Calculate overall processing confidence
   * 
   * @param documentType - The classified document type
   * @param entities - Extracted entities
   * @param afvStatus - AFV notation status
   * @returns Confidence score between 0 and 1
   */
  private calculateProcessingConfidence(
    documentType: DocumentType,
    entities: DocumentEntity[],
    afvStatus: any
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if document type is not unknown
    if (documentType !== DocumentType.UNKNOWN) {
      confidence += 0.1;
    }

    // Increase confidence based on number of entities extracted
    const entityCount = entities.length;
    if (entityCount >= 5) {
      confidence += 0.1;
    } else if (entityCount >= 3) {
      confidence += 0.05;
    }

    // Factor in AFV detection confidence if present
    if (afvStatus.present) {
      confidence += afvStatus.confidence * 0.1;
    }

    return Math.min(confidence, 1.0);
  }
}
