import { AFVNotation } from './types';

/**
 * AFVNotationDetector
 * 
 * Detects "Accepted for Value" (AFV) notation and related exemption markers
 * in legal documents according to Neo-Commonwealth legal framework.
 */
export class AFVNotationDetector {
  private readonly afvPatterns: RegExp[];
  private readonly exemptionPatterns: RegExp[];

  constructor() {
    // Patterns to detect AFV notation with variations
    this.afvPatterns = [
      /\bAccepted\s+for\s+Value\b/gi,
      /\bA\.F\.V\./gi,
      /\bAFV\b/g,
      /\bAccepted\s+For\s+Value\s+Return\s+For\s+Value\b/gi,
      /\bReturn\s+for\s+Value\b/gi,
      /\bA4V\b/g
    ];

    // Patterns to detect exemption from levy
    this.exemptionPatterns = [
      /\bExempt\s+from\s+Levy\b/gi,
      /\bExemption\s+from\s+Levy\b/gi,
      /\bLevy\s+Exempt\b/gi
    ];
  }

  /**
   * Detect AFV notation in a document
   * 
   * @param documentContent - The full text content of the document
   * @returns AFVNotation result with detection details
   */
  public detectAFVNotation(documentContent: string): AFVNotation {
    let afvMatch: RegExpMatchArray | null = null;
    let matchedPattern = '';
    
    // Try each AFV pattern
    for (const pattern of this.afvPatterns) {
      const match = documentContent.match(pattern);
      if (match && match.index !== undefined) {
        afvMatch = match;
        matchedPattern = match[0];
        break;
      }
    }

    // If no AFV notation found
    if (!afvMatch || afvMatch.index === undefined) {
      return {
        present: false,
        notation: '',
        confidence: 1.0
      };
    }

    // Check for exemption from levy
    let exemptMatch: RegExpMatchArray | null = null;
    let exemptFromLevy = false;
    
    for (const pattern of this.exemptionPatterns) {
      const match = documentContent.match(pattern);
      if (match && match.index !== undefined) {
        exemptMatch = match;
        exemptFromLevy = true;
        break;
      }
    }

    // Calculate confidence based on pattern strength
    const confidence = this.calculateConfidence(matchedPattern, documentContent);

    return {
      present: true,
      location: {
        start: afvMatch.index,
        end: afvMatch.index + matchedPattern.length
      },
      notation: matchedPattern,
      exemptFromLevy,
      exemptLocation: exemptMatch && exemptMatch.index !== undefined ? {
        start: exemptMatch.index,
        end: exemptMatch.index + exemptMatch[0].length
      } : undefined,
      confidence
    };
  }

  /**
   * Calculate confidence score for AFV detection
   * 
   * @param matchedPattern - The pattern that was matched
   * @param documentContent - Full document content
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidence(matchedPattern: string, documentContent: string): number {
    let confidence = 0.85; // Base confidence

    // Higher confidence for full phrase "Accepted for Value"
    if (matchedPattern.toLowerCase().includes('accepted for value')) {
      confidence += 0.10;
    }

    // Check for context indicators that increase confidence
    const contextIndicators = [
      /\bcommercial\s+instrument\b/gi,
      /\bdischarge\b/gi,
      /\bpromissory\s+note\b/gi,
      /\bill\s+of\s+exchange\b/gi,
      /\btender\b/gi
    ];

    for (const indicator of contextIndicators) {
      if (indicator.test(documentContent)) {
        confidence += 0.01;
      }
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Validate if AFV notation is properly placed in document
   * 
   * @param documentContent - The full text content of the document
   * @param afvNotation - The detected AFV notation
   * @returns True if placement is valid according to compliance rules
   */
  public validateNotationPlacement(documentContent: string, afvNotation: AFVNotation): boolean {
    if (!afvNotation.present || !afvNotation.location) {
      return false;
    }

    // AFV notation should typically appear in specific locations:
    // 1. Near the top of the document (within first 20%)
    // 2. Near a signature area
    // 3. On the face of the instrument

    const documentLength = documentContent.length;
    const notationPosition = afvNotation.location.start;
    const relativePosition = notationPosition / documentLength;

    // Check if in first 20% of document (preferred placement)
    if (relativePosition <= 0.2) {
      return true;
    }

    // Check if near signature indicators
    const signatureIndicators = [
      /\bsignature\b/gi,
      /\bsigned\b/gi,
      /\bby:\s*_+/gi,
      /\bauthorized\s+signature\b/gi
    ];

    const contextWindow = 200; // Characters to check around notation
    const contextStart = Math.max(0, notationPosition - contextWindow);
    const contextEnd = Math.min(documentLength, notationPosition + contextWindow);
    const context = documentContent.substring(contextStart, contextEnd);

    for (const indicator of signatureIndicators) {
      if (indicator.test(context)) {
        return true;
      }
    }

    // If not in preferred locations, still valid but less ideal
    return true;
  }
}
