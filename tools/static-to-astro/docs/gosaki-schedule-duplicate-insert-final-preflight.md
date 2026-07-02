# G-22d2 — Gosaki Schedule duplicate INSERT final preflight

**Phase:** `G-22d2-gosaki-schedule-duplicate-insert-final-preflight`  
**Status:** **complete** — final preflight / SQL templates only; **no Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `daa1da2`  
**Prior:** [gosaki-schedule-duplicate-insert-implementation.md](./gosaki-schedule-duplicate-insert-implementation.md) (G-22d1)

| Check | Status |
| --- | --- |
| G-22d1 implementation reconfirmed | **yes** |
| beforeVerification SQL templates | **yes** |
| expected INSERT payload locked | **yes** |
| afterVerification SQL templates | **yes** |
| rollback SQL templates | **yes** |
| Save / INSERT executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertFinalPreflightComplete: true
phase: G-22d2-gosaki-schedule-duplicate-insert-final-preflight
readyForG22d3DuplicateInsertOperatorExecution: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**approvalId:** `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`  
**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` (`static-to-astro-cms-staging`) only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `daa1da2` |
| `origin/main` | `daa1da2` |

---

## 2. G-22d1 implementation reconfirmation (static)

| Item | Result |
| --- | --- |
| `gosaki-schedule-duplicate-insert-config.ts` | **present** — fixed `sourceId`, `plannedLegacyId`, env arm |
| `gosaki-schedule-duplicate-insert-guards.ts` | **present** — payload guard + `buildG22dDuplicateInsertPayload` |
| `schedule-insert-write-adapter.ts` | **present** — `insertScheduleWrite` INSERT-only |
| `gosaki-schedule-duplicate-insert-save.ts` | **present** — `executeG22dScheduleDuplicateInsertSave` |
| UI gate (`gosaki-staging-schedule-operator-ui.ts`) | **present** — `evaluateG22dDuplicateInsertUiGate`, duplicate Save labels |
| Default Save disabled | **yes** — routine env → `saveEnabled=false` |
| `schedule-write-adapter.ts` | **UPDATE-only** — no `.insert(` |
| G-9k UPDATE path | **unchanged** — `executeG9kExistingEventSaveButtonSave` intact |
| G-22b dry-run | **unchanged** — `actualWrite=false`, `saveAllowed=false` |
| add / delete buttons | **disabled** in operator page markup |

---

## 3. Single-slice target

| Role | Field | Value |
| --- | --- | --- |
| Source | `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| Source | `legacy_id` | `schedule-2026-03-003` |
| Source | `title` | `<Live & Session>` |
| Source | `date` | `2026-03-08` |
| Insert | `legacy_id` | `schedule-2026-03-014` |
| Insert | `title` | `<Live & Session>（コピー）` |
| Both | `site_slug` | `gosaki-piano` |

---

## 4. beforeVerification SQL (SELECT only — operator / Cursor does **not** execute in G-22d2)

**Project:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta.supabase.co`) only.

### 4.1 Source row snapshot

```sql
-- G-22d2 beforeVerification — source row (SELECT only)
select
  id,
  legacy_id,
  site_slug,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  image_url,
  source_file,
  source_route,
  show_on_home,
  home_order,
  published,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';
```

**Expected:**

| Field | Expected |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `site_slug` | `gosaki-piano` |
| `title` | `<Live & Session>` |
| `date` | `2026-03-08` |
| `venue` | `学芸大学 珈琲美学` |
| `open_time` | `11:30` |
| `start_time` | `12:30` |
| `price` | `3,850円(税込)` |
| `published` | `true` |
| `sort_order` | `30` |

### 4.2 Planned legacy_id must not exist

```sql
-- G-22d2 — planned insert legacy_id absent
select id, legacy_id, title, published
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
```

**Expected:** **0 rows**

### 4.3 March 2026 legacy_id inventory

```sql
-- G-22d2 — 2026-03 legacy_id list
select legacy_id, date, title, sort_order, published
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03'
order by legacy_id asc;
```

**Expected:** `schedule-2026-03-001` … `schedule-2026-03-013` (13 rows); **no** `schedule-2026-03-014`

### 4.4 March 2026 max sort_order

```sql
-- G-22d2 — max sort_order in 2026-03
select max(sort_order) as max_sort_order, count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03';
```

**Expected:** `max_sort_order = 130`, `march_count = 13` (seed baseline; verify live before G-22d3)

### 4.5 Payload consistency pre-check

```sql
-- G-22d2 — duplicate payload source fields (read-only)
select
  legacy_id,
  title,
  venue,
  open_time,
  start_time,
  price,
  left(description, 80) as description_prefix,
  source_file,
  source_route,
  image_url
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';
```

Operator compares result with §5 expected INSERT payload (description full text must match source).

---

## 5. Expected INSERT payload (locked for G-22d3)

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-03-014` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-03-08` |
| `year` | `2026` |
| `month` | `2026-03` |
| `title` | `<Live & Session>（コピー）` |
| `venue` | `学芸大学 珈琲美学` |
| `open_time` | `11:30` |
| `start_time` | `12:30` |
| `price` | `3,850円(税込)` |
| `description` | `出演：【第一部Live】MAREE ARAKY vo,pf 後藤沙紀pianica,pf 【第二部Session】ホスト 後藤沙紀pf\n会場website: https://www.coffeebigaku.com/` |
| `image_url` | `null` |
| `source_file` | `2026-03.html` |
| `source_route` | `/schedule/2026-03/` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `sort_order` | `140` |
| `id` | *(omit — DB `gen_random_uuid()`)* |
| `created_at` | *(omit — DB default)* |
| `updated_at` | *(omit — DB default)* |

**Source row `schedule-2026-03-003` must remain unchanged** after INSERT.

---

## 6. Execution env stack (G-22d3 only — **not started in G-22d2**)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

**Verify before Save:**

- `PUBLIC_SUPABASE_URL` host = `kmjqppxjdnwwrtaeqjta.supabase.co`
- Dev panel: `insert saveEnabled=true`, `saveAllowed=true`
- **Never** `vsbvndwuajjhnzpohghh`

---

## 7. G-22d3 operator execution procedure (not executed in G-22d2)

1. Run §6 env stack; sign in to staging admin
2. Open `/__admin-staging-shell/musician-basic/admin/schedule/`
3. Run §4 beforeVerification SQL in Supabase SQL Editor — **all PASS**
4. Select source row `<Live & Session>` (`eb1f1898-…`)
5. Click **複製案を作成**
6. Click **変更を確認** — verify duplicate preview:
   - `operation=duplicate`, `dryRun=true`, `actualWrite=false`, `wouldInsert=true`
   - dev details: `insert saveEnabled=true`, `planned legacy_id=schedule-2026-03-014`
7. Confirm form matches §5 (especially title `（コピー）`, `published` unchecked)
8. Click **複製案を保存** **once** only
9. Confirm dialog; record `insertedId` from save result UI
10. Run §8 afterVerification SQL
11. **Do not** click Save again; **do not** re-run duplicate on other rows

---

## 8. afterVerification SQL (SELECT only — G-22d3 post-execution)

Replace `:inserted_id` with UUID from step 9.

```sql
-- G-22d2 afterVerification — inserted row
select
  id,
  legacy_id,
  site_slug,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  published,
  show_on_home,
  home_order,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = ':inserted_id';
```

**Expected inserted row:**

| Field | Expected |
| --- | --- |
| `legacy_id` | `schedule-2026-03-014` |
| `site_slug` | `gosaki-piano` |
| `title` | `<Live & Session>（コピー）` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `sort_order` | `140` |

```sql
-- G-22d2 afterVerification — source unchanged
select id, legacy_id, title, updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';
```

**Expected:** same `legacy_id`, `title`, `updated_at` as §4.1 beforeSnapshot (source not mutated)

```sql
-- G-22d2 afterVerification — planned legacy_id count
select count(*) as insert_legacy_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';
```

**Expected:** `insert_legacy_count = 1`

```sql
-- G-22d2 afterVerification — march count +1
select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03';
```

**Expected:** `march_count = 14` (was 13)

```sql
-- G-22d2 afterVerification — source legacy_id still present
select count(*) as source_count
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-003';
```

**Expected:** `source_count = 1`

---

## 9. Rollback SQL (G-22d3+ only — **not executed in G-22d2**)

Use only if operator decides cleanup is required. Replace `:inserted_id`.

```sql
-- G-22d2 rollback preflight — count candidates (SELECT only)
select id, legacy_id, site_slug, title, published, created_at
from public.schedules
where site_slug = 'gosaki-piano'
  and (
    id = ':inserted_id'
    or (
      legacy_id = 'schedule-2026-03-014'
      and title = '<Live & Session>（コピー）'
      and published = false
    )
  );
```

**Expected before DELETE:** exactly **1 row** matching inserted duplicate.

```sql
-- G-22d2 rollback — DELETE (operator only; staging only; G-22d3+ if needed)
-- Cursor does NOT execute

begin;

delete from public.schedules
where id = ':inserted_id'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014'
  and title = '<Live & Session>（コピー）'
  and published = false;

-- expect 1 row deleted
commit;
```

**Rollback not required if:** afterVerification PASS and operator accepts staging test row.

---

## 10. Risks and STOP conditions

**STOP immediately** (do not Save, do not SQL mutate) if:

| # | Condition |
| --- | --- |
| 1 | Supabase project is not `static-to-astro-cms-staging` / host is not `kmjqppxjdnwwrtaeqjta` |
| 2 | Sariswing production ref `vsbvndwuajjhnzpohghh` appears in env or URL |
| 3 | Source row not found or `id` ≠ `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| 4 | Source `legacy_id` ≠ `schedule-2026-03-003` or title ≠ `<Live & Session>` |
| 5 | `schedule-2026-03-014` already exists |
| 6 | March `max(sort_order)` ≠ `130` or count ≠ `13` (live drift — re-plan sort_order) |
| 7 | Duplicate preview payload ≠ §5 expected values |
| 8 | **複製案を保存** enabled without full §6 env stack |
| 9 | Any unrelated non-dry-run arm is `true` (G-9k, G-13c*, G-6-g*, etc.) |
| 10 | Save button enabled in routine dev (no G-22d arm) |
| 11 | Target row ambiguous (wrong source selected) |
| 12 | Operator intends to INSERT more than one row |

---

## 11. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Dev server arm for execution | **no** |
| Save / 複製案を保存 click | **no** |
| SQL INSERT/UPDATE/DELETE | **no** |
| Rollback SQL | **no** |
| package regen / FTP | **no** |

---

## 12. Next phase

**G-22d3** — operator single INSERT execution (manual Save once + afterVerification)

---

## 13. Fix required?

**No.** Final preflight complete. Proceed to G-22d3 when operator approves.
