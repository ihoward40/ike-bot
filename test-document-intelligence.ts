import { DocumentProcessor } from './src/document-intelligence/DocumentProcessor';
import { AFVNotationDetector } from './src/document-intelligence/AFVNotationDetector';
import { CommercialInstrumentParser } from './src/document-intelligence/CommercialInstrumentParser';
import { DocumentType } from './src/document-intelligence/types';

// Sample documents for testing
const sampleInvoiceWithAFV = `
INVOICE

Date: 01/15/2024
Invoice Number: INV-2024-001

From: ABC Collections Agency
123 Collection St
New York, NY 10001

To: John Doe
456 Main St
Anytown, ST 12345

Amount Due: $1,500.00
Account Number: ACC-987654

Details:
Original Debt: $1,500.00

ACCEPTED FOR VALUE
EXEMPT FROM LEVY

Payment Terms: Net 30
`;

const sampleBillWithoutAFV = `
BILL

Date: 02/01/2024
Account Number: 123456789

From: Utility Company
PO Box 1000
Cityville, ST 54321

To: Jane Smith
789 Oak Ave
Somewhere, ST 67890

Amount Due: $250.00

Please pay by 02/28/2024
`;

const samplePromissoryNoteWithAFV = `
PROMISSORY NOTE

Date: 12/01/2023
Principal Amount: $5,000.00

Maker: Robert Johnson
123 Elm Street
Town, ST 11111

To the Order of: First Bank
456 Bank Plaza
City, ST 22222

I, the undersigned, promise to pay the principal sum of $5,000.00

Accepted For Value
Return For Value

Signature: ___________________
Date: 12/01/2023
`;

async function testDocumentIntelligence() {
  console.log('=== Testing Document Intelligence Module ===\n');

  const processor = new DocumentProcessor();
  const detector = new AFVNotationDetector();
  const parser = new CommercialInstrumentParser();

  // Test 1: Invoice with AFV
  console.log('Test 1: Processing Invoice with AFV Notation');
  console.log('------------------------------------------------');
  const result1 = await processor.processDocument(sampleInvoiceWithAFV);
  console.log('Document Type:', result1.documentType);
  console.log('AFV Present:', result1.afvStatus?.present);
  console.log('AFV Notation:', result1.afvStatus?.notation);
  console.log('AFV Confidence:', result1.afvStatus?.confidence);
  console.log('Exempt from Levy:', result1.afvStatus?.exemptFromLevy);
  console.log('Discharge Eligible:', result1.dischargeEligibility?.eligible);
  console.log('Days Remaining:', result1.dischargeEligibility?.daysRemaining);
  console.log('Entities Found:', result1.entities.length);
  console.log('Parties Found:', result1.parties.length);
  console.log('Amounts Found:', result1.amounts);
  console.log('Overall Confidence:', result1.confidence);
  console.log();

  // Test 2: Bill without AFV
  console.log('Test 2: Processing Bill without AFV Notation');
  console.log('------------------------------------------------');
  const result2 = await processor.processDocument(sampleBillWithoutAFV);
  console.log('Document Type:', result2.documentType);
  console.log('AFV Present:', result2.afvStatus?.present);
  console.log('Discharge Eligible:', result2.dischargeEligibility?.eligible);
  console.log('Entities Found:', result2.entities.length);
  console.log('Amounts Found:', result2.amounts);
  console.log();

  // Test 3: Promissory Note with AFV
  console.log('Test 3: Processing Promissory Note with AFV');
  console.log('------------------------------------------------');
  const result3 = await processor.processDocument(samplePromissoryNoteWithAFV);
  console.log('Document Type:', result3.documentType);
  console.log('AFV Present:', result3.afvStatus?.present);
  console.log('AFV Notation:', result3.afvStatus?.notation);
  console.log('Discharge Eligible:', result3.dischargeEligibility?.eligible);
  console.log('Discharge Reason:', result3.dischargeEligibility?.reason);
  if (!result3.dischargeEligibility?.eligible) {
    console.log('Compliance Issues:', result3.dischargeEligibility?.complianceIssues);
  }
  console.log();

  // Test 4: AFV Detection Accuracy
  console.log('Test 4: Testing AFV Detection Patterns');
  console.log('------------------------------------------------');
  const afvPatterns = [
    'This document is Accepted for Value',
    'A.F.V. notation applied',
    'AFV',
    'Accepted For Value Return For Value',
    'Return for Value',
    'A4V applied'
  ];

  let correctDetections = 0;
  for (const pattern of afvPatterns) {
    const testDoc = `Document with ${pattern} notation`;
    const detection = detector.detectAFVNotation(testDoc);
    if (detection.present) {
      correctDetections++;
      console.log(`✓ Detected: "${pattern}"`);
    } else {
      console.log(`✗ Missed: "${pattern}"`);
    }
  }
  
  const accuracy = (correctDetections / afvPatterns.length) * 100;
  console.log(`\nAFV Detection Accuracy: ${accuracy.toFixed(1)}%`);
  console.log();

  // Test 5: Discharge Eligibility Calculation
  console.log('Test 5: Testing 30-Day Discharge Rule');
  console.log('------------------------------------------------');
  
  // Document issued 31 days ago (should be eligible)
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 31);
  const oldDoc = `
    INVOICE
    Date: ${oldDate.toLocaleDateString('en-US')}
    Amount: $1000.00
    Accepted for Value
  `;
  
  const analysis1 = await parser.analyzeInstrument(oldDoc, DocumentType.INVOICE);
  console.log('Document issued 31 days ago:');
  console.log('  Eligible:', analysis1.dischargeEligibility.eligible);
  console.log('  Days Remaining:', analysis1.dischargeEligibility.daysRemaining);
  console.log();
  
  // Document issued 15 days ago (should not be eligible yet)
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 15);
  const recentDoc = `
    INVOICE
    Date: ${recentDate.toLocaleDateString('en-US')}
    Amount: $1000.00
    Accepted for Value
  `;
  
  const analysis2 = await parser.analyzeInstrument(recentDoc, DocumentType.INVOICE);
  console.log('Document issued 15 days ago:');
  console.log('  Eligible:', analysis2.dischargeEligibility.eligible);
  console.log('  Days Remaining:', analysis2.dischargeEligibility.daysRemaining);
  console.log();

  console.log('=== All Tests Complete ===');
}

// Run the tests
testDocumentIntelligence().catch(console.error);
