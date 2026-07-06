# G-22h1 — Gosaki Schedule republish planning

**Phase:** `G-22h1-gosaki-schedule-republish-planning`  
**Status:** **complete** — planning / policy / slice design only; **no implementation / Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `d3e76df`  
**Prior:** G-22f unpublish UPDATE closed · G-22g P0 UX chain closed · authenticated admin read closed

| Check | Status |
| --- | --- |
| Republish planning recorded | **yes** |
| Implementation | **not started** |
| Save / DB write | **not executed** |
| GRANT / REVOKE / RLS | **not changed** |
| package regen / FTP / public reflection | **not executed** |

---

## Gates

```txt
gosakiScheduleRepublishPlanningComplete: true
phase: G-22h1-gosaki-schedule-republish-planning
proposedApprovalId: G-22h-gosaki-schedule-republish-update-non-dry-run-slice
proposedDryRunApprovalId: G-22h-gosaki-schedule-republish-dry-run
proposedEnvArm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED
readyForG22h2RepublishDryRunPlanning: true
implementationExecuted: false
saveExecuted: false
dbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
publicReflectionExecuted: false
ftpUploadExecuted: false
productionApplyExecuted: false
physicalDeleteImplemented: false
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Plan a safe **republish** path for Gosaki Schedule operator UI: set `published=false` → `published=true` on an existing row via a **single-field UPDATE**, mirroring the proven G-22f unpublish slice but inverted.

**This phase:** read existing unpublish implementation, define republish semantics, safety gates, UI flow, target candidates, future slices, and high-risk boundaries. **No code changes, no Save, no SQL mutation.**

---

## 2. Republish definition

| Property | Value |
| --- | --- |
| Operation | **UPDATE** on `public.schedules` |
| Field change | `published`: `false` → `true` only |
| Content fields | **unchanged** (title, date, venue, times, price, description, etc.) |
| INSERT | **no** |
| Physical DELETE | **no** |
| `updated_at` | Changes via existing DB trigger (`schedules_set_updated_at`) on UPDATE |
| Public site visibility | **Not automatic** — row becomes *eligible* for public read after republish; static pages update only after separate **public reflection / package / FTP** phase |
| Operator meaning |「再公開」— undo unpublish visibility in DB, not restore deleted data |

**Dry-run preview:** `actualWrite=false`, `wouldUpdate=true`, `wouldDelete=false`, `physicalDelete=false`, payload `{ published: true }`.

**Non-dry-run Save:** `actualWrite=true` only with dedicated **approvalId + env arm + dry-run success + optimistic lock**.

---

## 3. Relationship to unpublish (G-22f)

| Aspect | Unpublish (G-22f) | Republish (G-22h) |
| --- | --- | --- |
| Direction | `published true → false` | `published false → true` |
| Precondition | `target.published === true` | `target.published === false` |
| Payload | `{ published: false }` | `{ published: true }` |
| UI mode | `editDraftMode === "unpublish"` | **new** `editDraftMode === "republish"` (proposed) |
| approvalId (Save) | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` | `G-22h-gosaki-schedule-republish-update-non-dry-run-slice` (proposed) |
| dry-run approvalId | `G-22f-gosaki-schedule-unpublish-dry-run` | `G-22h-gosaki-schedule-republish-dry-run` (proposed) |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED` | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED` (proposed) |
| G-22f5 executed on 008 | **yes — closed, re-Save forbidden** | Republish is **separate slice** with new approval |
| Public reflection | Not executed at unpublish | **Still separate** at republish |

Unpublish chain closure explicitly deferred republish to a separate phase ([gosaki-schedule-unpublish-update-closure.md](./gosaki-schedule-unpublish-update-closure.md) §Out of scope).

---

## 4. Existing implementation inventory (read-only — G-22f)

### 4.1 Modules (reuse pattern)

| Layer | File | Role |
| --- | --- | --- |
| Dry-run | `gosaki-schedule-unpublish-dry-run.ts` | `executeG22fScheduleUnpublishDryRun`, `validateG22fUnpublishDryRunTarget`, `buildGosakiScheduleUnpublishDraft` |
| Dry-run adapter | `schedule-dry-run-adapter.ts` | `buildScheduleUnpublishDryRunResult()` — payload assembly |
| Config | `gosaki-schedule-unpublish-update-config.ts` | env arm stack, host/project gates, `evaluateG22fUnpublishUpdateUiGate` |
| Guards | `gosaki-schedule-unpublish-update-guards.ts` | payload-only assert, protected rows, `collectG22fUnpublishUpdateGuardFailures` |
| Save | `gosaki-schedule-unpublish-update-save.ts` | `executeG22fScheduleUnpublishUpdateSave` → `updateScheduleWrite` |
| Write adapter | `schedule-write-adapter.ts` | `updateScheduleWrite` (shared UPDATE path) |
| Optimistic lock | `schedule-general-update-trigger.ts` | `buildScheduleLockedWriteRequest` + `expectedBeforeUpdatedAt` |
| Types | `schedule-write-types.ts` | `G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID` |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` | unpublish draft mode, dry-run preview, Save gate, target panel |
| Procedure hints | G-22g2 | Step flow, preview vs DB write copy |

### 4.2 Reusable as-is (with mutual-exclusion wiring)

| Component | Reuse |
| --- | --- |
| `updateScheduleWrite` | **yes** — same UPDATE adapter |
| Optimistic lock (`expectedBeforeUpdatedAt`) | **yes** — required |
| Staging host / project allowlist gates | **yes** |
| Auth session (`getStagingSupabaseClient`, signed-in check) | **yes** |
| Save outcome shape (before/after record, guardReasons) | **yes** — mirror G-22f |
| Operator target panel / workflow steps (G-22g1c / G-22g2) | **yes** — new operation kind `republish` |
| Authenticated admin read (G-22g1f) | **yes** — lists unpublished rows for selection |
| Dry-run first / Save once / no double-click UX (G-22g2) | **yes** |

### 4.3 Must be dedicated (do not reuse unpublish modules directly)

| Concern | Republish-specific |
| --- | --- |
| Operation id | `operation: "republish"` (not `"unpublish"`) |
| Draft mode | `editDraftMode === "republish"` |
| Target validation | `published === false` required; error if already published |
| Payload guard | `{ published: true }` only — `assertG22hRepublishUpdatePayloadOnly` |
| before / after preview | `before.published=false`, `after.published=true` |
| approvalId registry | **New** `G-22h-gosaki-schedule-republish-update-non-dry-run-slice` |
| dry-run approvalId | **New** `G-22h-gosaki-schedule-republish-dry-run` |
| env arm | **New** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED` |
| UI gate | `evaluateG22hRepublishUpdateUiGate` — inverse of G-22f |
| Protected-row policy | **Revisit** — see §7 (inverse of unpublish block list) |
| Mutual exclusion | G-22f arm off when G-22h armed; G-22d/e/G-9k arms off |
| Button labels |「再公開案を作成」「再公開を保存」|
| Procedure hints card | New `data-gosaki-procedure-hint="republish"` |

**Do not** extend G-22f guards to accept both directions — separate modules prevent accidental wrong-direction Save.

---

## 5. Safety design

### 5.1 Target identification (fixed at Save time)

| Field | Requirement |
| --- | --- |
| `id` | Required — primary target key |
| `legacy_id` | Required — operator-visible confirmation |
| `site_slug` | Must be `gosaki-piano` |
| `expectedBeforeUpdatedAt` | Required — optimistic lock baseline from row before Save |
| `published` (before) | Must be **`false`** at dry-run and Save |

### 5.2 Payload policy

```txt
allowed keys: published only
value: published: true
forbidden: title, date, venue, open_time, start_time, price, description, updated_at in patch
wouldDelete: false
physicalDelete: false
```

### 5.3 Gate stack (non-dry-run Save)

Same class as G-22f / G-22d / G-22e:

- `ENABLE_ADMIN_STAGING_SHELL=true`
- `ENABLE_ADMIN_STAGING_WRITE=true`
- `ENABLE_ADMIN_STAGING_AUTH=true`
- `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
- `PUBLIC_ADMIN_WRITE_MODULE=schedule`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22h-gosaki-schedule-republish-update-non-dry-run-slice`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true`
- All other write arms **false** (G-22f, G-22d, G-22e, G-9k, G-13c, etc.)
- Staging Supabase host = `kmjqppxjdnwwrtaeqjta`
- Operator signed in
- Republish dry-run **success** immediately before Save
- Save **once** per approval ID — re-Save forbidden after closure

### 5.4 Failure handling

| Failure | Behavior |
| --- | --- |
| Optimistic lock stale | Save blocked; operator re-fetches row, re-runs「変更を確認」 |
| `published` already true | Dry-run error — no Save path |
| Guard / validation errors | Save disabled; show guardReasons |
| Partial / ambiguous write outcome | Stop; record incident; no auto-retry |
| Rollback | **Document SQL only** — operator executes manually if needed; **no auto rollback** |

Example rollback SQL template (staging only — **not executed in planning**):

```sql
-- Rollback republish on schedule-YYYY-MM-NNN (staging only — execute only with explicit approval)
-- UPDATE public.schedules
-- SET published = false
-- WHERE id = '<uuid>' AND site_slug = 'gosaki-piano' AND legacy_id = '<legacy_id>';
```

### 5.5 Protected rows policy (republish-specific)

G-22f **blocked** unpublish on closed test rows `014` / `001` (already unpublished).

For republish, those rows **are** valid `published=false` candidates. Policy options:

| Policy | Recommendation |
| --- | --- |
| Block 014 / 001 republish always | Too strict — prevents testing republish path on known test rows |
| Allow 014 / 001 for **dry-run QA only** | **Recommended for module smoke** |
| Allow 014 / 001 for **actual Save** only with separate approval + note public-eligible after reflection | Acceptable for **technical slice** if public reflection deferred |
| Block 008 without explicit operator approval ID | **Recommended for first actual Save** — use dedicated preflight |

---

## 6. UI flow (proposed)

Mirror unpublish + G-22g2 procedure hints:

1. **Login** — authenticated admin read loads unpublished rows
2. **Filter** —「非公開のみ」+ optional `legacy_id` keyword
3. **Select row** — selected summary shows id / legacy_id / published=false / updated_at
4. **「再公開案を作成」** — enters `republish` draft mode (read-only form; source row snapshot)
5. **「変更を確認」** — dry-run preview: `actualWrite=false`, published false→true, target identity panel
6. **Target panel** — id, legacy_id, date, title, published before→after, expectedBeforeUpdatedAt
7. **「再公開を保存」** — enabled only when write-armed + gates pass (default **disabled**)
8. **After Save** — refresh list/banner; row moves to published filter; **note:** public site unchanged until reflection phase
9. **Copy:**「公開サイトへの反映は別フェーズ（再生成・アップロード）です」

**Mutual exclusion:** republish mode disables unpublish / duplicate / new-event / existing-update Save paths.

---

## 7. Candidate target comparison

Planning does **not** fix the final non-dry-run target. Comparison for later preflight:

| Candidate | id | legacy_id | published | Pros | Cons / risk |
| --- | --- | --- | --- | --- | --- |
| **A. schedule-2026-07-008** | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | `schedule-2026-07-008` | `false` | Semantically reverses G-22f unpublish; real operator workflow; date 2026-07-17 | Near-production content (`title: <>`); **requires explicit operator approval**; public-eligible after reflection |
| **B. schedule-2026-03-014** | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `schedule-2026-03-014` | `false` | G-22d duplicate **test row**; isolated; good for **technical** UPDATE slice | Republish → **public eligible**; duplicate test content may appear on staging public site after reflection |
| **C. schedule-2026-09-001** | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `schedule-2026-09-001` | `false` | G-22e new-event **test row**; isolated | Republish → test event **public eligible**; may confuse staging preview |

**Known baseline (008):** `updated_at: 2026-07-06T13:58:41.425402+00:00` (re-fetch before any Save phase).

### 7.1 Recommended target strategy

| Phase | Recommended target | Reason |
| --- | --- | --- |
| Dry-run module / UI dev | **Any** `published=false` row or fixture | No DB write |
| Read-only QA (G-22h4) | HTML + module smoke on fixtures | No Save |
| First **actual** non-dry-run slice | **008** with **dedicated operator approval** | Closes G-22f ↔ republish loop on real row; aligns with operator need |
| Alternative first Save (lower business impact) | **014** or **001** | If operator prefers test row first — **only if public reflection remains deferred** |

**Avoid without approval:** republishing multiple rows in one session; republish while G-22f arm enabled; republish without fresh `expectedBeforeUpdatedAt`.

---

## 8. High-risk gate map

| Layer | Risk | Gate |
| --- | --- | --- |
| **G-22h1 Planning** | Low | This doc only — **complete** |
| **G-22h2–h3 Implementation** | Medium | Code review + verifiers; default Save disabled |
| **G-22h4 Read-only QA** | Low | dry-run dev; no Save |
| **G-22h5 Preflight / target selection** | Medium | beforeSnapshot / afterVerification SQL templates |
| **G-22h6 Actual UPDATE** | **HIGH** | Explicit operator approval form; write-armed env; single Save; optimistic lock |
| **Public reflection / package** | **HIGH** | Separate approval; FTP apply still suspended (G-7f) |
| **FTP / production** | **CRITICAL** | Never without new preflight + explicit approval |

Republish DB UPDATE and public reflection must **never** be combined in one approval.

---

## 9. Future implementation slices (proposed)

| Phase | Focus | Save / DB |
| --- | --- | --- |
| **G-22h1** | Planning (this doc) | **no** |
| **G-22h2** | Republish dry-run module + UI planning / design | **no** |
| **G-22h3** | Implementation: dry-run module, config, guards, save module, UI wiring, approvalId registry | **no** (Save disabled by default) |
| **G-22h4** | Read-only QA — dry-run dev, module smoke, HTML markers | **no** |
| **G-22h5** | Non-dry-run target selection — preflight, beforeSnapshot, rollback SQL doc | **no** |
| **G-22h6** | Actual republish UPDATE — operator Save **once** | **yes** (single slice) |
| **G-22h7** | Result closure — afterVerification, re-Save forbidden, chain doc | **no** (record only) |

Optional parallel track (not part of G-22h chain):

- **Public reflection planning** — when/how to regen static schedule pages after republish
- **Schedule P0 release readiness review**

---

## 10. Safety — this planning phase

| Item | Status |
| --- | --- |
| Save executed | **false** |
| DB write | **false** |
| SQL INSERT/UPDATE/DELETE/UPSERT | **false** |
| rollback SQL executed | **false** |
| GRANT / REVOKE | **false** |
| RLS policy change | **false** |
| service_role | **not used** |
| package regen | **false** |
| FTP / upload / deploy | **false** |
| public reflection | **false** |
| production apply | **false** |
| Implementation files changed | **false** |

---

## 11. Next phase candidates

1. **G-22h2** — republish dry-run UI / module planning
2. **G-22h3** — republish implementation (modules + UI; Save disabled)
3. **Public reflection planning** — separate from DB UPDATE
4. **Schedule P0 release readiness review**
5. **physical DELETE planning** — deferred / 後回し

---

## 12. Reference docs

| Doc | Phase |
| --- | --- |
| `gosaki-schedule-unpublish-update-planning.md` | G-22f2 pattern |
| `gosaki-schedule-unpublish-update-closure.md` | G-22f7 — deferred republish |
| `gosaki-schedule-p0-ux-summary.md` | G-22g2b — operator UX baseline |
| `gosaki-schedule-authenticated-admin-read-closure.md` | G-22g1f3 — unpublished row visibility |
