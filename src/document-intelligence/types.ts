/**
 * Document Intelligence Module - Type Definitions
 * 
 * This module defines TypeScript interfaces and types for document processing,
 * AFV notation detection, and commercial instrument analysis.
 */

/**
 * Supported document types for processing
 */
export enum DocumentType {
  PROMISSORY_NOTE = 'promissory_note',
  INVOICE = 'invoice',
  BILL = 'bill',
  STATEMENT = 'statement',
  NOTICE = 'notice',
  DEMAND_LETTER = 'demand_letter',
  COURT_FILING = 'court_filing',
  OTHER = 'other'
}

/**
 * Entity types that can be extracted from documents
 */
export interface ExtractedEntity {
  type: 'party' | 'date' | 'amount' | 'reference' | 'other';
  value: string;
  confidence: number;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * AFV notation detection result
 */
export interface AFVNotationResult {
  present: boolean;
  notations: AFVNotation[];
  confidence: number;
}

/**
 * Individual AFV notation instance
 */
export interface AFVNotation {
  text: string;
  type: 'accepted_for_value' | 'exempt_from_levy' | 'other';
  position: {
    start: number;
    end: number;
  };
  date?: Date;
  signature?: string;
}

/**
 * Discharge eligibility assessment result
 */
export interface DischargeEligibility {
  eligible: boolean;
  reason: string;
  daysRemaining?: number;
  deadlineDate?: Date;
  afvDate?: Date;
}

/**
 * Commercial instrument parsing result
 */
export interface CommercialInstrumentResult {
  documentType: DocumentType;
  afvStatus: {
    hasAFV: boolean;
    afvDate?: Date;
    afvNotations: AFVNotation[];
  };
  dischargeEligibility: DischargeEligibility;
  complianceStatus: {
    compliant: boolean;
    violations: string[];
    warnings: string[];
  };
  parties: ExtractedEntity[];
  amounts: ExtractedEntity[];
  dates: ExtractedEntity[];
  references: ExtractedEntity[];
}

/**
 * Document processing result
 */
export interface DocumentProcessingResult {
  id: string;
  documentType: DocumentType;
  entities: ExtractedEntity[];
  afvNotation: AFVNotationResult;
  commercialInstrument?: CommercialInstrumentResult;
  metadata: {
    processedAt: Date;
    processingTime: number;
    confidence: number;
  };
}

/**
 * Document input for processing
 */
export interface DocumentInput {
  content: string;
  documentType?: DocumentType;
  metadata?: {
    filename?: string;
    source?: string;
    uploadedAt?: Date;
  };
}
