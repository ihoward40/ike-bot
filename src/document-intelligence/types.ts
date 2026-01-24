/**
 * Type definitions for Document Intelligence Module
 * Handles AFV (Accepted for Value) processing and discharge eligibility assessment
 */

/**
 * Basic document properties
 */
export interface DocumentMetadata {
  /** Unique identifier for the document */
  id: string;
  /** Type of document */
  documentType: DocumentType;
  /** Document title or name */
  title?: string;
  /** Date the document was created */
  createdAt: Date;
  /** Date the document was last modified */
  updatedAt?: Date;
  /** Date the document was received or filed */
  receivedDate?: Date;
  /** Source of the document */
  source?: string;
  /** File size in bytes */
  fileSize?: number;
  /** MIME type of the document */
  mimeType?: string;
  /** Storage location (URL or path) */
  storageLocation?: string;
}

/**
 * Supported document types
 */
export enum DocumentType {
  AFFIDAVIT = 'affidavit',
  NOTICE = 'notice',
  COMMERCIAL_INSTRUMENT = 'commercial_instrument',
  PROMISSORY_NOTE = 'promissory_note',
  BILL_OF_EXCHANGE = 'bill_of_exchange',
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  CORRESPONDENCE = 'correspondence',
  COURT_FILING = 'court_filing',
  OTHER = 'other',
}

/**
 * AFV detection results with location and confidence
 */
export interface AFVNotation {
  /** Whether AFV notation was found */
  found: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Pattern that was matched */
  pattern?: string;
  /** Location in document (page number, line number, character position) */
  location?: DocumentLocation;
  /** Full text of the AFV notation */
  notationText?: string;
  /** Type of AFV notation detected */
  notationType?: AFVNotationType;
  /** Date the AFV was applied */
  afvDate?: Date;
  /** Whether exemption language was found */
  hasExemption: boolean;
  /** Exemption text if found */
  exemptionText?: string;
  /** Exemption location if found */
  exemptionLocation?: DocumentLocation;
  /** Whether the AFV notation is properly formatted according to compliance rules */
  isCompliant: boolean;
  /** Compliance issues if any */
  complianceIssues?: string[];
}

/**
 * Types of AFV notations
 */
export enum AFVNotationType {
  STANDARD = 'standard', // "Accepted for Value"
  EXEMPT_FROM_LEVY = 'exempt_from_levy', // "Exempt from Levy"
  RETURNED_FOR_VALUE = 'returned_for_value', // "Returned for Value"
  FULL_NOTATION = 'full_notation', // Complete AFV with signature and date
}

/**
 * Location within a document
 */
export interface DocumentLocation {
  /** Page number (1-indexed) */
  page?: number;
  /** Line number (1-indexed) */
  line?: number;
  /** Character position in the document */
  charPosition?: number;
  /** Character position range [start, end] */
  charRange?: [number, number];
  /** Context text around the location */
  context?: string;
}

/**
 * 30-day rule calculation results
 */
export interface DischargeEligibility {
  /** Whether discharge is eligible */
  isEligible: boolean;
  /** Date the AFV was applied */
  afvDate?: Date;
  /** Date when the 30-day period expires */
  dischargeDate?: Date;
  /** Days remaining until discharge (negative if expired) */
  daysRemaining?: number;
  /** Whether the 30-day period has passed */
  dischargePeriodExpired: boolean;
  /** Reason for ineligibility */
  ineligibilityReason?: string;
  /** Calculation details */
  calculationDetails?: string;
}

/**
 * Extracted entity from document
 */
export interface ExtractedEntity {
  /** Type of entity */
  type: EntityType;
  /** Value of the entity */
  value: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Location in document */
  location?: DocumentLocation;
}

/**
 * Types of entities that can be extracted
 */
export enum EntityType {
  PARTY = 'party',
  CREDITOR = 'creditor',
  DEBTOR = 'debtor',
  DATE = 'date',
  AMOUNT = 'amount',
  CURRENCY = 'currency',
  LEGAL_REFERENCE = 'legal_reference',
  ACCOUNT_NUMBER = 'account_number',
  CASE_NUMBER = 'case_number',
  ADDRESS = 'address',
  NAME = 'name',
  SIGNATURE = 'signature',
}

/**
 * Complete parsed document structure
 */
export interface ParsedDocument {
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Extracted text content */
  textContent: string;
  /** AFV notation detection results */
  afvNotation?: AFVNotation;
  /** Discharge eligibility assessment */
  dischargeEligibility?: DischargeEligibility;
  /** Extracted entities */
  entities: ExtractedEntity[];
  /** Document classification confidence */
  classificationConfidence: number;
  /** Raw data from parsing process */
  rawData?: any;
}

/**
 * Processing result status
 */
export enum ProcessingStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  ERROR = 'error',
}

/**
 * Processing warning or error
 */
export interface ProcessingIssue {
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Issue code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Additional context */
  details?: any;
  /** Location where issue occurred */
  location?: DocumentLocation;
}

/**
 * Overall processing outcome with errors/warnings
 */
export interface ProcessingResult {
  /** Processing status */
  status: ProcessingStatus;
  /** The parsed document (if successful or partially successful) */
  document?: ParsedDocument;
  /** Errors encountered during processing */
  errors: ProcessingIssue[];
  /** Warnings encountered during processing */
  warnings: ProcessingIssue[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Processing timestamp */
  timestamp: Date;
}

/**
 * Options for document processing
 */
export interface ProcessingOptions {
  /** Whether to perform AFV notation detection */
  detectAFV?: boolean;
  /** Whether to calculate discharge eligibility */
  calculateDischarge?: boolean;
  /** Whether to extract entities */
  extractEntities?: boolean;
  /** Whether to store the document in Supabase */
  storeInDatabase?: boolean;
  /** Minimum confidence threshold for entity extraction */
  confidenceThreshold?: number;
  /** Whether to include raw processing data in result */
  includeRawData?: boolean;
}
