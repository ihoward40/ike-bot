import { AFVNotation, AFVNotationType, DocumentLocation } from './types';
import { logger } from '../config/logger';

/**
 * AFVNotationDetector - Detects "Accepted for Value" notations in documents
 * 
 * Detects various forms of AFV notation including:
 * - "Accepted for Value" (case-insensitive)
 * - "Exempt from Levy"
 * - "Returned for Value"
 * 
 * Provides confidence scoring and compliance validation.
 */
export class AFVNotationDetector {
  private readonly log = logger.child({ component: 'AFVNotationDetector' });

  /**
   * Patterns for detecting AFV notations (case-insensitive)
   */
  private readonly afvPatterns = [
    // Standard AFV patterns
    /accepted\s+for\s+value/gi,
    /a\.?f\.?v\.?/gi, // AFV abbreviation
    /accepted\s*4\s*value/gi, // Common typo/variant
    
    // Returned for Value
    /returned\s+for\s+value/gi,
    /r\.?f\.?v\.?/gi,
    
    // Full notation patterns with signature
    /accepted\s+for\s+value.*?(?:signature|signed|dated)/gis,
  ];

  /**
   * Patterns for exemption language
   */
  private readonly exemptionPatterns = [
    /exempt\s+from\s+levy/gi,
    /exemption\s+from\s+levy/gi,
    /without\s+prejudice/gi,
    /all\s+rights\s+reserved/gi,
  ];

  /**
   * Patterns for date extraction near AFV notation
   */
  private readonly datePatterns = [
    /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g, // MM/DD/YYYY or MM-DD-YYYY
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi, // Month DD, YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g, // ISO format YYYY-MM-DD
  ];

  /**
   * Compliance requirements for valid AFV notation
   */
  private readonly complianceRequirements = {
    mustContainSignature: true,
    mustContainDate: true,
    mustBeProperlyFormatted: true,
    minimumTextLength: 10, // Minimum characters for valid AFV notation
  };

  /**
   * Detect AFV notation in document text
   * 
   * @param text - The document text to analyze
   * @returns AFV notation detection results with confidence and location
   */
  public detect(text: string): AFVNotation {
    this.log.info('Starting AFV notation detection');
    
    if (!text || text.trim().length === 0) {
      this.log.warn('Empty text provided for AFV detection');
      return this.createEmptyResult();
    }

    // Detect main AFV notation
    const afvResult = this.detectAFVPattern(text);
    
    // Detect exemption language
    const exemptionResult = this.detectExemption(text);
    
    // Extract date if AFV found
    let afvDate: Date | undefined;
    if (afvResult.found && afvResult.location) {
      afvDate = this.extractDateNearLocation(text, afvResult.location);
    }

    // Validate compliance
    const complianceCheck = this.validateCompliance(text, afvResult, afvDate);

    const result: AFVNotation = {
      found: afvResult.found,
      confidence: afvResult.confidence,
      pattern: afvResult.pattern,
      location: afvResult.location,
      notationText: afvResult.notationText,
      notationType: afvResult.notationType,
      afvDate,
      hasExemption: exemptionResult.found,
      exemptionText: exemptionResult.text,
      exemptionLocation: exemptionResult.location,
      isCompliant: complianceCheck.isCompliant,
      complianceIssues: complianceCheck.issues,
    };

    this.log.info({
      found: result.found,
      confidence: result.confidence,
      notationType: result.notationType,
      hasExemption: result.hasExemption,
      isCompliant: result.isCompliant,
    }, 'AFV detection completed');

    return result;
  }

  /**
   * Detect AFV pattern in text
   */
  private detectAFVPattern(text: string): {
    found: boolean;
    confidence: number;
    pattern?: string;
    location?: DocumentLocation;
    notationText?: string;
    notationType?: AFVNotationType;
  } {
    let bestMatch: {
      pattern: string;
      index: number;
      text: string;
      type: AFVNotationType;
      confidence: number;
    } | null = null;

    // Check each pattern
    for (const pattern of this.afvPatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(text);
      
      if (match) {
        const matchText = match[0];
        const matchIndex = match.index;
        
        // Determine notation type
        let notationType = AFVNotationType.STANDARD;
        let confidence = 0.9;
        
        if (/returned\s+for\s+value/i.test(matchText)) {
          notationType = AFVNotationType.RETURNED_FOR_VALUE;
        } else if (/a\.?f\.?v\.?/i.test(matchText)) {
          confidence = 0.7; // Lower confidence for abbreviation
        } else if (/signature|signed|dated/i.test(matchText)) {
          notationType = AFVNotationType.FULL_NOTATION;
          confidence = 0.95;
        }

        // Keep the best match (highest confidence)
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            pattern: pattern.source,
            index: matchIndex,
            text: matchText,
            type: notationType,
            confidence,
          };
        }
      }
    }

    if (!bestMatch) {
      return { found: false, confidence: 0 };
    }

    // Get context around the match
    const contextStart = Math.max(0, bestMatch.index - 50);
    const contextEnd = Math.min(text.length, bestMatch.index + bestMatch.text.length + 50);
    const context = text.substring(contextStart, contextEnd);

    // Calculate line and character position
    const location = this.calculateLocation(text, bestMatch.index, bestMatch.text.length);
    location.context = context;

    return {
      found: true,
      confidence: bestMatch.confidence,
      pattern: bestMatch.pattern,
      location,
      notationText: bestMatch.text,
      notationType: bestMatch.type,
    };
  }

  /**
   * Detect exemption language
   */
  private detectExemption(text: string): {
    found: boolean;
    text?: string;
    location?: DocumentLocation;
  } {
    for (const pattern of this.exemptionPatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(text);
      
      if (match) {
        const location = this.calculateLocation(text, match.index, match[0].length);
        return {
          found: true,
          text: match[0],
          location,
        };
      }
    }

    return { found: false };
  }

  /**
   * Extract date near AFV notation location
   */
  private extractDateNearLocation(text: string, location: DocumentLocation): Date | undefined {
    if (!location.charPosition) {
      return undefined;
    }

    // Look for date within 200 characters of AFV notation
    const searchStart = Math.max(0, location.charPosition - 100);
    const searchEnd = Math.min(text.length, location.charPosition + 100);
    const searchText = text.substring(searchStart, searchEnd);

    for (const pattern of this.datePatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(searchText);
      
      if (match) {
        const dateStr = match[0];
        const parsedDate = this.parseDate(dateStr);
        if (parsedDate) {
          return parsedDate;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse date string to Date object with explicit format handling
   * Handles common date formats: MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      // First try ISO format (YYYY-MM-DD) which is unambiguous
      const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
      if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try written format (Month DD, YYYY) which is unambiguous
      const writtenMatch = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(dateStr);
      if (writtenMatch) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // For MM/DD/YYYY format, assume US format (month first)
      const slashMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(dateStr);
      if (slashMatch) {
        let [, part1, part2, part3] = slashMatch;
        // Expand 2-digit year to 4-digit
        let year = parseInt(part3);
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        // Assume US format: month/day/year
        const date = new Date(year, parseInt(part1) - 1, parseInt(part2));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Fallback to standard parsing (may be ambiguous)
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      this.log.debug({ dateStr, error }, 'Failed to parse date');
    }
    return undefined;
  }

  /**
   * Validate compliance with AFV notation requirements
   */
  private validateCompliance(
    text: string,
    afvResult: { found: boolean; notationText?: string; location?: DocumentLocation },
    afvDate?: Date
  ): { isCompliant: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!afvResult.found) {
      return { isCompliant: false, issues: ['No AFV notation found'] };
    }

    // Check minimum length
    if (afvResult.notationText && afvResult.notationText.length < this.complianceRequirements.minimumTextLength) {
      issues.push('AFV notation is too short');
    }

    // Check for signature keyword near AFV
    if (this.complianceRequirements.mustContainSignature && afvResult.location?.context) {
      if (!/signature|signed|signatory/i.test(afvResult.location.context)) {
        issues.push('No signature indicator found near AFV notation');
      }
    }

    // Check for date
    if (this.complianceRequirements.mustContainDate && !afvDate) {
      issues.push('No date found near AFV notation');
    }

    // Check proper formatting (should be capitalized or all caps)
    if (this.complianceRequirements.mustBeProperlyFormatted && afvResult.notationText) {
      const isProperlyFormatted = 
        /^[A-Z]/.test(afvResult.notationText) || // Starts with capital
        /^[A-Z\s]+$/.test(afvResult.notationText); // All caps
      
      if (!isProperlyFormatted) {
        issues.push('AFV notation is not properly formatted');
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Calculate location (line and position) in document
   */
  private calculateLocation(text: string, charPosition: number, length: number): DocumentLocation {
    // Count lines up to the position
    const textBeforeMatch = text.substring(0, charPosition);
    const lineNumber = (textBeforeMatch.match(/\n/g) || []).length + 1;

    return {
      line: lineNumber,
      charPosition,
      charRange: [charPosition, charPosition + length],
    };
  }

  /**
   * Create empty AFV result when no notation is found
   */
  private createEmptyResult(): AFVNotation {
    return {
      found: false,
      confidence: 0,
      hasExemption: false,
      isCompliant: false,
      complianceIssues: ['No AFV notation detected'],
    };
  }
}
