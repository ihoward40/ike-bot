# Legal Document Generator Agent — Deployment Checklist

## Pre-Deployment Setup

### Step 1: Create Agent in Make.com

- [ ] Navigate to Make.com → Agents
- [ ] Create new Agent named "Legal-Document-Generator-Agent"
- [ ] Paste context from `context.md` into "Context" section
- [ ] Paste instructions from `instructions.md` into "Instructions" section
- [ ] Add task schema from `task-schema.json` to "Memory → Structured Data"
- [ ] Add document kernel from `document-kernel.md` to "Additional Instructions"

### Step 2: Enable MCP Servers

- [ ] Enable `IKE-Solutions-Document-Deployment` MCP server
- [ ] Enable `Sintra-Memory-Multi-Service-Router` MCP server
- [ ] Verify connection status is "Connected"

### Step 3: Verify Tools

Confirm the following tools are available and functional:

- [ ] PDF Generator (`mcp.pdf.generate`)
- [ ] DOCX Builder (`mcp.docx.generate`)
- [ ] PDF Merger (`mcp.pdf.merge`)
- [ ] ZIP Packager (`mcp.zip.create`)
- [ ] Drive Uploader (`mcp.drive.upload`)

## Testing Phase

### Step 4: Run Test Prompt 1 (Basic)

**Prompt:**
> Generate Crystal Hall's Notice-to-Quit Response with trust language, ADA reference, and Style B formatting.

**Expected Output:**
- [ ] Notice-to-Quit Response document generated
- [ ] Trust signature block included
- [ ] ADA reference present
- [ ] Style B formatting (black header, gold footer)
- [ ] PDF format generated
- [ ] DOCX format generated

### Step 5: Run Test Prompt 2 (Packet Build)

**Prompt:**
> Full Tenant Protection Packet for Crystal Hall with merged PDF, exhibits attached, page numbers, and trust signature block.

**Expected Output:**
- [ ] All packet documents generated:
  - [ ] Cover Letter
  - [ ] Notice Response
  - [ ] ADA Request
  - [ ] Ledger Dispute
  - [ ] Emergency Stay Motion
  - [ ] Affidavit of Truth
  - [ ] Proof of Service
  - [ ] Exhibits A, B, C
  - [ ] Court Script
  - [ ] Filing Checklist
- [ ] Documents merged into single PDF
- [ ] Page numbers "— X —" in gold footer
- [ ] Trust signature block on all applicable documents
- [ ] Exhibit Index page included

### Step 6: Run Test Prompt 3 (Extreme Load)

**Prompt:**
> Generate ADA Request, Ledger Dispute, Affidavit of Truth, and Proof of Service for docket ESX-LT-017577-25, merge them, export PDF + DOCX + ZIP.

**Expected Output:**
- [ ] All four documents generated
- [ ] Merged PDF created
- [ ] Individual DOCX files created
- [ ] ZIP package created containing all files
- [ ] Docket number appears correctly on all documents

## Production Deployment

### Step 7: Enable Full Automation Mode

- [ ] Navigate to Agent Settings
- [ ] Enable "Agent may call tools without confirmation"
- [ ] Set rate limits appropriately
- [ ] Configure webhook callbacks (if applicable)

### Step 8: Verify Integrations

- [ ] Test Google Drive upload functionality
- [ ] Verify document storage location
- [ ] Confirm file naming conventions
- [ ] Test notification systems

### Step 9: Final Verification

- [ ] Generate sample document and review formatting
- [ ] Verify disclaimer text appears on all documents
- [ ] Confirm page numbers are sequential across merged documents
- [ ] Test with real case data (redacted for testing)

## Post-Deployment

### Ongoing Monitoring

- [ ] Set up error logging and alerts
- [ ] Monitor document generation success rate
- [ ] Track API usage and costs
- [ ] Schedule periodic template reviews

### Documentation

- [ ] Update README.md with agent documentation
- [ ] Document any customizations made
- [ ] Create user guide for document requests
- [ ] Maintain version history of templates

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes:**
