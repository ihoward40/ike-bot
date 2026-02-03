# Legal Document Generator Agent

A professional legal document generation agent for IKE Solutions and the ISIAH TARIK HOWARD TRUST ecosystem.

## Overview

This agent generates court-compliant legal documents optimized for:
- Eviction defense
- ADA & HUD compliance
- Trust-based payment structures
- Affidavit creation
- Multi-document packet assembly
- New Jersey Special Civil Part standards

## Files

| File | Description |
|------|-------------|
| `context.md` | Agent context and role definition |
| `instructions.md` | Processing instructions and behavior rules |
| `task-schema.json` | Structured data schema for document requests |
| `document-kernel.md` | Automatic document generation rules |
| `deployment-checklist.md` | Step-by-step deployment guide |
| `test-prompts.md` | Test prompts for validation |

## Agent Tools

The following tools are available in the `/agent-tools` directory:

| Tool | Description |
|------|-------------|
| `generate_legal_document.json` | Generate individual legal documents |
| `generate_tenant_protection_packet.json` | Generate complete tenant protection packets |
| `merge_legal_documents.json` | Merge multiple documents into single PDF |
| `upload_legal_document.json` | Upload documents to Google Drive |
| `package_legal_documents.json` | Create ZIP packages of documents |

## Supported Document Types

- Notice-to-Quit Response
- ADA Accommodation Request
- Ledger Dispute + Demand for Verification
- Emergency Stay Motion
- Affidavit of Truth
- Trust Resolution
- Proof of Service
- Exhibits A–C
- Mail Tampering Exhibit
- Full Combined Tenant Protection Packet
- Hearing Script
- Filing Checklist
- Cover Letter

## Style Standards

- **Font**: 12pt Georgia
- **Header**: Left-aligned, bold, 1" top margin
- **Footer**: Thin black line + centered deep-gold page number ("— 1 —")
- **Section titles**: BOLD CAPS
- **Signature line**: Underline, 1.5"

### Style Options

| Style | Header | Footer |
|-------|--------|--------|
| A | Standard | Standard |
| B | Black | Gold (#B8860B) |

## Trust Integration

When `trust_involved = true`, documents include:

```
ISIAH TARIK HOWARD TRUST
By: ________________________
    Isiah-Tarik: Howard, Trustee
    Date: ___________________
```

## Quick Start

### 1. Deploy to Make.com

Follow the instructions in `deployment-checklist.md` to deploy the agent.

### 2. Enable MCP Servers

- IKE-Solutions-Document-Deployment
- Sintra-Memory-Multi-Service-Router

### 3. Run Tests

Use the prompts in `test-prompts.md` to validate the agent.

## Legal Engines

The agent uses specialized engines for different legal contexts:

### Eviction Defense Engine
- Verify notice defects
- Ledger disputes as defense
- ADA pause requirement before adverse action
- Housing Authority duty to modify policies
- No eviction without proper service

### ADA/HUD Engine
- Reasonable accommodation required
- Eviction paused during ADA review
- Written determination required
- Interactive process mandatory

### Affidavit Engine
- Oath of clerk verification
- Facts only; no legal conclusions
- Penalty-of-perjury declarations

### Proof of Service Engine
- Captures date, time, method, location
- Universal sworn format

### Trust Integration Engine
- Trust acts as benefactor, not tenant
- Automatic signature block insertion

## Automatic Triggers

| Condition | Auto-Generate |
|-----------|---------------|
| Trial date within 30 days | Emergency Motion to Stay |
| Disability noted | ADA Request |
| Trust involved | Trust Benefactor Signature Block |
| Prior notices exist | Ledger Dispute |
| Mail tampering mentioned | Exhibit C |
| Full packet requested | Complete document suite |

## Disclaimer

> **Educational use only. Not legal advice.**

All generated documents include this disclaimer.

## Support

For issues or questions, please open an issue on GitHub.
