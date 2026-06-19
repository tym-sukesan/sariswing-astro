# Staging shell schedule venue-only operational expansion execution runbook (G-9g4a1b)

**Phase:** `G-9g4a1b-venue-only-operational-expansion-execution-runbook`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a1a preflight — commit `01e64af`  
**Type:** execution runbook only — **no operator action executed in this phase**

| Check | Status |
| --- | --- |
| Operator action executed (this phase) | **no** |
| Row picker operated (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `.env` / `.env.local` arm write | **no** |
| Dev server with execution stack | **no** |
| Target row selected | **no** — remains unselected until `G-9g4a1b1` |

Prior docs:

- [staging-shell-schedule-venue-only-operational-expansion-preflight.md](./staging-shell-schedule-venue-only-operational-expansion-preflight.md)
- [staging-shell-schedule-venue-only-operational-expansion-implementation.md](./staging-shell-schedule-venue-only-operational-expansion-implementation.md)

**This runbook is for operator reference in `G-9g4a1b1-venue-only-operational-expansion-manual-execution`. Cursor / AI / Playwright / Chromium must not click Preview or Save.**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 operational Save.**

---

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionExecutionRunbookComplete: true
readyForG9g4a1b1VenueOnlyOperationalExpansionManualExecution: true
targetRowSelected: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a1b1-venue-only-operational-expansion-manual-execution`

---

## 1. Runbook scope

| Rule | Detail |
| --- | --- |
| This phase | **runbook documentation only** |
| Operator action | **none** in G-9g4a1b |
| Preview click | **forbidden** for Cursor/AI — operator only in G-9g4a1b1 |
| Save click | **forbidden** for Cursor/AI — operator only in G-9g4a1b1 |
| DB write | **no** |
| SQL execution | **no** |
| Rollback | **no** |
| Restore | **no** |
| FTP / deploy | **no** |
| service_role | **forbidden** |
| Target row | **unselected** until manual execution phase |

---

## 2. Route and hosts

```txt
URL:  http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
site_slug: gosaki-piano
staging host:  kmjqppxjdnwwrtaeqjta.supabase.co
production host (blocked): vsbvndwuajjhnzpohghh.supabase.co
```

Staging shell only — **not** Sariswing production `/admin`.

---

## 3. Approval ID

```txt
G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
```

---

## 4. Execution stack (G-9g4a1b1 — operator temporary inline env only)

Operator uses **inline env for one Save window** — do **not** permanently write to `.env` / `.env.local`.

### Execution-only temporary stack

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
PUBLIC_SUPABASE_URL=https://kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<staging anon key — never commit>
```

Shorthand (same meaning):

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_SAVE_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_ARMED=false or unset
```

### Arm mutual exclusion (mandatory)

**G-9g4a1 arm only on** during execution — G-9g3g and G-9g3g5 arms must stay off.

| Arm | G-9g4a1b1 execution |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | **on** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **off** |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC arms | **off** |
| `service_role` | **forbidden** |
| Production host | **blocked** |

**After Save:** restart dev with routine dev stack below. Do not leave execution arms on.

### Routine dev stack (default — daily work and this runbook phase)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

---

## 5. Exact UI targets (G-9g4a1 venue-only path only)

| Element | id |
| --- | --- |
| Venue-only Preview button | `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` |
| Preview result | `#site-slug-edit-g9g4a1-venue-only-dry-run-result` |
| Save gate panel | `#site-slug-edit-g9g4a1-venue-only-save-gate-panel` |
| Venue-only Save button | `#site-slug-edit-g9g4a1-venue-only-save-btn` |
| Save result | `#site-slug-edit-g9g4a1-venue-only-save-result` |

### Do **not** use

| Forbidden | Reason |
| --- | --- |
| G-9g3g general Save button | description operational path — wrong slice |
| G-9g3g5 restore button | restore path — wrong phase |
| Legacy G-6 buttons | frozen PoC slices |
| `/admin` | production admin — blocked |
| Sariswing staging shell | use gosaki `site_slug` staging shell only |

---

## 6. Target row selection runbook (operator — G-9g4a1b1)

### Primary — Option A (recommended)

Operator selects a **new safe content row** via row picker:

| Criterion | Requirement |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| Row type | **content row** — not audit / PoC |
| `[CMS Kit staging]` marker | **absent** in title, venue, description, time, price |
| G-6 pilot row | **not** `aa440e29-5be8-402e-9190-0d81c48434c0` |
| Old PoC rows | frozen slice rows excluded |
| `venue` | short, human-readable — easy before/after diff |
| Restore | single-string revert |
| History | **prefer not** `888c58f2-f152-4563-a3cf-a20d7c2456c1` (G-9g3g4 / G-9g3h1 series) |
| `published` | if `true`, operator accepts brief public venue display during smoke |

### Fallback — Option B (discouraged)

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| venue | `銀座 N` |

Technically valid for venue-only Save but **heavily used** — principle: avoid.

### Operator steps (G-9g4a1b1)

1. Open staging shell `#schedule` with **routine dev** stack (dry-run on, all arms off).
2. Browse row picker — filter by month if helpful (`2026-03`, `2026-04`, `2026-05`).
3. Select Option A candidate (or document Option B with explicit reason).
4. Confirm loaded row: no `[CMS Kit staging]` in any safe text field.
5. Record `id`, `legacy_id`, `venue`, `updated_at` for beforeSnapshot.
6. Edit **venue field only** — set smoke candidate (§7).
7. Proceed to Preview step (§8).

**Cursor/AI:** do not operate row picker in any phase.

---

## 7. Venue smoke value

### Generic form

```txt
before:  <current venue>
after:   <current venue> [G-9g4a1 venue smoke]
restore: <current venue>
```

### Fallback row example (Option B only)

```txt
before:  銀座 N
after:   銀座 N [G-9g4a1 venue smoke]
restore: 銀座 N
```

### Rules

| Rule | Detail |
| --- | --- |
| Do **not** use `[CMS Kit staging]` | avoids PoC audit classification |
| Suffix | `[G-9g4a1 venue smoke]` appended to original venue |
| Venue only | do not change title, description, date, published, image |
| Audit marker | do not confuse with `[CMS Kit staging]` audit rows |
| Published row | venue may appear on public schedule cards briefly |
| Post-smoke | **mandatory** restore chain (§12) |

---

## 8. Preview step (operator — G-9g4a1b1)

### Before Preview

- [ ] Target row selected and loaded in editor
- [ ] Smoke venue candidate entered — **only venue differs** from loaded row
- [ ] Routine dev stack still active for first Preview (dry-run Preview is valid before arming)
- [ ] Or execution stack armed per §4 if operator arms before Preview (either order documented in preflight — Preview must show `actualWrite=false`)
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` **off**
- [ ] Staging host only (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- [ ] Staging admin signed in

### Preview action

1. Operator clicks `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` **once** (manual only).
2. Read `#site-slug-edit-g9g4a1-venue-only-dry-run-result`.
3. Read `#site-slug-edit-g9g4a1-venue-only-save-gate-panel` for gate summary.

### Preview result — required fields

```txt
actualWrite: false
changedFields: ["venue"]
payload: { "venue": "<smoke venue>" }
target.id
target.legacy_id
target.site_slug: gosaki-piano
before.venue
after.venue
optimisticLock.expectedBeforeUpdatedAt
optimisticLock.currentUpdatedAt
optimisticLock.stale: false
hostGatePassed: true
approvalId: G-9g4a1-schedule-site-slug-venue-only-non-dry-run
serviceRoleUsed: false
productionBlocked: true
```

### Preview STOP — before Save

```txt
STOP: operator must paste Preview result to ChatGPT
STOP: operator must not click Save until ChatGPT confirms all gates
```

If any required field fails — fix candidate or row selection; run **fresh Preview** after change.

---

## 9. Save step (operator — G-9g4a1b1)

### Before Save — checklist

- [ ] ChatGPT confirmed Preview result
- [ ] Execution stack armed (§4) — `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- [ ] `#site-slug-edit-g9g4a1-venue-only-save-btn` enabled (Save gate passed)
- [ ] `changedFields` exactly `["venue"]`
- [ ] Payload exactly `{ "venue": "<smoke venue>" }`
- [ ] `expectedBeforeUpdatedAt` matches Preview optimistic lock
- [ ] `optimisticLock.stale=false`
- [ ] `hostGatePassed=true`
- [ ] `approvalId` = `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- [ ] **Only** `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true`
- [ ] G-9g3g / G-9g3g5 arms **off**
- [ ] Operator understands Save is **one-time only**
- [ ] Non-venue fields unchanged vs loaded row

### Save execution

```txt
operator manually clicks #site-slug-edit-g9g4a1-venue-only-save-btn exactly once
Cursor / AI / Playwright / Chromium must not click
no double click
no retry without fresh Preview and ChatGPT confirmation
```

### Save result — required fields

```txt
actualWrite: true
rowsAffected: 1
changedFields: ["venue"]
payload: { "venue": "<smoke venue>" }
before.venue
after.venue
after.updated_at
serviceRoleUsed: false
productionBlocked: true
scheduleMonthsTouched: false
deleteEnabled: false
publishTriggered: false
```

### Save STOP — after success

```txt
STOP: operator must paste Save result (#site-slug-edit-g9g4a1-venue-only-save-result) to ChatGPT
STOP: do not click Save again
STOP: do not run restore yet
STOP: do not run rollback SQL
STOP: wait for next instruction (restore preflight G-9g4a1c)
STOP: restart dev with routine dev stack
```

---

## 10. Re-click prevention

| Rule | Detail |
| --- | --- |
| Save success consumes latest Preview | same Preview identity cannot be reused |
| Save button disabled after success | confirm in UI after Save |
| Candidate change | requires **fresh Preview** before Save |
| Re-click block message | confirm after Save — `venue-only` mode in operational save reclick |
| No retry | without ChatGPT approval + fresh Preview |

---

## 11. Operator stop points (summary)

| Stop point | Action |
| --- | --- |
| After row selection | Record beforeSnapshot; do not Save yet |
| After Preview | **Paste to ChatGPT** — wait for confirmation |
| Before Save | Complete §9 checklist; arm execution stack |
| After Save | **Paste to ChatGPT** — do not re-click Save |
| After Save | Plan restore chain — do not execute restore in same session without instruction |

---

## 12. Restore follow-up (not executed in this phase)

After successful G-9g4a1b1 venue smoke Save, operator **must** proceed to restore chain:

| Phase | Scope |
| --- | --- |
| **G-9g4a1c-venue-only-operational-restore-preflight** | restore target, before.venue = smoke, after.venue = original |
| **G-9g4a1d-venue-only-operational-restore-execution** | operator Preview + restore Save once |
| **G-9g4a1e-venue-only-operational-restore-post-execution-hardening** | marker removed; routine dev safety |

Restore payload:

```txt
changedFields: ["venue"]
payload: { "venue": "<before venue>" }
```

**This runbook phase does not execute restore.**

---

## 13. Forbidden operations avoided (this phase)

| Operation | Status |
| --- | --- |
| Row picker (Cursor/AI) | **no** |
| Save click (Cursor/AI) | **no** |
| Preview click (Cursor/AI) | **no** |
| DB write | **no** |
| SQL mutation / rollback execution | **no** |
| Restore execution | **no** |
| `.env` / `.env.local` arm write | **no** |
| Dev server with execution arms | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| service_role | **no** |

---

## 14. Recommended next phase

**`G-9g4a1b1-venue-only-operational-expansion-manual-execution`**

Operator-driven: row selection → venue smoke candidate → G-9g4a1 Preview → paste to ChatGPT → armed stack → checklist → one manual Save → paste result → restore chain planning.
