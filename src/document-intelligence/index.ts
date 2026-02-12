/**
 * Document Intelligence Module
 * 
 * This module provides comprehensive document processing capabilities
 * for legal documents with focus on AFV (Accepted for Value) notation
 * detection and discharge eligibility assessment.
 */

export { DocumentProcessor } from './DocumentProcessor';
export { CommercialInstrumentParser } from './CommercialInstrumentParser';
export { AFVNotationDetector } from './AFVNotationDetector';

export {
  DocumentType,
  DocumentEntity,
  Party,
  AFVNotation,
  DischargeEligibility,
  CommercialInstrumentAnalysis,
  DocumentProcessingResult,
  DocumentMetadata
} from './types';
