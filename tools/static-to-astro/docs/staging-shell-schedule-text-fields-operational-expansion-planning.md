# Staging shell schedule text fields operational expansion planning (G-9g4a2)

**Phase:** `G-9g4a2-text-fields-operational-expansion-planning`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a1e venue-only round-trip finalization — commit `3b807c8`; original G-9g4a planning — commit `9a38c11`  
**Type:** planning only — **no implementation, no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Row picker clicked (Cursor/AI) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore SQL executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [staging-shell-schedule-venue-only-operational-restore-result-finalization.md](./staging-shell-schedule-venue-only-operational-restore-result-finalization.md) (G-9g4a1e — commit `3b807c8`)
- [staging-shell-schedule-venue-only-operational-expansion-implementation.md](./staging-shell-schedule-venue-only-operational-expansion-implementation.md) (G-9g4a1)
- Original G-9g4a planning at commit `9a38c11` (venue-first rationale — **superseded for next slice** by this G-9g4a2 doc)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 / G-9g4a1 venue-only Save.**

---

## Gates

```txt
stagingShellScheduleTextFieldsOperationalExpansionPlanningComplete: true
readyForG9g4a2aOpenTimeOnlyOperationalExpansionImplementation: true
g9g4a1VenueOnlyRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
singleFieldFirstPolicy: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a2a-open-time-only-operational-expansion-implementation`

---

## 1. G-9g4a1 round-trip completion summary

G-9g4a1 venue-only operational path is **proven end-to-end** on staging:

| Step | Phase | Commit | Result |
| --- | --- | --- | --- |
| Implementation | G-9g4a1 | `49986c1` | Guards, UI gate, Save executor |
| Save gate sync fix | G-9g4a1 | `78888f5` | Preview → Save gate refresh after `previewValid=true` |
| Smoke execution | G-9g4a1b1 | `11368be` | `venue` smoke marker appended |
| Restore preflight | G-9g4a1c | `3b3e4e0` | Restore via same G-9g4a1 path |
| Restore execution | G-9g4a1d | `82e1aaa` | Smoke marker removed |
| Round-trip closure | G-9g4a1e | `3b807c8` | Finalization + routine dev safety |

**Proven row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `gosaki-piano`  
**Final venue:** `学芸大学 珈琲美学`  
**markerRemainsInStagingDb:** false  
**activeRestoreExceptionsCount:** 0  
**restore required:** no

**Pattern established:** field-specific approval ID + env arm + payload guard + changedFields exact check + optimistic lock + re-click prevention + smoke marker + same-path UI restore.

---

## 2. Target field candidates

| Field | Operational today? | Notes |
| --- | --- | --- |
| `open_time` | **no** (PoC only G-9g3c on pilot row) | Nullable time string; low route impact |
| `start_time` | **no** (PoC only G-9g3c) | Pair conceptually with `open_time` but **not combined in next slice** |
| `price` | **no** (PoC only G-9g3c) | Nullable text; display-only |
| `description` | **yes** (G-9g3g4 operational on content row) | **Do not re-prove** in G-9g4a2 unless explicit regression slice |

**Out of scope for G-9g4a2 text-field expansion:** `title` (non-empty validation, SEO sensitivity — defer to G-9g4a4+), `venue` (proven G-9g4a1), `date` / routes / publication / images.

UI dry-run already diffs all safe fields in `staging-schedule-site-slug-edit-ui.ts`. Gap for each candidate: **field-specific operational guard**, **approval ID**, **env arm**, **Save routing**, **verifier chain** — same as G-9g4a1.

---

## 3. Recommended order (single-field-first)

| Priority | Slice | Field(s) | Rationale |
| --- | --- | --- | --- |
| **1** | **G-9g4a2a** | `open_time` only | Smallest blast radius after venue; one key in payload; G-9g4a1 proved single-field round-trip |
| 2 | G-9g4a2b | `start_time` only | Same validation class as `open_time`; separate approval ID |
| 3 | G-9g4a2c | `price` only | Independent display field |
| — | (defer) | `description` | Already operational under G-9g3g |
| — | (defer) | `title` | Non-empty rule + SEO — last text slice |

### Why NOT `open_time` + `start_time` together first

| Concern | Single-field (recommended) | Pair slice (deferred) |
| --- | --- | --- |
| changedFields audit | exactly `["open_time"]` | `["open_time", "start_time"]` — harder rollback narrative |
| Restore | one field back to original | two fields must match preflight exactly |
| G-9g3c precedent | 3-field PoC on **pilot row only** — not operational template | — |
| G-9g4a1 precedent | **proven** single-field operational round-trip | — |
| Verifier / docs | one smoke marker, one restore payload | coupled failure modes |

**Decision:** **single-field-first** for all remaining text fields. Pair slice (`open_time` + `start_time`) is **explicitly deferred** until both singles are proven (optional consolidation phase later — not G-9g4a2a).

---

## 4. Minimum execution unit

```txt
one field
one approval ID
one env arm
one changedFields array with exactly one element
one operator Preview
ChatGPT Preview confirmation
one operator Save
optional smoke marker + restore round-trip (same slice path)
```

**Forbidden:** multi-field operational Save combining `open_time` + `start_time` + `price` in one approval (G-9g3c PoC pattern stays frozen on pilot row).

---

## 5. Recommended next implementation slice

**First implementation:** `G-9g4a2a-open-time-only-operational-expansion-implementation`

| Item | Proposed value |
| --- | --- |
| Target field | `open_time` only |
| Allowed payload | `{ "open_time": "<candidate>" }` only |
| changedFields | `["open_time"]` only |
| Approval ID (implementation phase) | `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run` |
| Env arm (execution only — not created in this planning phase) | `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true` |
| Guard naming template | `assertG9G4a2aOpenTimeOnlyPayloadOnly` |
| Executor template | `executeG9G4a2aOpenTimeOnlyNonDryRunSave` |
| UI module template | clone G-9g4a1 venue-only pattern with `open_time` input binding |

### Sub-phase chain (planned — not executed in G-9g4a2)

```txt
G-9g4a2a-open-time-only-operational-expansion-implementation
  → G-9g4a2a-preflight (target row, before.open_time, smoke candidate, rollback SQL doc-only)
  → G-9g4a2a-execution-runbook
  → G-9g4a2a1-manual-execution (operator Preview + Save once)
  → G-9g4a2b-restore-preflight (if smoke marker used)
  → G-9g4a2b1-restore-manual-execution
  → G-9g4a2c-round-trip-finalization
```

### Suggested target row (preflight phase — not selected here)

Reuse G-9g4a1 proven row unless operator prefers isolation:

| Field | Value |
| --- | --- |
| id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| legacy_id | `schedule-2026-03-003` |
| site_slug | `gosaki-piano` |
| title | `<Live & Session>` |
| open_time (current) | `11:30` |
| start_time (current) | `12:30` |
| venue | `学芸大学 珈琲美学` (restored — no G-9g4a1 marker) |
| updated_at (reference) | `2026-06-19T05:54:34.767498+00:00` — **reconfirm at preflight** |

**Rationale:** Row already used for venue round-trip; `open_time` has a clear non-null baseline for smoke suffix test.

### open_time smoke marker (execution phase proposal)

```txt
before.open_time: 11:30
after.open_time:  11:30 [G-9g4a2a open_time smoke]
restore.open_time: 11:30
```

Suffix `[G-9g4a2a open_time smoke]` — slice-specific; avoid generic `[CMS Kit staging]` alone (PoC audit trap).

---

## 6. Reuse from G-9g4a1 venue-only path

| Component | G-9g4a1 (venue) | G-9g4a2a+ (text fields) |
| --- | --- | --- |
| UI gate / Save button / Preview | `staging-schedule-site-slug-venue-only-operational-edit-ui.ts` | New per-slice module (e.g. `...-open-time-only-operational-edit-ui.ts`) |
| Save executor | `staging-schedule-site-slug-venue-only-operational-save.ts` | New per-slice executor |
| Guards | `assertG9G4a1VenueOnlyPayloadOnly` | `assertG9G4a2aOpenTimeOnlyPayloadOnly` (field-specific allowed keys) |
| Config / env arm | `staging-schedule-site-slug-venue-only-operational-config.ts` | New per-slice config |
| Mutual exclusion | G-9g4a1 blocks G-9g3g / G-9g3g5 | G-9g4a2a blocks G-9g4a1 + G-9g3g + G-9g3g5 + other G-9g4a2* arms |
| Optimistic lock | `buildScheduleLockedWriteRequest` + `expectedBeforeUpdatedAt` | **Reuse** |
| Re-click prevention | `staging-schedule-site-slug-operational-save-reclick.ts` | **Reuse** — new mode key per slice |
| Preview → Save gate sync | refresh after `previewValid=true` | **Reuse** G-9g4a1b1 fix pattern |
| Host gate | staging host only | **Reuse** |
| Row picker | existing hydrate | **Reuse** |
| Restore path | same slice UI (not G-9g3g5) | **Same pattern** |

**Do not reuse** G-9g3g operational general edit arm for field slices — too broad.

---

## 7. Field guard policy

Per slice, implement:

| Guard | Purpose |
| --- | --- |
| `assertG9G4a2aOpenTimeOnlyChangedFieldsOnly` | `changedFields` exactly `["open_time"]` |
| `assertG9G4a2aOpenTimeOnlyPayloadOnly` | payload exactly `{ open_time: string }` — trim; allow null→empty per existing safe-field rules |
| `assertG9G4a2aNoRouteDatePublicationImageMutation` | same forbidden key set as G-9g4a1 (extend forbidden list) |
| `assertG9G4a2aOpenTimeOnlyApproval` | approval ID match |
| `assertG9G4a2aOpenTimeOnlyWritableRow` | content row; not PoC audit row |

Forbidden in same Save: `venue`, `title`, `start_time`, `price`, `description`, `date`, `published`, images, routes, ids, `site_slug`, `updated_at`, etc.

Future slices: mirror with `start_time` → G-9g4a2b guards, `price` → G-9g4a2c guards.

---

## 8. Payload exact policy

```txt
payload keys === changedFields keys === exactly one safe field for the slice
no extra keys
no missing keys
candidate must match Preview dry-run candidate for selected row
non-target safe fields must match loaded row at Preview and Save
```

Example G-9g4a2a:

```json
{ "open_time": "11:30 [G-9g4a2a open_time smoke]" }
```

---

## 9. changedFields exact policy

```txt
changedFields.length === 1
changedFields[0] === slice field name
order-independent compare in guards
Preview and Save must agree on changedFields
```

---

## 10. Optimistic lock policy

**Reuse G-9g4a1 / G-9g3g pattern:**

- `expectedBeforeUpdatedAt` from loaded row at Preview
- stale check on Preview blocks Save enablement
- Save passes `expectedBeforeUpdatedAt` to `executeScheduleGeneralUpdateWrite`
- DB trigger `schedules_set_updated_at` advances `updated_at` on success
- Preflight records lock baseline; execution reconfirms live

---

## 11. Re-click prevention policy

**Reuse G-9g3h1 / G-9g4a1 pattern:**

- One Save per preview identity
- After successful Save: Preview consumed message; Save disabled
- `g9g4a2aOpenTimeOnlySaveSuccess` (or equivalent) gates operator-completed copy
- Cursor / AI / Playwright must never click Save

---

## 12. Preview → ChatGPT confirmation → Save exactly once

| Step | Actor | Rule |
| --- | --- | --- |
| 1 | Operator | Select row via row picker |
| 2 | Operator | Edit `open_time` candidate in slice UI |
| 3 | Operator | Click Preview once |
| 4 | ChatGPT | Confirm Preview gate (dry-run flags, changedFields, lock, host) |
| 5 | Operator | Click Save **exactly once** |
| 6 | System | Block re-click; require fresh Preview for any further write |

Cursor / AI: **never** steps 3 or 5.

---

## 13. Restore required policy

| State | restore required |
| --- | --- |
| After smoke execution with marker in DB | **yes** — `activeRestoreExceptionsCount: 1` |
| After successful restore Save (marker removed) | **no** — `activeRestoreExceptionsCount: 0` |
| After round-trip finalization | **no** — same as G-9g4a1e |

Restore uses **same G-9g4a2a slice path** (not G-9g3g5 description restore).

---

## 14. Restore preflight policy

Before restore manual execution:

- Document `beforeSnapshot` with smoke marker value
- Document restore payload (original field value only)
- Document `expectedBeforeUpdatedAt` lock baseline from smoke Save
- Document rollback SQL (**DO NOT RUN**)
- Env stack: G-9g4a2a arm on; G-9g4a1 / G-9g3g / G-9g3g5 arms off
- Cursor / AI: no Preview, no Save in preflight phase

---

## 15. Rollback SQL document-only policy

```txt
rollback SQL may be documented in preflight / execution result docs
rollback SQL must never be executed by Cursor / AI
UI restore via same slice path is the preferred rollback
emergency SQL requires separate explicit operator approval (not planned in G-9g4a2a)
```

Example (G-9g4a2a — **DO NOT RUN**):

```sql
-- DO NOT RUN — documentation only
-- UPDATE public.schedules
-- SET open_time = '11:30'
-- WHERE id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69'
--   AND site_slug = 'gosaki-piano';
```

---

## 16. Env arm policy

**This planning phase:** no new env arms created or used. No writes to `.env` / `.env.local`.

**Implementation phase (proposal only):**

```txt
G-9g4a2a execution only:
  PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true
  PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false
  PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false
  PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false
  PUBLIC_ADMIN_WRITE_DRY_RUN=false
  ENABLE_ADMIN_STAGING_WRITE=true
```

Single slice armed at a time. Mutual exclusion with G-9g4a1 and all other operational arms.

---

## 17. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- G-9g4a2a env arm: **not created in this phase**
- Execution-only inline env ended after G-9g4a1e
- Do **not** write arms to `.env` / `.env.local`
- Production and `/admin` remain out of scope
- `service_role` prohibition continues
- FTP / deploy prohibition continues
- Staging host only: `kmjqppxjdnwwrtaeqjta.supabase.co`

---

## 18. Forbidden operations (this phase)

| Operation | Status |
| --- | --- |
| Cursor/AI row picker click | **no** |
| Cursor/AI Preview click | **no** |
| Cursor/AI Save click | **no** |
| DB write / SQL mutation | **no** |
| Rollback / restore SQL execution | **no** |
| FTP / workflow_dispatch / deploy | **no** |
| service_role | **not used** |
| `/admin` / production | **not touched** |
| New env arm activation | **no** |

---

## 19. Safety flags (proven + this phase)

**G-9g4a1 round-trip (proven):**

```json
{
  "serviceRoleUsed": false,
  "productionBlocked": true,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false
}
```

**G-9g4a2 planning (this phase):**

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "markerRemainsInStagingDb": false,
  "activeRestoreExceptionsCount": 0,
  "restoreRequired": false
}
```

---

## 20. Recommended next phase

**`G-9g4a2a-open-time-only-operational-expansion-implementation`**

**Reason:** G-9g4a1 proved single-field operational round-trip; `open_time` is the smallest safe text field with clear validation and no SEO coupling. Implementation phase delivers guards, config, UI gate, executor — **no operator Save** in implementation phase.

| Deliverable | Scope |
| --- | --- |
| G-9g4a2a implementation | approval ID registration, guards, config, UI module, executor, mutual exclusion |
| G-9g4a2a preflight | target row, before.open_time, smoke candidate, rollback SQL doc-only |

**Do not** implement G-9g4a2b (`start_time`) or G-9g4a2c (`price`) until G-9g4a2a round-trip is complete or explicitly deferred by operator.
