# DOCUMENT KERNEL v1

## Automatic Document Generation Rules

The Document Kernel is the operating system that determines which documents to auto-generate based on case conditions.

## Trigger Rules

| Condition | Auto-Generate |
|-----------|---------------|
| Trial date within 30 days | Emergency Motion to Stay |
| Disability noted | ADA Request |
| Trust involved | Insert Trust Benefactor Signature Block |
| Prior notices exist | Ledger Dispute |
| User mentions "mail tampering" | Exhibit C (Mail Tampering) |
| User requests "full packet" | Generate entire suite automatically |

## Always Include

- Exhibit Index page
- Page numbers "— X —" in gold (deep-gold color)
- Both PDF + DOCX versions

## Signature Block (Trust)

When `trust_involved = true`, always insert:

```
ISIAH TARIK HOWARD TRUST
By: ________________________
    Isiah-Tarik: Howard, Trustee
    Date: ___________________
```

## Document Formatting Standards

### Page Layout
- Margins: 1" all sides
- Font: 12pt Georgia
- Line spacing: 1.5 (except legal citations at 1.0)

### Header Format
- Left-aligned
- Bold
- 1" top margin

### Footer Format
- Thin black line (0.5pt)
- Centered page number
- Deep-gold color (#B8860B)
- Format: "— 1 —"

### Section Titles
- ALL CAPS
- Bold
- 14pt font

## Full Packet Contents

When generating a complete Tenant Protection Packet:

1. **Cover Letter** - Introduction and document list
2. **Notice-to-Quit Response** - Defense to eviction notice
3. **ADA Accommodation Request** - If disability involved
4. **Ledger Dispute + Demand for Verification** - Payment history challenge
5. **Emergency Stay Motion** - If trial within 30 days
6. **Affidavit of Truth** - Sworn factual statement
7. **Proof of Service** - Service documentation
8. **Exhibit A** - Primary supporting document
9. **Exhibit B** - Secondary supporting document
10. **Exhibit C** - Mail tampering evidence (if applicable)
11. **Court Hearing Script** - Speaking guide for court
12. **Filing Checklist** - Step-by-step filing instructions

## Processing Order

1. Parse user request
2. Apply trigger rules
3. Determine required documents
4. Generate each document with proper formatting
5. Create Exhibit Index
6. Apply page numbers
7. Merge if requested
8. Export in requested formats
9. Create ZIP if multiple files
