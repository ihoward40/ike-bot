# Binder Outbox System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BINDER OUTBOX SYSTEM                        │
│                                                                 │
│  Publisher (SintraPrime) → Google Drive → Make.com → Notion   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Diagram

```
┌──────────────────┐
│   SintraPrime    │  Binder Generator
│   (Publisher)    │
└────────┬─────────┘
         │
         │ Publish Ritual
         │ (8 steps)
         ↓
┌──────────────────┐
│   WORK/          │  Local Working Directory
│   (Not Watched)  │  - Render PDF
│                  │  - Compute SHA
│                  │  - Prepare files
└────────┬─────────┘
         │
         │ Copy with .tmp → rename
         ↓
┌──────────────────┐
│   OUTBOX/        │  Google Drive Folder
│   (Watched)      │  - PDF
│                  │  - SHA256 sidecar
│                  │  - .ready marker ← Trigger
└────────┬─────────┘
         │
         │ Trigger on *.ready
         ↓
┌──────────────────┐
│   Make.com       │  Automation Scenario
│   Scenario       │
│                  │  - Parse files
│                  │  - Validate Case
│                  │  - Update Notion
│                  │  - Archive files
└────────┬─────────┘
         │
         ├───────────────┬──────────────┐
         ↓               ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│   Notion   │  │  Archive/  │  │   Slack    │
│            │  │            │  │            │
│ - Cases DB │  │  - PDF     │  │ - Alerts   │
│ - Evidence │  │  - SHA     │  │ - Success  │
│ - Queue DB │  │  - READY   │  │ - Errors   │
└────────────┘  └────────────┘  └────────────┘
```

---

## Data Flow Diagram

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ↓
┌────────────────────┐
│ 1. Render Binder   │
│    in WORK/        │
│    as .tmp         │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 2. Rename to final │
│    in WORK/        │
│    (atomic)        │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 3. Compute SHA256  │
│    Create sidecar  │
│    in WORK/        │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 4. Copy to OUTBOX/ │
│    as .tmp files   │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 5. Rename in       │
│    OUTBOX/         │
│    (atomic)        │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 6. Verify files    │
│    (size, hash)    │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 7. Create .ready   │
│    marker          │
│    ← TRIGGER!      │
└────┬───────────────┘
     │
     │ Make.com watches here
     ↓
┌────────────────────┐
│ 8. Parse .ready    │
│    Derive PDF name │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 9. Search for PDF  │
│    Search for SHA  │
└────┬───────────────┘
     │
     ├─── Not Found ────→ Error Route
     │
     ↓ Found
┌────────────────────┐
│ 10. Parse SHA256   │
│     Extract CaseID │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 11. Search Notion  │
│     for Case       │
└────┬───────────────┘
     │
     ├─── Not Found ────→ Archive as UNMATCHED
     │
     ↓ Found
┌────────────────────┐
│ 12. Update Case    │
│     - Binder link  │
│     - Status=Done  │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 13. Create         │
│     Evidence Entry │
│     - Exhibit code │
│     - SHA note     │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 14. Archive Files  │
│     - Move PDF     │
│     - Move SHA     │
│     - Move READY   │
└────┬───────────────┘
     │
     ↓
┌────────────────────┐
│ 15. Notify Slack   │
│     (optional)     │
└────┬───────────────┘
     │
     ↓
┌─────────┐
│   END   │
└─────────┘
```

---

## File State Transitions

```
PDF File States:
┌─────────────┐
│ Not Exist   │
└──────┬──────┘
       │ Render
       ↓
┌─────────────┐
│ WORK/       │
│ PDF.tmp     │
└──────┬──────┘
       │ Rename
       ↓
┌─────────────┐
│ WORK/       │
│ PDF         │ ← Final in WORK
└──────┬──────┘
       │ Copy
       ↓
┌─────────────┐
│ OUTBOX/     │
│ PDF.tmp     │
└──────┬──────┘
       │ Rename
       ↓
┌─────────────┐
│ OUTBOX/     │
│ PDF         │ ← Visible to Make
└──────┬──────┘
       │ After .ready created
       ↓
┌─────────────┐
│ Make.com    │
│ Processing  │
└──────┬──────┘
       │ Archive
       ↓
┌─────────────┐
│ ARCHIVE/    │
│ PDF         │ ← Final location
└─────────────┘

Ready Marker States:
┌─────────────┐
│ Not Exist   │
└──────┬──────┘
       │ All files verified
       ↓
┌─────────────┐
│ OUTBOX/     │
│ READY.tmp   │
└──────┬──────┘
       │ Rename
       ↓
┌─────────────┐
│ OUTBOX/     │
│ READY       │ ← Make triggers!
└──────┬──────┘
       │ After processing
       ↓
┌─────────────┐
│ ARCHIVE/    │
│ READY       │
└─────────────┘
```

---

## Error Handling Flow

```
                    ┌─────────────┐
                    │   Error?    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Invalid       │  │ Case Not      │  │ PDF Missing   │
│ Filename      │  │ Found         │  │ (false ready) │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ↓                  ↓                  ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Archive with  │  │ Archive with  │  │ Archive ready │
│ INVALID_      │  │ UNMATCHED_    │  │ PDF_MISSING_  │
│ prefix        │  │ prefix        │  │ marker        │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ↓
                  ┌───────────────┐
                  │ Slack Alert   │
                  │ (optional)    │
                  └───────────────┘
```

---

## Concurrent Processing

```
Time →

Upload 1:  [PDF]────[SHA]────[READY]····[Make Process]────[Archive]
                                         ↓
Upload 2:        [PDF]────[SHA]────[READY]····[Make Process]────[Archive]
                                              ↓
Upload 3:              [PDF]────[SHA]────[READY]····[Make Process]────[Archive]

Each .ready triggers independently
No conflicts as each has unique filename
All processed in parallel
```

---

## Configuration Hierarchy

```
┌──────────────────────────────────────────┐
│     FieldMap_Manifest.json              │
│     (Central Configuration)              │
│                                          │
│  ├─ Google Drive                        │
│  │  ├─ Outbox Folder ID                │
│  │  └─ Archive Folder ID               │
│  │                                      │
│  ├─ Notion                              │
│  │  ├─ Cases Database ID               │
│  │  ├─ Evidence Database ID            │
│  │  └─ Queue Database ID               │
│  │                                      │
│  ├─ Slack                               │
│  │  ├─ Notifications Channel           │
│  │  └─ Alerts Channel                  │
│  │                                      │
│  └─ Settings                            │
│     ├─ Case ID Pattern                 │
│     ├─ SHA Enabled/Required            │
│     ├─ Exhibit Code Format             │
│     └─ Archive Structure               │
└──────────────────────────────────────────┘
          ↓
          ↓ Read at runtime
          ↓
┌──────────────────────────────────────────┐
│     Make.com Scenario                   │
│     (Uses CFG variables)                │
└──────────────────────────────────────────┘
```

---

## Security & Audit Trail

```
┌─────────────────────────────────────────────────────────┐
│                    AUDIT TRAIL                          │
└─────────────────────────────────────────────────────────┘

1. SintraPrime:
   - Timestamp: Binder generation time
   - SHA256: Computed hash of PDF
   - Generator: SintraPrime version

2. Google Drive:
   - File upload timestamps
   - File IDs (unique identifiers)
   - Web view links

3. Make.com:
   - Execution logs
   - Run duration
   - Success/failure status
   - Module outputs

4. Notion:
   - Case update timestamp
   - Evidence Log entry created
   - Auto Status changes
   - Next Action updates
   - Queue item completion (optional)

5. Slack:
   - Notification timestamp
   - Success/error messages
   - Case IDs and exhibit codes

Complete Chain of Custody:
[Generate] → [Hash] → [Upload] → [Trigger] → [Process] → [Archive] → [Evidence]
    ↓          ↓         ↓           ↓           ↓           ↓           ↓
  Logged    Logged    Logged      Logged      Logged      Logged      Logged
```

---

## Failure Recovery

```
Scenario: Process interrupted at any point

1. Before .ready created:
   ┌────────────────┐
   │ .tmp files in  │
   │ OUTBOX         │
   └───────┬────────┘
           │
           ↓
   ┌────────────────┐
   │ Cleanup script │
   │ removes *.tmp  │
   └───────┬────────┘
           │
           ↓
   ┌────────────────┐
   │ Re-run publish │
   │ (idempotent)   │
   └────────────────┘

2. After .ready created:
   ┌────────────────┐
   │ Make triggered │
   │ but failed     │
   └───────┬────────┘
           │
           ↓
   ┌────────────────┐
   │ Check Case DB  │
   │ Last Binder ID │
   └───────┬────────┘
           │
           ├─── Already processed → Skip
           │
           └─── Not processed → Retry
```

---

## Performance Characteristics

| Operation | Duration | Notes |
|-----------|----------|-------|
| PDF Render | 5-30s | Depends on size |
| SHA Compute | 1-5s | Depends on size |
| Copy to OUTBOX | 2-10s | Drive sync |
| Make Trigger | <1s | Near instant |
| PDF Search | 1-2s | Drive API |
| Notion Updates | 2-5s | Multiple API calls |
| Archive Move | 1-3s | Drive API |
| **Total** | **15-60s** | Typical range |

---

## Scalability

```
Throughput Capacity:

Single Scenario:
- ~60 binders/hour (1 per minute)
- Parallel uploads OK
- Sequential processing in Make

Multiple Scenarios (parallel):
- 10 scenarios = ~600 binders/hour
- Each watches same folder
- First to grab file wins

Queue-based (future):
- Unlimited throughput
- Multiple workers
- Load balancing
```

---

## Related Documentation

- [BINDER_OUTBOX_READY_v1](./BINDER_OUTBOX_READY_MARKER_v1.md) - Full scenario
- [SINTRAPRIME_READY_RITUAL](./SINTRAPRIME_READY_RITUAL.md) - Publish process
- [IMPLEMENTATION_CHECKLIST](./IMPLEMENTATION_CHECKLIST.md) - Dev guide
- [TEST_HARNESS](./TEST_HARNESS.md) - Testing

---

## Version History

- **v1.0** (2026-01-24): Initial architecture documentation
