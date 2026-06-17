# Staging shell schedule site_slug title non-dry-run PoC preflight (G-9g2)

**Phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight`  
**Date:** 2026-06-17  
**Prior:** G-9g2 implementation commit `969822e`  
**Type:** preflight checklist only — **no Save click, no DB write, no Supabase SQL execution**

---

## 1. Background

G-9g2 implementation shipped gated `Save title PoC` UI and `executeG9G2TitleNonDryRunSave()` for Gosaki `site_slug=gosaki-piano`. This phase documents operator checks immediately **before** the first manual Save in the execution phase.

**This phase performed:** preflight checklist, beforeSnapshot expectations, dry-run / Save procedures, restore plan, AI context.  
**This phase did not:** Save click, UPDATE / INSERT / DELETE, Supabase SQL execution, FTP, workflow_dispatch, `service_role`, `/admin` changes.

Prior docs:

- [staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-planning.md)
- [staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md)
- [staging-shell-schedule-site-slug-edit-dry-run-preview.md](./staging-shell-schedule-site-slug-edit-dry-run-preview.md)
- [gosaki-existing-schedule-rows-manual-sql-execution-result.md](./gosaki-existing-schedule-rows-manual-sql-execution-result.md) (G-9c2c baseline)

---

## 2. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
date:       2026-07-19
```

---

## 3. Title payload (PoC)

```txt
[CMS Kit staging] G-9g2 title PoC
```

---

## 4. Restore target (separate phase — not executed here)

```txt
title = <>
```

---

## 5. Approval ID

```txt
G-9g2-schedule-site-slug-title-non-dry-run-poc
```

---

## 6. Operator approval text (execution phase)

Required **before** one manual Save in execution phase. **Not required for this preflight phase.**

```txt
承認します。G-9g2 title non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、title のみを "[CMS Kit staging] G-9g2 title PoC" に更新します。dry-run preview と optimistic lock が成功している場合のみ1回だけ実行し、他フィールド・他site・本番には触りません。
```

Cursor / AI / CI / Playwright must **not** click Save or run SQL.

---

## 7. Env arm

### G-9g2 arm (required for Save)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
```

Without this env: Save UI remains disabled; dry-run preview only.

### Full execution-phase dev stack (inline env — do not commit `.env` / `.env.local`)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g2-schedule-site-slug-title-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

| Env | Value | Notes |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` | Section visible |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` | Write path |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` | Live row load + stale check |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` | |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` | |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g2-schedule-site-slug-title-non-dry-run-poc` | **Not G-6-g1 / G-9g1** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` | |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` | Recommended explicit |
| `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED` | `true` | G-9g2 arm gate |
| `PUBLIC_SUPABASE_URL` | staging URL | `static-to-astro-cms-staging` |
| `PUBLIC_SUPABASE_ANON_KEY` | staging anon key | **Never commit** |

### Do not arm (single-arm conflict)

```txt
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true
service_role key
production Supabase URL / keys
```

**Warning:** Execution-phase dev command arms non-dry-run Save. In **preflight**, verify checklist only — **do not click Save**.

---

## 8. Preflight confirmation items

Before execution phase, operator confirms:

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | Supabase project | `static-to-astro-cms-staging` only |
| 2 | Route | `/__admin-staging-shell/musician-basic/#schedule` — **not** `/admin` |
| 3 | Section | `AdminStagingScheduleSiteSlugEditSection` visible |
| 4 | G-9f read section | Unchanged; read-only |
| 5 | Target row | id + legacy_id + site_slug match §2 |
| 6 | beforeSnapshot | Matches §9 (operator SQL or UI read) |
| 7 | Approval ID displayed | `G-9g2-schedule-site-slug-title-non-dry-run-poc` |
| 8 | Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true` when arming Save |
| 9 | G-6 arms off | G-6-g1 / G-6-g2 arms not active |
| 10 | Auth | Staging admin signed in before Save (execution) |
| 11 | `service_role` | Not used |
| 12 | FTP / workflow_dispatch | Not executed |

---

## 9. beforeSnapshot confirmation

### Operator SQL (read-only — staging project only)

**Cursor does not execute.**

```sql
-- G-9g2 beforeSnapshot — SELECT only; staging project only
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
  description,
  source_route,
  published,
  show_on_home,
  home_order,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

**Row count must be exactly 1.**

### Expected beforeSnapshot (G-9c2c restored baseline)

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |
| `title` | `<>` |
| `venue` | `NULL` |
| `description` | `出演：` |
| `source_route` | `/schedule/2026-07/` |
| `published` | `true` |
| `show_on_home` | `false` |
| `home_order` | `NULL` |
| `sort_order` | `10` |
| `updated_at` | **record exact value** — used as `expectedBeforeUpdatedAt` |

### UI confirmation (alternative / supplement)

In `AdminStagingScheduleSiteSlugEditSection` target row panel and G-9f read section:

- Confirm `id`, `legacy_id`, `site_slug`, `updated_at` match SQL
- Confirm `title` is `<>` before preview

### Abort conditions (beforeSnapshot)

Abort execution if:

```txt
- Supabase project is not static-to-astro-cms-staging
- row count ≠ 1
- site_slug ≠ gosaki-piano
- legacy_id ≠ schedule-2026-07-010
- title ≠ <> (unless documented intentional change + restore approved)
- venue ≠ NULL
- description ≠ 出演：
- source_route ≠ /schedule/2026-07/
- published ≠ true
- show_on_home ≠ false
- home_order ≠ NULL
- sort_order ≠ 10
```

---

## 10. Dry-run preview confirmation (required before Save)

**URL:** `http://localhost:<port>/__admin-staging-shell/musician-basic/#schedule`

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Load section with Supabase env | Target row loaded; data source Supabase |
| 2 | Confirm title input default / current | `<>` or operator-entered PoC title |
| 3 | Enter title | `[CMS Kit staging] G-9g2 title PoC` |
| 4 | Click **Preview dry-run** | Preview succeeds |
| 5 | Confirm `actualWrite` | `false` |
| 6 | Confirm `changedFields` | `["title"]` only |
| 7 | Confirm `before.title` | `<>` |
| 8 | Confirm `after.title` | `[CMS Kit staging] G-9g2 title PoC` |
| 9 | Confirm `target.id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| 10 | Confirm `target.legacy_id` | `schedule-2026-07-010` |
| 11 | Confirm `target.site_slug` | `gosaki-piano` |
| 12 | Confirm `optimisticLock.stale` | `false` |
| 13 | Record `expectedBeforeUpdatedAt` | Displayed; matches beforeSnapshot `updated_at` |
| 14 | Confirm Save hint | Not stale; preview valid |

### Stale stop condition

```txt
optimisticLock.stale === true  → STOP — do not Save
```

Actions when stale:

1. Reload page / re-fetch row
2. Re-run beforeSnapshot SQL
3. Re-run Preview dry-run
4. Confirm `stale === false` before considering Save

---

## 11. Save execution procedure (execution phase only)

**Operator manual only.** Cursor / AI / CI / Playwright **must not** click Save.

Click **Save title PoC** **once** only when **all** conditions hold:

```txt
- Operator approval text provided (§6)
- env arm active (PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true)
- approval ID visible: G-9g2-schedule-site-slug-title-non-dry-run-poc
- dry-run preview succeeded in same session
- changedFields = ["title"]
- optimisticLock.stale = false
- target id / legacy_id / site_slug match §2
- title input unchanged since preview
- Save title PoC button enabled (not disabled)
- staging admin signed in
```

### UPDATE scope (adapter)

```txt
.update({ title: "[CMS Kit staging] G-9g2 title PoC" })
.eq("id", "aa440e29-5be8-402e-9190-0d81c48434c0")
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

`updated_at` is **not** in payload — `schedules_set_updated_at` trigger advances it.

---

## 12. Post-Save verification (execution phase only)

After operator clicks Save once, verify via UI result panel and/or SELECT:

### Expected result

```txt
actualWrite: true
approvalId: G-9g2-schedule-site-slug-title-non-dry-run-poc
changedFields: ["title"]
optimisticLock: expectedBeforeUpdatedAt matched
```

### Expected row state

| Field | Expected after Save |
| --- | --- |
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `site_slug` | `gosaki-piano` |
| `legacy_id` | `schedule-2026-07-010` |
| `updated_at` | advanced from beforeSnapshot |

### Unchanged fields (must remain)

```txt
venue = NULL
description = 出演：
source_route = /schedule/2026-07/
published = true
show_on_home = false
home_order = NULL
sort_order = 10
```

### afterVerification SQL (execution phase — operator only)

```sql
-- G-9g2 afterVerification — SELECT only
select
  id,
  legacy_id,
  site_slug,
  title,
  venue,
  description,
  source_route,
  published,
  show_on_home,
  home_order,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

---

## 13. Rollback / restore policy

Restore is **not implemented** in code. After PoC QA, operator may restore with **separate approval**.

### Restore target

```txt
title = <>
```

### Restore approval text (separate phase)

```txt
承認します。G-9g2 restore として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、title のみを "<>" に戻します。restore preview と optimistic lock が成功している場合のみ1回だけ実行し、他フィールド・他site・本番には触りません。
```

### Suggested restore SQL (staging only — **not executed in preflight**)

```sql
UPDATE public.schedules
SET title = '<>'
WHERE id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  AND legacy_id = 'schedule-2026-07-010'
  AND site_slug = 'gosaki-piano';
```

No automatic rollback in code.

---

## 14. Prohibited actions (this phase)

```txt
- Save button click (Cursor / AI / CI / Playwright)
- DB write / UPDATE / INSERT / DELETE
- Supabase SQL execution by Cursor
- FTP connect / upload / mirror / delete
- workflow_dispatch
- service_role usage
- /admin or src/pages/admin changes
- .env / secrets commit
- output/ / manual-upload package commit
```

---

## 15. Verification (preflight phase)

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
npm run verify:manual-upload
```

No new code required for preflight.

---

## 16. Gates

```txt
stagingShellScheduleTitlePocPreflightComplete: true
stagingShellScheduleTitlePocBeforeSnapshotDefined: true
stagingShellScheduleTitlePocDryRunChecklistReady: true
stagingShellScheduleTitlePocOperatorApprovalReady: true
stagingShellScheduleTitlePocRestorePlanReady: true
stagingShellScheduleTitlePocNotExecuted: true
readyForOperatorG9g2TitlePocSave: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 17. Next phase

**G-9g2-execution** — operator provides approval text (§6), arms dev stack (§7), runs beforeSnapshot → Preview → **one manual Save** → afterVerification. Cursor does not click Save.
