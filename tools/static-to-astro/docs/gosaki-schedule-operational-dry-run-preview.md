# G-13a — Gosaki schedule operational dry-run preview verification

**Phase:** `G-13a-gosaki-schedule-operational-dry-run-preview`  
**Status:** verification complete (code-path + local pure dry-run simulation)  
**Base commit:** `993356b`  
**Prior:** G-12d phase boundary; G-9g4a2 single-text-field framework  
**Type:** dry-run / read-only verification — **no Save, no DB write, no browser Preview click by Cursor**

## Summary

Verified Schedule CMS **dry-run preview** paths for Gosaki `site_slug` operational slices (`start_time`, `price`, and registry `open_time`). Preview uses pure `buildSiteSlugScheduleEditDryRunResult` + optional SELECT-only stale check. **No Supabase UPDATE** on preview. Routine dev keeps **Save disabled** (`saveEnabled: false`).

**Operator browser Preview on staging shell:** not executed by Cursor this phase — code path + local simulation only.

---

## 1. Scope (Gosaki staging only)

| Item | Value |
|------|-------|
| **UI route** | `/__admin-staging-shell/musician-basic/#schedule` |
| **site_slug** | `gosaki-piano` |
| **Fields verified** | `start_time` (G-9g4a2b), `price` (G-9g4a2c), `open_time` (G-9g4a2a registry) |
| **Not in scope** | Sariswing `/admin`, production Supabase |

---

## 2. Dry-run preview path (G-9g4a2)

```txt
onPreviewClick(fieldName)
  → parseTargetRow() + host gate
  → runDryRunStaleCheck()     ← SELECT only (optional)
  → buildSiteSlugScheduleEditDryRunResult()
  → renderDryRunResult()      ← UI only; no write adapter
```

**Modules:**

| Module | Role |
|--------|------|
| `staging-schedule-single-text-field-operational-edit-ui.ts` | Preview button handler |
| `staging-schedule-site-slug-edit-dry-run.ts` | Pure dry-run result builder |
| `schedule-optimistic-lock-dry-run.ts` | SELECT-only stale check |
| `staging-schedule-single-text-field-operational-save.ts` | **Save only** — not called on Preview |

---

## 3. Local simulation results (`start_time` / `price`)

Simulated `buildSiteSlugScheduleEditDryRunResult` with representative Gosaki row (`site_slug=gosaki-piano`, staging host gate passed):

| Field | Input patch | `changedFields` | `wouldWrite` | `actualWrite` | `dryRun` | `safety.supabaseWriteCalled` |
|-------|-------------|-----------------|--------------|---------------|----------|------------------------------|
| `start_time` | `"19:00"` (was `15:30`) | `["start_time"]` | **true** | **false** | **true** | **false** |
| `price` | `"3,500円"` (was `null`) | `["price"]` | **true** | **false** | **true** | **false** |
| `start_time` | same as before (no change) | `[]` | **false** | **false** | **true** | **false** |

**Semantics:** `wouldWrite: true` means *changes detected in preview* — **not** that a DB write occurred. Always paired with `actualWrite: false` and `safety.actualWrite: false`.

### Safety block (all successful previews)

```txt
supabaseWriteCalled: false
writeAdapterUsed: false
scheduleMonthsTouched: false
nonDryRunEnabled: false
actualWrite: false
```

---

## 4. Save path gated off (routine dev)

`getSingleTextFieldOperationalConfig(fieldName)` with default/routine env:

| Field | `saveEnabled` | Reason (routine dev) |
|-------|---------------|----------------------|
| `start_time` | **false** | `PUBLIC_ADMIN_SCHEDULE_G9G4A2B_*_ARMED` off + `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |
| `price` | **false** | `PUBLIC_ADMIN_SCHEDULE_G9G4A2C_*_ARMED` off |
| `open_time` | **false** | `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_*_ARMED` off |

`executeSingleTextFieldOperationalNonDryRunSave` returns early with `errorCode: *_only_not_armed` when `!config.saveEnabled` — **no `updateScheduleWrite` call**.

---

## 5. G-9k existing-event dry-run (parallel path)

`executeG9kExistingEventSaveButtonDryRun` — pure function, no `updateScheduleWrite`:

| Check | Result |
|-------|--------|
| `dryRun` | **true** |
| `safety.actualWrite` | **false** |
| `safety.supabaseWriteCalled` | **false** |
| `safety.serviceRoleUsed` | **false** |

G-9k6 non-dry-run Saves **closed** — do not re-click; dry-run path remains valid for preview testing.

---

## 6. Static framework verifier (cross-check)

```bash
node tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c3.mjs
```

**Result:** 47 passed, 0 failed (G-13a run).

---

## 7. DB unchanged confirmation

| Layer | Mechanism |
|-------|-----------|
| Dry-run builder | No Supabase client; pure in-memory diff |
| Stale check | `checkScheduleRowStale` — **SELECT only** |
| Preview handler | Does not import `updateScheduleWrite` |
| Save (not invoked) | Gated off in routine dev |

**Cursor/AI this phase:** no Save click, no SQL, no Supabase mutation.

---

## 8. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleOperationalDryRunPreviewVerified` | **true** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `productionTouched` | **false** |

---

## 9. Next minimum write slice (recommendation)

Prerequisites still apply: **G-12c-result** (client feedback) before first non-dry-run.

| Priority | Slice | Rationale |
|----------|-------|-----------|
| **1** | **G-13b** — PoC marker cleanup on public-visible July row | Low risk; client-visible data quality |
| **2** | **G-6-g3** — `price` only on G-6 PoC row | Low risk; preflight exists in planning |
| **3** | G-9g4a2 framework smoke Save (once) | Policy-limited proof |

**Optional operator follow-up:** manual Preview on staging shell with auth + row picker (still dry-run only).

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13a-gosaki-schedule-operational-dry-run-preview.mjs
```

---

## 11. References

- [gosaki-schedule-cms-phase-boundary-planning.md](./gosaki-schedule-cms-phase-boundary-planning.md) (G-12d)
- [staging-shell-schedule-single-text-field-operational-commonization-implementation.md](./staging-shell-schedule-single-text-field-operational-commonization-implementation.md) (G-9g4a2)
