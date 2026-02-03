# Make.com Scenarios

This directory contains detailed specifications for Make.com automation scenarios used in the IKE-BOT trust automation system.

## Available Scenarios

### Binder PDF Processing

#### [BINDER_OUTBOX_COMPLETE_v1](./BINDER_OUTBOX_COMPLETE_v1.md)
Complete binder PDF ingestion workflow with SHA256 verification.

**Features:**
- Watches Google Drive folder for new PDFs
- Extracts case IDs from filenames
- Processes SHA256 sidecar files with retry logic
- Updates Notion Cases and Evidence Log
- Archives processed files

**Best for:** Simple setup, existing systems without ready marker support

#### [BINDER_OUTBOX_READY_v1](./BINDER_OUTBOX_READY_MARKER_v1.md) ⭐ Recommended
Enhanced binder PDF workflow using `.ready` marker files.

**Features:**
- Eliminates race conditions with ready markers
- Faster processing (no sleep/retry delays)
- Clearer error handling
- All features of COMPLETE_v1

**Best for:** New implementations, systems with publisher control

### Supporting Documentation

- **[SINTRAPRIME_READY_RITUAL.md](./SINTRAPRIME_READY_RITUAL.md)** - No-false-ready publish ceremony
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - 10-line developer guide
- **[TEST_HARNESS.md](./TEST_HARNESS.md)** - 10 tests to prove reliability
- **[SUGGESTED_UPGRADES.md](./SUGGESTED_UPGRADES.md)** - 20 enhancement options
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - One-page cheat sheet

---

## Quick Start

### 1. Choose a Scenario
- **Existing systems:** Start with BINDER_OUTBOX_COMPLETE_v1
- **New systems:** Use BINDER_OUTBOX_READY_MARKER_v1 for best results

### 2. Configure FieldMap
Copy and configure the FieldMap template:
```bash
cp config-templates/FieldMap_Manifest.template.json FieldMap_Manifest.json
# Edit FieldMap_Manifest.json with your IDs
```

### 3. Upload to Google Drive
Upload your configured `FieldMap_Manifest.json` to Google Drive and note the file ID.

### 4. Build in Make.com
Open Make.com and create a new scenario following the module-by-module guide in your chosen scenario documentation.

### 5. Test
Follow the testing checklist in the scenario documentation.

---

## Configuration

All scenarios use a shared configuration file: `FieldMap_Manifest.json`

**Required IDs:**
- Google Drive folder IDs (outbox, archive)
- Notion database IDs (Cases, Evidence Log, Queue)
- Slack channel IDs (optional)

See [config-templates/FieldMap_Manifest.template.json](../config-templates/FieldMap_Manifest.template.json) for the complete template.

---

## Common Concepts

### Case ID Format
All scenarios expect case IDs in the format: `HTN-XXXX-XXXX`

Example: `HTN-1234-5678_binder.pdf`

### SHA256 Sidecar Files
Sidecar files contain SHA256 hashes in the format:
```
<sha256_hex>  <pdf_filename>
```

Example (`HTN-1234-5678_binder.pdf.sha256`):
```
a1b2c3d4e5f6...  HTN-1234-5678_binder.pdf
```

### Ready Marker Files
Empty files (or containing metadata) that signal all required files are present:
```
HTN-1234-5678_binder.pdf          # The PDF
HTN-1234-5678_binder.pdf.sha256   # The sidecar
HTN-1234-5678_binder.pdf.ready    # The marker (uploaded last)
```

### Exhibit Code Generation
Evidence Log entries receive sequential exhibit codes:
- First entry: `EX-01`
- Second entry: `EX-02`
- Etc.

---

## Architecture

### Data Flow

```
Google Drive Outbox
    ↓
Make.com Scenario (This)
    ↓
Notion Updates → Slack Notifications
    ↓
Google Drive Archive
```

### Integration Points

**Inputs:**
- Google Drive: PDF files, sidecar files, FieldMap JSON
- Notion: Existing case records

**Outputs:**
- Notion: Updated cases, new Evidence Log entries, queue status
- Google Drive: Archived files
- Slack: Notifications (optional)

---

## File Naming Conventions

### Valid Binder PDF Names
✅ `HTN-1234-5678_binder.pdf`  
✅ `HTN-9999-0001_BINDER_2026-01-24.pdf`  
✅ `HTN-0123-4567.pdf`  

### Invalid Binder PDF Names
❌ `binder.pdf` (no case ID)  
❌ `HTN1234.pdf` (wrong format)  
❌ `case_HTN-1234-5678.pdf` (case ID not at start)  

### Sidecar Names
Must exactly match PDF name plus `.sha256`:
```
HTN-1234-5678_binder.pdf       → HTN-1234-5678_binder.pdf.sha256
```

### Ready Marker Names
Must exactly match PDF name plus `.ready`:
```
HTN-1234-5678_binder.pdf       → HTN-1234-5678_binder.pdf.ready
```

---

## Error Handling

All scenarios include comprehensive error handling:

### Invalid Filename
**Trigger:** No case ID found in filename  
**Action:** Move to archive with `INVALID_` prefix  
**Result:** Processing stops, no Notion updates  

### Unmatched Case
**Trigger:** Case ID not found in Notion  
**Action:** Move to archive with `UNMATCHED_` prefix  
**Result:** Processing stops, all files archived  

### Missing Sidecar
**Trigger:** SHA256 file not found  
**Action:** Continue with note "SHA256: not provided"  
**Result:** Evidence Log entry created without hash  

### Sidecar Mismatch
**Trigger:** Filename in sidecar doesn't match PDF  
**Action:** Continue with warning in notes  
**Result:** Evidence Log entry includes mismatch warning  

---

## Webhook Integration

Make.com scenarios can send webhooks back to IKE-BOT API:

```http
POST /webhooks/make
Content-Type: application/json

{
  "action": "binder_complete",
  "data": {
    "case_id": "HTN-1234-5678",
    "binder_link": "https://drive.google.com/...",
    "exhibit_code": "EX-06",
    "sha256": "abc123..."
  }
}
```

See [../README.md#webhooks](../README.md#webhooks) for webhook documentation.

---

## Troubleshooting

### Scenario Not Triggering
- Verify folder ID in trigger module
- Check Make.com permissions for Google Drive
- Ensure folder is being watched (not subfolders)
- Test by manually running scenario

### FieldMap Not Loading
- Verify file ID is correct
- Check Make.com has access to file
- Ensure file is valid JSON
- Try re-uploading FieldMap file

### Files Not Moving
- Check folder IDs in FieldMap
- Verify Make.com has edit permissions
- Ensure destination folder exists
- Check for folder sharing restrictions

### Notion Updates Failing
- Verify database IDs in FieldMap
- Check Notion connection in Make.com
- Ensure database properties exist
- Verify property types match (text, relation, etc.)

### Sidecar Not Found
- Increase sleep durations (COMPLETE_v1)
- Check sidecar filename exactly matches PDF + `.sha256`
- Verify sidecar is in same folder
- Consider switching to READY_MARKER_v1

---

## Performance Considerations

### COMPLETE_v1
- **Typical run time:** 30-40 seconds (includes sleeps)
- **Concurrent scenarios:** Limited by sleep overlap
- **Best for:** Low-moderate volume (< 100/day)

### READY_MARKER_v1
- **Typical run time:** 5-10 seconds
- **Concurrent scenarios:** High parallelism possible
- **Best for:** High volume (> 100/day)

---

## Security

### Access Control
- Use service account for Google Drive
- Restrict folder permissions
- Use Notion integration tokens (not personal)
- Store FieldMap in restricted folder

### Data Handling
- SHA256 hashes are for verification only
- No sensitive data in file content
- Audit trail in Notion Evidence Log
- Archive maintains file history

### Secrets Management
- Never hardcode credentials in scenarios
- Use Make.com connections securely
- Rotate Notion tokens regularly
- Use webhook secrets for callbacks

---

## Best Practices

1. **Test First**
   - Always test scenarios in a sandbox folder
   - Verify with known good files
   - Check error cases

2. **Monitor Logs**
   - Review Make.com execution history
   - Check Notion Evidence Log entries
   - Monitor Slack notifications

3. **Version Control**
   - Export scenarios periodically
   - Document changes
   - Keep FieldMap versions

4. **Graceful Degradation**
   - Scenarios handle missing sidecars
   - Invalid files are archived, not deleted
   - Clear error messages

5. **Documentation**
   - Keep FieldMap comments updated
   - Document custom modifications
   - Share knowledge with team

---

## Future Enhancements

Potential additions to these scenarios:

- [ ] OCR text extraction from PDFs
- [ ] Automatic creditor identification
- [ ] Email notifications for specific case types
- [ ] Integration with document generation
- [ ] Automatic deadline calculation
- [ ] Multi-beneficiary case handling
- [ ] Batch processing support
- [ ] Advanced error recovery

---

## Related Documentation

- [Main README](../README.md) - IKE-BOT API documentation
- [FieldMap Template](../config-templates/FieldMap_Manifest.template.json)
- [Make.com Webhook Handler](../src/webhooks/make.webhook.ts)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review scenario documentation
3. Check Make.com execution logs
4. Open an issue on GitHub

---

## Contributing

To add a new scenario:
1. Create `SCENARIO_NAME_v1.md` in this directory
2. Follow existing documentation structure
3. Include testing checklist
4. Update this README with scenario link
5. Add FieldMap fields if needed

---

## Version History

- **2026-01-24**: Initial documentation with BINDER_OUTBOX scenarios
