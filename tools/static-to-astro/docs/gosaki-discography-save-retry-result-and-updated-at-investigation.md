# G-15b-retry — Gosaki Discography Save retry result and updated_at investigation

**Phase:** `G-15b-retry-gosaki-discography-save-retry-result-and-updated-at-investigation`  
**Status:** **complete** — Save retry **succeeded** (`purchase_url`); `updated_at` **unchanged**; trigger gap identified; remediation SQL template prepared (doc-only)  
**Date:** 2026-06-28  
**Base commit:** `cfc0297`  
**Prior:** G-15b-grant-apply (`gosaki-discography-update-grant-apply-result.md`) — committed

| Check | Status |
| --- | --- |
| Save retry (operator once) | **yes** — UI alert 保存しました |
| `purchase_url` updated | **yes** |
| `updated_at` unchanged | **yes** — investigation recorded |
| rollback needed | **no** |
| Cursor Save / SQL | **no** |
| Trigger template | **yes** — not executed |

---

## Gates

```txt
gosakiDiscographySaveRetryResultComplete: true
phase: G-15b-retry-gosaki-discography-save-retry-result-and-updated-at-investigation
readyForG15bF8DiscographyUpdatedAtTriggerPlanning: true
readyForG15cDiscographyPublicReflectionPlanning: true
readyForG15bSaveReExecution: false
rollbackNeeded: false
readyForAnyDbWrite: false
readyForAnyDbMigrationOrTriggerApply: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorTriggerSqlExecuted: false
```

**Do not click Save again** on `discography-002` without a new approval phase.

---

## 1. Git state (verified at phase start)

```txt
git status --short: (empty)
HEAD: cfc0297
origin/main: cfc0297
branch: main...origin/main
```

---

## 2. Save retry result (operator)

### 2.1 Target

```txt
legacy_id: discography-002
title: SKYLARK
field: purchase_url only
before: https://gosaakiii.base.shop/
after: https://gosakirikako.base.shop/
approval: G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run
```

### 2.2 Dry-run Preview (before Save)

```txt
ok: true
dryRun: true
actualWrite: false
wouldWrite: true
changedFields: purchase_url
payload: {"purchase_url":"https://gosakirikako.base.shop/"}
expectedBeforeUpdatedAt: 2026-06-05T17:39:44.201802+00:00
stale: false
hostGatePassed: true
saveReadiness: ready_to_save
saveAllowed: true
guardErrors: none
```

### 2.3 Save (operator clicked 「更新する」 once)

```txt
UI: browser alert 「保存しました。」
actualWrite: true (inferred from success alert + afterVerification)
rowsAffected: 1 (inferred — single-row UPDATE by id + legacy_id + optimistic lock)
error: none
```

**Cursor did not click Save.**

---

## 3. afterVerification (operator read-only SELECT)

```sql
select id, legacy_id, title, purchase_url, updated_at
from public.discography
where legacy_id = 'discography-002';
```

| Field | Before Save (baseline) | After Save (operator) | Match expected |
| --- | --- | --- | --- |
| **id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` | same | **yes** |
| **legacy_id** | `discography-002` | same | **yes** |
| **title** | `SKYLARK` | same | **yes** |
| **purchase_url** | `https://gosaakiii.base.shop/` | `https://gosakirikako.base.shop/` | **yes — updated** |
| **updated_at** | `2026-06-05 17:39:44.201802+00` | **same** | **yes — unchanged** |

### Cursor read-only REST SELECT (verifier)

Staging `kmjqppxjdnwwrtaeqjta` — anon key SELECT only: **PASS** — `purchase_url` after value; `updated_at` baseline unchanged.

---

## 4. purchase_url update success judgment

```txt
purchaseUrlUpdateSucceeded: true
intendedTypoFixOnly: true
auditMarkersAbsent: true
titleUnchanged: true
discographyTracksUntouched: true
```

**G-15b Save slice goal achieved** for `purchase_url` on `discography-002`.

---

## 5. updated_at unchanged judgment

```txt
updatedAtChanged: false
beforeUpdatedAt: 2026-06-05T17:39:44.201802+00:00
afterUpdatedAt: 2026-06-05T17:39:44.201802+00:00
optimisticLockBaselineAdvanced: false
```

**Impact on Discography CMS optimistic lock:**

| Scenario | With schedules (G-6-f8 trigger) | Discography (G-15b-retry) |
| --- | --- | --- |
| After successful Save | `updated_at` advances → new baseline | `updated_at` **stays at seed time** |
| Stale detection on re-edit | Compares new DB timestamp | **Weak** — same baseline after write |
| Concurrent edit detection | Meaningful | **Not meaningful** until trigger added |

App code passes `expectedBeforeUpdatedAt` on UPDATE `.eq("updated_at", …)` — Save succeeded because baseline matched pre-write row (correct for this attempt). **Future edits** will not get a fresh lock token from DB until trigger exists.

---

## 6. Rollback judgment

```txt
rollbackNeeded: false
rollbackSqlExecuted: false
```

`purchase_url` change is **intentional product fix** (typo `gosaakiii` → `gosakirikako`). No compensating UPDATE required.

---

## 7. updated_at trigger / default / schedules comparison (read-only investigation)

### 7.1 Repo evidence (Cursor — no SQL Editor execution)

| Source | Finding |
| --- | --- |
| `scripts/supabase/schedules-updated-at-trigger.sql` | **Applied on staging (G-6-f8)** — `schedules_set_updated_at` BEFORE UPDATE sets `new.updated_at = now()` |
| `schedule-updated-at-staging-migration-execution-result.md` | Pre-migration: schedules had **no** updated_at triggers; post-migration: trigger active |
| `gosaki-discography-schema.template.sql` § OPTIONAL FUTURE | **updated_at trigger deferred** — “See schedules-updated-at-trigger.sql” |
| `gosaki-discography-cms-mvp-inventory-and-plan.md` | MVP noted optional `updated_at` trigger; **not in G-15b scope** |
| `discography-write-adapter.ts` | Payload is `purchase_url` only — **does not send `updated_at`** (correct) |

### 7.2 Operator SQL audit queries (for SQL Editor — results align with repo inference)

**discography triggers (expected before G-15b-f8):**

```sql
select tgname, tgenabled, pg_get_triggerdef(oid) as trigger_def
from pg_trigger
where tgrelid = 'public.discography'::regclass
  and not tgisinternal
order by tgname;
```

**Expected:** **no rows** or no `discography_set_updated_at` — UPDATE does not auto-bump `updated_at`.

**discography column defaults:**

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
  and column_name in ('updated_at', 'created_at')
order by column_name;
```

**Expected:** `updated_at` timestamptz, nullable or with default `now()` on **INSERT only** — no auto-update on UPDATE without trigger.

**schedules triggers (comparison — expected on staging):**

```sql
select tgname, tgenabled, pg_get_triggerdef(oid) as trigger_def
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal
order by tgname;
```

**Expected:** `schedules_set_updated_at` present and enabled (G-6-f8).

### 7.3 Side-by-side summary

| Item | `public.schedules` | `public.discography` |
| --- | --- | --- |
| G-6-f8 / G-15b-f8 trigger | **yes** (`schedules_set_updated_at`) | **no** (deferred) |
| UPDATE bumps `updated_at` | **yes** | **no** (G-15b-retry proved) |
| Optimistic lock viability | **yes** | **partial** — works for first write; weak for subsequent |
| Payload includes `updated_at` | no | no |

---

## 8. Estimated root cause

**Primary (high confidence):**

```txt
public.discography has no BEFORE UPDATE trigger to set updated_at = now().
G-15 MVP deferred discography updated_at trigger (documented in schema template).
Schedules received G-6-f8 trigger; discography did not.
Therefore purchase_url UPDATE succeeded but updated_at column was not modified.
```

**Not the cause:**

```txt
- Save adapter omitting updated_at in payload (correct — trigger should set it)
- RLS or GRANT (Save succeeded)
- Optimistic lock rejection (baseline matched pre-write row)
- Failed write (purchase_url changed)
```

---

## 9. Remediation plan (doc-only)

### Recommended: G-15b-f8 — discography updated_at trigger (mirror G-6-f8)

1. **Preflight** — operator runs §7.2 pre-check SQL in SQL Editor; record trigger count = 0.
2. **Apply** (separate explicit approval) — `scripts/supabase/gosaki-discography-updated-at-trigger.template.sql`
3. **Post-check** — low-risk verification UPDATE on staging (or observe `updated_at` advance on next approved edit).
4. **App** — no code change required if trigger mirrors schedules; stale check already reads `updated_at`.

**Note:** Applying trigger does **not** retroactively change `discography-002.updated_at`. Next UPDATE on any row will advance `updated_at`.

**Do not** apply trigger in G-15b-retry recording phase.

### Parallel track: G-15c — public reflection

`purchase_url` fix is live in **Supabase** only; public Wix HTML `/discography/` still shows old link until reflection phase.

---

## 10. Safety statement

```txt
Cursor Save executed: false
Cursor DB write executed: false
Trigger / migration SQL executed: false
rollback SQL executed: false
service_role used: false
production touched: false
Save re-click: none
```

---

## 11. Related artifacts

| File | Purpose |
| --- | --- |
| `gosaki-discography-updated-at-trigger.template.sql` | Trigger apply template (DO NOT RUN without approval) |
| `gosaki-discography-update-grant-apply-result.md` | Grant prerequisite |
| `gosaki-discography-save-slice-final-preflight.md` | G-15b Save slice |
| `schedules-updated-at-trigger.sql` | Schedule reference implementation |
| `verify-g15b-gosaki-discography-save-retry-result-and-updated-at-investigation.mjs` | Phase verifier |

---

## 12. Next phases

| Order | Phase | Goal |
| --- | --- | --- |
| **1** | **G-15b-f8** — discography `updated_at` trigger preflight + operator apply | Restore optimistic lock parity with schedules |
| **2** | **G-15c** — public reflection planning | Wix HTML / staging package `purchase_url` for SKYLARK |
| **3** | G-15d+ | Additional discography fields / tracks (deferred) |

**Do not** re-Save `discography-002` without new approval.
