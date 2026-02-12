import { AFVNotationDetector } from './AFVNotationDetector';
import {
  CommercialInstrumentAnalysis,
  DocumentType,
  DischargeEligibility,
  Party,
  AFVNotation
} from './types';

/**
 * CommercialInstrumentParser
 * 
 * Parses commercial instruments to assess AFV status, discharge eligibility,
 * and compliance with Neo-Commonwealth legal framework including the 30-day rule.
 */
export class CommercialInstrumentParser {
  private readonly afvDetector: AFVNotationDetector;

  constructor() {
    this.afvDetector = new AFVNotationDetector();
  }

  /**
   * Analyze a commercial instrument for AFV status and discharge eligibility
   * 
   * @param documentContent - The full text content of the document
   * @param documentType - The type of document being analyzed
   * @returns Complete analysis including AFV status and discharge eligibility
   */
  public async analyzeInstrument(
    documentContent: string,
    documentType: DocumentType
  ): Promise<CommercialInstrumentAnalysis> {
    // Detect AFV notation
    const afvStatus = this.afvDetector.detectAFVNotation(documentContent);

    // Extract issuance date
    const issuanceDate = this.extractIssuanceDate(documentContent);

    // Extract amount
    const amount = this.extractAmount(documentContent);

    // Extract parties
    const parties = this.extractParties(documentContent, documentType);

    // Assess discharge eligibility
    const dischargeEligibility = this.assessDischargeEligibility(
      afvStatus,
      issuanceDate,
      documentType
    );

    return {
      afvStatus,
      dischargeEligibility,
      instrumentType: documentType,
      issuanceDate,
      amount,
      parties
    };
  }

  /**
   * Assess discharge eligibility based on AFV status and 30-day rule
   * 
   * The 30-day rule states that a commercial instrument with proper AFV notation
   * can be discharged 30 days after it is accepted for value.
   * 
   * @param afvStatus - The AFV notation detection result
   * @param issuanceDate - The date the instrument was issued
   * @param documentType - The type of document
   * @returns Discharge eligibility assessment
   */
  private assessDischargeEligibility(
    afvStatus: AFVNotation,
    issuanceDate: Date | undefined,
    documentType: DocumentType
  ): DischargeEligibility {
    const complianceIssues: string[] = [];

    // Check if AFV notation is present
    if (!afvStatus.present) {
      return {
        eligible: false,
        reason: 'No AFV notation detected on the instrument',
        complianceIssues: ['Missing AFV notation']
      };
    }

    // Check confidence threshold
    if (afvStatus.confidence < 0.85) {
      complianceIssues.push(`Low AFV detection confidence: ${(afvStatus.confidence * 100).toFixed(1)}%`);
    }

    // Check if issuance date is available
    if (!issuanceDate) {
      complianceIssues.push('Unable to determine issuance date');
      return {
        eligible: false,
        reason: 'Cannot determine discharge date without issuance date',
        complianceIssues
      };
    }

    // Calculate discharge date (30 days after issuance)
    const dischargeDate = new Date(issuanceDate);
    dischargeDate.setDate(dischargeDate.getDate() + 30);

    // Calculate days remaining until discharge
    const now = new Date();
    const daysRemaining = Math.ceil(
      (dischargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Validate document type is appropriate for AFV discharge
    const validTypes = [
      DocumentType.BILL,
      DocumentType.INVOICE,
      DocumentType.PROMISSORY_NOTE,
      DocumentType.NOTICE
    ];

    if (!validTypes.includes(documentType)) {
      complianceIssues.push(`Document type '${documentType}' may not be eligible for AFV discharge`);
    }

    // Determine eligibility
    const eligible = daysRemaining <= 0 && complianceIssues.length === 0;

    return {
      eligible,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      dischargeDate,
      reason: eligible
        ? 'Instrument has satisfied the 30-day waiting period and is eligible for discharge'
        : daysRemaining > 0
        ? `Instrument must wait ${daysRemaining} more days before discharge eligibility`
        : 'Compliance issues prevent discharge eligibility',
      complianceIssues
    };
  }

  /**
   * Extract the issuance date from a document
   * 
   * @param documentContent - The full text content of the document
   * @returns The issuance date if found
   */
  private extractIssuanceDate(documentContent: string): Date | undefined {
    // Common date patterns
    const datePatterns = [
      /\bDate:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /\bIssued:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /\bDated:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /\b(\w+ \d{1,2},? \d{4})\b/i,
      /\b(\d{4}-\d{2}-\d{2})\b/
    ];

    for (const pattern of datePatterns) {
      const match = documentContent.match(pattern);
      if (match) {
        const dateStr = match[1];
        const parsedDate = new Date(dateStr);
        
        // Validate the date is reasonable (not in distant past or future)
        if (!isNaN(parsedDate.getTime())) {
          const now = new Date();
          const yearsDiff = (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          
          if (yearsDiff >= -1 && yearsDiff <= 10) {
            return parsedDate;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Extract the amount from a document
   * 
   * @param documentContent - The full text content of the document
   * @returns The amount if found
   */
  private extractAmount(documentContent: string): number | undefined {
    // Amount patterns
    const amountPatterns = [
      /\$\s*([\d,]+\.?\d*)/,
      /\bAmount:\s*\$?\s*([\d,]+\.?\d*)/i,
      /\bTotal:\s*\$?\s*([\d,]+\.?\d*)/i,
      /\bDue:\s*\$?\s*([\d,]+\.?\d*)/i
    ];

    for (const pattern of amountPatterns) {
      const match = documentContent.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract parties from a document
   * 
   * @param documentContent - The full text content of the document
   * @param documentType - The type of document
   * @returns Array of parties found in the document
   */
  private extractParties(documentContent: string, documentType: DocumentType): Party[] {
    const parties: Party[] = [];

    // Extract creditor/sender
    const creditorPatterns = [
      /\bFrom:\s*([^\n]+)/i,
      /\bCreditor:\s*([^\n]+)/i,
      /\bTo\s+the\s+Order\s+of:\s*([^\n]+)/i
    ];

    for (const pattern of creditorPatterns) {
      const match = documentContent.match(pattern);
      if (match) {
        parties.push({
          name: match[1].trim(),
          role: 'creditor'
        });
        break;
      }
    }

    // Extract debtor/recipient
    const debtorPatterns = [
      /\bTo:\s*([^\n]+)/i,
      /\bDebtor:\s*([^\n]+)/i,
      /\bAccount\s+Holder:\s*([^\n]+)/i
    ];

    for (const pattern of debtorPatterns) {
      const match = documentContent.match(pattern);
      if (match) {
        parties.push({
          name: match[1].trim(),
          role: 'debtor'
        });
        break;
      }
    }

    return parties;
  }

  /**
   * Validate compliance with Neo-Commonwealth rules
   * 
   * @param analysis - The completed instrument analysis
   * @returns True if the instrument is compliant
   */
  public validateCompliance(analysis: CommercialInstrumentAnalysis): boolean {
    // Check if AFV notation is present and valid
    if (!analysis.afvStatus.present) {
      return false;
    }

    // Check if AFV notation has sufficient confidence
    if (analysis.afvStatus.confidence < 0.85) {
      return false;
    }

    // Check if issuance date is present
    if (!analysis.issuanceDate) {
      return false;
    }

    // Check if document type is appropriate
    const validTypes = [
      DocumentType.BILL,
      DocumentType.INVOICE,
      DocumentType.PROMISSORY_NOTE,
      DocumentType.NOTICE
    ];

    if (!validTypes.includes(analysis.instrumentType)) {
      return false;
    }

    // All compliance checks passed
    return true;
  }
}
