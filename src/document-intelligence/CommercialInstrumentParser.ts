import { DischargeEligibility, DocumentType, AFVNotation } from './types';
import { logger } from '../config/logger';
import { AFVNotationDetector } from './AFVNotationDetector';

/**
 * CommercialInstrumentParser - Analyzes commercial instruments and calculates discharge eligibility
 * 
 * Handles:
 * - AFV status analysis
 * - 30-day discharge rule calculation
 * - Compliance validation
 * - Document type identification
 */
export class CommercialInstrumentParser {
  private readonly log = logger.child({ component: 'CommercialInstrumentParser' });
  private readonly afvDetector: AFVNotationDetector;

  /**
   * Number of days in the discharge period
   */
  private readonly DISCHARGE_PERIOD_DAYS = 30;

  /**
   * Patterns for identifying commercial instrument types
   */
  private readonly instrumentPatterns = {
    [DocumentType.PROMISSORY_NOTE]: [
      /promissory\s+note/gi,
      /promise\s+to\s+pay/gi,
      /i\s+promise\s+to\s+pay/gi,
    ],
    [DocumentType.BILL_OF_EXCHANGE]: [
      /bill\s+of\s+exchange/gi,
      /draft/gi,
      /pay\s+to\s+the\s+order\s+of/gi,
    ],
    [DocumentType.INVOICE]: [
      /invoice/gi,
      /bill\s+for\s+services/gi,
      /amount\s+due/gi,
    ],
    [DocumentType.AFFIDAVIT]: [
      /affidavit/gi,
      /sworn\s+statement/gi,
      /subscribed\s+and\s+sworn/gi,
    ],
    [DocumentType.NOTICE]: [
      /notice/gi,
      /hereby\s+notify/gi,
      /notification/gi,
    ],
  };

  constructor() {
    this.afvDetector = new AFVNotationDetector();
  }

  /**
   * Parse commercial instrument and assess AFV status
   * 
   * @param text - Document text to analyze
   * @param documentDate - Date of the document (used for discharge calculation)
   * @returns AFV notation and discharge eligibility
   */
  public parse(text: string, documentDate?: Date): {
    afvNotation: AFVNotation;
    dischargeEligibility: DischargeEligibility;
    documentType: DocumentType;
  } {
    this.log.info('Parsing commercial instrument');

    // Detect AFV notation
    const afvNotation = this.afvDetector.detect(text);

    // Identify document type
    const documentType = this.identifyDocumentType(text);

    // Calculate discharge eligibility
    const dischargeEligibility = this.calculateDischargeEligibility(
      afvNotation,
      documentDate
    );

    this.log.info({
      afvFound: afvNotation.found,
      documentType,
      isEligible: dischargeEligibility.isEligible,
    }, 'Commercial instrument parsing completed');

    return {
      afvNotation,
      dischargeEligibility,
      documentType,
    };
  }

  /**
   * Calculate discharge eligibility based on 30-day rule
   * 
   * @param afvNotation - AFV notation detection results
   * @param documentDate - Optional document date to use if AFV date not found
   * @returns Discharge eligibility assessment
   */
  public calculateDischargeEligibility(
    afvNotation: AFVNotation,
    documentDate?: Date
  ): DischargeEligibility {
    // If no AFV notation found, not eligible
    if (!afvNotation.found) {
      return {
        isEligible: false,
        dischargePeriodExpired: false,
        ineligibilityReason: 'No AFV notation found in document',
        calculationDetails: 'AFV notation is required for discharge eligibility',
      };
    }

    // If AFV is not compliant, not eligible
    if (!afvNotation.isCompliant) {
      return {
        isEligible: false,
        dischargePeriodExpired: false,
        ineligibilityReason: 'AFV notation is not compliant',
        calculationDetails: `Compliance issues: ${afvNotation.complianceIssues?.join(', ')}`,
      };
    }

    // Determine the AFV date
    const afvDate = afvNotation.afvDate || documentDate;
    
    if (!afvDate) {
      return {
        isEligible: false,
        dischargePeriodExpired: false,
        ineligibilityReason: 'Cannot determine AFV date',
        calculationDetails: 'AFV date is required for discharge eligibility calculation',
      };
    }

    // Calculate discharge date (AFV date + 30 days)
    const dischargeDate = new Date(afvDate);
    dischargeDate.setDate(dischargeDate.getDate() + this.DISCHARGE_PERIOD_DAYS);

    // Calculate days remaining
    const now = new Date();
    const timeDiff = dischargeDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Determine if discharge period has expired
    const dischargePeriodExpired = now >= dischargeDate;

    // Eligible if discharge period has expired
    const isEligible = dischargePeriodExpired;

    const calculationDetails = dischargePeriodExpired
      ? `AFV applied on ${afvDate.toISOString().split('T')[0]}, 30-day period expired on ${dischargeDate.toISOString().split('T')[0]}`
      : `AFV applied on ${afvDate.toISOString().split('T')[0]}, discharge eligible on ${dischargeDate.toISOString().split('T')[0]} (${daysRemaining} days remaining)`;

    return {
      isEligible,
      afvDate,
      dischargeDate,
      daysRemaining,
      dischargePeriodExpired,
      calculationDetails,
    };
  }

  /**
   * Identify the type of commercial instrument
   * 
   * @param text - Document text to analyze
   * @returns Identified document type
   */
  public identifyDocumentType(text: string): DocumentType {
    const scores: Record<DocumentType, number> = {
      [DocumentType.PROMISSORY_NOTE]: 0,
      [DocumentType.BILL_OF_EXCHANGE]: 0,
      [DocumentType.INVOICE]: 0,
      [DocumentType.AFFIDAVIT]: 0,
      [DocumentType.NOTICE]: 0,
      [DocumentType.COMMERCIAL_INSTRUMENT]: 0,
      [DocumentType.CONTRACT]: 0,
      [DocumentType.CORRESPONDENCE]: 0,
      [DocumentType.COURT_FILING]: 0,
      [DocumentType.OTHER]: 0,
    };

    // Check patterns for each document type
    for (const [type, patterns] of Object.entries(this.instrumentPatterns)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0; // Reset regex
        const matches = text.match(pattern);
        if (matches) {
          scores[type as DocumentType] += matches.length;
        }
      }
    }

    // Additional heuristics
    if (/\$\s*\d+/g.test(text) && /pay/gi.test(text)) {
      scores[DocumentType.PROMISSORY_NOTE] += 1;
      scores[DocumentType.INVOICE] += 1;
    }

    if (/whereas|witnesseth|hereby/gi.test(text)) {
      scores[DocumentType.CONTRACT] += 1;
      scores[DocumentType.AFFIDAVIT] += 1;
    }

    if (/court|judge|plaintiff|defendant/gi.test(text)) {
      scores[DocumentType.COURT_FILING] += 1;
    }

    // Find the type with the highest score
    let maxScore = 0;
    let identifiedType = DocumentType.COMMERCIAL_INSTRUMENT; // Default

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        identifiedType = type as DocumentType;
      }
    }

    // If no specific type identified with confidence, check for generic commercial instrument
    if (maxScore === 0) {
      if (/commercial|instrument|negotiable/gi.test(text)) {
        identifiedType = DocumentType.COMMERCIAL_INSTRUMENT;
      } else {
        identifiedType = DocumentType.OTHER;
      }
    }

    this.log.debug({ identifiedType, maxScore }, 'Document type identified');

    return identifiedType;
  }

  /**
   * Validate compliance of commercial instrument
   * 
   * @param text - Document text
   * @param afvNotation - AFV notation detection results
   * @returns Compliance validation result
   */
  public validateCompliance(text: string, afvNotation: AFVNotation): {
    isCompliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if AFV notation is present
    if (!afvNotation.found) {
      issues.push('Missing AFV notation');
    } else {
      // Use AFV notation's own compliance check
      if (!afvNotation.isCompliant && afvNotation.complianceIssues) {
        issues.push(...afvNotation.complianceIssues);
      }
    }

    // Additional commercial instrument compliance checks
    
    // Check for party identification
    if (!/\b(?:creditor|debtor|payee|payor|obligor|obligee)\b/gi.test(text)) {
      issues.push('Missing clear party identification');
    }

    // Check for amount (if applicable)
    const documentType = this.identifyDocumentType(text);
    if ([DocumentType.PROMISSORY_NOTE, DocumentType.INVOICE, DocumentType.BILL_OF_EXCHANGE].includes(documentType)) {
      if (!/\$\s*\d+|\d+\s*(?:dollars|USD)/gi.test(text)) {
        issues.push('Missing monetary amount');
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if document is a supported commercial instrument type
   * 
   * @param text - Document text
   * @returns True if document is a recognized commercial instrument
   */
  public isSupportedInstrument(text: string): boolean {
    const documentType = this.identifyDocumentType(text);
    const supportedTypes = [
      DocumentType.COMMERCIAL_INSTRUMENT,
      DocumentType.PROMISSORY_NOTE,
      DocumentType.BILL_OF_EXCHANGE,
      DocumentType.INVOICE,
      DocumentType.AFFIDAVIT,
      DocumentType.NOTICE,
    ];

    return supportedTypes.includes(documentType);
  }
}
