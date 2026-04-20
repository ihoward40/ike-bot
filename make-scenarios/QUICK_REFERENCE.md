# Quick Reference Card: Binder Publish Ritual

## At a Glance

### The Golden Rule
**Never create `.ready` until PDF and SHA are verified in OUTBOX.**

---

## File Naming

```
PDF:    HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf
SHA:    HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256
READY:  HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready
```

---

## The 5-Step Shorthand

1. **Render** → `WORK/PDF.tmp` → flush → rename to `PDF`
2. **Hash** → compute SHA → write `SHA.tmp` → rename to `SHA`
3. **Copy** → `WORK/PDF` to `OUTBOX/PDF.tmp` → verify size
4. **Finalize** → rename `PDF.tmp` to `PDF` in OUTBOX
5. **Signal** → write `READY.tmp` → rename to `READY` ✅

---

## Critical Checkpoints

| Step | Check | Failure Action |
|------|-------|----------------|
| 2 | File size > 0 | Stop, cleanup |
| 3 | Size matches | Stop, cleanup |
| 4 | Rename succeeds | Stop, cleanup |
| 4.5 | Hash matches (optional) | Stop, cleanup, write error |
| 5 | `.ready` created last | N/A - success |

---

## Error Protocol

```python
on_error:
  1. Delete OUTBOX/*.tmp
  2. Delete OUTBOX/*.ready (if exists)
  3. Write {CaseID}_BINDER_ERROR_{timestamp}.txt
  4. Exit with failure
```

---

## Make.com Behavior

| File Present | Make Action |
|--------------|-------------|
| `.ready` only | Error: PDF missing |
| `.pdf` only | No trigger (waiting for `.ready`) |
| `.pdf` + `.ready` | ✅ Process |
| `.pdf` + `.sha256` + `.ready` | ✅ Process with verification |

---

## SHA256 Sidecar Format

```
<sha256hex>  <pdf_filename>
```

Example:
```
a1b2c3d4e5f6...  HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf
```

**Note:** Two spaces between hash and filename.

---

## State Machine (Simplified)

```
START
  ↓
Write .tmp
  ↓
Rename to final
  ↓
Copy to OUTBOX as .tmp
  ↓
Rename in OUTBOX
  ↓
Verify ✓
  ↓
Create .ready ← Make triggers HERE
  ↓
SUCCESS
```

Any failure → CLEANUP

---

## Common Mistakes ❌

1. ❌ Writing directly to final name
2. ❌ Not flushing before rename
3. ❌ Creating `.ready` too early
4. ❌ Not cleaning up on error
5. ❌ Assuming operations succeed

## Best Practices ✅

1. ✅ Always use `.tmp` files
2. ✅ Always flush + close handles
3. ✅ Always verify file sizes
4. ✅ Always cleanup on error
5. ✅ Write `.ready` LAST

---

## Testing Quick Check

```bash
# 1. Happy path
publish_binder(...) → Make triggers → Case updated ✓

# 2. Interrupt test
kill -9 $PID → No .ready → Make silent ✓

# 3. False ready
touch .ready → Make errors "PDF missing" ✓
```

---

## Folder Structure

```
WORK/           ← Local, fast, not watched
  {CaseID}/
    PDF.tmp → PDF
    SHA.tmp → SHA

OUTBOX/         ← Drive-synced, watched by Make
  PDF.tmp → PDF
  SHA.tmp → SHA
  READY.tmp → READY ← Trigger!

ARCHIVE/        ← Processed files
  {CaseID}/
    {Date}/
      PDF
      SHA
      READY
```

---

## Emergency Checklist

**If Make triggers early:**
- [ ] Check `.ready` creation timing
- [ ] Verify atomic rename operations
- [ ] Check for race conditions

**If files not found:**
- [ ] Verify Drive sync timing
- [ ] Check folder permissions
- [ ] Verify filename matching

**If SHA mismatch:**
- [ ] Check hash computation
- [ ] Verify file unchanged during process
- [ ] Check sidecar parsing logic

---

## Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Early triggers | 0 | Any |
| Orphaned .tmp files | 0 | > 5 |
| Success rate | 100% | < 95% |
| Processing time | < 60s | > 300s |

---

## Quick Links

- [Full Ritual](./SINTRAPRIME_READY_RITUAL.md)
- [Make Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [10-Line Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Test Plan](./TEST_HARNESS.md)

---

## Version

**v1.0** - 2026-01-24

---

*Keep this card handy during implementation and troubleshooting.*
