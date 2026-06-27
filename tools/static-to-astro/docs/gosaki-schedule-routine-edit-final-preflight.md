# G-14b1c — Gosaki Schedule CMS routine edit final preflight

**Phase:** `G-14b1c-gosaki-schedule-routine-edit-final-preflight`  
**Status:** **complete** — live beforeSnapshot confirmed; Save env stack documented (no Save / Preview in this phase)  
**Date:** 2026-06-28  
**Base commit:** `53b28e9`  
**Prior:** G-14b1b-result (`gosaki-schedule-routine-edit-local-dry-run-preview-result.md`)

| Check | Status |
| --- | --- |
| Staging project confirmed | **yes** — `kmjqppxjdnwwrtaeqjta` |
| beforeSnapshot read-only SELECT | **yes** — 1 row; values match baseline |
| G-9k Save path documented | **yes** |
| G-9g3g excluded | **yes** |
| Save env stack documented | **yes** |
| afterVerification SELECT documented | **yes** |
| Rollback SQL template (doc-only) | **yes** |
| Cursor Preview / Save | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditFinalPreflightComplete: true
phase: G-14b1c-gosaki-schedule-routine-edit-final-preflight
readyForG14b1dRoutineEditPocExecution: true
readyForG14b1ePublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 53b28e9
origin/main: 53b28e9
branch: main...origin/main
```

---

## 2. Purpose

Final checks before the first **G-14b1 routine edit** non-dry-run Save on `schedule-2026-04-005` (`price` field only).

Documents live beforeSnapshot, **G-9k product Save path**, Save env stack, pre-Save G-9k Preview gates, afterVerification SELECT, rollback template (doc-only), and stop conditions.

**Out of scope (this phase):** Preview click, Save click, DB write, rollback SQL execution, package regen, FTP, dev server start.

---

## 3. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
Save path: G-9k operator main UI — not dev-tools G-9g3g
service_role: not used
schedule_months: read-only / derived (not touched)
```

---

## 4. beforeSnapshot — read-only SELECT (executed)

**Method:** Supabase REST `GET /rest/v1/schedules` — anon key only; staging `kmjqppxjdnwwrtaeqjta` only.

**Filters:**

```txt
id = 14230329-dde5-40d6-b9b3-75aefe140daf
site_slug = gosaki-piano
legacy_id = schedule-2026-04-005
```

**Result:** `rowCount = 1` — **PASS**

| Field | Live value (G-14b1c preflight) | Expected | Match |
| --- | --- | --- | --- |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` | same | **yes** |
| **site_slug** | `gosaki-piano` | `gosaki-piano` | **yes** |
| **legacy_id** | `schedule-2026-04-005` | `schedule-2026-04-005` | **yes** |
| **date** | `2026-04-12` | `2026-04-12` | **yes** |
| **title** | `<Trio>` | `<Trio>` | **yes** |
| **venue** | `吉祥寺 Strings` | `吉祥寺 Strings` | **yes** |
| **open_time** | `12:00` | `12:00` | **yes** |
| **start_time** | `13:00` | `13:00` | **yes** |
| **price** | `3,300円(tax in)` | `3,300円(tax in)` | **yes** |
| **show_on_home** | `false` | `false` | **yes** |
| **published** | `true` | `true` | **yes** |
| **updated_at** | `2026-06-16T16:03:41.551792+00:00` | `2026-06-16T16:03:41.551792+00:00` | **yes** |

**description (exact):**

```txt
出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b
会場website: https://www.jazz-strings.com/
```

**PoC / audit marker scan:** **none**

**Reference SQL (operator reconfirm — read-only):**

```sql
select
  id,
  site_slug,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  show_on_home,
  published,
  updated_at
from public.schedules
where id = '14230329-dde5-40d6-b9b3-75aefe140daf'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-04-005';
```

**Optimistic lock baseline for Save:** `updated_at = 2026-06-16T16:03:41.551792+00:00`

---

## 5. Save target and change

| Item | Value |
| --- | --- |
| **operation** | G-14b1-routine-poc-1 Save (first routine edit) |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| **legacy_id** | `schedule-2026-04-005` |
| **date** | `2026-04-12` |
| **site_slug** | `gosaki-piano` |
| **public month page** | `/schedule/2026-04/` |
| **Field changed** | `price` only |
| **before** | `3,300円(tax in)` |
| **after** | `3,300円（税込）` |
| **approval_id** | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |

**Excluded rows (do not select):**

| id | legacy_id | reason |
| --- | --- | --- |
| `f687ebf3-407c-49d0-9ab8-58040c499b8e` | `schedule-2026-03-007` | Event A — G-13c1 cleanup closed |
| `aa440e29-5be8-402e-9190-0d81c48434c0` | `schedule-2026-07-010` | Event B — G-13c2 cleanup closed |

---

## 6. G-9k / G-9g3g UI and Save path

### 6.1 Product path (G-14b1 — use for Save)

| Step | UI surface | Button / control |
| --- | --- | --- |
| Select row | **Operator main UI** (`AdminGosakiStagingScheduleOperatorPage`) | 公演一覧 → **編集する** |
| Dry-run Preview | **Operator main UI** | **`変更を確認`** (`#gosaki-schedule-edit-dry-run-btn`) |
| Save | **Operator main UI** | **`更新する`** (G-9k Save button) |
| `approval_id` | G-9k config | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| Env arm | G-14b1a practical | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=true` |

### 6.2 Do not use (dev-tools / frozen PoC)

| Surface | Button | Why excluded |
| --- | --- | --- |
| `<details>開発者向け詳細</details>` | `Preview G-9 site_slug general edit dry-run` | G-9g1 dev-tools preview — not G-14b1 product Save gate |
| Dev-tools | `Save operational general edit` | G-9g3g frozen operational path |
| G-9g3g | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` | **Not** routine product approval |

**Note:** G-14b1b-result used G-9g1 dev-tools Preview for payload validation. **G-14b1d Save** must use **G-9k operator UI** only. Re-run **G-9k `変更を確認`** immediately before Save (see §9).

---

## 7. Save execution env stack (G-14b1d — not started here)

From repo root. **Do not start dev in this preflight phase.**

Use existing `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (do not print or change).

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED=true \
G9K_SAVE_BUTTON_SAVE_ENABLED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` |
| `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED` | `true` |
| `G9K_SAVE_BUTTON_SAVE_ENABLED` | `true` (runtime Save compile gate — G-14b1a) |

### Explicitly OFF (must remain unset or false)

```txt
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED — unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED — unset
PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED — unset/false
PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED — unset/false
PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED — unset/false
PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED — unset/false
(all G-9j5 / G-6-g* / G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g5 arms — off)
```

**Single-arm policy:** practical arm ON ⇒ legacy G-9k arm + G-9g3g arm + cleanup arms **off**.

### Operator approval phrase (required once per Save session)

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

---

## 8. Operator procedure (G-14b1d — Save once)

| Step | Action |
| --- | --- |
| 1 | Start dev with §7 env stack |
| 2 | Open `/__admin-staging-shell/musician-basic/admin/schedule/` |
| 3 | Sign in to staging admin if prompted |
| 4 | In **Operator main UI** 公演一覧, find `2026-04-12` / `<Trio>` / `吉祥寺 Strings` |
| 5 | Click **編集する** — confirm `schedule-2026-04-005` |
| 6 | Change **料金** only: `3,300円(tax in)` → `3,300円（税込）` |
| 7 | Leave title / venue / times / description **unchanged** |
| 8 | Click **Operator main UI** **`変更を確認`** once — verify §9 gates |
| 9 | **Do not** use dev-tools `Preview G-9 site_slug general edit dry-run` for Save gate |
| 10 | Click **Operator main UI** **`更新する`** once |
| 11 | Record Save result JSON for G-14b1d result doc |
| 12 | Run §10 afterVerification SELECT in Supabase SQL Editor |

**Do not use** G-13c1 / G-13c2 cleanup panels or dev-tools `Save operational general edit`.

---

## 9. Pre-Save G-9k Preview gates (operator must verify)

After **G-9k `変更を確認`** on Operator main UI:

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveReadiness` | `ready_to_save` |
| `changedFields` | `["price"]` only |
| `payload` | `{ "price": "3,300円（税込）" }` |
| `target.id` | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| `target.legacy_id` | `schedule-2026-04-005` |
| `target.site_slug` | `gosaki-piano` |
| `target.date` | `2026-04-12` |
| `expectedBeforeUpdatedAt` | `2026-06-16T16:03:41.551792+00:00` |
| `optimisticLockStale` | `false` |
| `hostGatePassed` | `true` |
| Save button | **enabled** (G-9k gate; not G-9g3g) |

**Abort Save** if any check fails.

---

## 10. afterVerification SELECT (operator — post-Save, read-only)

Run in Supabase SQL Editor (staging project `kmjqppxjdnwwrtaeqjta` only):

```sql
select
  id,
  site_slug,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  show_on_home,
  published,
  updated_at
from public.schedules
where id = '14230329-dde5-40d6-b9b3-75aefe140daf'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-04-005';
```

### Expected after Save

| Field | Expected |
| --- | --- |
| `price` | `3,300円（税込）` |
| `updated_at` | **newer than** `2026-06-16T16:03:41.551792+00:00` |
| `title` | `<Trio>` (unchanged) |
| `venue` | `吉祥寺 Strings` (unchanged) |
| `open_time` | `12:00` (unchanged) |
| `start_time` | `13:00` (unchanged) |
| `description` | unchanged (see §4) |
| `show_on_home` | `false` |
| `published` | `true` |
| `date` | `2026-04-12` |

---

## 11. Rollback SQL template (documented only — **DO NOT EXECUTE**)

**Execution requires separate explicit approval.** Cursor / CI must not run this SQL.

Reverts **price only** to beforeSnapshot. Other safe fields unchanged in this operation.

```sql
-- G-14b1 rollback template — DOCUMENTATION ONLY — operator manual; staging only
-- DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta)
-- Separate approval required if rollback is ever needed

begin;

update public.schedules
set
  price = '3,300円(tax in)'
where id = '14230329-dde5-40d6-b9b3-75aefe140daf'
  and legacy_id = 'schedule-2026-04-005'
  and site_slug = 'gosaki-piano'
  and updated_at = '<operator-captured-after-save-updated_at>';

commit;

-- Post-check: SELECT same row; price should be 3,300円(tax in)
```

Replace `<operator-captured-after-save-updated_at>` with the live `updated_at` from afterVerification if using optimistic predicate.

`updated_at` will advance via `schedules_set_updated_at` trigger on rollback UPDATE.

**Rollback needed policy:** If Save succeeds and afterVerification PASS, rollback is **not expected** for this natural price notation change. Template is for incident recovery only.

---

## 12. Stop conditions (abort — do not Save or stop after ambiguous Save)

| Condition | Action |
| --- | --- |
| Target row mismatch (not `schedule-2026-04-005`) | **Stop** |
| `legacy_id` / `site_slug` / `date` mismatch vs §4 | **Stop** |
| `updated_at` ≠ `2026-06-16T16:03:41.551792+00:00` at Preview time | **Stop** — re-SELECT; document drift |
| `optimisticLockStale` = `true` | **Stop** — refresh; re-Preview |
| `changedFields` includes non-`price` fields | **Stop** |
| Payload price ≠ `3,300円（税込）` | **Stop** |
| Payload contains `[CMS Kit staging]` / `PoC` / `test` | **Stop** |
| G-9g3g Save surface used (`Save operational general edit`) | **Stop** |
| `saveReadiness` ≠ `ready_to_save` before Save | **Stop** |
| `actualWrite` = `false` after Save click | **Stop** — incident |
| Save result ambiguous / network error | **Stop** — no retry without new preflight |
| afterVerification mismatch | **Stop** — consider rollback template with separate approval |
| Supabase host = `vsbvndwuajjhnzpohghh` | **Stop immediately** |
| Event A or Event B row selected | **Stop** |

---

## 13. Next phases

| Phase | Action |
| --- | --- |
| **G-14b1d** | Operator Save once (G-9k `更新する`) + afterVerification + result doc |
| **G-14b1e** | G-14c public reflection (`/schedule/2026-04/`) |

---

## 14. Prohibited operations — not performed

| Operation | Executed |
| --- | --- |
| Preview / Save click (Cursor) | **no** |
| DB write / SQL UPDATE | **no** |
| Rollback SQL execution | **no** |
| package regen / FTP | **no** |
| `.env` modification | **no** |
| commit / push | **no** |

---

## 15. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1c-gosaki-schedule-routine-edit-final-preflight.mjs
```

---

## 16. Reference index

| Topic | Doc |
| --- | --- |
| G-14b1 planning | `gosaki-schedule-routine-edit-flow-next-poc-planning.md` |
| G-14b1a implementation | `gosaki-schedule-routine-edit-practical-save-enablement-implementation.md` |
| G-14b1b preflight | `gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md` |
| G-14b1b-result | `gosaki-schedule-routine-edit-local-dry-run-preview-result.md` |
| G-14b flow | `gosaki-schedule-cms-practical-editing-flow-definition.md` |
