# Schedule UPDATE Grant Manual Apply Prep

**Phase:** `G-6-e4-schedule-update-grant-manual-apply-prep`  
**Approval ID (prep):** `G-6-e4-schedule-update-grant-manual-apply-prep`  
**Prerequisites:** [schedule-update-grant-prep.md](./schedule-update-grant-prep.md)

**Target project:** `static-to-astro-cms-staging` — Supabase SQL Editor, manual only, never production

Cursor does not connect to Supabase or execute SQL in this phase.

## 1. Purpose

This document prepares the final manual steps for applying authenticated UPDATE grant on `public.schedules` in staging.

It does not execute GRANT.  
It does not execute REVOKE.  
It does not change RLS policies.  
It does not write schedule records.  
It does not implement the write adapter.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule UPDATE grant prep is complete.
The next human action will be a manual Supabase SQL Editor operation, but not in this phase.
The grant must be applied only to the staging Supabase project.
```

**State:**

```txt
G-6-e4-schedule-update-grant-prep: DONE
grantExecuted: false
grantChangesPerformed: false
readyForG6E4ScheduleUpdateGrantManualApplyPrep: true
```

## 3. Manual execution checklist

Before running any SQL manually, confirm:

```txt
[ ] Supabase project is staging, not production
[ ] Browser tab / project name is the staging project (static-to-astro-cms-staging)
[ ] SQL Editor is open in staging project only
[ ] No production URL/key/password is used
[ ] No service_role key is used
[ ] You are not editing RLS policies
[ ] You are not editing schema
[ ] You are only applying UPDATE grant to public.schedules
[ ] No INSERT/DELETE/TRUNCATE/TRIGGER/REFERENCES grant is included
[ ] Rollback SQL is prepared before applying GRANT (section 13)
[ ] Result recording template is ready (section 15)
```

## 4. Abort conditions

Abort immediately if:

```txt
- The Supabase project is not clearly staging
- The current grants differ from expected in a surprising way
- RLS is disabled on public.schedules
- schedules_admin_all policy is missing
- schedules_admin_all does not use is_admin()
- is_admin() definition does not check admin_users by auth.uid() and role='admin'
- admin user row cannot be confirmed
- Any SQL includes INSERT, DELETE, TRUNCATE, TRIGGER, REFERENCES, schema change, or RLS policy change
- Any production project or production credential is visible
```

Do not proceed to Step 6 (GRANT) until all abort conditions are cleared.

## 5. Step 1 — pre-check current grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
```

**Expected result before GRANT:**

```txt
anon SELECT
authenticated SELECT
```

**Allowed alternative:**

```txt
If authenticated UPDATE already exists, do not run GRANT again.
Record the result and proceed to after verification / smoke test.
```

## 6. Step 2 — confirm RLS enabled

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'schedules';
```

**Expected:**

```txt
rowsecurity = true
```

**Abort if:**

```txt
rowsecurity is not true
```

## 7. Step 3 — confirm policies

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'schedules'
order by policyname;
```

**Expected:**

```txt
schedules_public_select:
- roles includes anon/authenticated
- cmd = SELECT
- qual = published = true

schedules_admin_all:
- roles includes authenticated
- cmd = ALL
- qual = is_admin()
- with_check = is_admin()
```

**Abort if:**

```txt
schedules_admin_all is missing
schedules_admin_all does not use is_admin()
```

## 8. Step 4 — confirm is_admin()

```sql
select
  p.proname,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_admin';
```

**Expected:**

```txt
is_admin() checks public.admin_users using auth.uid() and role = 'admin'
```

**Abort if:**

```txt
is_admin() does not reference auth.uid()
is_admin() does not reference public.admin_users
is_admin() does not require role = 'admin'
```

## 9. Step 5 — confirm admin user row

SQL template only. Do not commit real email.

```sql
select user_id, email, role
from public.admin_users
where email = '<your-admin-email>';
```

**Expected:**

```txt
one row
role = admin
```

**Abort if:**

```txt
no row
role is not admin
multiple unexpected rows
```

## 10. Step 6 — apply GRANT manually

**MANUAL STAGING GRANT SQL** — user runs in Supabase SQL Editor after Steps 1–5 pass. Cursor does not execute.

```sql
-- G-6-e4-schedule-update-grant-manual-apply
-- STAGING ONLY. Do not run against production.
grant update on table public.schedules to authenticated;
```

**Important notes:**

```txt
Run this only after Steps 1–5 pass.
Run this only in staging.
Do not include any other GRANT.
Do not grant INSERT.
Do not grant DELETE.
Do not grant UPDATE to anon.
Do not touch schedule_months.
```

## 11. Step 7 — after verification: grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
```

**Expected after GRANT:**

```txt
anon SELECT
authenticated SELECT
authenticated UPDATE
```

## 12. Step 8 — after verification: no broad grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES', 'INSERT', 'DELETE')
order by grantee, privilege_type;
```

**Expected:**

```txt
no rows
```

**Abort / rollback if:**

```txt
INSERT, DELETE, TRUNCATE, TRIGGER, or REFERENCES appears unexpectedly
```

## 13. Rollback SQL

**MANUAL STAGING ROLLBACK SQL** — use if grant must be reverted.

```sql
-- Rollback for G-6-e4-schedule-update-grant-manual-apply
-- STAGING ONLY. Do not run against production.
revoke update on table public.schedules from authenticated;
```

**Rollback verification SQL:**

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'schedules'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
```

**Expected after rollback:**

```txt
anon SELECT
authenticated SELECT
```

## 14. Smoke test after future manual apply

After GRANT is applied manually (user action, not this phase):

```txt
- Start staging shell in dry-run mode
- Open /__admin-staging-shell/musician-basic/
- Confirm Debug Panel still shows expected auth/dry-run status
- Confirm Schedule section still loads
- Confirm Update dry-run still returns actualWrite:false
- Confirm Duplicate dry-run still returns actualWrite:false
- Confirm no non-dry-run button appears
- Confirm Profile PoC dry-run still returns actualWrite:false / no DB update
```

**Important:**

```txt
Applying UPDATE grant must not expose a non-dry-run UI.
```

Default env remains `PUBLIC_ADMIN_WRITE_DRY_RUN=true` for day-to-day staging work.

## 15. Result recording template

Record results in **G-6-e4-schedule-update-grant-manual-apply-result** after manual SQL execution:

```txt
G-6-e4-schedule-update-grant-manual-apply result

Project:
- staging confirmed: yes/no

Pre-check grants:
- anon SELECT: yes/no
- authenticated SELECT: yes/no
- authenticated UPDATE before apply: yes/no

RLS:
- rowsecurity true: yes/no

Policies:
- schedules_public_select present: yes/no
- schedules_admin_all present: yes/no
- schedules_admin_all uses is_admin(): yes/no

is_admin():
- references auth.uid(): yes/no
- references public.admin_users: yes/no
- requires role='admin': yes/no

Admin user:
- row found: yes/no
- role admin: yes/no

Grant:
- GRANT UPDATE executed: yes/no
- SQL success: yes/no

After verification:
- authenticated UPDATE present: yes/no
- INSERT absent: yes/no
- DELETE absent: yes/no
- TRUNCATE absent: yes/no
- TRIGGER absent: yes/no
- REFERENCES absent: yes/no

Rollback:
- rollback executed: yes/no
- reason if rollback executed:

Smoke test:
- staging shell loaded: yes/no
- Schedule dry-run actualWrite:false: yes/no
- Duplicate dry-run actualWrite:false: yes/no
- non-dry-run UI absent: yes/no
- Profile dry-run still safe: yes/no

Final:
- grant manual apply status: pass/fail/rolled_back
```

## 16. Gate decision

```txt
readyForManualGrantApply: true (was true at prep time)
grantExecuted: true (user manual — see schedule-update-grant-manual-apply-result.md)
grantChangesPerformed: true
readyForG6E4ScheduleUpdateGrantManualApplyResult: true (recorded)
readyForG6E4ScheduleWriteAdapterImplementation: true
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
writeAdapterImplemented: false
dbWritesPerformed: false
```

**G-6-e4-schedule-update-grant-manual-apply-result（完了）:** [schedule-update-grant-manual-apply-result.md](./schedule-update-grant-manual-apply-result.md) — `authenticated UPDATE` on `public.schedules` applied in staging; after verification pass; dry-run smoke test pass; no schedule DB write.

## 17. Recommended next phase

```txt
Recommended next:
G-6-e4-schedule-update-grant-manual-apply-result — DONE (see schedule-update-grant-manual-apply-result.md)
Next: G-6-e4-schedule-write-adapter-implementation
```

## 18. Final safety statement

This phase prepares the manual apply procedure only.

No GRANT is executed by Cursor.  
No REVOKE is executed by Cursor.  
No schedule records are written.  
No RLS policy is changed.  
No write adapter is implemented.  
No production data is touched.  
No `/admin` route is connected.

Schedule write implementation remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-update-grant-manual-apply-prep.mjs \
  --out-dir tools/static-to-astro/output/schedule-update-grant-manual-apply-prep/gosaki
```
