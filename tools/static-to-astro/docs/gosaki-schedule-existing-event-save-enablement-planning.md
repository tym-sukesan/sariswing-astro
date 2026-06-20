# Gosaki schedule existing event save enablement planning (G-9j)

**Phase:** `G-9j-gosaki-schedule-existing-event-save-enablement-planning`  
**Status:** **complete** (planning only — no implementation, no Save, no DB write)  
**Date:** 2026-06-19  
**Prior:** Gosaki operator Schedule UI polish — commit `fcb40a9`; operator add/edit forms on `/__admin-staging-shell/musician-basic/admin/schedule/`  
**Type:** planning / readiness only

| Check | Status |
| --- | --- |
| Row picker / Save clicked (Cursor/AI) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL / migration executed (this phase) | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `/admin` modified | **no** |
| `service_role` used | **no** |
| non-dry-run arm ON | **no** |

Prior docs (read-only reference):

- [gosaki-schedule-cms-practicalization-planning.md](./gosaki-schedule-cms-practicalization-planning.md) (G-9h)
- [staging-shell-schedule-site-slug-operational-general-edit-planning.md](./staging-shell-schedule-site-slug-operational-general-edit-planning.md) (G-9g3g — dev-tools operational path; **do not re-click** G-9g3g4 Save)
- [staging-shell-schedule-single-text-field-operational-commonization-implementation.md](./staging-shell-schedule-single-text-field-operational-commonization-implementation.md) (G-9g4a2)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g4 / G-9g4a1 / G-9g4a2a Save.**

---

## Gates

```txt
gosakiScheduleExistingEventSaveEnablementPlanningComplete: true
readyForG9j1GuardsAndDryRunImplementation: true
readyForG9j2OperatorUiWiringSaveDisabled: false
readyForG9j3StagingDryRunManualVerification: false
readyForG9j4OneRowNonDryRunPreflight: false
readyForG9j5OneRowNonDryRunExecution: false
readyForAnyDbWrite: false
readyForProductionCutover: false
readyForFtpAutoApply: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9j1-gosaki-schedule-existing-event-update-guards-and-dry-run-implementation`

---

## 1. Purpose

Enable **existing event UPDATE only** on the Gosaki **operator-facing** Schedule admin page (`AdminGosakiStagingScheduleOperatorPage`) — not production `/admin`, not dev-tools PoC sections.

First save scope is intentionally narrow:

- **UPDATE** one selected existing row on staging `public.schedules`
- **Safe text fields only** (no date / month / route / publication changes)
- **Dry-run preview required** before Save is enabled
- **Dedicated approval ID + env arm** (separate from frozen G-9g3g PoC)
- **One-row non-dry-run** at first execution (explicit operator approval)

Out of scope for G-9j series initial slice:

- INSERT (new event add)
- DELETE
- DUPLICATE save
- `date` / `year` / `month` mutation
- `source_route` / `source_file` mutation
- `published` / `show_on_home` / `home_order` / `sort_order`
- `schedule_months` writes
- Public site rebuild / FTP / deploy

---

## 2. Write infrastructure survey (current codebase)

### 2.1 Confirmed building blocks (reuse)

| Component | Path | Role |
| --- | --- | --- |
| Optimistic lock builder | `schedule-general-update-trigger.ts` → `buildScheduleLockedWriteRequest` | Wires `expectedBeforeUpdatedAt` from `beforeSnapshot.updated_at` when lock enabled |
| Write executor | `schedule-general-update-trigger.ts` → `executeScheduleGeneralUpdateWrite` | Auth session + load snapshot + locked request + `updateScheduleWrite` |
| Write adapter | `schedule-write-adapter.ts` → `updateScheduleWrite` | UPDATE-only on `schedules`; stale check; no `service_role` |
| Payload safety (global) | `schedule-write-guards.ts` → `assertScheduleUpdatePayloadAllowed` | Blocks `id`, `legacy_id`, `month`, `source_route`, etc. |
| Safe-field set (6 fields) | `schedule-write-guards.ts` → `G9G3D_GENERAL_EDIT_SAFE_FIELDS` | `title`, `venue`, `open_time`, `start_time`, `price`, `description` |
| Operational payload guard (pattern) | `assertG9G3gOperationalGeneralEditPayloadOnly` | changedFields-only; keys must match exactly |
| Site slug scope | `assertBeforeSnapshotSiteSlugScope` | `site_slug = gosaki-piano` |
| PoC row block | `assertOperationalNotPocAuditRow` | Blocks PoC audit rows / staging markers |
| Preview identity / consumed | `assertOperationalPreviewIdentityPresent`, `assertOperationalPreviewNotConsumed` | One Save per successful dry-run preview |
| Host gate | `staging-schedule-site-slug-host-gate.ts` | Blocks production Supabase host |
| Auth | `getStagingAuthSessionDetails` + anon client | No `service_role` |
| Operator row selection | `gosaki-staging-schedule-operator-ui.ts` → `dispatchRowSelected` | Already selects existing rows for edit form |

### 2.2 Existing operational path (G-9g3g) — reference, not reuse for approval

`staging-schedule-site-slug-operational-general-edit-save.ts` already implements UPDATE with the **same six safe fields** via dev-tools UI (`AdminStagingScheduleSiteSlugEditSection` in `<details>`).

| Item | G-9g3g (frozen) | G-9j (new operator path) |
| --- | --- | --- |
| UI surface | Dev-tools row picker / G-9 sections | Operator edit form on main Schedule page |
| Approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` | **New** `G-9j-gosaki-schedule-existing-event-update-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **New** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED` |
| PoC Save | G-9g3g4 executed once — **do not re-click** | Fresh operator slice; separate preview identity |
| Save enabled today | G-9g3g arm off by default | G-9j arm off until G-9j5 |

**Recommendation:** Reuse **write mechanics** (`buildScheduleLockedWriteRequest`, `updateScheduleWrite`, optimistic lock, host gate, auth). Add **G-9j-specific** guard + config + operator UI dry-run/Save wiring. Do **not** reuse G-9g3g approval ID or re-arm G-9g3g env.

### 2.3 DB schema alignment (`public.schedules`)

Staging row shape (read loader / write adapter):

| UI label | DB column | G-9j UPDATE payload |
| --- | --- | --- |
| タイトル | `title` | **allowed** |
| 会場 | `venue` | **allowed** |
| 開場 | `open_time` | **allowed** |
| 開演 | `start_time` | **allowed** |
| 料金 | `price` | **allowed** |
| 備考 / 説明 | `description` | **allowed** |
| 日付 | `date` | **excluded** (display only in edit form) |
| 月 | `month` | **excluded** (derived from date; not written) |
| 公開 | `published` | **excluded** (checkbox read-only in G-9j2 until future phase) |

`updated_at`: DB trigger `schedules_set_updated_at` (staging) may set on UPDATE — **do not pass in payload**.

`site_slug`: enforced via `beforeSnapshot.site_slug` scope guard, not in payload.

---

## 3. Allowed fields (first UPDATE slice)

### 3.1 In scope

```txt
title
venue
open_time
start_time
price
description
```

Rules:

- **changed-fields-only** — payload keys must equal `changedFields` exactly
- At least one field must change vs `beforeSnapshot`
- `title` cannot be empty when included
- Text fields normalize trim; empty string → `null` where existing guards allow (follow `normalizeG9G3dGeneralEditFieldValue`)

### 3.2 Explicitly excluded from operator save (first slice)

```txt
id
legacy_id
site_slug
date
year
month
source_route
source_file
published
show_on_home
home_order
sort_order
image_url
home_image_url
created_at
updated_at          # not in payload; used only for optimistic lock baseline
schedule_months     # no read/write
```

UI note: edit form may show **date** and **published** for context; G-9j2 should keep them **read-only** or ignore on save until dedicated phases.

---

## 4. Save flow (operator UI)

```txt
1. Operator selects existing row in 公演一覧 → 編集フォーム populated
2. Operator edits allowed fields only
3. Operator clicks 「変更を確認」 (dry-run preview) — SELECT + diff only, no write
4. Dry-run panel shows:
   - target id, legacy_id (display), date, title (identification)
   - site_slug (must be gosaki-piano)
   - changedFields[]
   - before / after per field
   - expectedBeforeUpdatedAt (optimistic lock baseline)
   - guard pass/fail (no forbidden keys)
5. If dry-run OK + host gate OK + auth OK + not stale → enable 「更新」button
6. Non-dry-run Save requires:
   - G-9j approval ID registered
   - PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=true
   - ENABLE_ADMIN_STAGING_WRITE=true (existing staging write flag)
   - PUBLIC_ADMIN_WRITE_DRY_RUN=false (routine dev stays dry-run default)
   - Explicit operator approval (one-row pilot)
7. After Save: reload row into edit form; mark preview consumed; disable Save until next dry-run
```

**This planning phase:** Save button remains **disabled**; no dry-run button wired to DB yet.

---

## 5. Approval ID and env arm

| Item | Value |
| --- | --- |
| **Phase** | `G-9j-gosaki-schedule-existing-event-save-enablement-planning` |
| **approvalId** | `G-9j-gosaki-schedule-existing-event-update-non-dry-run` |
| **Env arm** | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED` |
| **TypeScript constant (implementation)** | `G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID` |
| **Config module (implementation)** | `gosaki-schedule-existing-event-update-config.ts` (new, under `staging-data/`) |
| **Save executor (implementation)** | `gosaki-schedule-existing-event-update-save.ts` (new, under `staging-write/`) |
| **Guard (implementation)** | `assertG9jExistingEventUpdatePayloadOnly` — same field set as `G9G3D_GENERAL_EDIT_SAFE_FIELDS` |

### 5.1 Single-arm policy

When G-9j arm is ON, other non-dry-run schedule arms must remain OFF (same pattern as G-9g4a2 registry):

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=false
```

### 5.2 Routine dev default (unchanged)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false
```

---

## 6. Safety guards (implementation checklist)

| Guard | Policy |
| --- | --- |
| Table | `public.schedules` only |
| Operation | UPDATE only |
| INSERT / DELETE / UPSERT | forbidden |
| `site_slug` | `gosaki-piano` on `beforeSnapshot` only |
| Row | Selected existing row; not PoC audit (`isPocAuditScheduleRow`) |
| Payload keys | ⊆ `{title, venue, open_time, start_time, price, description}` |
| `changedFields` | Must match payload keys exactly |
| `date` / `month` / `source_route` / `published` | Not in payload |
| `schedule_months` | Not touched |
| Optimistic lock | **Required** — `expectedBeforeUpdatedAt` from dry-run baseline |
| Production host | Blocked via host gate |
| `service_role` | Forbidden |
| Auth | Staging signed-in session + anon key |
| Public reflect | Manual rebuild / re-upload — separate phase |
| Cursor auto-click | Forbidden for Preview/Save in execution phases |

---

## 7. Dry-run design

### 7.1 Operator dry-run (G-9j1+)

New client/server helper: `executeG9jExistingEventUpdateDryRun` (name TBD) — **no write**.

Inputs:

- `beforeSnapshot` (from row picker binding / SSR dataset refresh)
- `candidateValues` from operator edit form (6 fields only)
- `targetId`

Outputs (`G9jExistingEventUpdatePreviewBinding`):

```ts
{
  targetId: string;
  legacyId: string | null;
  siteSlug: string;           // gosaki-piano
  date: string;               // identification only — not written
  title: string;              // identification
  changedFields: string[];
  fieldValues: Record<string, string>;  // after values
  beforeValues: Record<string, string>;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  hostGatePassed: boolean;
  previewIdentity: string;    // uuid per successful dry-run
  guardErrors: string[];
}
```

Dry-run must verify:

- No forbidden keys in derived payload
- `changedFields` non-empty (or block Save with message)
- `site_slug` scope OK
- Not PoC audit row
- Stale `updated_at` flagged before Save enable

### 7.2 Relation to existing dry-run

Reuse patterns from:

- `staging-schedule-site-slug-edit-binding` (G-9g dry-run preview)
- G-9g3g operational preview binding shape

Do **not** call `updateScheduleWrite` during dry-run.

---

## 8. Implementation phase split

| Phase | ID | Scope | DB write |
| --- | --- | --- | --- |
| **Planning** | **G-9j** | This doc + verifier + AI context | **no** |
| Guards + dry-run | **G-9j1** | Register approval ID; `assertG9j*` guards; config; dry-run executor; static verifier | **no** |
| Operator UI wiring | **G-9j2** | Wire edit form → dry-run preview panel on main Schedule page; **Save stays disabled** | **no** |
| Dry-run manual verify | **G-9j3** | Operator manual dry-run on staging; document result | **no** |
| Final preflight | **G-9j4** | One target row; before/after/rollback SQL doc; arm command doc | **no** |
| One-row Save | **G-9j5** | Enable Save when armed; operator clicks once; Cursor does not click Save | **yes** (one UPDATE, staging only) |

### 8.1 Deferred follow-up phases (not G-9j)

| Future | Scope |
| --- | --- |
| G-9j-add | INSERT new event |
| G-9j-del | Soft delete / archive |
| G-9j-date | `date` + derived `month` + `source_route` policy |
| G-9j-pub | `published` toggle |
| G-9j-rebuild | Public schedule rebuild + manual re-upload checklist |

---

## 9. UI touchpoints (implementation reference)

| File | G-9j change |
| --- | --- |
| `AdminGosakiStagingScheduleOperatorPage.astro` | Dry-run panel + Save gate UI (G-9j2); keep dev PoC in `<details>` |
| `gosaki-staging-schedule-operator-ui.ts` | Form diff, dry-run trigger, preview binding state |
| `gosaki-schedule-existing-event-update-config.ts` | **new** — arm / host gate / saveEnabled |
| `gosaki-schedule-existing-event-update-save.ts` | **new** — wraps locked write |
| `schedule-write-types.ts` | Register G-9j approval ID |
| `schedule-write-guards.ts` | `assertG9jExistingEventUpdatePayloadOnly` |

**Not in scope:** `src/pages/admin/*`

---

## 10. First non-dry-run pilot (G-9j5 planning only)

- **One row** only — operator-selected non-PoC `gosaki-piano` event
- **Explicit approval** text per AGENTS.md destructive/safety rules
- **Rollback:** documented SQL restoring beforeSnapshot fields for changed columns only
- **After success:** disable arm; return to `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
- **Do not** re-use G-9g3g4 target row or re-click G-9g3g Save

---

## 11. Verifier

Static verifier:

```bash
node tools/static-to-astro/scripts/verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs
```

---

## 12. Planning completion statement

- G-9j planning **complete**
- **No** implementation, Save, DB write, migration, FTP, or deploy in this phase
- **`readyForAnyDbWrite: false`** maintained
- **Next:** `G-9j1-gosaki-schedule-existing-event-update-guards-and-dry-run-implementation`
