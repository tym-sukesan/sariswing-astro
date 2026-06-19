# Staging shell schedule venue-only operational expansion preflight (G-9g4a1a)

**Phase:** `G-9g4a1a-venue-only-operational-expansion-preflight`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a1 venue-only implementation — commit `49986c1`  
**Type:** preflight / rollback planning / operator checklist only — **no Save, no Preview click by Cursor, no DB write, no SQL execution**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `.env` / `.env.local` arm write | **no** |

Prior docs:

- [staging-shell-schedule-venue-only-operational-expansion-implementation.md](./staging-shell-schedule-venue-only-operational-expansion-implementation.md)
- [staging-shell-schedule-text-fields-operational-expansion-planning.md](./staging-shell-schedule-text-fields-operational-expansion-planning.md)

**G-9g4a1b venue smoke execution is forbidden until operator completes row selection, Preview, and checklist in execution phase.**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 operational Save.**

---

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a1bVenueOnlyOperationalExpansionExecutionRunbook: true
targetRowSelected: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
```

**Recommended next:** `G-9g4a1b-venue-only-operational-expansion-execution-runbook`

---

## 1. Route and hosts

```txt
URL:  http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
site_slug: gosaki-piano
staging host:  kmjqppxjdnwwrtaeqjta.supabase.co
production host (blocked): vsbvndwuajjhnzpohghh.supabase.co
```

Staging shell only — **not** Sariswing production `/admin`.

---

## 2. Approval ID / env arm

```txt
G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
```

Distinct from G-9g3g description operational path:

```txt
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED
```

---

## 3. Target row selection strategy

### Option A — **Primary (recommended)**

At execution preflight, operator selects a **new safe content row** via row picker:

| Criterion | Requirement |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| Row type | **content row** — not audit / PoC |
| `[CMS Kit staging]` marker | **absent** in title, venue, description, time, price |
| G-6 pilot row | **not** `aa440e29-5be8-402e-9190-0d81c48434c0` |
| Old PoC rows | frozen slice rows excluded |
| Route / date / month | no change intended — row metadata unchanged by venue-only Save |
| Publication / image | no change intended |
| `venue` | short, human-readable — easy before/after diff |
| Restore | single-string revert |
| History | **prefer not** `888c58f2-f152-4563-a3cf-a20d7c2456c1` (G-9g3g4 / G-9g3h1 series) |
| `published` | if `true`, operator accepts brief public venue display during smoke |

**Suggested month filters for operator browse:** `2026-03`, `2026-04`, `2026-05` — pick first row meeting all criteria.

### Option B — **Fallback (discouraged)**

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| venue | `銀座 N` |

**Caveat:** Technically valid for venue-only Save (does not touch `description`), but **heavily used** in G-9g3g4 / G-9g3h1 round-trip. **Principle: avoid** — use only if no Option A row is available and operator documents explicit acceptance.

**This preflight does not fix a target row id** — operator records chosen row in execution runbook.

---

## 4. Target row selection method

### Cursor / AI (this phase) — documentation only

| Deliverable | Status |
| --- | --- |
| Selection criteria | documented §3 |
| Operator UI / result items | documented §5, §10 |
| beforeSnapshot template | documented §6 |
| Rollback / restore templates | documented §8, §9 |
| Execution pre-checklist | documented §10 |
| Row picker click | **forbidden** |
| Preview click | **forbidden** |
| Save click | **forbidden** |
| SQL / DB | **forbidden** |

### Operator (G-9g4a1b execution phase onward) — manual

1. Open staging shell `#schedule` with routine dev safety (dry-run on, all arms off).
2. Browse row picker — filter by month if helpful.
3. Select **Option A** candidate (or document Option B fallback with reason).
4. Confirm loaded row: no `[CMS Kit staging]` in any safe text field.
5. Edit **venue candidate only** — append smoke suffix (§7).
6. Click `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` **once** (operator manual).
7. Read `#site-slug-edit-g9g4a1-venue-only-dry-run-result` — verify gates (§10).
8. Copy beforeSnapshot fields into execution result doc.
9. **Do not Save** until G-9g4a1b execution runbook armed stack + checklist complete.
10. Paste Preview + gate panel + Save result to ChatGPT after Save (execution phase only).

---

## 5. Operator UI / result items to verify at Preview

| Panel / element | id | Verify |
| --- | --- | --- |
| Venue-only Preview button | `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` | operator clicks (not Cursor) |
| Preview result | `#site-slug-edit-g9g4a1-venue-only-dry-run-result` | `actualWrite=false`, `changedFields: venue` |
| Save gate | `#site-slug-edit-g9g4a1-venue-only-save-gate-panel` | approval ID, env arm, host gate, lock |
| Save button | `#site-slug-edit-g9g4a1-venue-only-save-btn` | disabled until armed + valid Preview |
| Save result | `#site-slug-edit-g9g4a1-venue-only-save-result` | paste after one manual Save |

Preview result must show:

```txt
changedFields: ["venue"]
payload: { "venue": "<smoke candidate>" }
optimisticLock.stale: false
hostGatePassed: true
serviceRoleUsed: false
productionBlocked: true
```

---

## 6. beforeSnapshot template

### Full template (operator fills at Preview / execution)

```txt
id:
legacy_id:
site_slug:
title:
date:
year:
month:
source_route:
venue:
open_time:
start_time:
price:
description:
published:
show_on_home:
sort_order:
home_order:
image_url:
home_image_url:
updated_at:
```

### G-9g4a1 venue-only **required** comparison fields

```txt
id
legacy_id
site_slug
venue
updated_at
```

All other fields: **unchanged confirmation only** — if any differ from loaded row at Preview, stop and fix candidate (venue-only slice requires non-venue fields unchanged).

### Placeholder (target row TBD at operator selection)

```txt
id: <OPERATOR_RECORD_AT_EXECUTION>
legacy_id: <OPERATOR_RECORD_AT_EXECUTION>
site_slug: gosaki-piano
venue: <BEFORE_VENUE>
updated_at: <OPERATOR_RECORD_FROM_PREVIEW>
```

---

## 7. Smoke candidate

### Generic form

```txt
before:  <current venue>
after:   <current venue> [G-9g4a1 venue smoke]
restore: <current venue>
```

### Fallback row example (Option B only — not pre-selected)

```txt
before:  銀座 N
after:   銀座 N [G-9g4a1 venue smoke]
restore: 銀座 N
```

### Smoke marker rules

| Rule | Detail |
| --- | --- |
| Do **not** use `[CMS Kit staging]` alone | avoids PoC audit classification |
| Suffix | `[G-9g4a1 venue smoke]` appended to original venue |
| Published row | venue may appear on public schedule cards briefly |
| Post-smoke | **mandatory** restore chain (§9) — G-9g4a1b / c / d |

---

## 8. Env stack / arm plan

### Routine dev (default — **this preflight and daily work**)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

### Execution-only temporary stack (G-9g4a1b — operator arms for one Save window)

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

### Arm mutual exclusion (mandatory)

**G-9g4a1 arm only on** during execution — G-9g3g and G-9g3g5 arms must stay off.

| Arm | G-9g4a1b execution |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | **on** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **off** |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC arms | **off** |
| `service_role` | **forbidden** |
| Production host | **blocked** |

**This preflight:** do **not** write arms to `.env` / `.env.local`; do **not** start dev server with execution stack.

---

## 9. Rollback SQL (document-only — DO NOT RUN)

Fill placeholders after G-9g4a1b execution result is known. **Cursor/AI must not execute.**

```sql
-- DO NOT RUN during G-9g4a1a preflight.
-- DO NOT RUN unless operator explicitly approves emergency SQL rollback.
-- Document-only rollback template for G-9g4a1 venue smoke.
-- Prefer UI restore via G-9g4a1 venue-only path (G-9g4a1c).

UPDATE public.schedules
SET
  venue = '<BEFORE_VENUE>',
  updated_at = '<BEFORE_UPDATED_AT>'
WHERE id = '<TARGET_ID>'
  AND site_slug = 'gosaki-piano'
  AND venue = '<SMOKE_VENUE>'
  AND updated_at = '<AFTER_SMOKE_UPDATED_AT>';
```

| Placeholder | Source |
| --- | --- |
| `<TARGET_ID>` | operator beforeSnapshot.id |
| `<BEFORE_VENUE>` | smoke §7 restore target |
| `<SMOKE_VENUE>` | smoke §7 after value |
| `<BEFORE_UPDATED_AT>` | beforeSnapshot.updated_at at smoke Preview |
| `<AFTER_SMOKE_UPDATED_AT>` | after Save result updated_at |

**Policy:** UI restore route preferred; SQL is emergency documentation only.

---

## 10. Restore strategy

After optional G-9g4a1b venue smoke Save:

| Phase | Scope |
| --- | --- |
| **G-9g4a1b** | execution runbook — operator Preview + Save once (smoke) |
| **G-9g4a1c-venue-only-operational-restore-preflight** | restore target, before.venue = smoke, after.venue = original |
| **G-9g4a1d-venue-only-operational-restore-execution** | operator Preview + restore Save once |
| **G-9g4a1e-venue-only-operational-restore-post-execution-hardening** | marker removed; routine dev safety |

Restore payload:

```txt
changedFields: ["venue"]
payload: { "venue": "<before venue>" }
```

Restore requirements (same safety stack):

- Preview first (`#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn`)
- fresh Preview required after candidate change
- approval ID `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- env arm `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true`
- optimistic lock (`expectedBeforeUpdatedAt`)
- host gate passed
- one-time Save + re-click prevention
- result doc + verifier
- confirm smoke marker removed from `venue` field

---

## 11. Operator execution checklist (before Save — G-9g4a1b)

- [ ] Staging host only (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- [ ] Signed in as staging admin
- [ ] Selected row is **content row** (not PoC audit)
- [ ] Selected row has **no** `[CMS Kit staging]` in safe text fields
- [ ] Not G-6 pilot row `aa440e29-5be8-402e-9190-0d81c48434c0`
- [ ] `site_slug` = `gosaki-piano`
- [ ] Non-venue fields unchanged vs loaded row
- [ ] `changedFields` exactly `["venue"]` in G-9g4a1 Preview result
- [ ] Payload exactly `{ "venue": "<smoke>" }`
- [ ] `before.venue` recorded in beforeSnapshot
- [ ] `after.venue` smoke candidate confirmed
- [ ] `expectedBeforeUpdatedAt` matches Preview optimistic lock
- [ ] `hostGatePassed=true` in Preview result
- [ ] `optimisticLock.stale=false` in Preview result
- [ ] `approvalId` = `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- [ ] **Only** `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true`
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_WRITE_DRY_RUN=false` (execution window only)
- [ ] Save clicked by **operator only** — not Cursor/AI
- [ ] Save clicked **exactly once**
- [ ] After Save: paste `#site-slug-edit-g9g4a1-venue-only-save-result` to ChatGPT before further action
- [ ] Plan restore chain (§10) if smoke marker used

---

## 12. Forbidden operations avoided (this phase)

| Operation | Status |
| --- | --- |
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

## 13. Recommended next phase

**`G-9g4a1b-venue-only-operational-expansion-execution-runbook`**

Operator-driven: row selection → G-9g4a1 Preview → armed stack → checklist → one manual Save → result doc. Optional smoke marker → restore chain G-9g4a1c–e.
