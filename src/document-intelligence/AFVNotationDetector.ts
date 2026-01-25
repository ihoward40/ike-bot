/**
 * AFV Notation Detector
 * 
 * Detects "Accepted for Value" (AFV) notations and exemption declarations
 * in legal documents with pattern matching and compliance validation.
 */

import { AFVNotationResult, AFVNotation } from './types';

export class AFVNotationDetector {
  // AFV pattern variations
  private readonly AFV_PATTERNS = [
    /\baccepted\s+for\s+value\b/gi,
    /\ba\s*\.\s*f\s*\.\s*v\s*\.?\b/gi,
    /\ba\s+f\s+v\b/gi,
    /\baccepted\s*-\s*for\s*-\s*value\b/gi,
    /\baccepted\s+4\s+value\b/gi
  ];

  // Exemption patterns
  private readonly EXEMPTION_PATTERNS = [
    /exempt\s+from\s+levy/gi,
    /exemption\s+claimed/gi,
    /claim\s+of\s+exemption/gi,
    /exempt\s+property/gi,
    /not\s+subject\s+to\s+levy/gi
  ];

  // Date patterns near AFV notation
  private readonly DATE_PATTERNS = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi
  ];

  // Signature patterns
  private readonly SIGNATURE_PATTERNS = [
    /signed\s*:\s*([^\n]+)/gi,
    /signature\s*:\s*([^\n]+)/gi,
    /by\s*:\s*([^\n]+)/gi,
    /\/s\/\s*([^\n]+)/gi
  ];

  /**
   * Detect AFV notations in document content
   * @param content - Document text content
   * @returns AFV notation detection result with confidence score
   */
  detectAFVNotation(content: string): AFVNotationResult {
    const notations: AFVNotation[] = [];

    // Detect AFV patterns
    notations.push(...this.detectPatterns(content, this.AFV_PATTERNS, 'accepted_for_value'));
    
    // Detect exemption patterns
    notations.push(...this.detectPatterns(content, this.EXEMPTION_PATTERNS, 'exempt_from_levy'));

    // Calculate confidence based on notation quality
    const confidence = this.calculateConfidence(notations, content);

    return {
      present: notations.length > 0,
      notations,
      confidence
    };
  }

  /**
   * Detect patterns in content
   * @param content - Document text
   * @param patterns - Array of regex patterns
   * @param type - Type of AFV notation
   * @returns Array of detected notations
   */
  private detectPatterns(
    content: string, 
    patterns: RegExp[], 
    type: 'accepted_for_value' | 'exempt_from_levy' | 'other'
  ): AFVNotation[] {
    const notations: AFVNotation[] = [];

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const position = {
          start: match.index,
          end: match.index + match[0].length
        };

        // Extract surrounding context for date and signature
        const contextStart = Math.max(0, position.start - 200);
        const contextEnd = Math.min(content.length, position.end + 200);
        const context = content.substring(contextStart, contextEnd);

        const notation: AFVNotation = {
          text: match[0],
          type,
          position,
          date: this.extractDate(context),
          signature: this.extractSignature(context)
        };

        notations.push(notation);
      }
    }

    return notations;
  }

  /**
   * Extract date from context around AFV notation
   * @param context - Text context around notation
   * @returns Extracted date or undefined
   */
  private extractDate(context: string): Date | undefined {
    for (const pattern of this.DATE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(context);
      
      if (match) {
        try {
          const dateStr = match[0];
          const parsedDate = new Date(dateStr);
          
          // Validate date is reasonable (not in far future or past)
          const now = new Date();
          const yearsDiff = Math.abs(now.getFullYear() - parsedDate.getFullYear());
          
          if (!isNaN(parsedDate.getTime()) && yearsDiff < 50) {
            return parsedDate;
          }
        } catch (error) {
          // Continue to next pattern if parsing fails
          continue;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract signature from context around AFV notation
   * @param context - Text context around notation
   * @returns Extracted signature or undefined
   */
  private extractSignature(context: string): string | undefined {
    for (const pattern of this.SIGNATURE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(context);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Calculate confidence score for AFV detection
   * @param notations - Detected notations
   * @param content - Full document content
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(notations: AFVNotation[], content: string): number {
    if (notations.length === 0) {
      return 0;
    }

    let score = 0.5; // Base score for finding any notation

    // Increase confidence for multiple notations
    score += Math.min(notations.length * 0.1, 0.2);

    // Increase confidence if date is present
    const hasDate = notations.some(n => n.date !== undefined);
    if (hasDate) {
      score += 0.15;
    }

    // Increase confidence if signature is present
    const hasSignature = notations.some(n => n.signature !== undefined);
    if (hasSignature) {
      score += 0.15;
    }

    // Increase confidence for proper AFV format (not just 'AFV' abbreviation)
    const hasFullFormat = notations.some(n => 
      n.text.toLowerCase().includes('accepted') && 
      n.text.toLowerCase().includes('value')
    );
    if (hasFullFormat) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Validate if AFV notation complies with requirements
   * @param notation - AFV notation to validate
   * @returns Validation result with compliance status
   */
  validateNotationCompliance(notation: AFVNotation): {
    compliant: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check for date presence
    if (!notation.date) {
      warnings.push('AFV notation missing date - recommended for proper documentation');
    }

    // Check for signature
    if (!notation.signature) {
      warnings.push('AFV notation missing signature - recommended for authenticity');
    }

    // Check notation type
    if (notation.type === 'other') {
      warnings.push('AFV notation type is unclear - may need manual review');
    }

    // Validate date is not in the future
    if (notation.date && notation.date > new Date()) {
      violations.push('AFV notation date is in the future - invalid');
    }

    // Check for minimum text length (avoid false positives)
    if (notation.text.length < 3) {
      violations.push('AFV notation text too short - likely false positive');
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings
    };
  }
}
