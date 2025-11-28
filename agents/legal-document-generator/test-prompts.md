# Test Prompts for Legal Document Generator Agent

Use these prompts to verify the agent is functioning correctly.

## Test 1 — Basic Document Generation

**Prompt:**
```
Generate Crystal Hall's Notice-to-Quit Response with trust language, ADA reference, and Style B formatting.
```

**Expected Results:**
- Notice-to-Quit Response document generated
- Trust signature block included ("ISIAH TARIK HOWARD TRUST / By: Isiah-Tarik: Howard, Trustee")
- ADA accommodation language present
- Style B formatting applied (black header, gold footer)
- Page numbers in "— 1 —" format with deep-gold color
- PDF and DOCX versions generated
- Disclaimer present: "Educational use only. Not legal advice."

---

## Test 2 — Full Packet Build

**Prompt:**
```
Full Tenant Protection Packet for Crystal Hall with merged PDF, exhibits attached, page numbers, and trust signature block.
```

**Expected Results:**
- Complete packet generated containing:
  - Cover Letter
  - Notice Response
  - ADA Request
  - Ledger Dispute
  - Emergency Stay Motion (if trial date < 30 days)
  - Affidavit of Truth
  - Proof of Service
  - Exhibits A, B, C
  - Court Script
  - Filing Checklist
- Exhibit Index page at beginning
- All documents merged into single PDF
- Sequential page numbers across all documents
- Gold footer style ("— 1 —", "— 2 —", etc.)
- Trust signature block on all applicable documents
- ZIP package created with all individual files

---

## Test 3 — Extreme Load (Multiple Documents with Merge)

**Prompt:**
```
Generate ADA Request, Ledger Dispute, Affidavit of Truth, and Proof of Service for docket ESX-LT-017577-25, merge them, export PDF + DOCX + ZIP.
```

**Expected Results:**
- Four documents generated:
  1. ADA Accommodation Request
  2. Ledger Dispute + Demand for Verification
  3. Affidavit of Truth
  4. Proof of Service
- Docket number "ESX-LT-017577-25" appears on all documents
- Merged PDF created with sequential page numbers
- Individual DOCX files for each document
- ZIP package containing:
  - Merged PDF
  - Individual DOCX files
  - Filing checklist
- All formatting standards applied

---

## Test 4 — Mail Tampering Exhibit

**Prompt:**
```
Generate an Exhibit C for mail tampering evidence for case ESX-LT-017577-25. Include trust signature and Style B formatting.
```

**Expected Results:**
- Exhibit C (Mail Tampering) document generated
- Proper exhibit labeling
- Trust signature block included
- Style B formatting applied
- Space for evidence documentation
- PDF and DOCX versions

---

## Test 5 — Emergency Motion (Time-Sensitive)

**Prompt:**
```
Trial is in 15 days. Generate emergency motion to stay eviction for Crystal Hall at 123 Main Street, Newark NJ 07102 against ABC Property Management. Docket number ESX-LT-017577-25.
```

**Expected Results:**
- Emergency Motion to Stay document generated
- Urgent/time-sensitive language included
- All party information correctly inserted
- Docket number present in caption
- Trust signature block included
- Request for immediate relief
- PDF and DOCX versions

---

## Validation Checklist

For each test, verify:

- [ ] Document generated without placeholders (no `[DOUBLE SPACE]` etc.)
- [ ] Font is 12pt Georgia
- [ ] Headers are left-aligned, bold, 1" top margin
- [ ] Footer has thin black line + gold page number
- [ ] Section titles are BOLD CAPS
- [ ] Signature lines are 1.5" underlines
- [ ] Trust signature block present when applicable
- [ ] Disclaimer text included
- [ ] Both PDF and DOCX formats generated
- [ ] Formatting is clean and professional
