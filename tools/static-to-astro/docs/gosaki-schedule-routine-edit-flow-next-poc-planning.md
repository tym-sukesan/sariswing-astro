# G-14b1 — Gosaki Schedule CMS routine edit flow next PoC planning

**Phase:** `G-14b1-gosaki-schedule-routine-edit-flow-next-poc-planning`  
**Status:** **complete** — routine edit next PoC planned (doc-only / read-only survey)  
**Date:** 2026-06-28  
**Base commit:** `af21cdf`  
**Prior:** G-13c2e Event B chain closed; G-14b practical flow; G-14c reflection playbook

| Check | Status |
| --- | --- |
| Routine edit implementation surveyed | **yes** |
| G-14b vs code gap documented | **yes** |
| Next PoC event candidates (read-only) | **yes** |
| Field candidates + safe-field policy | **yes** |
| Recommended PoC proposal | **yes** |
| Implementation phases decomposed | **yes** |
| End-to-end future flow documented | **yes** |
| Cursor Save / DB write / FTP / regen | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditFlowNextPocPlanningComplete: true
phase: G-14b1-gosaki-schedule-routine-edit-flow-next-poc-planning
readyForG14b1aRoutineEditSaveEnablementImplementation: true
readyForG14b1bLocalDryRunPreflight: false
readyForG14b1dRoutineEditPocExecution: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorSaveExecuted: false
cursorPreviewExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
cursorFtpExecuted: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all non-dry-run arms off; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-13c1 / G-13c2 は **PoC 文言 cleanup 専用 slice** で、DB + public staging の両方が解消済み。  
本フェーズは **routine Schedule CMS edit flow**（G-14b で定義）の **次 PoC** を設計する。

**Goals:**

- 運用者が picker で任意行を選び、safe field を編集し、**multi-field Save 1回** → **G-14c reflection** まで通す初回 PoC を定義する
- G-13 cleanup slice との違いを固定し、実装フェーズを分解する
- 小さく rollback しやすい対象イベント・フィールドを read-only で選定する

**Out of scope (this phase):** implementation, UI change, Save, Preview click, DB write, package regen, FTP, commit.

---

## 2. Current routine Schedule CMS implementation status

### 2.1 What exists (G-9k product path — code complete, Save gated off)

| Layer | Module / route | Status |
| --- | --- | --- |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` | Row picker, filters, 6-field edit form, dry-run + Save wiring |
| Dry-run | `gosaki-schedule-existing-event-save-button-dry-run.ts` | Preview gate; `changedFields`, stale check |
| Save executor | `gosaki-schedule-existing-event-save-button-save.ts` | Multi-field UPDATE; optimistic lock; `afterSnapshot` |
| Guards | `gosaki-schedule-existing-event-save-button-guards.ts` | Safe fields only; `rowsAffected === 1` |
| Config / arm | `gosaki-schedule-existing-event-save-button-config.ts` | Env arm stack; **Save default disabled** |
| approval_id | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` | Registered in `schedule-write-types.ts` |
| Write adapter | `schedule-write-adapter.ts` + `buildScheduleLockedWriteRequest` | Staging anon + auth session |
| Public read | Gosaki convert + `scheduleDataSource=supabase` | Proven in G-13e / G-13c2e |
| Reflection playbook | `gosaki-public-reflection-operation-standardization.md` | Proven twice (Event A + B cleanup) |

### 2.2 What G-14b defines but is not yet “routine-ready”

| G-14b target | Current code state | Gap |
| --- | --- | --- |
| Routine multi-field Save via picker | G-9k path exists; **never executed as routine PoC** | Save compile gate off; heavy env stack |
| Simplified practical arm | G-14b §10 proposes `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` | **Not implemented** — still `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| PoC audit rows excluded from routine ops | `isPocAuditScheduleRow()` in row-picker-utils | Event B (`aa440e29…`) **still hard-excluded** via `G9G1_TARGET_ROW_ID` even after G-13c2 cleanup |
| 1 Save = multi-field (practical) | Code supports multi-field | G-9k6 per-field slices **frozen** — must not reuse |
| Public reflection after routine edit | G-14c playbook ready | **No routine-edit reflection chain yet** |
| Online admin parity | Same G-9k UI in package | First test recommended on **local shell** (G-14b §5) |

### 2.3 Frozen / parallel paths (do not use for routine PoC)

| Path | Trait | Routine use |
| --- | --- | --- |
| G-13c1 Event A cleanup | Fixed row + hardcoded expected values | **No** — closed |
| G-13c2 Event B cleanup | Fixed row + null-field cleanup | **No** — closed |
| G-9k6 per-field slices | 1 Save = 1 field on Event A | **No** — frozen |
| G-9g3* / G-9g4a* PoC arms | Pilot row / single-field framework | **No** — disarmed |
| G-6-g1/g2 Sariswing slices | Legacy staging shell sections | **No** |

---

## 3. G-13 cleanup slice vs routine edit flow

| Aspect | G-13c1 / G-13c2 cleanup | G-14b routine edit (next PoC) |
| --- | --- | --- |
| **Intent** | Remove PoC / test text; restore known-good values | Operator edits content for real staging use |
| **Row selection** | Hardcoded `TARGET_ROW_ID` | **Picker** — any non-audit row |
| **Field values** | Constants in cleanup config | **Operator form input** |
| **approval_id** | `G-13c1-…` / `G-13c2-…` | **`G-9k-gosaki-schedule-existing-event-save-button-non-dry-run`** |
| **Env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C1_*` / `G13C2_*` | G-9k arm (+ G-14b1 practical alias — impl) |
| **Fields per Save** | Cleanup bundle (6 fields) | **1–6 safe fields** as changed in form |
| **UI surface** | Dedicated cleanup panel below workspace | Operator edit form + 「変更を確認」/「更新する」 |
| **Reflection** | Minimal month HTML (proven) | Same G-14c playbook |
| **Re-execution** | **Forbidden** (one-off) | **Allowed** with fresh Preview each time |
| **Post-G-13 state** | Event A + B DB + public **clean** | Clean baseline for **new** routine PoC row |

---

## 4. Next PoC event candidates (read-only survey)

**Sources:** G-13b public HTTP scan (2026-06-26); `gosaki-schedules-seed.template.sql`; G-13c1/G-13c2 closure docs.  
**No live DB SELECT in this phase** — UUIDs resolved in **G-14b1c final preflight** via read-only anon SELECT by `legacy_id`.

### 4.1 Excluded from routine PoC (policy)

| Row | legacy_id | date | Reason |
| --- | --- | --- | --- |
| `aa440e29-5be8-402e-9190-0d81c48434c0` | `schedule-2026-07-010` | 2026-07-19 | G-13c2 cleanup closed; `G9G1_TARGET_ROW_ID` audit exclusion; July HTML just re-uploaded |
| `f687ebf3-407c-49d0-9ab8-58040c499b8e` | `schedule-2026-03-007` | 2026-03-15 | G-13c1 cleanup closed; heavy G-9k6 history; March HTML reflected — **defer** for first routine PoC |

### 4.2 Primary candidates (April–June — G-13b: no public PoC markers)

| Rank | legacy_id | date | title (seed) | venue | show_on_home | Public month scan |
| --- | --- | --- | --- | --- | --- | --- |
| **1 ★** | `schedule-2026-04-005` | 2026-04-12 | `<Trio>` | 吉祥寺 Strings | false | 2026-04 clean |
| **2** | `schedule-2026-05-001` | 2026-05-03 | `<新谷健介オノマトペ>` | 用賀 キンのツボ | false | 2026-05 clean |
| **3** | `schedule-2026-06-001` | 2026-06-02 | `<Trio PEPINO>` | 阿佐ヶ谷 スタッカート | false | 2026-06 clean |
| 4 | `schedule-2026-04-002` | 2026-04-08 | `<Golden PODs〜春の里帰りツアー〜>` | 野毛 Jazz Spot DOLPHY | false | 2026-04 clean |

**★ Rank 1 rationale:**

- Never used for non-dry-run PoC writes
- `show_on_home: false` — lower top-page blast radius
- Full venue / open / start / price / description — realistic edit surface
- Month page `/schedule/2026-04/` — G-13b confirmed no PoC text
- Minimal upload scope: `schedule/2026-04/index.html` only (G-14c pattern)

### 4.3 UUID resolution (deferred to G-14b1c)

```sql
-- read-only preflight (operator or Cursor doc phase only — not executed in G-14b1)
select id, legacy_id, date, title, venue, open_time, start_time, price, description, updated_at
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-04-005';
```

---

## 5. Next PoC field candidates

### 5.1 Safe fields (MVP — in scope)

```txt
title
venue
open_time
start_time
price
description
```

**Out of scope:** `date`, `month`, `published`, `show_on_home`, `legacy_id`, `site_slug`, INSERT, DELETE, `schedule_months`.

### 5.2 Field risk ranking for first routine PoC

| Field | Risk | Routine PoC fit | Notes |
| --- | --- | --- | --- |
| **price** | **Low** | **Best** | Display string; easy visual verify on month card |
| **open_time** | **Low** | **Good** | Pair with price for 2-field multi-save demo |
| **start_time** | **Low** | **Good** | Same as open_time |
| **venue** | Low | OK | Nullable; visible on card |
| **description** | Low | OK | Multi-line; G-9k first Save used this field |
| **title** | Medium | Defer to 2nd routine PoC | SEO / card heading; G-9g4a2 excluded title from framework |

### 5.3 Proposed edit payloads (staging-only markers)

Use a **single recognizable suffix** for rollback — not `[CMS Kit staging]` (audit marker). Proposed:

```txt
[G-14b1 routine PoC]
```

| Option | Fields | Before (seed) → After (example) |
| --- | --- | --- |
| **A (recommended)** | `price` only | `3,300円(tax in)` → `3,300円(tax in) [G-14b1 routine PoC]` |
| B | `open_time` + `price` | `12:00` → `12:15`; price as Option A |
| C | `description` append | Add one line `※ [G-14b1 routine PoC]` at end |

**Policy:** Option A — **1 event, 1 field** for smallest blast radius; still exercises **routine multi-field Save path** (changedFields length = 1).

---

## 6. Recommended PoC proposal

### G-14b1-routine-poc-1 (recommended)

| Item | Value |
| --- | --- |
| **operation_id** | `gosaki-schedule-routine-edit-poc-1` |
| **approval_id** | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` (existing product path) |
| **New approval_id** | **Not required** for first routine PoC — reuse G-9k |
| **Target legacy_id** | `schedule-2026-04-005` |
| **Target date** | `2026-04-12` |
| **Target month page** | `/schedule/2026-04/` |
| **Fields** | `price` only |
| **Save count** | **1** (multi-field path; 1 changed field) |
| **UI** | Local staging shell operator form (G-9k path) |
| **Reflection** | G-14c minimal — `schedule/2026-04/index.html` × 1 |
| **Rollback** | Doc-only SQL to restore seed `price` (execute only with separate approval) |

**Why not Event A or B:** cleanup chains closed; prefer untouched row for first **routine** proof.

**Prerequisite code (G-14b1a):** optional but recommended — add `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` as alias OR document G-9k env stack; consider post-cleanup picker policy for `G9G1_TARGET_ROW_ID` (Event B re-enable for routine — **not** needed if using April row).

---

## 7. Implementation phase decomposition

| Order | Phase | Type | Deliverable |
| --- | --- | --- | --- |
| **1** | **G-14b1** | Planning | This doc + verifier |
| **2** | **G-14b1a** | Implementation | Practical Save enablement: env alias / gate docs; optional picker audit policy tweak; **no Save execution** |
| **3** | **G-14b1b** | Preflight | Local dry-run Preview procedure doc; dev env stack |
| **4** | **G-14b1b-result** | Operator | Preview once; Save **not** clicked |
| **5** | **G-14b1c** | Final preflight | Read-only `beforeSnapshot`; expected after; rollback SQL (doc); Save env stack |
| **6** | **G-14b1d** | Execution | Operator Save **once**; afterVerification |
| **7** | **G-14b1e** | Reflection chain | regen preflight → operator regen → upload preflight → manual upload → HTTP verify → closure |

### G-14b1a implementation scope (preview)

```txt
- Document canonical G-9k / G-14b1 dev env stack (inline env; no .env commit)
- Optional: PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED maps to G-9k arm
- Optional: register G-14b1-routine-poc-1 target legacy_id in planning verifier only
- Reuse G-9k guards — no new field types
- Do not: re-enable G-13c1/G-13c2/G-9k6 arms
- Do not: Save / Preview click in implementation phase
```

### G-14b1d execution env stack (reference — not started in G-14b1)

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true
G9K_SAVE_BUTTON_SAVE_ENABLED=true
# All G-13c1 / G-13c2 / G-9g* / G-6 arms: OFF
```

---

## 8. Future end-to-end procedure (operator)

```txt
1. Local dev: arm G-14b1 stack (G-14b1c doc)
2. Open /__admin-staging-shell/musician-basic/admin/schedule/
3. Picker: select schedule-2026-04-005 row (2026-04-12 <Trio>)
4. Edit price field only
5. 「変更を確認」— dry-run Preview once
   → dryRun:true, changedFields:["price"], saveReadiness:ready_to_save
6. 「更新する」— Save once (operator)
7. afterVerification: UI afterSnapshot + optional read-only SELECT
8. G-14c Phase 1–3: regen preflight → build-gosaki-staging-admin-package.mjs → local verify
9. Upload scope: schedule/2026-04/index.html only (if CSS hash unchanged)
10. Operator manual FTP overwrite once (approval phrase)
11. HTTP verify: live /schedule/2026-04/ shows new price text
12. Closure doc; routine dev back to PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

---

## 9. Risks and stop conditions

### 9.1 Risks

| Risk | Mitigation |
| --- | --- |
| Wrong Supabase project | Host gate + allowlist; STOP on `vsbvndwuajjhnzpohghh` |
| Stale optimistic lock | Re-Preview after row refresh; no Save |
| Accidental multi-field drift | Preview `changedFields` must be `["price"]` only |
| Upload wrong path | G-14c preflight; remote `/cms-kit-staging/gosaki-piano/schedule/2026-04/index.html` |
| Event B picker confusion | Use April row; defer `G9G1_TARGET_ROW_ID` policy change |
| Reuse frozen G-9k6 Save | New session; G-9k approval only |
| `[CMS Kit staging]` in payload | **Forbidden** — triggers audit exclusion |

### 9.2 Stop conditions (immediate)

```txt
- production / sari-site Supabase host
- changedFields includes forbidden fields or unexpected fields
- saveReadiness !== ready_to_save
- Save errorCode present or rowsAffected !== 1
- afterVerification mismatch
- regen safeForStaticFtp false
- HTTP verify mismatch after upload
- outcome ambiguous → stop, record, ask human
```

**No automatic rollback SQL execution.**

---

## 10. Rollback (doc-only — not executed)

```sql
-- staging only — G-14b1-routine-poc-1 price rollback (if ever needed)
update public.schedules
set price = '3,300円(tax in)'
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-04-005';
-- Re-run afterVerification SELECT; then forward-fix public HTML via G-14c if upload already happened
```

---

## 11. Optional parallel track

| Phase | Purpose |
| --- | --- |
| **G-13f** | Residual PoC text scan (read-only HTTP/DB) — confirm no other `CMS Kit staging` / G-9k6 suffix on public months |
| **G-14a refresh** | Update gap inventory post-G-13c2e |

Neither blocks G-14b1a.

---

## 12. Prohibited operations — not performed (this phase)

| Operation | Executed |
| --- | --- |
| Save / Preview click | **no** |
| DB write / SQL UPDATE | **no** |
| package regen | **no** |
| FTP / upload / deploy | **no** |
| workflow_dispatch | **no** |
| `.env` / `.env.local` change | **no** |
| `src/pages/admin` change | **no** |
| commit / push | **no** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1-gosaki-schedule-routine-edit-flow-next-poc-planning.mjs
```

---

## 14. Reference index

| Topic | Doc / code |
| --- | --- |
| G-14b routine flow | `gosaki-schedule-cms-practical-editing-flow-definition.md` |
| G-14c reflection | `gosaki-public-reflection-operation-standardization.md` |
| G-13c2e closure | `gosaki-schedule-event-b-public-reflection-closure.md` |
| G-13b scan | `gosaki-schedule-poc-visible-text-cleanup-preflight.md` |
| Seed baseline | `scripts/supabase/gosaki-schedules-seed.template.sql` |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` |
| G-9k Save | `gosaki-schedule-existing-event-save-button-save.ts` |
| Picker audit | `staging-schedule-site-slug-row-picker-utils.ts` |
