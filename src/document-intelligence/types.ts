/**
 * Type definitions for the Document Intelligence Module
 */

/**
 * Document types supported by the system
 */
export enum DocumentType {
  BILL = 'bill',
  INVOICE = 'invoice',
  NOTICE = 'notice',
  SUMMONS = 'summons',
  COMPLAINT = 'complaint',
  CONTRACT = 'contract',
  PROMISSORY_NOTE = 'promissory_note',
  UNKNOWN = 'unknown'
}

/**
 * Entity types that can be extracted from documents
 */
export interface DocumentEntity {
  type: 'party' | 'date' | 'amount' | 'reference';
  value: string;
  confidence: number;
  location?: {
    start: number;
    end: number;
  };
}

/**
 * Party information extracted from a document
 */
export interface Party {
  name: string;
  role: 'creditor' | 'debtor' | 'plaintiff' | 'defendant' | 'sender' | 'recipient' | 'other';
  address?: string;
  contact?: string;
}

/**
 * AFV (Accepted for Value) notation detection result
 */
export interface AFVNotation {
  present: boolean;
  location?: {
    start: number;
    end: number;
  };
  notation: string;
  exemptFromLevy?: boolean;
  exemptLocation?: {
    start: number;
    end: number;
  };
  confidence: number;
}

/**
 * Discharge eligibility assessment result
 */
export interface DischargeEligibility {
  eligible: boolean;
  daysRemaining?: number;
  dischargeDate?: Date;
  reason: string;
  complianceIssues: string[];
}

/**
 * Commercial instrument analysis result
 */
export interface CommercialInstrumentAnalysis {
  afvStatus: AFVNotation;
  dischargeEligibility: DischargeEligibility;
  instrumentType: DocumentType;
  issuanceDate?: Date;
  amount?: number;
  parties: Party[];
}

/**
 * Complete document processing result
 */
export interface DocumentProcessingResult {
  documentType: DocumentType;
  entities: DocumentEntity[];
  parties: Party[];
  dates: Date[];
  amounts: number[];
  references: string[];
  afvStatus?: AFVNotation;
  dischargeEligibility?: DischargeEligibility;
  confidence: number;
}

/**
 * Document metadata for storage
 */
export interface DocumentMetadata {
  id?: string;
  content: string;
  type: DocumentType;
  processingResult?: DocumentProcessingResult;
  createdAt?: Date;
  updatedAt?: Date;
}
