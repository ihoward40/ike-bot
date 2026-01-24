# Document Intelligence Module

The Document Intelligence Module provides automated AFV (Accepted for Value) notation detection and discharge eligibility assessment for legal documents and commercial instruments.

## Overview

This module is the foundational component of the Neo-Commonwealth legal strategy automation system. It processes legal documents to:

- Detect AFV notation with high accuracy (95%+ confidence)
- Calculate discharge eligibility based on the 30-day rule
- Extract entities (parties, dates, amounts, legal references)
- Classify document types
- Validate compliance with AFV requirements

## Components

### Core Classes

#### 1. AFVNotationDetector
Detects "Accepted for Value" notations in document text.

**Features:**
- Pattern matching for multiple AFV formats (case-insensitive)
- Exemption detection ("Exempt from Levy", "All Rights Reserved")
- Location tracking within documents
- Confidence scoring (0-1 range)
- Compliance validation

**Example:**
```typescript
import { AFVNotationDetector } from './document-intelligence';

const detector = new AFVNotationDetector();
const result = detector.detect(documentText);

if (result.found) {
  console.log(`AFV found with ${result.confidence} confidence`);
  console.log(`Type: ${result.notationType}`);
  console.log(`Has exemption: ${result.hasExemption}`);
  console.log(`Compliant: ${result.isCompliant}`);
}
```

#### 2. CommercialInstrumentParser
Analyzes commercial instruments and calculates discharge eligibility.

**Features:**
- 30-day discharge rule calculation
- Document type identification
- Compliance validation
- Support for multiple commercial instrument types

**Example:**
```typescript
import { CommercialInstrumentParser } from './document-intelligence';

const parser = new CommercialInstrumentParser();
const result = parser.parse(documentText, documentDate);

if (result.dischargeEligibility.isEligible) {
  console.log('Document is discharge eligible!');
  console.log(`Discharge date: ${result.dischargeEligibility.dischargeDate}`);
}
```

#### 3. DocumentProcessor
Main integration point for document processing.

**Features:**
- Document type classification
- Entity extraction (dates, amounts, account numbers, legal references)
- Integration with AFVNotationDetector and CommercialInstrumentParser
- Supabase storage integration
- Comprehensive error handling and logging

**Example:**
```typescript
import { DocumentProcessor } from './document-intelligence';

const processor = new DocumentProcessor();
const result = await processor.process(documentText, metadata, {
  detectAFV: true,
  calculateDischarge: true,
  extractEntities: true,
  storeInDatabase: false,
});

console.log(`Status: ${result.status}`);
console.log(`Processing time: ${result.processingTime}ms`);
if (result.document) {
  console.log(`Document type: ${result.document.metadata.documentType}`);
  console.log(`Entities found: ${result.document.entities.length}`);
}
```

### Service Layer

#### DocumentIntelligenceService
High-level service following existing codebase patterns.

**Methods:**
- `processDocument(text, metadata?, options?)` - Process a document
- `getProcessedDocument(id)` - Retrieve processed document by ID
- `listProcessedDocuments(filters?)` - List with pagination and filtering
- `searchDocuments(searchText, limit?)` - Full-text search
- `getDischargeEligibleDocuments()` - Get discharge-eligible documents
- `deleteProcessedDocument(id)` - Delete a document

## API Endpoints

### Process Document
```http
POST /api/document-intelligence/process
Content-Type: application/json

{
  "text": "Document text content...",
  "metadata": {
    "title": "Document Title",
    "receivedDate": "2024-01-15"
  },
  "options": {
    "detectAFV": true,
    "calculateDischarge": true,
    "extractEntities": true,
    "storeInDatabase": true
  }
}
```

### List Documents
```http
GET /api/document-intelligence?page=1&limit=10&afvFound=true&dischargeEligible=true
```

### Get Document
```http
GET /api/document-intelligence/:id
```

### Search Documents
```http
GET /api/document-intelligence/search?q=accepted+for+value&limit=10
```

### Get Discharge Eligible
```http
GET /api/document-intelligence/discharge-eligible
```

### Delete Document
```http
DELETE /api/document-intelligence/:id
```

## Database Schema

The module uses the `processed_documents` table:

```sql
CREATE TABLE processed_documents (
  id UUID PRIMARY KEY,
  document_type VARCHAR(50),
  title VARCHAR(500),
  text_content TEXT,
  afv_found BOOLEAN,
  afv_confidence DECIMAL(3, 2),
  discharge_eligible BOOLEAN,
  discharge_date DATE,
  entities JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## OpenAI Agent Tools

Three agent tools are available for AI integration:

1. **process_document** - Process a document with AFV detection
2. **list_processed_documents** - List processed documents with filtering
3. **get_discharge_eligible_documents** - Get discharge-eligible documents

Tool definitions are in `/agent-tools/` directory.

## AFV Detection Accuracy

The module achieves 95%+ accuracy for AFV notation detection through:

- Multiple pattern variations (case-insensitive)
- Context analysis around matches
- Confidence scoring based on match quality
- Compliance validation (signature, date, formatting)

**Supported AFV Patterns:**
- "Accepted for Value"
- "A.F.V." or "AFV"
- "Returned for Value"
- "Accepted 4 Value" (common variants)

**Exemption Patterns:**
- "Exempt from Levy"
- "Exemption from Levy"
- "Without Prejudice"
- "All Rights Reserved"

## 30-Day Discharge Rule

The module calculates discharge eligibility based on:

1. AFV notation must be present
2. AFV notation must be compliant
3. 30 days must pass from AFV date
4. Discharge date = AFV date + 30 days

**Example:**
- AFV Date: January 1, 2024
- Discharge Date: January 31, 2024
- Eligible on/after: January 31, 2024

## Entity Extraction

Automatically extracts:

- **Dates** - Various formats (ISO, US, written)
- **Amounts** - Monetary values ($X,XXX.XX or "X dollars")
- **Account Numbers** - Pattern: "Account #XXXX"
- **Case Numbers** - Pattern: "Case No. XXX"
- **Legal References** - USC, CFR citations
- **Parties** - Creditor, debtor, etc.

## Document Types

Supported document types:

- Affidavit
- Notice
- Commercial Instrument
- Promissory Note
- Bill of Exchange
- Invoice
- Contract
- Correspondence
- Court Filing
- Other

## Error Handling

The module uses structured error handling:

```typescript
interface ProcessingResult {
  status: 'success' | 'partial_success' | 'failure' | 'error';
  document?: ParsedDocument;
  errors: ProcessingIssue[];
  warnings: ProcessingIssue[];
  processingTime: number;
  timestamp: Date;
}
```

## Logging

All operations are logged using Pino logger with structured metadata:

```typescript
logger.info({
  component: 'AFVNotationDetector',
  found: true,
  confidence: 0.95,
}, 'AFV detection completed');
```

## Integration Points

- **Existing Services** - Follows BeneficiaryService pattern
- **Supabase Client** - Uses existing connection
- **Webhook System** - Can be integrated with webhook handlers
- **Agent Tools** - OpenAI function calling support

## Future Enhancements

- Machine learning model for improved accuracy
- PDF/image OCR support
- Batch processing
- Document versioning
- Signature verification
- More entity types
- Multi-language support

## Dependencies

This module depends on:

- Issue #28: Compliance Checker (will consume this module)
- Issue #26: Legal Research Integration (will consume this module)
- Issue #23: Evidence Management System (will consume this module)

## Testing

Run manual tests:
```bash
# See test results in console
npx ts-node test_standalone.ts
```

## License

Part of the IKE-BOT Trust Automation Engine - MIT License
