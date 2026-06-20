# Gosaki schedule existing event update one-row preflight (G-9j4)

**Phase:** `G-9j4-gosaki-schedule-existing-event-update-one-row-preflight`  
**Status:** **complete** (preflight only — no Save, no DB write, no SQL execution)  
**Date:** 2026-06-20  
**Prior:** G-9j3 dry-run manual verification — commit `e9519d8`  
**Type:** preflight / rollback planning / operator checklist only

| Check | Status |
| --- | --- |
| Save clicked (Cursor/AI) | **no** |
| Preview / dry-run clicked (Cursor/AI) | **no** (programmatic dry-run only for doc) |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Save enabled | **no** |
| non-dry-run arm ON | **no** |
| `service_role` used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [gosaki-schedule-existing-event-save-enablement-planning.md](./gosaki-schedule-existing-event-save-enablement-planning.md) (G-9j)
- G-9j1 guards + dry-run — commit `85200e1`
- G-9j2 operator dry-run UI — commit `e9519d8`

**Do not re-click G-9g3g4 / G-9g3h1 operational Save on `888c58f2-f152-4563-a3cf-a20d7c2456c1`.**

---

## Gates

```txt
gosakiScheduleExistingEventUpdateOneRowPreflightComplete: true
readyForG9j5OneRowNonDryRunExecution: false
phase: G-9j4
readyForAnyDbWrite: false
dbWriteExecuted: false
saveEnabled: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
```

**Recommended next:** `G-9j5-gosaki-schedule-existing-event-update-one-row-non-dry-run-execution` (requires explicit operator approval only)

---

## 1. Purpose

Document the **single-row, single-field** staging `UPDATE` for the first Gosaki **operator-facing** existing event save (G-9j5).

| Policy | Value |
| --- | --- |
| `targetTable` | `public.schedules` |
| `operation` | **UPDATE only** |
| `targetRows` | **1** |
| `targetSiteSlug` | `gosaki-piano` |
| `targetField` | **`description` only** |
| `changedFields` | `["description"]` |
| `payload keys` | `["description"]` only |
| UI route | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Save path | Operator edit form (G-9j2) — **not** dev-tools G-9g3g |

Out of scope for G-9j5 first slice:

- `date` / `month` / `source_route` / `published` mutation
- multi-field payload
- INSERT / DELETE / UPSERT
- `schedule_months` writes
- public rebuild / FTP

---

## 2. Approval ID / env arm

```txt
approvalId: G-9j-gosaki-schedule-existing-event-update-non-dry-run
envArm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED
```

G-9j5 routine dev arm stack (document only — **do not arm in G-9j4**):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9j-gosaki-schedule-existing-event-update-non-dry-run
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=true
# all other schedule non-dry-run arms OFF
```

Staging host (expected): `kmjqppxjdnwwrtaeqjta.supabase.co`  
Production host (blocked): `vsbvndwuajjhnzpohghh.supabase.co`

---

## 3. Target row selection

### Selected row — **primary for G-9j5**

Live SSR read from staging dev (`data-read-source=supabase`) on **2026-06-20**. Operator must reconfirm `updated_at` immediately before G-9j5 Save.

| Field | Value |
| --- | --- |
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **title** | `<Duo>` |
| **date** | `2026-03-15` |
| **year** | `2026` |
| **month** | `2026-03` |
| **venue** | `川崎 ぴあにしも` (unchanged — not in payload) |
| **open_time** | `15:00` (unchanged) |
| **start_time** | `15:30` (unchanged) |
| **price** | `3,000円` (unchanged) |
| **published** | `true` (unchanged — record only) |
| **source_route** | `/schedule/2026-03/` (unchanged — record only) |
| **source_file** | `schedule-2026-03.html` (unchanged — record only) |
| **updated_at** | `2026-06-16T16:03:41.551792+00:00` |
| **expectedBeforeUpdatedAt** | `2026-06-16T16:03:41.551792+00:00` |

**Why this row (not `<ごちまきトリオ>`):**

| Criterion | `f687ebf3…` (selected) | `888c58f2…` (ごちまき — not selected) |
| --- | --- | --- |
| PoC audit marker | **none** | none today, but heavy G-9g3g4 / G-9g3h1 history |
| Prior non-dry-run Save | **none** on operator path | G-9g3g4 description Save + restore series |
| Description length | short (46 chars) — easy rollback | longer; more visible if missed rollback |
| `updated_at` | stable seed batch `2026-06-16` | recently touched `2026-06-19` |
| Operator dry-run tested | acceptable alternate | G-9j3 dry-run PASS |

`<ごちまきトリオ>` (`888c58f2-f152-4563-a3cf-a20d7c2456c1`) remains a **fallback** only if operator reconfirms live row state and explicitly accepts G-9g history overlap.

### Writable / guard checks (programmatic, G-9j4)

- `assertG9jExistingEventUpdateWritableRow` — **PASS**
- Not G-6 pilot row `aa440e29-5be8-402e-9190-0d81c48434c0`
- No `[CMS Kit staging]` marker in safe fields

---

## 4. Target field and payload

```txt
targetField: description
changedFields: ["description"]
payload keys: ["description"]
```

**Excluded from payload (recorded for context only):**

```txt
date, year, month, source_route, source_file, published,
show_on_home, home_order, sort_order, image_url, home_image_url,
created_at, updated_at, schedule_months
```

---

## 5. before / planned after

### description before

```txt
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

### description planned after (G-9j5)

```txt
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
（管理画面保存テスト）
```

### Payload (changed-fields-only)

```json
{
  "description": "出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/\n（管理画面保存テスト）"
}
```

---

## 6. Dry-run result (programmatic — G-9j4)

Executor: `executeG9jExistingEventUpdateDryRun` with live `beforeSnapshot` + operator form values.

| Item | Result |
| --- | --- |
| `ok` | `true` |
| `dryRun` | `true` |
| `changedFields` | `["description"]` |
| `payload keys` | `["description"]` |
| `expectedBeforeUpdatedAt` | `2026-06-16T16:03:41.551792+00:00` |
| `saveAllowed` | `false` |
| `guardErrors` | `[]` |
| `actualWrite` | `false` |

**Operator G-9j5 UI procedure (before Save):**

1. Open `/__admin-staging-shell/musician-basic/admin/schedule/`
2. Select row `<Duo>` / `2026-03-15` / `川崎 ぴあにしも`
3. Edit **description only** — append `（管理画面保存テスト）` on new line
4. Click **変更を確認** — expect dry-run OK panel
5. Reconfirm `expectedBeforeUpdatedAt` matches live row
6. Only then proceed to G-9j5 armed Save (operator manual once)

---

## 7. beforeSnapshot SQL (read-only)

**DO NOT RUN during G-9j4 as mutation. SELECT is for operator reconfirmation before G-9j5.**

```sql
-- DO NOT RUN during G-9j4 except as read-only SELECT in staging SQL Editor.
-- G-9j5 beforeSnapshot — staging project static-to-astro-cms-staging only
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
  published,
  source_route,
  source_file,
  created_at,
  updated_at
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and site_slug = 'gosaki-piano';
```

**Abort G-9j5 if:**

- row count ≠ 1
- `updated_at` ≠ `2026-06-16T16:03:41.551792+00:00` (re-record baseline)
- `description` ≠ before text in section 5
- `site_slug` ≠ `gosaki-piano`

---

## 8. Rollback SQL (write template only — DO NOT RUN in G-9j4)

```sql
-- DO NOT RUN during G-9j4.
-- Rollback after G-9j5 if needed (description only).
update public.schedules
set description = $$出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/$$
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and site_slug = 'gosaki-piano';
```

### Safer rollback template (after checking post-save `updated_at`)

```sql
-- DO NOT RUN during G-9j4.
-- Safer rollback template after checking the post-save updated_at:
update public.schedules
set description = $$出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/$$
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and site_slug = 'gosaki-piano'
  and updated_at = '<post-save updated_at from verification SELECT>';
```

`rollbackNeeded` default after successful G-9j5: **optional** — operator may leave test suffix briefly or rollback immediately.

---

## 9. Post-save verification SELECT (read-only template)

```sql
-- DO NOT RUN during G-9j4.
select id, site_slug, title, date, description, updated_at
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and site_slug = 'gosaki-piano';
```

### Expected after G-9j5 success

| Field | Expected |
| --- | --- |
| `id` | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| `site_slug` | `gosaki-piano` |
| `title` | `<Duo>` (unchanged) |
| `date` | `2026-03-15` (unchanged) |
| `description` | planned after (section 5) |
| `updated_at` | **new** timestamp (trigger `schedules_set_updated_at`) |
| `venue` / `open_time` / `start_time` / `price` | unchanged |
| `published` | unchanged (`true`) |
| `source_route` / `month` | unchanged |

---

## 10. Post-save confirmation procedure (G-9j5)

1. Run post-save SELECT (section 9) in staging SQL Editor
2. Confirm `description` ends with `（管理画面保存テスト）`
3. Confirm only `description` + `updated_at` changed vs beforeSnapshot
4. Confirm `title`, `date`, `venue`, times, `price`, `published`, `source_route` unchanged
5. Reload operator Schedule page — row still selectable; edit form shows new description
6. Re-run **変更を確認** dry-run — should show no further changes if form matches DB
7. Disarm all non-dry-run env flags; return to `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
8. **Do not** re-click Save on same preview identity

---

## 11. Rollback confirmation procedure

If rollback executed:

1. Run rollback SQL (section 8) once in staging SQL Editor (operator only)
2. Re-run post-save SELECT — `description` must match before text exactly
3. Record `updated_at` after rollback
4. Operator UI: select row → dry-run with unchanged form → expect **変更なし** or matching DB state
5. Document result in G-9j5 execution result doc (future phase)

---

## 12. G-9j5 explicit approval requirement

G-9j5 non-dry-run Save is **forbidden** until the operator provides explicit approval equivalent to:

```txt
G-9j5として、対象行 f687ebf3-407c-49d0-9ab8-58040c499b8e の description だけを planned after に更新してOKです。
approvalId: G-9j-gosaki-schedule-existing-event-update-non-dry-run
```

Per AGENTS.md destructive rules, formal approval may also require:

```txt
承認します。この操作を1回だけ実行してください。
```

Without this approval:

- Do not arm `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED`
- Do not enable Save button
- Do not call `updateScheduleWrite`
- Cursor / AI must not click Save

---

## 13. G-9j5 execution constraints (preview)

| Constraint | Policy |
| --- | --- |
| Rows | 1 (`f687ebf3-407c-49d0-9ab8-58040c499b8e`) |
| Fields | `description` only |
| Optimistic lock | `expectedBeforeUpdatedAt` from dry-run immediately before Save |
| Auth | Staging session + anon key |
| `service_role` | forbidden |
| Save clicks | operator manual once; Cursor does not click |
| After success | disarm env; `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

---

## 14. Planning completion statement

- G-9j4 preflight **complete**
- **No** DB write, SQL execution, Save, migration, or env arm in this phase
- **`readyForAnyDbWrite: false`** maintained
- **Next:** G-9j5 one-row non-dry-run execution — **blocked until explicit operator approval**
