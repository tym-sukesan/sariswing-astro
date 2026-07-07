# G-22h5 — Gosaki Schedule republish target selection / preflight

**Phase:** `G-22h5-gosaki-schedule-republish-target-preflight`  
**Status:** **complete** — target selection + read-only preflight record only; **no Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `92eaf55`  
**Prior:** [gosaki-schedule-republish-ui-wording-cleanup.md](./gosaki-schedule-republish-ui-wording-cleanup.md) (G-22h4b) · [gosaki-schedule-republish-dry-run-readonly-qa.md](./gosaki-schedule-republish-dry-run-readonly-qa.md) (G-22h4)

| Check | Status |
| --- | --- |
| Target selection recorded | **yes** |
| Preflight verification recorded | **yes** |
| SELECT-only SQL template | **yes** |
| G-22h6 first candidate fixed | **yes** — `schedule-2026-07-008` |
| Save / UPDATE executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleRepublishTargetPreflightComplete: true
phase: G-22h5-gosaki-schedule-republish-target-preflight
selectedTargetCandidateLegacyId: schedule-2026-07-008
selectedTargetCandidateId: 3e572f02-4f35-460e-80a1-3a7d15ca3fd9
expectedBeforeUpdatedAtG22h6: 2026-07-06T13:58:41.425402+00:00
beforeVerificationPass: true
readyForG22h6RepublishUpdateImplementation: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**approvalId (G-22h6):** `G-22h-gosaki-schedule-republish-update-non-dry-run-slice`

**This is NOT physical DELETE.** Slice is `published=false` → `published=true` UPDATE only.

---

## 1. Purpose

Before G-22h6 actual republish UPDATE, select **one** target row, confirm current DB state read-only, and record `expectedBeforeUpdatedAt` for optimistic lock. **Preflight / record only** — no Save, no SQL mutation, no implementation file changes.

---

## 2. Target selection policy

| Rule | Detail |
| --- | --- |
| Eligible rows | `site_slug = 'gosaki-piano'` AND `published = false` |
| G-22h6 first candidate | **`schedule-2026-07-008`** (preflight candidate — operator re-approves before Save) |
| Reference rows (non-target) | `schedule-2026-03-014`, `schedule-2026-09-001` |
| Selection authority | Documented recommendation in G-22h5; **operator final approval** required at G-22h6 |
| Slice | Single UPDATE: `published` only; row **not** deleted |

---

## 3. Target candidate comparison

| legacy_id | id | Role | G-22h6 first candidate? | Notes |
| --- | --- | --- | --- | --- |
| `schedule-2026-07-008` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | G-22f unpublish row | **yes (recommended)** | Closes unpublish→republish verification loop; G-22h4 dry-run QA PASS |
| `schedule-2026-03-014` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | G-22d duplicate test | **no** | Republish would make duplicate test row public-eligible |
| `schedule-2026-09-001` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | G-22e new event test | **no** | Republish would make test event public-eligible |

### Why `schedule-2026-07-008` as G-22h6 first candidate

1. **Verification loop:** G-22f unpublish UPDATE succeeded on this row; republish inverts that slice cleanly.
2. **Test row isolation:** Avoids publishing G-22d duplicate or G-22e new-event test rows.
3. **Dry-run proven:** G-22h4 operator login QA confirmed republish preview on this row.
4. **Public reflection deferred:** Even after G-22h6 DB republish, static site / FTP remain a **separate high-risk gate** — row becomes DB-eligible only.

**Do not re-Save unpublish on 008** (G-22f7 closed). **Do not re-Save duplicate / new-event INSERT** on 014 / 001 (G-22d3d / G-22e7 closed).

---

## 4. Preflight method

| Step | Actor | Detail |
| --- | --- | --- |
| 1 | Cursor | Read-only Supabase JS `.select()` via **anon** key on staging `kmjqppxjdnwwrtaeqjta` — **0 rows** (RLS hides `published=false` rows; expected) |
| 2 | Cursor | **No** `service_role`; **no** admin credentials in env; **no** SQL mutation |
| 3 | Doc chain | Cross-check target + reference rows against G-22f6 afterVerification + G-22h4 operator dry-run + G-22d/e execution records |
| 4 | Operator (G-22h6) | Re-run **§5 SELECT SQL** immediately before Save for fresh `updated_at` (optimistic lock) |

**SQL script:** `tools/static-to-astro/scripts/supabase/gosaki-schedule-g22h5-republish-target-preflight-check.sql`

---

## 5. Preflight SELECT SQL (SELECT only)

**Project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` ONLY.  
**Do not run on Sariswing production.** Cursor anon API attempt returned 0 rows; operator authenticated SELECT recommended before G-22h6.

```sql
-- G-22h5 republish target preflight — SELECT ONLY
-- See: tools/static-to-astro/scripts/supabase/gosaki-schedule-g22h5-republish-target-preflight-check.sql

select
  id,
  legacy_id,
  site_slug,
  date,
  title,
  published,
  updated_at,
  source_route,
  source_file,
  sort_order
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id in (
    'schedule-2026-07-008',
    'schedule-2026-03-014',
    'schedule-2026-09-001'
  )
order by legacy_id asc;
```

---

## 6. Preflight verification record (read-only chain)

Verified via G-22f6 afterVerification + G-22h4 operator dry-run preview + protected-row execution docs. **No writes since G-22f7 / G-22h4.**

### Selected target — `schedule-2026-07-008` — **PASS**

| Field | Value | Source |
| --- | --- | --- |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | G-22f6 / G-22h4 |
| `legacy_id` | `schedule-2026-07-008` | G-22f6 / G-22h4 |
| `site_slug` | `gosaki-piano` | G-22f6 |
| `date` | `2026-07-17` | G-22f6 / G-22h4 |
| `title` | `<>` | G-22f6 / G-22h4 |
| `published` | **`false`** | G-22f6 afterVerification |
| `updated_at` | **`2026-07-06T13:58:41.425402+00:00`** | G-22f6 Save result; reconfirmed G-22h4 dry-run |
| `source_route` | `/schedule/2026-07/` | G-22f6 |
| `source_file` | `schedule-2026-07.html` | G-22f6 |
| `sort_order` | `8` | G-22f6 |

### Reference row — `schedule-2026-03-014` — **PASS (non-target)**

| Field | Value | Notes |
| --- | --- | --- |
| `id` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | G-22d duplicate INSERT |
| `published` | **`false`** | Unchanged since G-22d3c |
| `title` | `<Live & Session>（コピー）` | Duplicate test marker |
| `source_route` | `/schedule/2026-03/` | Expected range |
| `source_file` | `schedule-2026-03.html` | Expected range |
| `sort_order` | `70` | G-22d payload |

**Not G-22h6 target:** republish would publish duplicate test row.

### Reference row — `schedule-2026-09-001` — **PASS (non-target)**

| Field | Value | Notes |
| --- | --- | --- |
| `id` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | G-22e new event INSERT |
| `published` | **`false`** | Unchanged since G-22e6 |
| `title` | `【G-22eテスト】新規追加テストイベント` | Test event marker |
| `source_route` | `/schedule/2026-09/` | Expected range |
| `source_file` | `schedule-2026-09.html` | Expected range |
| `sort_order` | `10` | G-22e payload |

**Not G-22h6 target:** republish would publish new-event test row.

---

## 7. G-22h6 parameters (from preflight)

| Parameter | Value |
| --- | --- |
| **Selected target** | `schedule-2026-07-008` |
| **Target id** | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| **expectedBeforeUpdatedAt** | `2026-07-06T13:58:41.425402+00:00` |
| **Required before** | `published = false` |
| **Required after** | `published = true` |
| **operation** | `republish-update` |
| **Payload** | `{ published: true }` only |
| **actualWrite** | **G-22h6 only** (`false` until Save) |
| **Save** | G-22h6 — operator **once** only |
| **Optimistic lock** | `expectedBeforeUpdatedAt` must match live row at Save; stale → block |
| **env arm** | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true` (G-22h6 only) |

**G-22h6 before Save:** operator re-runs §5 SELECT; refresh `expectedBeforeUpdatedAt` if `updated_at` drifted.

---

## 8. Rollback plan (document only — not executed)

Automatic rollback **forbidden**. If operator explicitly approves rollback after G-22h6:

```sql
-- Rollback republish on schedule-2026-07-008 (staging only — execute only with explicit approval)
-- UPDATE public.schedules
-- SET published = false
-- WHERE id = '3e572f02-4f35-460e-80a1-3a7d15ca3fd9'
--   AND site_slug = 'gosaki-piano'
--   AND legacy_id = 'schedule-2026-07-008'
--   AND published = true;
```

**Not executed in G-22h5.**

---

## 9. Public reflection / package / FTP

| Gate | Status |
| --- | --- |
| Public reflection | **not executed** — separate phase after G-22h6 if approved |
| package regen | **not executed** |
| FTP / upload / deploy | **not executed** |

Republish UPDATE makes row DB-eligible; static Gosaki site unchanged until explicit reflection gate.

---

## 10. Save / DB write — not executed

| Operation | Executed |
| --- | --- |
| Save / 再公開保存 click | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| GRANT / REVOKE / RLS change | **no** |
| `service_role` | **not used** |
| rollback SQL | **not executed** |
| Implementation file changes | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h5-gosaki-schedule-republish-target-preflight.mjs
```

---

## 12. Next phases

| Phase | Scope |
| --- | --- |
| **G-22h6** | Actual republish UPDATE implementation + operator Save once |
| **G-22h7** | Result closure |
| **Separate gate** | Public reflection planning / package / FTP |

---

## 13. Fix required?

**No.** Target candidate `schedule-2026-07-008` selected with read-only preflight PASS. Proceed to **G-22h6** after implementation + operator re-approval + fresh SELECT before Save.
