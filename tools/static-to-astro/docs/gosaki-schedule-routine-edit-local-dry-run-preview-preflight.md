# G-14b1b — Gosaki Schedule CMS routine edit local dry-run Preview preflight

**Phase:** `G-14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight`  
**Status:** **complete** — read-only target confirmed; Preview-only procedure documented (no Preview / Save in this phase)  
**Date:** 2026-06-28  
**Base commit:** `b161235`  
**Prior:** G-14b1a practical Save enablement (`gosaki-schedule-routine-edit-practical-save-enablement-implementation.md`)

| Check | Status |
| --- | --- |
| Staging project confirmed | **yes** — `kmjqppxjdnwwrtaeqjta` |
| Target row read-only SELECT | **yes** — 1 row |
| Planning candidate match | **yes** |
| beforeSnapshot recorded | **yes** |
| Price edit candidate proposed | **yes** (no audit markers) |
| Preview-only env documented | **yes** |
| Cursor Preview / Save | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditLocalDryRunPreviewPreflightComplete: true
phase: G-14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight
readyForG14b1bResultOperatorDryRunPreview: true
readyForG14b1cFinalPreflight: false
readyForG14b1dRoutineEditPocExecution: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
```

**Routine dev:** Save arms **OFF**; `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: b161235
origin/main: b161235
branch: main...origin/main
```

---

## 2. Purpose

Operator（戸山）が **routine Schedule CMS edit**（G-9k operator path）で **local dry-run Preview を1回だけ** 実行する前の preflight。

- **Preview only** — Save は押さない
- **price 1フィールドのみ** 変更
- 監査マーカー（`[CMS Kit staging]` / `PoC` / `test` 等）は使用しない

**Out of scope (this phase):** Preview click, Save, DB write, package regen, FTP, dev server start.

---

## 3. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
UI path: Operator edit form（G-9k）— not G-13c1/G-13c2 cleanup panels
service_role: not used
schedule_months: read-only / derived (not touched)
```

**Abort** if host is `vsbvndwuajjhnzpohghh` or project is not staging.

---

## 4. Read-only SELECT (executed — staging anon GET)

**Method:** Supabase REST `GET /rest/v1/schedules` — anon key only; **SELECT equivalent**; no SQL UPDATE.

**Query filters:**

```txt
legacy_id = schedule-2026-04-005
site_slug = gosaki-piano
```

**Result:** `rowCount = 1` — **PASS**

| Field | Live value (2026-06-28 preflight) | Planning reference | Match |
| --- | --- | --- | --- |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` | (resolved in G-14b1b) | — |
| **legacy_id** | `schedule-2026-04-005` | `schedule-2026-04-005` | **yes** |
| **site_slug** | `gosaki-piano` | `gosaki-piano` | **yes** |
| **date** | `2026-04-12` | `2026-04-12` | **yes** |
| **month** | `2026-04` | `2026-04` | **yes** |
| **title** | `<Trio>` | `<Trio>` | **yes** |
| **venue** | `吉祥寺 Strings` | `吉祥寺 Strings` | **yes** |
| **open_time** | `12:00` | `12:00` (seed) | **yes** |
| **start_time** | `13:00` | `13:00` (seed) | **yes** |
| **price** | `3,300円(tax in)` | `3,300円(tax in)` (seed) | **yes** |
| **show_on_home** | `false` | `false` | **yes** |
| **published** | `true` | `true` (seed) | **yes** |
| **updated_at** | `2026-06-16T16:03:41.551792+00:00` | (lock baseline) | recorded |

**description (exact):**

```txt
出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b
会場website: https://www.jazz-strings.com/
```

**PoC / audit marker scan on text fields:** **none** — no `[CMS Kit staging]`, `G-9k6`, `PoC`, or `test` suffixes.

**Reference SQL (operator reconfirm — read-only):**

```sql
select id, legacy_id, site_slug, date, title, venue, open_time, start_time, price, description, show_on_home, published, updated_at
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-04-005';
```

---

## 5. Target event — confirmed

| Item | Value |
| --- | --- |
| **operation** | G-14b1-routine-poc-1 (first routine edit dry-run Preview) |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| **legacy_id** | `schedule-2026-04-005` |
| **date** | `2026-04-12` |
| **site_slug** | `gosaki-piano` |
| **month** | `2026-04` |
| **public month page** | `/schedule/2026-04/` |
| **show_on_home** | `false` |

**Excluded rows (do not select):**

| id | legacy_id | reason |
| --- | --- | --- |
| `f687ebf3-407c-49d0-9ab8-58040c499b8e` | `schedule-2026-03-007` | Event A — G-13c1 cleanup closed |
| `aa440e29-5be8-402e-9190-0d81c48434c0` | `schedule-2026-07-010` | Event B — G-13c2 cleanup closed |

---

## 6. beforeSnapshot (lock baseline for Preview)

| Field | Value |
| --- | --- |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| **legacy_id** | `schedule-2026-04-005` |
| **site_slug** | `gosaki-piano` |
| **date** | `2026-04-12` |
| **title** | `<Trio>` |
| **venue** | `吉祥寺 Strings` |
| **open_time** | `12:00` |
| **start_time** | `13:00` |
| **price** | `3,300円(tax in)` |
| **description** | `出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b` + newline + `会場website: https://www.jazz-strings.com/` |
| **show_on_home** | `false` |
| **published** | `true` |
| **updated_at** | `2026-06-16T16:03:41.551792+00:00` |

**G-14b1c final preflight:** re-SELECT; abort if `updated_at` differs from this baseline.

---

## 7. Operator price input (proposed)

**Field:** `price` only — all other safe fields **unchanged** in form.

| | Value |
| --- | --- |
| **Before (DB)** | `3,300円(tax in)` |
| **Operator enters** | `3,300円（税込）` |

**Rationale:** Same amount; natural Japanese notation (`（税込）` full-width) instead of English `(tax in)`. No audit markers; client-acceptable wording on public staging.

**Forbidden in operator input:**

```txt
[CMS Kit staging]
[G-14b1 routine PoC]
PoC
test
UI保存テスト
```

If operator prefers different natural wording, keep: same numeric amount, no audit markers, **price field only**.

---

## 8. Local dev startup env (Preview-only — Save arms OFF)

**Do not start dev in this preflight phase.** Operator uses this stack in **G-14b1b-result** only.

From repo root:

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
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

### Save arms — must remain OFF

```txt
PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED — unset or false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED — unset or false
G9K_SAVE_BUTTON_SAVE_ENABLED — unset or false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_WRITE_APPROVAL_ID — unset (dry-run path does not require non-dry-run approval)
```

### Other schedule arms — must be OFF

```txt
PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED=false or unset
PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED=false or unset
(all G-9g* / G-6 non-dry-run arms off)
```

### Preconditions

```txt
□ Staging Supabase login (local shell auth)
□ .env / .env.local has PUBLIC_SUPABASE_URL → kmjqppxjdnwwrtaeqjta only
□ Browser: /__admin-staging-shell/musician-basic/admin/schedule/
□ Schedule list loads from Supabase (not static fallback)
```

---

## 9. Operator procedure (G-14b1b-result — Preview once)

| Step | Action |
| --- | --- |
| 1 | Start dev with §8 env stack |
| 2 | Open `/__admin-staging-shell/musician-basic/admin/schedule/` |
| 3 | Sign in to staging admin if prompted |
| 4 | In **公演一覧**, find `2026-04-12` / `<Trio>` / `吉祥寺 Strings` |
| 5 | Click **編集する** — confirm row id `14230329-dde5-40d6-b9b3-75aefe140daf` in UI if visible |
| 6 | Change **料金** only: `3,300円(tax in)` → `3,300円（税込）` |
| 7 | Leave title / venue / times / description **unchanged** |
| 8 | Click **変更を確認** once (dry-run Preview) |
| 9 | **Do not** click **更新する** (Save) |
| 10 | Record Preview panel JSON / fields for G-14b1b-result doc |

**Do not use** G-13c1 or G-13c2 cleanup panels.

---

## 10. Expected Preview result

| Field | Expected |
| --- | --- |
| `dryRun` | `true` |
| `safety.actualWrite` | `false` |
| `safety.supabaseWriteCalled` | `false` |
| `saveReadiness` | `ready_but_save_disabled` |
| `saveAllowed` | `false` |
| `changedFields` | `["price"]` only |
| `payloadKeys` | `["price"]` only |
| `optimisticLockStale` | `false` (if row unchanged since §6) |
| `expectedBeforeUpdatedAt` | `2026-06-16T16:03:41.551792+00:00` |
| `before.price` | `3,300円(tax in)` |
| `after.price` | `3,300円（税込）` |

**before/after diff:** **price** line only; title / venue / open_time / start_time / description unchanged.

---

## 11. Stop conditions (abort — do not Save)

| Condition | Action |
| --- | --- |
| Wrong row selected (not `schedule-2026-04-005`) | **Stop** — re-select |
| Event A or Event B row | **Stop** — use April row only |
| `legacy_id` / `site_slug` / `date` mismatch vs §6 | **Stop** — re-read SELECT |
| `updated_at` ≠ `2026-06-16T16:03:41.551792+00:00` at Preview time | **Stop** — re-SELECT; document drift |
| `changedFields` includes non-`price` fields | **Stop** — fix form; re-Preview |
| Payload contains audit markers (§7 forbidden list) | **Stop** |
| `saveReadiness` = `ready_to_save` | **Stop** — Save arm accidentally on; restart dev with §8 |
| `actualWrite` = `true` | **Stop** — incident; no Save |
| `optimisticLockStale` = `true` | **Stop** — refresh row; re-Preview |
| Supabase host = `vsbvndwuajjhnzpohghh` | **Stop immediately** |
| Preview error / guard_error | **Stop** — record; no Save |

---

## 12. Next phases

| Phase | Action |
| --- | --- |
| **G-14b1b-result** | Operator Preview once; result doc |
| **G-14b1c** | Final preflight — re-SELECT `updated_at`; Save env stack |
| **G-14b1d** | Operator Save once + afterVerification |
| **G-14b1e** | G-14c public reflection |

---

## 13. Prohibited operations — not performed

| Operation | Executed |
| --- | --- |
| Preview / Save click (Cursor) | **no** |
| DB write / SQL UPDATE | **no** |
| package regen / FTP | **no** |
| `.env` modification | **no** |
| commit / push | **no** |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight.mjs
```

---

## 15. Reference index

| Topic | Doc |
| --- | --- |
| G-14b1 planning | `gosaki-schedule-routine-edit-flow-next-poc-planning.md` |
| G-14b1a implementation | `gosaki-schedule-routine-edit-practical-save-enablement-implementation.md` |
| G-14b flow | `gosaki-schedule-cms-practical-editing-flow-definition.md` |
| G-9k dry-run | `gosaki-schedule-existing-event-save-button-dry-run.ts` |
