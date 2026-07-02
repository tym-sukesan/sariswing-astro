# G-22d — Gosaki Schedule duplicate INSERT planning / final preflight

**Phase:** `G-22d-gosaki-schedule-duplicate-insert-planning`  
**Status:** **complete** — planning + final preflight only; **no implementation / Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `d1fa0a8`  
**Prior:** [gosaki-schedule-duplicate-dry-run-local-qa.md](./gosaki-schedule-duplicate-dry-run-local-qa.md) (G-22c)

| Check | Status |
| --- | --- |
| Schema / payload design | **yes** |
| legacy_id policy decided | **yes** — Option B |
| Implementation plan | **yes** |
| Final preflight (G-22d2 templates) | **yes** |
| Save / INSERT executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleDuplicateInsertPlanningComplete: true
phase: G-22d-gosaki-schedule-duplicate-insert-planning
readyForG22d1DuplicateInsertImplementation: true
readyForG22d2DuplicateInsertFinalPreflight: true
readyForG22d3DuplicateInsertOperatorExecution: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**approvalId (proposed):** `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice`  
**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean at planning start) |
| `HEAD` | `d1fa0a8` |
| `origin/main` | `d1fa0a8` |

---

## 2. G-22c spot-check baseline (operator visual QA)

Operator spot-check on local dev confirmed G-22b duplicate dry-run preview:

| Field | Observed |
| --- | --- |
| `operation` | `duplicate` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldInsert` | `true` |
| `saveAllowed` | `false` |
| `legacy_id` (payload) | `null` |
| `published` | `false` |
| `site_slug` | `gosaki-piano` |

**Fixed source row (first non-dry-run slice candidate):**

| Field | Value |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `title` | `<Live & Session>` |
| `date` | `2026-03-08` |
| `site_slug` | `gosaki-piano` |

---

## 3. `public.schedules` schema (read-only audit)

Source: [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md) (G-6-e1 manual SQL on staging) + Gosaki seed template (`gosaki-schedules-seed.template.sql`) + `staging-schedule-read.ts` SELECT list.

### 3.1 Columns relevant to INSERT

| Column | Type / default | INSERT notes |
| --- | --- | --- |
| `id` | `uuid NOT NULL DEFAULT gen_random_uuid()` | **Omit** — let DB generate |
| `legacy_id` | `text NULL`, **UNIQUE** | See §4 — recommend explicit value |
| `site_slug` | `text` (G-9c) | **Required** `gosaki-piano` |
| `date` | `date NOT NULL` | From form / source |
| `year` | `integer NULL` | Derive from `date` |
| `month` | `text NULL` | Derive `YYYY-MM` from `date` |
| `title` | `text NULL` | Source + `（コピー）` suffix |
| `venue` | `text NULL` | Copy / form |
| `open_time` | `text NULL` | Copy / form |
| `start_time` | `text NULL` | Copy / form |
| `price` | `text NULL` | Copy / form |
| `description` | `text NULL` | Copy / form |
| `image_url` | `text NULL` | Copy source (usually `null`) |
| `home_image_url` | `text NULL` | Omit / `null` |
| `source_file` | `text NULL` | Copy source (live staging e.g. `schedule-2026-03.html`) |
| `source_route` | `text NULL` | Copy source (e.g. `/schedule/2026-03/`) |
| `show_on_home` | `boolean DEFAULT false` | **Force `false`** |
| `home_order` | `integer NULL` | **Force `null`** |
| `published` | `boolean DEFAULT true` | **Force `false`** for duplicate draft |
| `sort_order` | `integer DEFAULT 0` | See §3.3 |
| `created_at` | `timestamptz DEFAULT now()` | Omit — DB default |
| `updated_at` | `timestamptz DEFAULT now()` | Omit on INSERT; trigger may apply on UPDATE only |

### 3.2 NOT NULL / constraints

| Constraint | Implication |
| --- | --- |
| `id` NOT NULL | DB default OK |
| `date` NOT NULL | Must validate before INSERT |
| `schedules_legacy_id_key` UNIQUE on `legacy_id` | Non-null values must be unique; **multiple `NULL` allowed** in PostgreSQL |
| No `deleted_at` on Kit staging schema | Soft-delete not in scope; rollback = hard `DELETE` by id |

`schedule_months`: **read-only / derived** — do not INSERT/UPDATE in duplicate path.

### 3.3 `sort_order` policy

Gosaki seed uses `10, 20, 30…` per month. March 2026 current max: `130` (`schedule-2026-03-013`).

**Recommendation:** `sort_order = max(sort_order) + 10` within `(site_slug, month)` at save time.  
For G-22d3 fixed slice preflight: **`70`** (live max 60 + 10; G-22d2b).

---

## 4. Duplicate INSERT payload policy

### 4.1 Copy from source (read-only snapshot)

`date`, `title` (then suffix), `venue`, `open_time`, `start_time`, `price`, `description`, `image_url`, `source_file`, `source_route`, `year`, `month` (re-derived if date edited).

### 4.2 Override on INSERT

| Field | Value | Rationale |
| --- | --- | --- |
| `title` | `{sourceTitle}（コピー）` | Operator-visible duplicate marker |
| `legacy_id` | **new** `schedule-YYYY-MM-NNN` | See §5 |
| `site_slug` | `gosaki-piano` | Fixed guard |
| `published` | `false` | Draft copy — not public until reviewed |
| `show_on_home` | `false` | Matches G-22b dry-run |
| `home_order` | `null` | Not featured |
| `sort_order` | month max + 10 | Avoid collision |
| `id` | *(omit)* | `gen_random_uuid()` |

### 4.3 Exclude from INSERT payload

`created_at`, `updated_at`, `id` (source), source row `legacy_id`.

### 4.4 Alignment with G-22b dry-run

`buildScheduleDuplicateDryRunResult()` already forces `published=false`, `show_on_home=false`, `home_order=null`, `legacy_id=null` in preview.  
G-22d1 must add **`buildGosakiScheduleDuplicateInsertPayload()`** that applies §4.2 (including legacy_id assignment) while reusing validation from `validateDryRunFormInput()`.

**G-22d1 fix (planned):** `buildGosakiScheduleDuplicateDraft()` currently sets `published: source.published === true`; align draft default to `false` to match dry-run / INSERT policy.

---

## 5. `legacy_id` numbering policy

### 5.1 Options compared

| Option | Pros | Cons | Public / verifier impact |
| --- | --- | --- | --- |
| **A. `null` INSERT** | Fastest; no collision calc | Multiple nulls OK but breaks seed convention; hard to reference in rollback/docs; public build may expect `legacy_id` | Weak traceability |
| **B. `schedule-YYYY-MM-NNN` next** | Matches 60-row seed; global UNIQUE safe; rollback by `legacy_id`; static build / month pages use date+content not legacy_id directly | Requires read `MAX` or prefix scan before INSERT | **Low risk** — Gosaki routes use `/schedule/YYYY-MM/` + date |
| **C. `draft-{uuid}`** | Unique by construction | Breaks operator mental model; unlike Wix import IDs | Confusing; no seed parity |

### 5.2 Recommendation: **Option B**

**Algorithm (implementation phase):**

1. Parse `month` from duplicate `date` → `YYYY-MM`
2. `SELECT legacy_id FROM schedules WHERE site_slug = 'gosaki-piano' AND legacy_id LIKE 'schedule-{month}-%'`
3. Parse trailing `NNN` (3-digit); `next = max + 1`, zero-pad → `schedule-2026-03-014`
4. Guard: fail if `next` already exists (race safety)

**G-22d3 fixed slice:** preflight locks `legacy_id = schedule-2026-03-014` (March 2026 has 001–013 in seed).

Dry-run preview may continue showing `legacy_id: null` until G-22d1 wires **planned** legacy_id into preview when save arm is evaluated (optional UX improvement — not required for first slice).

---

## 6. Non-dry-run implementation plan (G-22d1)

### 6.1 New / extended modules

| File | Role |
| --- | --- |
| `gosaki-schedule-duplicate-insert-config.ts` | Env arm, approval ID, host gate |
| `gosaki-schedule-duplicate-insert-guards.ts` | `assertG22dDuplicateInsertPayloadOnly`, fixed `sourceId` / `site_slug` |
| `gosaki-schedule-duplicate-insert-save.ts` | `executeG22dScheduleDuplicateInsertSave()` — orchestration |
| `schedule-insert-write-adapter.ts` *(new, preferred)* | `insertScheduleWrite()` — `.insert().select().single()`; separate from update-only `schedule-write-adapter.ts` |
| `schedule-write-types.ts` | Add `G22D_…_APPROVAL_ID`, `ScheduleInsertWritePayload`, register in `SCHEDULE_WRITE_APPROVAL_IDS` |
| `gosaki-schedule-duplicate-dry-run.ts` | Keep G-22b dry-run; call shared payload builder from new module |
| `gosaki-staging-schedule-operator-ui.ts` | Duplicate-mode Save gate + `runEditSave()` branch |

**Do not** add INSERT to `gosaki-schedule-existing-event-save-button-save.ts` (UPDATE-only path).

### 6.2 G-22b vs G-22d separation

| Layer | G-22b | G-22d |
| --- | --- | --- |
| Preview | `executeG22bScheduleDuplicateDryRun` | unchanged |
| Save | blocked | `executeG22dScheduleDuplicateInsertSave` |
| Adapter | `buildScheduleDuplicateDryRunResult` | `insertScheduleWrite` |
| Approval | `G-22b-gosaki-schedule-duplicate-dry-run` | `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice` |

### 6.3 Env / arm stack (execution phase only — not armed in G-22d)

```bash
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice
PUBLIC_ADMIN_GOSAKI_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=true
# All other non-dry-run arms OFF (G-9k, G-18, G-19, G-6-g*, G-13c*, etc.)
```

| Gate | Required |
| --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | **`true`** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **`false`** |
| Staging host allowlist | `kmjqppxjdnwwrtaeqjta` |
| Auth session | signed in |
| `service_role` | **never** |

### 6.4 Single-slice guards (first execution)

| Guard | Value |
| --- | --- |
| `sourceId` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` (fixed for G-22d3) |
| `site_slug` | `gosaki-piano` |
| `approvalId` | `G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice` |
| Operations | INSERT only — no UPDATE/DELETE in same Save |
| Rows affected | exactly 1 |
| `schedule_months` | not touched |

### 6.5 INSERT result shape

Return to UI (mirror G-9k save outcome):

- `afterRecord`: `{ id, legacy_id, title, date, venue, description, published, updated_at }`
- `insertedId` (new UUID)
- `changedFields`: all payload keys
- `rollbackHint`: DELETE by `id`
- `safety`: `{ serviceRoleUsed: false, scheduleMonthsTouched: false, stagingOnly: true }`

---

## 7. UI gate policy

| State | 更新する / Save |
| --- | --- |
| Default (routine dev) | **disabled** — `更新する（準備中）` or `更新する（複製案）` |
| Duplicate mode, dry-run only | **disabled** — current G-22b |
| Duplicate mode, G-22d armed + preview OK | **enabled** — label `複製案を保存` (operator-only) |
| Existing UPDATE mode | unchanged G-9k gates |

**Enable conditions (all required):**

1. `editDraftMode === "duplicate"`
2. `lastDuplicateDryRunResult?.ok === true`
3. `getG22dDuplicateInsertConfig().saveEnabled === true` (env arm stack)
4. `sourceId` matches fixed guard (first slice)
5. `PUBLIC_ADMIN_WRITE_DRY_RUN=false`

**Audience:** staging shell operator UI only (`/__admin-staging-shell/musician-basic/admin/schedule/`). Not exposed on production `/admin` or client-facing build.

`runEditSave()` duplicate branch: call G-22d save adapter instead of alert when armed; keep alert when not armed.

---

## 8. Rollback policy

### 8.1 Identify inserted row

| Method | When |
| --- | --- |
| `id` returned from `.insert().select().single()` | **Primary** — use in rollback |
| `legacy_id = 'schedule-2026-03-014'` | Preflight / operator docs |
| `title = '<Live & Session>（コピー）'` + `published = false` | Secondary verification |
| `sourceId` | Audit trail only (not stored on row unless we add metadata — **not planned**) |

### 8.2 Rollback SQL template (G-22d3 — operator only)

```sql
-- G-22d3 rollback — staging kmjqppxjdnwwrtaeqjta ONLY
-- Replace :inserted_id with UUID returned after INSERT
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

### 8.3 Rollback execution conditions

- Wrong row inserted
- Duplicate execution accident
- Operator requests cleanup before public reflection

**Not needed if:** INSERT matches afterVerification and operator accepts row as staging test data.

---

## 9. Public reflection policy

| Step | G-22d | Later (e.g. G-22h) |
| --- | --- | --- |
| INSERT with `published=false` | **yes** | — |
| Visible on staging static site | **no** (filtered by `published`) | after `published=true` + regen |
| Local package regen | **no** | `build-gosaki-staging-admin-package.mjs` or production package script |
| Manual FTP upload | **no** | operator checklist |
| `schedule_months` | derived at build | unchanged |

INSERT of unpublished row is **safe for public HTML** until publish + regen phase.

---

## 10. Execution phase split

### G-22d1 — implementation only

- INSERT adapter + save function + guards + config + UI gate + verifier
- Extend types / approval registry
- **No DB write / no Save click**

### G-22d2 — final preflight (templates below)

- Lock target source row + expected payload + rollback SQL
- before SELECT templates
- after verification SELECT templates
- Dev arm command documented
- **No Save / no SQL execution by Cursor**

### G-22d3 — operator single INSERT execution

- Operator: duplicate source → 変更を確認 → 複製案を保存 **once**
- afterVerification SELECT
- rollback only if needed
- Closure doc if `rollbackNeeded: false`

---

## 11. Final preflight (G-22d2 templates)

### 11.1 Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
service_role: not used
schedule_months: read-only
Sariswing production ref vsbvndwuajjhnzpohghh: never
```

### 11.2 beforeSnapshot — source row (SELECT only)

```sql
-- G-22d2 beforeSnapshot source — SELECT only; staging only
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

**Expected source snapshot:**

| Field | Expected |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-03-08` |
| `title` | `<Live & Session>` |
| `published` | `true` |
| `sort_order` | `30` |

### 11.3 beforeSnapshot — month legacy_id occupancy (SELECT only)

```sql
-- Confirm next legacy_id slot
select legacy_id, sort_order, title, published
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03'
order by legacy_id asc;
```

**Expected:** `schedule-2026-03-001` … `schedule-2026-03-013` present; **`schedule-2026-03-014` absent**.

### 11.4 Expected INSERT payload (G-22d3)

| Field | Expected value |
| --- | --- |
| `legacy_id` | `schedule-2026-03-014` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-03-08` |
| `year` | `2026` |
| `month` | `2026-03` |
| `title` | `<Live & Session>（コピー）` |
| `venue` | *(same as source — 学芸大学 珈琲美学)* |
| `open_time` | `11:30` |
| `start_time` | `12:30` |
| `price` | `3,850円(税込)` |
| `description` | *(same as source)* |
| `source_file` | `schedule-2026-03.html` |
| `source_route` | `/schedule/2026-03/` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `published` | `false` |
| `sort_order` | `70` |
| `image_url` | `null` |

**Source row must remain unchanged** after INSERT.

### 11.5 afterVerification SQL (post G-22d3 — operator)

```sql
-- New row
select id, legacy_id, site_slug, date, title, published, sort_order, created_at
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-03-014';

-- Source unchanged
select id, legacy_id, title, updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';

-- Month count +1
select count(*) as march_count
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03';
-- expect 14 (was 13)
```

### 11.6 UI procedure (G-22d3 execution phase only)

1. Arm dev with §6.3 env stack
2. Open schedule operator UI; sign in
3. Select source row `<Live & Session>` (`eb1f1898-…`)
4. Click **複製案を作成**
5. Click **変更を確認** — verify duplicate preview
6. Click **複製案を保存** once (enabled only when armed)
7. Run afterVerification SQL
8. **Do not** re-click Save

---

## 12. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Implementation code | **no** |
| Save / DB INSERT | **no** |
| SQL INSERT/UPDATE/DELETE | **no** |
| package regen / FTP | **no** |
| Sariswing production ref | **no** |

---

## 13. Next phase

**G-22d1** — `gosaki-schedule-duplicate-insert-implementation` (adapter + UI gate; no DB write)

---

## 14. Fix required?

**No.** Planning and final preflight templates complete. Proceed to G-22d1 implementation when approved.
