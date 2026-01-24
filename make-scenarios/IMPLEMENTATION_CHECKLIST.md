# 10-Line Implementation Checklist

## Language-Agnostic Quick Reference

Hand this to any developer implementing the `.ready` publish ritual. No framework or language specific - works for Python, Node, Go, PowerShell, etc.

---

## The 10 Steps

### 1. Define filenames
`PDF`, optional `SHA=PDF.sha256`, `READY=PDF.ready`, plus temp names `*.tmp`.

**Example:**
```
PDF = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf
SHA = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256
READY = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready
PDF.tmp = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.tmp
SHA.tmp = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.sha256.tmp
READY.tmp = HTN-2026-0007_BINDER_Verizon_2026-01-24.pdf.ready.tmp
```

---

### 2. Render binder to WORK as PDF.tmp
Flush + close; verify size > 0.

**Pseudocode:**
```
write(WORK/PDF.tmp, pdf_content)
flush()
close()
assert filesize(WORK/PDF.tmp) > 0
```

---

### 3. Rename in WORK: PDF.tmp → PDF
Atomic on same filesystem.

**Pseudocode:**
```
rename(WORK/PDF.tmp, WORK/PDF)
```

---

### 4. (Optional) Compute SHA-256 from WORK PDF
Write `SHA.tmp` containing `hash  PDF`; flush + close; rename `SHA.tmp → SHA`.

**Pseudocode:**
```
sha256 = hash_file(WORK/PDF)
write(WORK/SHA.tmp, "{sha256}  {PDF}\n")
flush()
close()
rename(WORK/SHA.tmp, WORK/SHA)
```

**Note:** Two spaces between hash and filename.

---

### 5. Copy WORK PDF → OUTBOX/PDF.tmp
Verify OUTBOX temp exists + size matches; close handles.

**Pseudocode:**
```
copy(WORK/PDF, OUTBOX/PDF.tmp)
assert exists(OUTBOX/PDF.tmp)
assert filesize(OUTBOX/PDF.tmp) == filesize(WORK/PDF)
close_all_handles()
```

---

### 6. (Optional) Copy WORK SHA → OUTBOX/SHA.tmp
Verify exists + non-zero size.

**Pseudocode:**
```
copy(WORK/SHA, OUTBOX/SHA.tmp)
assert exists(OUTBOX/SHA.tmp)
assert filesize(OUTBOX/SHA.tmp) > 0
```

---

### 7. Rename in OUTBOX: PDF.tmp → PDF
And `SHA.tmp → SHA` if used.

**Pseudocode:**
```
rename(OUTBOX/PDF.tmp, OUTBOX/PDF)
if using_sha:
    rename(OUTBOX/SHA.tmp, OUTBOX/SHA)
```

---

### 8. (Optional) Re-hash OUTBOX PDF
Confirm it matches SHA before proceeding.

**Pseudocode:**
```
if using_sha:
    outbox_hash = hash_file(OUTBOX/PDF)
    sidecar_hash = read(OUTBOX/SHA).split()[0]
    assert outbox_hash == sidecar_hash
```

---

### 9. Write READY.tmp; rename READY.tmp → READY last
Content "ready\n" or JSON; flush + close.

**Pseudocode:**
```
write(OUTBOX/READY.tmp, "ready\n")
flush()
close()
rename(OUTBOX/READY.tmp, OUTBOX/READY)  # ← Make triggers ONLY after this
```

---

### 10. On any failure before READY
Delete temp files in OUTBOX; do NOT leave READY; write `*_BINDER_ERROR_*.txt` with step + error.

**Pseudocode:**
```
on_error:
    delete(OUTBOX/PDF.tmp)
    delete(OUTBOX/SHA.tmp)
    delete(OUTBOX/READY.tmp)
    write(OUTBOX/{CaseID}_BINDER_ERROR_{timestamp}.txt, error_details)
    raise
```

---

## Implementation Examples

### Python
```python
# Step 2-3
with open(f"{WORK}/{PDF}.tmp", 'wb') as f:
    f.write(pdf_content)
    f.flush()
    os.fsync(f.fileno())
os.rename(f"{WORK}/{PDF}.tmp", f"{WORK}/{PDF}")

# Step 5
shutil.copy2(f"{WORK}/{PDF}", f"{OUTBOX}/{PDF}.tmp")

# Step 7
os.rename(f"{OUTBOX}/{PDF}.tmp", f"{OUTBOX}/{PDF}")

# Step 9
with open(f"{OUTBOX}/{READY}.tmp", 'w') as f:
    f.write("ready\n")
    f.flush()
    os.fsync(f.fileno())
os.rename(f"{OUTBOX}/{READY}.tmp", f"{OUTBOX}/{READY}")
```

### Node.js
```javascript
// Step 2-3
fs.writeFileSync(`${WORK}/${PDF}.tmp`, pdfContent);
fs.renameSync(`${WORK}/${PDF}.tmp`, `${WORK}/${PDF}`);

// Step 5
fs.copyFileSync(`${WORK}/${PDF}`, `${OUTBOX}/${PDF}.tmp`);

// Step 7
fs.renameSync(`${OUTBOX}/${PDF}.tmp`, `${OUTBOX}/${PDF}`);

// Step 9
fs.writeFileSync(`${OUTBOX}/${READY}.tmp`, "ready\n");
fs.renameSync(`${OUTBOX}/${READY}.tmp`, `${OUTBOX}/${READY}`);
```

### Go
```go
// Step 2-3
ioutil.WriteFile(filepath.Join(WORK, PDF+".tmp"), pdfContent, 0644)
os.Rename(filepath.Join(WORK, PDF+".tmp"), filepath.Join(WORK, PDF))

// Step 5
io.Copy(
    mustCreate(filepath.Join(OUTBOX, PDF+".tmp")),
    mustOpen(filepath.Join(WORK, PDF))
)

// Step 7
os.Rename(filepath.Join(OUTBOX, PDF+".tmp"), filepath.Join(OUTBOX, PDF))

// Step 9
ioutil.WriteFile(filepath.Join(OUTBOX, READY+".tmp"), []byte("ready\n"), 0644)
os.Rename(filepath.Join(OUTBOX, READY+".tmp"), filepath.Join(OUTBOX, READY))
```

### PowerShell
```powershell
# Step 2-3
[IO.File]::WriteAllBytes("$WORK\$PDF.tmp", $pdfContent)
Move-Item "$WORK\$PDF.tmp" "$WORK\$PDF"

# Step 5
Copy-Item "$WORK\$PDF" "$OUTBOX\$PDF.tmp"

# Step 7
Move-Item "$OUTBOX\$PDF.tmp" "$OUTBOX\$PDF"

# Step 9
"ready" | Out-File "$OUTBOX\$READY.tmp"
Move-Item "$OUTBOX\$READY.tmp" "$OUTBOX\$READY"
```

---

## Critical Rules

### ✅ DO
- Always write to `.tmp` first, then rename
- Always flush and close file handles
- Always verify file sizes after operations
- Always cleanup temps on error
- Write `.ready` as the **absolute last step**

### ❌ DON'T
- Never write directly to final filenames in OUTBOX
- Never leave `.ready` file if operation fails
- Never assume file operations succeed without checking
- Never proceed to next step if previous step failed
- Never create `.ready` before PDF and SHA are verified

---

## State Machine View

```
[START]
   ↓
[Render PDF.tmp in WORK] → fail → [CLEANUP]
   ↓
[Rename to PDF in WORK] → fail → [CLEANUP]
   ↓
[SHA: Compute & Write] → fail → [CLEANUP]
   ↓
[Copy PDF.tmp to OUTBOX] → fail → [CLEANUP]
   ↓
[Copy SHA.tmp to OUTBOX] → fail → [CLEANUP]
   ↓
[Rename PDF in OUTBOX] → fail → [CLEANUP]
   ↓
[Rename SHA in OUTBOX] → fail → [CLEANUP]
   ↓
[Verify: Size & Hash] → fail → [CLEANUP]
   ↓
[Write READY.tmp] → fail → [CLEANUP]
   ↓
[Rename to READY] → fail → [CLEANUP]
   ↓
[SUCCESS] → Make triggers
```

**[CLEANUP] state:**
1. Delete all `.tmp` files in OUTBOX
2. Write error file
3. Exit with failure

---

## Verification Checklist

After implementing, verify:

- [ ] `.tmp` files are used for all intermediate writes
- [ ] Renames are atomic (same filesystem)
- [ ] File handles are closed before rename
- [ ] File sizes are validated
- [ ] SHA256 is verified (if using)
- [ ] Error cleanup removes all temps
- [ ] Error file is written with useful info
- [ ] `.ready` is created last and only on success
- [ ] Test harness passes all scenarios

---

## Common Mistakes

### Mistake 1: Writing directly to final name
```
❌ write(OUTBOX/PDF, content)  # Wrong!
✅ write(OUTBOX/PDF.tmp, content); rename(PDF.tmp, PDF)
```

### Mistake 2: Not flushing before rename
```
❌ write(file); rename(file.tmp, file)  # May be partial!
✅ write(file); flush(); close(); rename(file.tmp, file)
```

### Mistake 3: Creating READY too early
```
❌ write(READY); copy(PDF)  # Make triggers before PDF ready!
✅ copy(PDF); verify(PDF); write(READY)
```

### Mistake 4: Not cleaning up on error
```
❌ on_error: exit()  # Leaves .tmp files!
✅ on_error: cleanup_temps(); write_error_file(); exit()
```

### Mistake 5: Assuming operations succeed
```
❌ rename(a, b)  # May fail silently
✅ rename(a, b); assert exists(b)
```

---

## Performance Notes

- **WORK directory:** Use fast local storage (SSD), not network
- **OUTBOX directory:** May be network/sync (Google Drive), operations are slower
- **Large files:** Copy operations may take time, ensure no timeout interruptions
- **SHA computation:** CPU-bound, can take seconds for large PDFs
- **Atomic renames:** Instant on same filesystem, may be copy+delete across filesystems

---

## Testing Your Implementation

1. **Dry run:** Test with small fake PDFs (1KB)
2. **Large files:** Test with 100MB+ files to verify no partial writes
3. **Interruption:** Kill process at each step, verify no `.ready` created
4. **Error injection:** Force failures at each step, verify cleanup works
5. **Concurrent:** Run multiple publishes simultaneously, verify no conflicts

See [TEST_HARNESS.md](./TEST_HARNESS.md) for comprehensive test plan.

---

## Related Documentation

- [Full Ritual Specification](./SINTRAPRIME_READY_RITUAL.md)
- [Make Scenario](./BINDER_OUTBOX_READY_MARKER_v1.md)
- [Test Harness](./TEST_HARNESS.md)
- [Suggested Upgrades](./SUGGESTED_UPGRADES.md)

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| `.tmp` files remain after crash | Add cleanup in error handler |
| Make triggers before PDF ready | Ensure `.ready` created last |
| SHA mismatch | Add verification in Step 8 |
| File not found after rename | Check same filesystem requirement |
| Partial file uploaded | Add flush + close before operations |
| Race condition | Verify atomic rename operation |

---

## Version History

- **v1.0** (2026-01-24): Initial 10-line checklist
