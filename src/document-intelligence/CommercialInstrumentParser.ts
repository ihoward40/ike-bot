/**
 * Commercial Instrument Parser
 * 
 * Parses commercial instruments (bills, invoices, promissory notes) to analyze
 * AFV status, discharge eligibility, and compliance validation.
 */

import { AFVNotationDetector } from './AFVNotationDetector';
import {
  DocumentType,
  CommercialInstrumentResult,
  DischargeEligibility,
  ExtractedEntity,
  AFVNotation
} from './types';

export class CommercialInstrumentParser {
  private afvDetector: AFVNotationDetector;

  // Entity extraction patterns
  private readonly AMOUNT_PATTERNS = [
    /\$[\d,]+\.?\d*/g,
    /USD\s*[\d,]+\.?\d*/gi,
    /\b\d+\.\d{2}\s*(?:dollars|usd)\b/gi
  ];

  private readonly REFERENCE_PATTERNS = [
    /(?:account|acct|ref|reference|invoice|bill)\s*(?:number|no|#)?[\s:]*([A-Z0-9\-]+)/gi,
    /\b[A-Z]{2,}\d{4,}\b/g
  ];

  private readonly PARTY_PATTERNS = [
    /(?:from|to|debtor|creditor|obligor|obligee)[\s:]+([A-Z][A-Za-z\s\.]+(?:[A-Z][A-Za-z\s\.]+)*)/g,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g
  ];

  constructor() {
    this.afvDetector = new AFVNotationDetector();
  }

  /**
   * Parse a commercial instrument document
   * @param content - Document text content
   * @param documentType - Type of document
   * @returns Parsed commercial instrument result
   */
  parseCommercialInstrument(
    content: string,
    documentType: DocumentType
  ): CommercialInstrumentResult {
    // Detect AFV notations
    const afvResult = this.afvDetector.detectAFVNotation(content);

    // Extract entities
    const parties = this.extractParties(content);
    const amounts = this.extractAmounts(content);
    const dates = this.extractDates(content);
    const references = this.extractReferences(content);

    // Determine AFV status
    const afvStatus = {
      hasAFV: afvResult.present,
      afvDate: this.getEarliestAFVDate(afvResult.notations),
      afvNotations: afvResult.notations
    };

    // Calculate discharge eligibility (30-day rule)
    const dischargeEligibility = this.calculateDischargeEligibility(
      afvStatus.afvDate,
      afvStatus.hasAFV
    );

    // Validate compliance
    const complianceStatus = this.validateCompliance(
      afvStatus,
      dischargeEligibility,
      afvResult.notations
    );

    return {
      documentType,
      afvStatus,
      dischargeEligibility,
      complianceStatus,
      parties,
      amounts,
      dates,
      references
    };
  }

  /**
   * Extract party entities from document
   * @param content - Document text
   * @returns Array of party entities
   */
  private extractParties(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    for (const pattern of this.PARTY_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const value = match[1] || match[0];
        const trimmedValue = value.trim();

        // Avoid duplicates and filter out common words
        if (
          !seen.has(trimmedValue) &&
          trimmedValue.length > 3 &&
          /[A-Z]/.test(trimmedValue)
        ) {
          seen.add(trimmedValue);
          entities.push({
            type: 'party',
            value: trimmedValue,
            confidence: 0.7,
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract amount entities from document
   * @param content - Document text
   * @returns Array of amount entities
   */
  private extractAmounts(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    for (const pattern of this.AMOUNT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const value = match[0].trim();

        if (!seen.has(value)) {
          seen.add(value);
          entities.push({
            type: 'amount',
            value,
            confidence: 0.9,
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract date entities from document
   * @param content - Document text
   * @returns Array of date entities
   */
  private extractDates(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    const datePatterns = [
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi
    ];

    for (const pattern of datePatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const value = match[0].trim();

        if (!seen.has(value)) {
          seen.add(value);
          entities.push({
            type: 'date',
            value,
            confidence: 0.85,
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract reference entities from document
   * @param content - Document text
   * @returns Array of reference entities
   */
  private extractReferences(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    for (const pattern of this.REFERENCE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(content)) !== null) {
        const value = (match[1] || match[0]).trim();

        if (!seen.has(value) && value.length > 2) {
          seen.add(value);
          entities.push({
            type: 'reference',
            value,
            confidence: 0.75,
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    }

    return entities;
  }

  /**
   * Get the earliest AFV date from notations
   * @param notations - Array of AFV notations
   * @returns Earliest date or undefined
   */
  private getEarliestAFVDate(notations: AFVNotation[]): Date | undefined {
    const dates = notations
      .map(n => n.date)
      .filter((d): d is Date => d !== undefined);

    if (dates.length === 0) {
      return undefined;
    }

    return dates.reduce((earliest, current) =>
      current < earliest ? current : earliest
    );
  }

  /**
   * Calculate discharge eligibility based on 30-day rule
   * @param afvDate - Date of AFV notation
   * @param hasAFV - Whether AFV notation is present
   * @returns Discharge eligibility assessment
   */
  calculateDischargeEligibility(
    afvDate: Date | undefined,
    hasAFV: boolean
  ): DischargeEligibility {
    if (!hasAFV) {
      return {
        eligible: false,
        reason: 'No AFV notation present on document'
      };
    }

    if (!afvDate) {
      return {
        eligible: false,
        reason: 'AFV notation present but date could not be determined',
        afvDate: undefined
      };
    }

    const now = new Date();
    const daysSinceAFV = Math.floor(
      (now.getTime() - afvDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 30-day rule: instrument is discharged if AFV was applied 30+ days ago
    const DISCHARGE_PERIOD_DAYS = 30;
    const daysRemaining = DISCHARGE_PERIOD_DAYS - daysSinceAFV;

    if (daysSinceAFV >= DISCHARGE_PERIOD_DAYS) {
      const deadlineDate = new Date(afvDate);
      deadlineDate.setDate(deadlineDate.getDate() + DISCHARGE_PERIOD_DAYS);

      return {
        eligible: true,
        reason: `AFV notation dated ${afvDate.toLocaleDateString()} - 30-day period has elapsed`,
        daysRemaining: 0,
        deadlineDate,
        afvDate
      };
    } else {
      const deadlineDate = new Date(afvDate);
      deadlineDate.setDate(deadlineDate.getDate() + DISCHARGE_PERIOD_DAYS);

      return {
        eligible: false,
        reason: `AFV notation dated ${afvDate.toLocaleDateString()} - ${daysRemaining} days remaining until discharge`,
        daysRemaining,
        deadlineDate,
        afvDate
      };
    }
  }

  /**
   * Validate compliance of AFV status and discharge eligibility
   * @param afvStatus - AFV status information
   * @param dischargeEligibility - Discharge eligibility assessment
   * @param notations - AFV notations
   * @returns Compliance status with violations and warnings
   */
  private validateCompliance(
    afvStatus: { hasAFV: boolean; afvDate?: Date; afvNotations: AFVNotation[] },
    dischargeEligibility: DischargeEligibility,
    notations: AFVNotation[]
  ): {
    compliant: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Validate each AFV notation
    for (const notation of notations) {
      const validation = this.afvDetector.validateNotationCompliance(notation);
      violations.push(...validation.violations);
      warnings.push(...validation.warnings);
    }

    // Check for conflicting information
    if (afvStatus.hasAFV && notations.length === 0) {
      violations.push('AFV status indicates presence but no notations found');
    }

    // Warn about approaching discharge deadline
    if (
      dischargeEligibility.daysRemaining !== undefined &&
      dischargeEligibility.daysRemaining > 0 &&
      dischargeEligibility.daysRemaining <= 7
    ) {
      warnings.push(
        `Discharge deadline approaching in ${dischargeEligibility.daysRemaining} days`
      );
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings
    };
  }
}
