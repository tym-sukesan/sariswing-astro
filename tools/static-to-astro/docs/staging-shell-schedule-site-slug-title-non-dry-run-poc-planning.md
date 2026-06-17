# Staging shell schedule site_slug title non-dry-run PoC planning (G-9g2)

**Phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-planning`  
**Date:** 2026-06-17  
**Prior:** G-9g1 commit `5ba2305`  
**Type:** planning only — no implementation, no Save UI, no DB write, no Supabase SQL

---

## 1. Background

G-9g planned Gosaki `site_slug` schedule edits. G-9g1 shipped dry-run Preview only (`actualWrite=false`). G-9g2 plans the **first non-dry-run write** on the Gosaki site_slug path: **title only**, one row, staging Supabase only.

**This phase performed:** safety design, approval/rollback/UI slice map, AI context updates.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, Save UI, non-dry-run execution, `/admin` changes, `service_role`.

Prior docs:

- [staging-shell-schedule-site-slug-edit-planning.md](./staging-shell-schedule-site-slug-edit-planning.md)
- [staging-shell-schedule-site-slug-edit-dry-run-preview.md](./staging-shell-schedule-site-slug-edit-dry-run-preview.md)
- [gosaki-existing-schedule-rows-manual-sql-execution-result.md](./gosaki-existing-schedule-rows-manual-sql-execution-result.md) (G-9c2c baseline)

---

## 2. G-9g1 baseline

| Item | Value |
| --- | --- |
| Section | `AdminStagingScheduleSiteSlugEditSection` |
| Route | `/__admin-staging-shell/musician-basic/#schedule` |
| UI | title input + `Preview dry-run` only |
| `actualWrite` | always `false` |
| Save | **none** |

---

## 3. G-9g2 purpose

Prove the **Gosaki site_slug write path** on staging with minimal blast radius:

1. First non-dry-run UPDATE scoped by `site_slug=gosaki-piano`
2. Title field only — no routing / `schedule_months` impact
3. Optimistic lock + dry-run prerequisite before Save
4. Separate approval ID from frozen G-6-g1 path (no `site_slug` filter)

---

## 4. Target row

Same as G-9g1 / G-9c2c restored seed row:

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
date:       2026-07-19
```

### Expected beforeSnapshot (G-9c2c — operator re-confirms before execution)

```txt
title:        <>
venue:        NULL
open_time:    NULL
start_time:   NULL
price:        NULL
description:  出演：
source_route: /schedule/2026-07/
published:    true
show_on_home: false
sort_order:   10
```

**Abort** if `site_slug`, `legacy_id`, or `title` differ from expected without a new planning phase.

---

## 5. Target field

```txt
title only
```

Payload must not include: `venue`, `open_time`, `start_time`, `price`, `description`, or any out-of-scope field from G-9g planning.

---

## 6. Title payload (PoC)

```txt
[CMS Kit staging] G-9g2 title PoC
```

Guard: `assertG9G2TitlePayloadOnly` — payload keys `["title"]` only.

---

## 7. Dry-run prerequisite

Before non-dry-run Save is enabled or clicked:

| Rule | Detail |
| --- | --- |
| Preview required | Successful G-9g1 `Preview dry-run` in same session for same title value |
| `changedFields` | Must include `title` (or operator acknowledges no-op and aborts) |
| `actualWrite` | `false` during Preview |
| Stale | If `optimisticLock.stale === true` → **Save disabled**; re-Preview after reload |
| Payload match | Save title must match last successful Preview title |

---

## 8. Optimistic lock policy

Reuse G-6-f10 pattern; extend for site_slug path:

| Step | Action |
| --- | --- |
| 1 | Capture `expectedBeforeUpdatedAt` from `beforeSnapshot.updated_at` at Preview / Save arm time |
| 2 | Pre-UPDATE SELECT: verify `updated_at === expectedBeforeUpdatedAt` (existing adapter) |
| 3 | Pre-UPDATE SELECT: verify `site_slug === gosaki-piano` and `legacy_id === schedule-2026-07-010` |
| 4 | On mismatch → `optimistic_lock_failed` or `site_slug_scope_failed`; **no UPDATE** |

### Stale stop conditions

```txt
staleDetected === true        → Save disabled; show stale banner
optimistic_lock_failed        → Save blocked; operator must re-Preview
site_slug mismatch on SELECT  → abort; no write
legacy_id mismatch          → abort; no write
```

`updated_at` is **never** sent in payload — `schedules_set_updated_at` trigger (G-6-f8) advances it after UPDATE.

---

## 9. Update scope policy

### Match conditions (all required)

```txt
id          = aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id   = schedule-2026-07-010   (beforeSnapshot guard + optional .eq)
site_slug   = gosaki-piano           (beforeSnapshot guard + .eq on UPDATE)
updated_at  = expectedBeforeUpdatedAt (optimistic lock)
```

### Supabase UPDATE (planned implementation)

```txt
.update({ title: "[CMS Kit staging] G-9g2 title PoC" })
.eq("id", targetId)
.eq("site_slug", "gosaki-piano")
.eq("updated_at", expectedBeforeUpdatedAt)
```

`legacy_id`: enforce in `assertBeforeSnapshotSiteSlug` / row SELECT before UPDATE; add `.eq("legacy_id", …)` if RLS allows.

### New code path (do not extend G-6-g1 trigger)

```txt
executeG9G2TitleNonDryRunSave
  → executeG9G2SiteSlugScheduleUpdateWrite (new)
  → updateScheduleWrite with site_slug UPDATE filter (adapter extension)
```

Frozen paths **unchanged**: G-6-e5, G-6-f6, G-6-g1, G-6-g2 triggers.

---

## 10. Approval ID

```txt
G-9g2-schedule-site-slug-title-non-dry-run-poc
```

Register in `SCHEDULE_WRITE_APPROVAL_IDS` during implementation — **do not reuse** G-6-g1 / G-9g1 dry-run IDs.

### Env arm (implementation)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
```

Single-arm: G-9g2 cannot be armed alongside G-6-g1 / G-6-g2 arms.

---

## 11. Operator approval text

Required before **one** manual Save in execution phase (not this planning phase):

```txt
承認します。G-9g2 title non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、title のみを "[CMS Kit staging] G-9g2 title PoC" に更新します。dry-run preview と optimistic lock が成功している場合のみ1回だけ実行し、他フィールド・他site・本番には触りません。
```

Cursor / CI must **not** click Save or run SQL.

---

## 12. Expected verification (post Save — operator / SELECT only)

After single manual Save (execution phase):

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC
venue:      NULL                    (unchanged)
description: 出演：                  (unchanged)
open_time / start_time / price: NULL (unchanged)
published:  true                    (unchanged)
show_on_home: false                 (unchanged)
updated_at: advanced from before baseline
```

`changedFields`: `["title"]` only.

---

## 13. Rollback / restore policy

### After PoC verification — restore to Gosaki seed

```txt
title = <>
```

### Restore approval (separate — not auto)

```txt
承認します。G-9g2 restore として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 の title を "<>" に戻します。1回だけ実行し、他フィールド・他行・本番には触りません。
```

Suggested restore SQL (staging only — **not executed in planning**):

```sql
UPDATE public.schedules
SET title = '<>'
WHERE id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  AND legacy_id = 'schedule-2026-07-010'
  AND site_slug = 'gosaki-piano';
```

No automatic rollback in code. Operator runs restore manually with separate approval after PoC QA.

---

## 14. UI policy (implementation phase — not G-9g2 planning)

Extend `AdminStagingScheduleSiteSlugEditSection` (G-9g1 preserved):

| Rule | Detail |
| --- | --- |
| Default | dry-run only; Save hidden or disabled |
| Save visibility | Only when `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true` |
| Save enabled | After successful Preview + not stale + title matches preview |
| Save label | `Save title PoC` (explicit) |
| Stale | Save disabled; stale banner |
| Approval ID | Display `G-9g2-schedule-site-slug-title-non-dry-run-poc` |
| `actualWrite` | `false` until Save succeeds → then `true` in result only |
| Fields | title input only for Save path |

Do **not** show Save alongside unarmed dry-run without gates passing.

---

## 15. Implementation slice map

| Phase | Scope | DB write |
| --- | --- | --- |
| **G-9g2 planning** (this) | Docs only | none |
| **G-9g2-implementation** | Adapter `site_slug` UPDATE filter; `executeG9G2*`; guards; Save UI gated off by default | none in impl phase |
| **G-9g2-preflight** | beforeSnapshot / afterVerification / rollback SQL docs | none |
| **G-9g2-execution** | Operator manual Save once | **one UPDATE** (operator) |
| **G-9g2-restore** | Separate approval + operator SQL or gated Save | restore only |

---

## 16. Risks

| Risk | Mitigation |
| --- | --- |
| Cross-site UPDATE | `.eq("site_slug", "gosaki-piano")` on UPDATE |
| Wrong row | Fixed id + legacy_id guards |
| G-9g1 regression | Additive Save block; dry-run path unchanged |
| G-6 path confusion | New approval ID, env arm, section labels |
| Stale concurrent edit | Optimistic lock blocks Save |
| Frozen G-6-g1 overlap | Do not arm G-6-g1 when G-9g2 armed |
| `title: <>` literal | Document angle brackets in restore SQL |

---

## 17. Safety

| Rule | Status |
| --- | --- |
| Staging project only | `static-to-astro-cms-staging` |
| `service_role` | not used |
| `/admin` | not modified |
| FTP / workflow_dispatch | not executed |
| G-9g1 dry-run section | preserve Preview path |

---

## 18. Verification (G-9g2 planning)

Standard verifiers — no new code assertions in planning phase.

```bash
cd tools/static-to-astro
node scripts/verify-gosaki-schedule-seed-extractor.mjs
node scripts/verify-url-to-staging-pipeline.mjs
node scripts/verify-crawl-static-site.mjs
node scripts/verify-gosaki-font-safety.mjs
npm run verify:manual-upload
```

---

## 19. Gates

```txt
stagingShellScheduleSiteSlugTitleNonDryRunPocPlanningComplete: true
stagingShellScheduleTitlePocTargetDefined: true
stagingShellScheduleTitlePocApprovalRequired: true
stagingShellScheduleTitlePocDryRunPrerequisiteDefined: true
stagingShellScheduleTitlePocOptimisticLockDefined: true
stagingShellScheduleTitlePocRestorePlanDefined: true
stagingShellNoWriteUiAdded: true
stagingShellNoAdminRouteTouched: true
readyForG9g2Implementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 20. Next phase

**G-9g2-implementation** — `site_slug` UPDATE adapter extension, `executeG9G2TitleNonDryRunSave`, gated Save UI (default off). No Save execution in implementation phase.
