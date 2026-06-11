# Staging RLS Grant Cleanup Manual Apply Prep

## 1. Purpose

**Phase:** `G-6-rls-grant-cleanup-manual-apply-prep`

This document prepares a manual staging-only GRANT cleanup.
It does not execute REVOKE.
It does not execute GRANT.
It does not change policies.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase. All SQL below is for **manual execution by the user** in Supabase SQL Editor on `static-to-astro-cms-staging` only.

Follows [staging-rls-grant-cleanup-plan.md](./staging-rls-grant-cleanup-plan.md) and [staging-rls-audit-result.md](./staging-rls-audit-result.md).

## 2. Target project

```txt
Target project: static-to-astro-cms-staging
Execution method: Supabase SQL Editor, manual only
Production: never
```

Confirm the Supabase dashboard project name before running any SQL. If the project is not `static-to-astro-cms-staging`, **stop immediately**.

## 3. Cleanup target

**Privileges to revoke:**

```txt
TRUNCATE
TRIGGER
REFERENCES
```

**Target grantees:**

```txt
anon
authenticated
```

**Target tables:**

```txt
public.admin_users
public.discography
public.discography_tracks
public.profile
public.schedule_months
public.schedules
```

## 4. Permissions to preserve

Do **not** remove the following in this cleanup:

```txt
- SELECT grants
- public read grants needed by public/staging read flows
- authenticated SELECT on admin_users, needed for profile UPDATE policy / self-read
- authenticated UPDATE on profile, restricted by RLS policy
- RLS policies themselves
```

This cleanup targets **TRUNCATE / TRIGGER / REFERENCES only**.

## 5. Pre-apply checklist

Before running any SQL in Supabase SQL Editor:

```txt
[ ] Supabase project is static-to-astro-cms-staging
[ ] Not production
[ ] SQL Editor is connected to staging
[ ] No service_role key is used
[ ] G-6-d dry-run restore check is PASS
[ ] G-6-e implementation remains blocked
[ ] Rollback SQL is available (§12)
[ ] User is ready to run REVOKE manually
```

## 6. Before verification SQL

Run this **read-only** query before REVOKE:

```sql
-- MANUAL READ-ONLY CHECK.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profile',
    'admin_users',
    'schedules',
    'schedule_months',
    'discography',
    'discography_tracks'
  )
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;
```

**Expected:**

```txt
Currently multiple rows are returned.
Target privileges are TRUNCATE / TRIGGER / REFERENCES only.
```

If no rows are returned, cleanup may already be applied — record in G-6-rls-grant-cleanup-result instead of re-running REVOKE.

## 7. Manual REVOKE SQL

**This is the final manual apply SQL.** Cursor does **not** execute it in this phase. Run only after §5 checklist and §6 before verification pass.

```sql
-- MANUAL STAGING CLEANUP SQL.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.
-- Run manually in Supabase SQL Editor only after final confirmation.

revoke truncate, trigger, references on table public.admin_users from anon, authenticated;
revoke truncate, trigger, references on table public.discography from anon, authenticated;
revoke truncate, trigger, references on table public.discography_tracks from anon, authenticated;
revoke truncate, trigger, references on table public.profile from anon, authenticated;
revoke truncate, trigger, references on table public.schedule_months from anon, authenticated;
revoke truncate, trigger, references on table public.schedules from anon, authenticated;
```

**Alternative split form** if a combined REVOKE statement fails:

```sql
-- revoke truncate on table public.profile from anon, authenticated;
-- revoke trigger on table public.profile from anon, authenticated;
-- revoke references on table public.profile from anon, authenticated;
-- (repeat per table as needed)
```

## 8. After verification SQL

Run this **read-only** query immediately after REVOKE:

```sql
-- MANUAL READ-ONLY CHECK AFTER CLEANUP.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profile',
    'admin_users',
    'schedules',
    'schedule_months',
    'discography',
    'discography_tracks'
  )
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;
```

**Expected:**

```txt
No rows returned.
```

## 9. Preserved permissions verification SQL

Run this **read-only** query after REVOKE to confirm needed grants remain:

```sql
-- MANUAL READ-ONLY CHECK FOR PRESERVED PERMISSIONS.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'profile',
    'admin_users',
    'schedules',
    'schedule_months',
    'discography',
    'discography_tracks'
  )
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('SELECT', 'UPDATE', 'INSERT', 'DELETE')
order by table_name, grantee, privilege_type;
```

**Expected:**

```txt
- profile authenticated UPDATE remains
- needed SELECT grants remain
- no unexpected INSERT / DELETE is newly introduced
```

## 10. Functional smoke test after cleanup

After SQL verification, manually confirm in the staging shell:

```txt
[ ] Staging shell opens
[ ] Supabase Auth login still works
[ ] Debug Panel shows Auth status: authenticated
[ ] Debug Panel shows Dry-run mode: true
[ ] Profile read still works
[ ] Profile dry-run Save simulates payload only
[ ] No non-dry-run Save is executed
[ ] /admin route remains unconnected
[ ] Production remains untouched
```

Staging shell route: `/__admin-staging-shell/musician-basic/` (not `/admin/`).

## 11. Abort conditions

**Stop and do not run REVOKE** if any of the following apply:

```txt
- Project is not static-to-astro-cms-staging
- Any production project is open
- SQL contains service_role key or secrets
- SQL includes DROP POLICY / CREATE POLICY / ALTER TABLE
- SQL includes DELETE / INSERT / UPDATE / TRUNCATE commands (as data operations)
- User is unsure whether the selected project is staging
- Before verification result differs substantially from expected
```

**Note:** The REVOKE SQL contains `revoke truncate` — this removes the **privilege** to truncate tables; it does **not** execute `TRUNCATE` on table data. Project confirmation remains mandatory.

## 12. Rollback SQL

Use only if cleanup unexpectedly breaks staging behavior. Cursor does **not** execute this.

```sql
-- MANUAL STAGING ROLLBACK SQL.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.
-- Run only if cleanup unexpectedly breaks staging behavior.

grant truncate, trigger, references on table public.admin_users to anon, authenticated;
grant truncate, trigger, references on table public.discography to anon, authenticated;
grant truncate, trigger, references on table public.discography_tracks to anon, authenticated;
grant truncate, trigger, references on table public.profile to anon, authenticated;
grant truncate, trigger, references on table public.schedule_months to anon, authenticated;
grant truncate, trigger, references on table public.schedules to anon, authenticated;
```

## 13. Result recording template

After manual execution, record results in **G-6-rls-grant-cleanup-result** (future phase):

```txt
Manual cleanup result:

targetProject:
static-to-astro-cms-staging

cleanupExecuted:
true / false

executedAt:
YYYY-MM-DD HH:mm:ss

beforeVerification:
expected broad grants present / unexpected

revokeResult:
success / failed

afterVerification:
no rows returned / rows remain

preservedPermissionsVerification:
pass / review_required

smokeTest:
pass / review_required

rollbackExecuted:
false

productionDataTouched:
false

adminRouteConnected:
false

notes:
...
```

## 14. Gate state

**This prep phase (no execution by Cursor):**

```txt
manualApplyPrepCreated: true
cleanupExecuted: false
rollbackExecuted: false
readyForManualCleanupApply: true
readyForG6EPlanning: true
readyForG6EImplementation: false
grantChangesPerformed: false
policyChangesPerformed: false
dbWritesPerformed: false
productionDataTouched: false
adminRouteConnected: false
```

## 15. Recommended next step

```txt
User manually runs before verification SQL, REVOKE SQL, after verification SQL, and smoke test in Supabase SQL Editor for static-to-astro-cms-staging.
Then record results in G-6-rls-grant-cleanup-result.
```

Do **not** proceed to G-6-e implementation until cleanup result is reviewed.

## 16. Final safety statement

```txt
This phase prepares manual staging cleanup only.
No grants are changed by Cursor.
No policies are changed.
No database writes are performed.
No production data is touched.
G-6-e implementation remains blocked until manual cleanup result is reviewed.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-rls-grant-cleanup-manual-apply-prep.mjs \
  --out-dir tools/static-to-astro/output/staging-rls-grant-cleanup-manual-apply-prep/gosaki
```
