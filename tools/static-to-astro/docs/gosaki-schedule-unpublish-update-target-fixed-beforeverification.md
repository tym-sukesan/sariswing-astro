# G-22f4b — Gosaki Schedule unpublish UPDATE target fixed / beforeVerification record

**Phase:** `G-22f4b-gosaki-schedule-unpublish-update-target-fixed-beforeverification`  
**Status:** **complete** — target fixed + beforeVerification PASS recorded; **no Save / DB write**  
**Date:** 2026-07-06  
**Base commit:** `8945905`  
**Prior:** [gosaki-schedule-unpublish-update-final-preflight.md](./gosaki-schedule-unpublish-update-final-preflight.md) (G-22f4)

| Check | Status |
| --- | --- |
| Candidate list executed (operator) | **yes** |
| Target row fixed in doc | **yes** |
| beforeVerification PASS (operator) | **yes** |
| UPDATE slice | `published=true` → `published=false` only |
| Physical DELETE | **no** |
| Rollback needed | **no** (template only; not executed) |
| Save / UPDATE executed | **no** |
| Ready for G-22f5 | **yes** |

---

## Gates

```txt
gosakiScheduleUnpublishUpdateTargetFixedBeforeverificationComplete: true
phase: G-22f4b-gosaki-schedule-unpublish-update-target-fixed-beforeverification
approvalId: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
targetFixedInDoc: true
beforeVerificationPass: true
readyForG22f5ScheduleUnpublishUpdateOperatorExecution: true
expectedBeforeUpdatedAt: 2026-06-16T16:03:41.551792+00:00
targetMonthCountBefore: 14
rollbackNeeded: false
rollbackSqlExecuted: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
grantRevokeExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`

**This is NOT physical DELETE.** Slice is `published=true` → `published=false` UPDATE only.

---

## 1. Purpose

Record operator-confirmed target row and beforeVerification PASS results so G-22f5 can proceed with a single unpublish UPDATE Save.

G-22f4b does **not** click Save, run UPDATE, or execute rollback SQL.

---

## 2. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean at G-22f4b start) |
| `HEAD` | `8945905` |
| `origin/main` | `8945905` |

---

## 3. Target fixed record

Operator selected from G-22f4 candidate list (`published=true`). Cursor did **not** auto-select.

| Field | Value |
| --- | --- |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `legacy_id` | `schedule-2026-07-008` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-07-17` |
| `year` | `2026` |
| `month` | `2026-07` |
| `title` | `<>` |
| `venue` | `` (empty string) |
| `open_time` | `null` |
| `start_time` | `null` |
| `price` | `null` |
| `description` | `出演：` |
| `published` (before) | `true` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `sort_order` | `8` |
| `source_route` | `/schedule/2026-07/` |
| `source_file` | `schedule-2026-07.html` |
| `created_at` | `2026-06-05T17:39:44.140168+00:00` |
| `updated_at` (before) | `2026-06-16T16:03:41.551792+00:00` |
| `target_month_count_before` | `14` |

### UPDATE payload (G-22f5)

| Field | Before | After |
| --- | --- | --- |
| `published` | `true` | `false` |
| All other columns | unchanged | unchanged |
| `updated_at` | `2026-06-16T16:03:41.551792+00:00` | changes via DB trigger (record in G-22f6) |

**`expectedBeforeUpdatedAt`:** `2026-06-16T16:03:41.551792+00:00` (must match UI dev panel at Save time).

**Public reflection:** not part of G-22f4b / G-22f5. Package regen / FTP **not** executed.

---

## 4. beforeVerification PASS (operator — SELECT only)

Executed on staging `kmjqppxjdnwwrtaeqjta` before G-22f5. Cursor did **not** execute SQL in G-22f4b.

| Check | Result |
| --- | --- |
| `authenticated` UPDATE | **yes** |
| `anon` UPDATE | **no** |
| RLS enabled | **true** |
| `schedules_admin_all` | **unchanged** |
| `target_id_count` | `1` |
| `target_legacy_id_count` | `1` |
| `target_published_true_count` | `1` |
| `target_is_protected_legacy_count` | `0` |
| Protected `schedule-2026-03-014` | **unchanged** / `published=false` |
| Protected `schedule-2026-09-001` | **unchanged** / `published=false` |
| `target_month_count_before` | `14` |

### Protected rows (unchanged baseline)

| `legacy_id` | `id` | `published` |
| --- | --- | --- |
| `schedule-2026-03-014` | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `false` |
| `schedule-2026-09-001` | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `false` |

**Target is not** `schedule-2026-03-014` or `schedule-2026-09-001`.

---

## 5. G-22f5 handoff values

| Item | Value |
| --- | --- |
| Target `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| Target `legacy_id` | `schedule-2026-07-008` |
| `expectedBeforeUpdatedAt` | `2026-06-16T16:03:41.551792+00:00` |
| `approvalId` | `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true` |
| Patch | `{ published: false }` only |
| `changedFields` | `["published"]` |
| `wouldDelete` / `physicalDelete` | `false` |
| `target_month_count_before` | `14` (afterVerification baseline) |
| Operator action | Save **once** only in G-22f5 |

### G-22f5 dev arm command

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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

### G-22f5 UI procedure (operator)

1. Open `/__admin-staging-shell/musician-basic/admin/schedule/`
2. Select row `schedule-2026-07-008` (`published=true`, title `<>`)
3. **非公開化案を作成** → **変更を確認** (dry-run `operation=unpublish`)
4. Verify dev panel: `expectedBeforeUpdatedAt = 2026-06-16T16:03:41.551792+00:00`
5. **非公開化を保存** — click **once** only
6. Do **not** re-click Save; do **not** unpublish protected rows

---

## 6. afterVerification baseline (G-22f6 — post G-22f5 Save)

Use values from §3 for protected-field checks. Placeholder `:target_updated_at_after` from post-Save row.

**Expected after G-22f5:**

- Row still exists (`target_row_exists = 1`)
- `published = false`
- `legacy_id` count = 1
- All non-`published` fields unchanged
- `updated_at` ≠ `2026-06-16T16:03:41.551792+00:00`
- `target_month_count_after = 14`
- Protected rows unchanged (§4)

---

## 7. Rollback SQL template (UPDATE — not needed / not executed)

Rollback **not needed** if G-22f5 targets correct row. Template for emergency only (staging):

```sql
begin;
update public.schedules
set published = true
where id = '3e572f02-4f35-460e-80a1-3a7d15ca3fd9'
  and legacy_id = 'schedule-2026-07-008'
  and site_slug = 'gosaki-piano'
  and published = false
  and updated_at = ':target_updated_at_after';
commit;
```

**DO NOT EXECUTE** unless operator / assistant confirms wrong unpublish.

---

## 8. Not executed in G-22f4b

| Item | Status |
| --- | --- |
| Save click | **no** |
| DB write / Supabase mutation | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| Rollback SQL execution | **no** |
| GRANT / REVOKE | **no** |
| package regen / FTP / deploy | **no** |
| commit / push | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f4b-gosaki-schedule-unpublish-update-target-fixed-beforeverification.mjs
```

---

## 10. Fix required?

**No.** Target fixed and beforeVerification PASS recorded. Proceed to **G-22f5** — operator Save once only.
