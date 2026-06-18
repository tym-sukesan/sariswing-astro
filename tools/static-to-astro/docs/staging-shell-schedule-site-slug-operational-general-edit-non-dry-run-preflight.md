# Staging shell schedule site_slug operational general edit non-dry-run preflight (G-9g3g3)

**Phase:** `G-9g3g3-operational-non-dry-run-preflight`  
**Status:** **preflight complete / execution pending**  
**Date:** 2026-06-18  
**Prior:** G-9g3g2 smoke — commit `2fb6d08`  
**Type:** preflight / rollback planning / operator checklist only — **no Save, no Preview click by Cursor, no DB write, no SQL execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| Rollback SQL executed | **no** |
| service_role used | **no** |

**G-9g3g4 execution is forbidden until operator completes this preflight and arms env for one manual Save.**

Prior docs:

- [staging-shell-schedule-site-slug-operational-general-edit-planning.md](./staging-shell-schedule-site-slug-operational-general-edit-planning.md)
- [staging-shell-schedule-site-slug-operational-general-edit-implementation.md](./staging-shell-schedule-site-slug-operational-general-edit-implementation.md)
- [staging-shell-schedule-site-slug-operational-general-edit-ui-gate-smoke-test-result.md](./staging-shell-schedule-site-slug-operational-general-edit-ui-gate-smoke-test-result.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunPreflightComplete: true
readyForG9g3g4OperationalNonDryRunExecution: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
```

---

## 1. Route and hosts

```txt
URL:  http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
site_slug: gosaki-piano
staging host:  kmjqppxjdnwwrtaeqjta.supabase.co
production host (blocked): vsbvndwuajjhnzpohghh.supabase.co
```

Staging shell only — **not** Sariswing production `/admin`.

---

## 2. Approval ID / env arm

### Approval ID

```txt
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
```

### Env arm (G-9g3g4 only)

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
```

### Required env (G-9g3g4 execution stack)

| Env | Value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_DATA_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` (recommended explicit) |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | `true` |
| `PUBLIC_SUPABASE_URL` | `https://kmjqppxjdnwwrtaeqjta.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | staging anon key — **never commit** |

### Inline dev arm (G-9g3g4 — operator only; do not commit secrets)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

**G-9g3g3:** document only — **do not** run this stack or click Save.

---

## 3. Single-arm rule

When operational arm is on, **all** legacy PoC arms must be **off**:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED          — off
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED — off
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED    — off
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED    — off
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE                   — off (recommended)
```

Only `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` for G-9g3g4.

`service_role` — **forbidden**.

---

## 4. Target row identity

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| venue | `銀座 N` |
| open_time | `13:30` |
| start_time | `14:00` |
| price | `3,500円` |
| description (before) | see §5 |
| updated_at (baseline from G-9g3g2 smoke) | `2026-06-16T16:03:41.551792+00:00` |
| source_route | operator confirms from picker strip / live SELECT (expected Gosaki month route) |

### Row eligibility

- **Not** PoC audit row (`aa440e29-…` / `[CMS Kit staging]` marker rows excluded)
- **Selectable** in row picker (confirmed in G-9g3g2 smoke)
- `site_slug=gosaki-piano` scope only

### Operator live SELECT (G-9g3g4 pre-step — manual only)

**Cursor/AI does not execute.**

```sql
-- STAGING ONLY. SELECT only. static-to-astro-cms-staging.
select
  id,
  legacy_id,
  site_slug,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  source_route,
  updated_at
from public.schedules
where id = '888c58f2-f152-4563-a3cf-a20d7c2456c1'
  and legacy_id = 'schedule-2026-03-001'
  and site_slug = 'gosaki-piano';
```

**Pass:** exactly **1** row; `updated_at` recorded as lock baseline before Preview.

---

## 5. Planned G-9g3g4 payload (description only)

### Field changed

```txt
description
```

### before (exact)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

### after candidate (exact)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

### changedFields

```txt
["description"]
```

### Rationale

- Append-only marker — clear diff, easy rollback
- Limited display impact vs title / venue / time / price
- `changedFields=description` only — easy Preview verification

Config constant: `G9G3G4_OPERATIONAL_DESCRIPTION_MARKER`

---

## 6. Expected G-9 Preview (G-9g3g4 — operator manual)

### Press — OK

| Item | Value |
| --- | --- |
| Section | `Edit (safe fields)` / G-9 site_slug general edit |
| Button label | `Preview G-9 site_slug general edit dry-run` |
| Button id | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |

### Do not use

| Item | Why |
| --- | --- |
| Legacy G-6 dry-run `#schedule-dry-run-update-btn` | `approvalId=G-6-e2-schedule-dry-run-ui` — invalid |

### Expected preview result

| Check | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| optimisticLock.stale | `false` |
| optimisticLock.expectedBeforeUpdatedAt | equals live `currentUpdatedAt` at Preview time |
| hostGatePassed | `true` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| payload (changed-fields-only) | `{ "description": "<after candidate §5>" }` |
| title / venue / open_time / start_time / price | unchanged vs loaded baseline |

**G-9g3g3:** Preview not clicked.

---

## 7. Expected operational Save (G-9g3g4 — operator manual once)

### Press — OK (once only)

| Item | Value |
| --- | --- |
| Button label | `Save operational general edit` |
| Button id | `#site-slug-edit-g9g3g-operational-save-btn` |
| Result panel id | `#site-slug-edit-g9g3g-operational-save-result` |
| Gate panel id | `#site-slug-edit-save-gate-panel` |

### Do not press

| Button id | Reason |
| --- | --- |
| `#site-slug-edit-g9g3d-save-btn` | Frozen G-9g3d PoC Save |
| `#site-slug-edit-g9g3c-save-btn` | G-9g3b/c legacy slice PoC |
| `#site-slug-edit-g9g3b-save-btn` | G-9g3b legacy slice PoC |
| `#site-slug-edit-g9g2-*` / legacy G-6 Save | Wrong path |
| Any other Save | — |

### Expected Save result (G-9g3g4)

| Check | Expected |
| --- | --- |
| operator manual | **once** only |
| actualWrite | `true` |
| rowsAffected | `1` |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| changedFields | `description` only |
| beforeSnapshot | recorded (description = §5 before) |
| payload | `{ "description": "<after §5>" }` only |
| afterSnapshot | description contains G-9g3g4 marker |
| updated_at | changes from lock baseline |
| id / legacy_id / site_slug | unchanged |
| optimistic lock | success (`expectedBeforeUpdatedAt` matched) |
| serviceRoleUsed | `false` |
| production | not touched |

**G-9g3g3:** Save not clicked.

---

## 8. Rollback plan

Rollback is **operator manual** in G-9g3g5 or when operator decides restore is needed.  
**Cursor/AI does not execute rollback SQL.**

### Preferred rollback approach

1. Run SELECT (§4) to confirm row state and `updated_at` after Save.
2. If `description` contains G-9g3g4 marker, revert using guarded UPDATE below.
3. Record rollback result in G-9g3g5 execution result doc.

### Rollback SQL template (guarded — STAGING ONLY)

```sql
-- STAGING ONLY. DO NOT RUN UNLESS OPERATOR APPROVES.
-- Guard: only revert if G-9g3g4 marker is present.

-- Step 1: verify (SELECT only)
select id, legacy_id, site_slug, description, updated_at
from public.schedules
where id = '888c58f2-f152-4563-a3cf-a20d7c2456c1'
  and legacy_id = 'schedule-2026-03-001'
  and site_slug = 'gosaki-piano';

-- Step 2: revert description (operator manual — G-9g3g5 or restore phase)
update public.schedules
set
  description = '出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/'
where
  id = '888c58f2-f152-4563-a3cf-a20d7c2456c1'
  and legacy_id = 'schedule-2026-03-001'
  and site_slug = 'gosaki-piano'
  and description like '%[CMS Kit staging] G-9g3g4 operational Save test%';
```

**Note:** Avoid `updated_at = now()` in rollback unless operator documents new lock baseline. Prefer reverting `description` only; `updated_at` trigger may advance — record post-rollback `updated_at` in result doc.

**G-9g3g3:** rollback SQL **not executed**.

---

## 9. G-9g3g4 manual execution checklist (operator)

### Pre-flight (before arming)

- [ ] Confirm staging project `static-to-astro-cms-staging` only
- [ ] Confirm route `/#schedule` — not `/admin`
- [ ] Run live SELECT (§4) — 1 row; record `updated_at`
- [ ] Confirm row is non-PoC / selectable
- [ ] Stop routine dev; do **not** arm until checklist complete

### Arm dev stack (§2 inline env)

- [ ] Single-arm: G-9g3g operational arm **on**; all PoC arms **off**
- [ ] `PUBLIC_ADMIN_WRITE_APPROVAL_ID` = G-9g3g operational ID
- [ ] Staging host gate passes in UI
- [ ] Sign in as staging admin

### Row + candidate

- [ ] Select row `888c58f2-…` in picker
- [ ] Set description candidate to §5 **after** value only (other fields unchanged)
- [ ] Do **not** click legacy G-6 or PoC Save buttons

### Preview (press once)

- [ ] Click `#site-slug-edit-dry-run-preview-btn` only
- [ ] Verify §6 expected preview values in `#site-slug-edit-dry-run-result`
- [ ] Confirm Save gate panel shows operational Save **enabled** (armed stack only)

### Save (press once — G-9g3g4 only)

- [ ] Click `#site-slug-edit-g9g3g-operational-save-btn` **once**
- [ ] Verify §7 Save result in `#site-slug-edit-g9g3g-operational-save-result`
- [ ] Do **not** click Save again
- [ ] Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` and operational arm off

---

## 10. Operator approval text (G-9g3g4 execution only)

Required before one manual Save in **G-9g3g4**. Not required for G-9g3g3 preflight.

```txt
承認します。この操作を1回だけ実行してください。
G-9g3g4 operational general edit として、static-to-astro-cms-staging の public.schedules で、id=888c58f2-f152-4563-a3cf-a20d7c2456c1 / legacy_id=schedule-2026-03-001 / site_slug=gosaki-piano の1行について、description のみに G-9g3g4 marker を追記します。G-9 Preview 成功・optimistic lock 一致・operational arm のみ on の場合に1回だけ Save operational general edit を押します。他フィールド・他行・本番には触りません。
```

---

## 11. Safety checklist (G-9g3g3)

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| Rollback SQL executed | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| service_role used | **no** |
| `/admin` / production touched | **no** |
| Secrets committed | **no** |

---

## 12. Next phase

**`G-9g3g4-operational-non-dry-run-execution`**

Then: **`G-9g3g5-operational-post-execution-hardening`** (rollback decision / restore test).

---

## 13. Git

```txt
G-9g3g2 committed at: 2fb6d08
G-9g3g3 preflight: complete (uncommitted)
```
