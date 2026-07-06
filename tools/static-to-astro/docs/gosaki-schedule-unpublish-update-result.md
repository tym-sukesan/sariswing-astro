# G-22f6 — Gosaki Schedule unpublish UPDATE execution result

**Phase:** `G-22f6-gosaki-schedule-unpublish-update-execution-result`  
**Status:** **complete** — operator Save + afterVerification recorded; **G-22f5 DB write closed**  
**Date:** 2026-07-06  
**Base commit:** `500aaf0`  
**Prior:** [gosaki-schedule-unpublish-update-target-fixed-beforeverification.md](./gosaki-schedule-unpublish-update-target-fixed-beforeverification.md) (G-22f4b); G-22f5 operator single unpublish UPDATE execution

| Check | Status |
| --- | --- |
| Save executed (operator once) | **yes** |
| afterVerification | **PASS** |
| Physical DELETE | **no** |
| Target row still exists | **yes** |
| Protected rows unchanged | **yes** |
| rollback needed | **no** |
| public reflection | **not executed** |
| package regen / FTP | **not executed** |
| Cursor Save / SQL | **no** |
| Save re-execution | **forbidden** |

---

## Gates

```txt
gosakiScheduleUnpublishUpdateExecutionResultComplete: true
phase: G-22f6-gosaki-schedule-unpublish-update-execution-result
g22f5UnpublishUpdateChainSaveClosed: true
readyForG22fUnpublishUpdateSaveReExecution: false
rollbackNeeded: false
rollbackSqlExecuted: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
cursorGrantRevokeExecuted: false
physicalDeleteOccurred: false
```

**approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`  
**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

**Do not re-click 「非公開化を保存」** for this slice. G-22f5 DB write is **closed** (single UPDATE: `published` only).

**This is NOT physical DELETE.** Row remains in `public.schedules`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `500aaf0` |
| `origin/main` | `500aaf0` |

---

## 2. Execution summary

```txt
Execution: PASS
beforeVerification: PASS (G-22f4b / operator pre-G-22f5)
Save button clicked: yes (operator manual, exactly once — G-22f5)
DB write performed: yes (one UPDATE on public.schedules — published only)
operation: unpublish-update
actualWrite: true
targetId: 3e572f02-4f35-460e-80a1-3a7d15ca3fd9
legacy_id: schedule-2026-07-008
published: true → false
wouldDelete: false
physicalDelete: false
changedFields: ["published"] only
updated_at_before_preflight: 2026-06-16T16:03:41.551792+00:00
updated_at_after: 2026-07-06T13:58:41.425402+00:00
target_month_count: 14 → 14 (unchanged)
service_role used: false
production touched: false
/admin touched: false
rollback needed: false
rollback executed: false
public reflection: not executed
package regen / FTP: not executed
```

---

## 3. Execution context

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/schedule/
Approval ID: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
Env arm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true
Write path: executeG22fScheduleUnpublishUpdateSave → updateScheduleWrite + buildScheduleLockedWriteRequest
Session: authenticated (staging Supabase Auth)
Protected rows (non-touch): schedule-2026-03-014 (G-22d), schedule-2026-09-001 (G-22e)
```

---

## 4. Save result (operator — G-22f5)

| Field | Value |
| --- | --- |
| `operation` | `unpublish-update` |
| `approvalId` | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` |
| `targetId` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `legacy_id` | `schedule-2026-07-008` |
| `before.published` | `true` |
| `after.published` | `false` |
| `actualWrite` | `true` |
| `wouldDelete` | `false` |
| `physicalDelete` | `false` |
| `updated_at_after` (Save result) | `2026-07-06T13:58:41.425402+00:00` |

### UI display note (non-blocking)

Save result screen showed `expectedBeforeUpdatedAt` equal to `updated_at_after`. **afterVerification on staging DB confirmed the UPDATE succeeded** — `published=false`, `updated_at` changed from preflight baseline, all other fields unchanged. No rollback required.

---

## 5. Target row afterVerification (confirmed)

| Field | Before (preflight) | After (G-22f6) | Changed |
| --- | --- | --- | --- |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | same | no |
| `legacy_id` | `schedule-2026-07-008` | same | no |
| `site_slug` | `gosaki-piano` | same | no |
| `date` | `2026-07-17` | same | no |
| `year` | `2026` | same | no |
| `month` | `2026-07` | same | no |
| `title` | `<>` | same | no |
| `venue` | `` (empty) | same | no |
| `open_time` | `null` | same | no |
| `start_time` | `null` | same | no |
| `price` | `null` | same | no |
| `description` | `出演：` | same | no |
| `show_on_home` | `false` | same | no |
| `home_order` | `null` | same | no |
| `sort_order` | `8` | same | no |
| `source_route` | `/schedule/2026-07/` | same | no |
| `source_file` | `schedule-2026-07.html` | same | no |
| `created_at` | `2026-06-05T17:39:44.140168+00:00` | same | no |
| `published` | `true` | **`false`** | **yes** |
| `updated_at` | `2026-06-16T16:03:41.551792+00:00` | **`2026-07-06T13:58:41.425402+00:00`** | **yes** (DB trigger) |

Row **still exists** — physical DELETE did not occur.

---

## 6. afterVerification PASS (operator — SELECT only)

Executed on staging `kmjqppxjdnwwrtaeqjta` after G-22f5 Save. Cursor did **not** execute SQL in G-22f6.

| Check | Result |
| --- | --- |
| `target_row_count` | `1` |
| `target_legacy_id_count` | `1` |
| `published_after` | `false` |
| `published_is_false` | `true` |
| `updated_at_after` | `2026-07-06T13:58:41.425402+00:00` |
| `updated_at_changed_from_preflight` | `true` |
| `updated_at_equals_save_result_reported` | `true` |
| `target_month_count_before` | `14` |
| `target_month_count_after` | `14` |
| `date_unchanged` | `true` |
| `year_unchanged` | `true` |
| `month_unchanged` | `true` |
| `title_unchanged` | `true` |
| `venue_unchanged` | `true` |
| `open_time_unchanged` | `true` |
| `start_time_unchanged` | `true` |
| `price_unchanged` | `true` |
| `description_unchanged` | `true` |
| `show_on_home_unchanged` | `true` |
| `home_order_unchanged` | `true` |
| `sort_order_unchanged` | `true` |
| `source_route_unchanged` | `true` |
| `source_file_unchanged` | `true` |
| Physical DELETE | **did not occur** |
| `authenticated` INSERT / SELECT / UPDATE grants | unchanged |
| `anon` SELECT only | unchanged |
| RLS enabled | `true` |
| `schedules_admin_all` | unchanged |
| `schedules_public_select` | unchanged |

### Protected rows (unchanged)

| `legacy_id` | `published` | Status |
| --- | --- | --- |
| `schedule-2026-03-014` | `false` | unchanged |
| `schedule-2026-09-001` | `false` | unchanged |

`protected_row_count = 2` · `all_protected_rows_still_unpublished = true`

---

## 7. Rollback

**Not needed.** Rollback UPDATE template archived in [gosaki-schedule-unpublish-update-final-preflight.md](./gosaki-schedule-unpublish-update-final-preflight.md) §8 — **NOT executed**.

```sql
-- Archive only — DO NOT EXECUTE unless operator confirms wrong unpublish
-- update public.schedules set published = true
-- where id = '3e572f02-4f35-460e-80a1-3a7d15ca3fd9'
--   and legacy_id = 'schedule-2026-07-008'
--   and site_slug = 'gosaki-piano'
--   and published = false
--   and updated_at = '2026-07-06T13:58:41.425402+00:00';
```

---

## 8. Public reflection / package / FTP

| Item | Status |
| --- | --- |
| Public site reflection | **not executed** |
| package regen | **not executed** |
| FTP / deploy | **not executed** |

Unpublish on staging DB only. Public `/cms-kit-staging/gosaki-piano/` schedule pages may still show the event until a future reflection phase (if ever needed for unpublished rows).

---

## 9. G-22f chain status

| Phase | Status |
| --- | --- |
| G-22f dry-run UI | complete |
| G-22f1 local QA | complete |
| G-22f2 planning | complete |
| G-22f3 implementation | complete |
| G-22f4 final preflight | complete |
| G-22f4b target fixed / beforeVerification | complete |
| G-22f5 operator Save once | **complete** |
| **G-22f6 execution result** | **complete** (this doc) |
| G-22f7 chain closure | **next** |
| Physical DELETE | **deferred** (separate future phase) |

**Closed slice — do not re-Save:** `schedule-2026-07-008` unpublish UPDATE (`G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`).

---

## 10. Not executed in G-22f6

| Item | Status |
| --- | --- |
| Save re-click | **no** |
| Cursor DB write / SQL mutation | **no** |
| Rollback SQL execution | **no** |
| GRANT / REVOKE | **no** |
| package regen / FTP / deploy | **no** |
| commit / push | **no** |

---

## 11. Next actions

1. **G-22f7** — unpublish UPDATE chain closure doc
2. **Schedule P0** — remaining CRUD items (physical DELETE deferred; price/general edit slices; public reflection policy for unpublished rows)
3. Routine dev: `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; all write arms off

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f6-gosaki-schedule-unpublish-update-result.mjs
```

---

## 13. Fix required?

**No.** G-22f5 single unpublish UPDATE succeeded; afterVerification PASS. Proceed to **G-22f7** chain closure. Do **not** re-Save `schedule-2026-07-008`.
