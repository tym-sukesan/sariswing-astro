# Schedule PoC Isolation and Dry-Run Default

**Phase:** `G-6-f1-schedule-poc-isolation-dry-run-default`  
**Prerequisites:** [schedule-non-dry-run-poc-explicit-retry-result.md](./schedule-non-dry-run-poc-explicit-retry-result.md), [schedule-cms-generalization-planning.md](./schedule-cms-generalization-planning.md)

## 1. Purpose

Isolate the completed G-6-e5 hidden Schedule non-dry-run PoC trigger so it cannot be accidentally re-run during Schedule CMS generalization work.

This phase does **not** perform database writes.  
It does **not** click the hidden PoC Run button.  
It does **not** execute rollback SQL.  
It does **not** modify `/admin` or `src/pages/admin`.

## 2. G-6-e5 success record (unchanged)

```txt
Phase: G-6-e5-schedule-non-dry-run-poc-explicit-retry-result
Result: SUCCESS
Table: public.schedules (one existing row)
Change: description only → 出演： [G-6-e5 non-dry-run PoC]
actualWrite: true
service_role: not used
schedule_months: not touched
rollbackNeeded: false
Run button: user manual once only
```

Staging row may retain the PoC marker in `description` until an optional rollback phase. No rollback in this phase.

## 3. Risk assessment (before G-6-f1)

### 3.1 Prior gate stack (G-6-e5)

Hidden Danger Zone required **all** of:

```txt
DEV=true
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e5-schedule-non-dry-run-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true
PUBLIC_ADMIN_NON_DRY_RUN_POC_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0
PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY (staging)
```

### 3.2 Residual risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Re-run with copied G-6-e5 inline env | **High** | Old command sets `DRY_RUN=false` + `POC_TRIGGER=true` |
| G-6-e5 approval ID reused in general UI | **High** | Would bypass phased generalization approvals |
| `DRY_RUN` unset at dev start | Medium | Defaults to `true` in code (`!== "false"`) for PoC config dryRun flag, but write module env may still confuse operators |
| Hidden trigger mistaken for general Save | Medium | UI looked like production write path |
| Mock allowlist UI vs RLS | Low | Documented; G-6-e5 proved RLS path works |

### 3.3 Default dry-run behavior

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN unset → treated as true (dry-run)
PoC trigger additionally requires dryRun === false (explicit non-dry-run)
Schedule dry-run UI (G-6-e2) is always dry-run only
Profile PoC respects PUBLIC_ADMIN_WRITE_DRY_RUN from staging-write-config
```

## 4. G-6-f1 implementation changes

### 4.1 Additional env gate (code)

After G-6-f1, hidden Danger Zone also requires:

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true
```

**Default:** unset or not `true` → Danger Zone **hidden** (disarmed).

This breaks accidental re-run when only the old G-6-e5 env block is copied (without the new flag).

Constant: `SCHEDULE_NON_DRY_RUN_POC_EXPLICIT_RERUN_ENV` in `schedule-non-dry-run-poc-config.ts`.

### 4.2 Completed notice UI

`AdminStagingScheduleNonDryRunPocCompletedNotice.astro` — always visible on staging shell schedule section:

- G-6-e5 completed; do not click Run again
- G-6-e5 approval ID is one-off; general UI needs new approval IDs
- Default `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
- Explicit rerun requires `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true`

### 4.3 Approval ID reuse prohibition (code comment)

`schedule-write-types.ts` documents that `G-6-e5-schedule-non-dry-run-poc` is **not** for general Schedule CMS UI.

### 4.4 Boundary: hidden PoC vs general UI

| Layer | Hidden G-6-e5 PoC | Future general Schedule UI |
| --- | --- | --- |
| Visibility | Env-gated Danger Zone | Normal Schedule module section |
| Approval ID | `G-6-e5-schedule-non-dry-run-poc` only | New IDs per milestone (e.g. G-6-f5) |
| Activation | `EXPLICIT_RERUN=true` + full old gate stack | Dry-run first; non-dry-run explicit phase |
| Target | Fixed UUID | User-selected row from list |
| Retirement | Disarmed by default after G-6-f1 | Primary path |

## 5. Default dev server (recommended)

**Day-to-day staging shell work — dry-run default:**

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Optional when exercising write gates without non-dry-run:

```bash
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-e2-schedule-dry-run-ui \
```

**Do not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` unless in an approved explicit non-dry-run phase.

**Do not** set `PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true` for normal development after G-6-e5 success.

## 6. Non-dry-run env (archived — explicit rerun only)

The G-6-e5 one-off command is preserved in [schedule-non-dry-run-poc-explicit-retry-result.md](./schedule-non-dry-run-poc-explicit-retry-result.md) and execution-path verification docs.

**After G-6-f1**, arming the hidden trigger also requires:

```txt
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true
```

Only use in a **new documented explicit rerun phase** with beforeSnapshot, rollback SQL, and user manual Run once. Cursor / Playwright must not click Run.

## 7. Safety rules (maintained)

```txt
- production / Sariswing production: do not touch
- Supabase production project: do not touch
- staging project only: static-to-astro-cms-staging
- service_role: prohibited
- /admin and src/pages/admin: do not modify
- schedule_months: read-only / derived
- INSERT / DELETE / UPSERT: deferred
- hidden PoC Run button: do not re-click without explicit rerun phase
- rollback SQL: available in result doc; not executed in G-6-f1
- Playwright / Chromium auto-click: prohibited
- Storage / Publish / FTP / workflow_dispatch: prohibited
```

## 8. Gate decision

```txt
g6e5PocCompleted: true
hiddenPocTriggerDisarmedByDefault: true
explicitRerunGateRequired: true
dryRunDefaultDocumented: true
g6e5ApprovalIdReuseProhibited: true
completedNoticeUiAdded: true
dbWritesInThisPhase: false
runButtonClickedInThisPhase: false
readyForScheduleReadUiBinding: true
```

## 9. Recommended next phase

```txt
G-6-f2-schedule-read-ui-binding-audit
```

Wire `ScheduleAdminUi` to `loadSchedulesForDryRunUi` on staging shell (SELECT only).

## 10. Related files

```txt
src/lib/admin/staging-write/schedule-non-dry-run-poc-config.ts
src/lib/admin/staging-write/schedule-write-types.ts
tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocCompletedNotice.astro
tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro
tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro
```
