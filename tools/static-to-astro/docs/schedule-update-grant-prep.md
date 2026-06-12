# Schedule UPDATE Grant Prep

**Phase:** `G-6-e4-schedule-update-grant-prep`  
**Approval ID (prep):** `G-6-e4-schedule-update-grant-prep`  
**Prerequisites:** [schedule-write-adapter-implementation-planning.md](./schedule-write-adapter-implementation-planning.md), [schedule-schema-read-audit-result.md](./schedule-schema-read-audit-result.md)

**Target project:** `static-to-astro-cms-staging` (manual SQL in Supabase SQL Editor only — never production)

Cursor does not connect to Supabase or execute SQL in this phase.

## 1. Purpose

This document prepares a manual, staging-only UPDATE grant review for `public.schedules`.

It does not execute GRANT.  
It does not execute REVOKE.  
It does not change RLS policies.  
It does not write schedule records.  
It does not implement the write adapter.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Current status

```txt
Schedule dry-run adapter is implemented and verified.
Schedule write adapter implementation planning is complete.
The first real write PoC is planned as a single pre-seeded schedule row update.
Current observed schedules grants were SELECT-only for anon/authenticated.
```

**Completed prerequisites:**

```txt
G-6-e4-schedule-write-adapter-planning: DONE
G-6-e4-schedule-write-adapter-implementation-planning: DONE
readyForG6E4ScheduleUpdateGrantPrep: true
```

## 3. Why UPDATE grant prep is needed

```txt
RLS policy schedules_admin_all may allow admin-only writes through is_admin().
However, PostgreSQL table privileges also require UPDATE to be granted to authenticated.
Without authenticated UPDATE grant, an authenticated admin user may still receive permission denied before RLS can allow the update.
```

**Important:**

```txt
Granting UPDATE to authenticated does not by itself allow all authenticated users to update rows if RLS remains enabled and the write policy requires is_admin().
Both table GRANT and RLS policy must allow the operation.
```

**However:**

```txt
This is still a permission change and must be applied manually, separately, and only on staging.
```

## 4. Scope of future grant

**Target table:**

```txt
public.schedules
```

**Minimum grant candidate:**

```txt
authenticated UPDATE only
```

**Explicit exclusions:**

```txt
- anon UPDATE
- authenticated INSERT
- authenticated DELETE
- authenticated TRUNCATE
- authenticated TRIGGER
- authenticated REFERENCES
- schedule_months UPDATE
- any production grant
```

## 5. Manual pre-check SQL

Run in Supabase SQL Editor on **staging only** before any GRANT. Cursor does not execute these.

### 5.1 Confirm current table grants

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

**Expected current state:**

```txt
anon SELECT
authenticated SELECT
```

If `authenticated UPDATE` already exists, **stop** — document the finding and skip GRANT application.

### 5.2 Confirm schedule policies

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
schedules_public_select: SELECT where published = true
schedules_admin_all: ALL where is_admin(), with_check is_admin()
```

### 5.3 Confirm RLS enabled

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

### 5.4 Confirm is_admin function definition

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
is_admin() checks public.admin_users with auth.uid() and role='admin'
```

If definition differs or function is missing, **abort** grant application until reviewed.

### 5.5 Confirm admin user row

Use a placeholder email only in committed docs. Do not commit real admin email.

```sql
select user_id, email, role
from public.admin_users
where email = '<your-admin-email>';
```

**Expected:**

```txt
one row with role = admin
```

## 6. Manual GRANT SQL candidate

**MANUAL STAGING GRANT SQL** — do not run in this prep phase. User runs manually in a later apply phase after pre-checks pass.

```sql
-- G-6-e4-schedule-update-grant-prep
-- STAGING ONLY. Do not run against production.
grant update on table public.schedules to authenticated;
```

**Notes:**

```txt
This grants table-level UPDATE privilege to authenticated.
RLS still restricts actual updates to rows allowed by schedules_admin_all using is_admin().
Do not grant INSERT or DELETE in this phase.
Do not grant UPDATE to anon.
```

**Pre-apply checklist (user manual):**

```txt
[ ] Supabase project is static-to-astro-cms-staging
[ ] Not production
[ ] Section 5 pre-check SQL all pass
[ ] is_admin() definition confirmed
[ ] admin_users row confirmed for test user
[ ] Rollback REVOKE SQL copied to SQL Editor tab (section 8)
[ ] No service_role key used
```

## 7. After verification SQL

Run after manual GRANT in a future apply phase.

### 7.1 Confirm UPDATE grant present

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

**Expected:**

```txt
anon SELECT
authenticated SELECT
authenticated UPDATE
```

### 7.2 Confirm broad grants did not return

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

## 8. Rollback SQL

**MANUAL STAGING ROLLBACK SQL** — use if grant must be reverted.

```sql
-- Rollback for G-6-e4-schedule-update-grant-prep
-- STAGING ONLY. Do not run against production.
revoke update on table public.schedules from authenticated;
```

**Expected state after rollback:**

```txt
anon SELECT
authenticated SELECT
```

Re-run section 7.1 SQL to confirm `authenticated UPDATE` is absent.

## 9. Risk assessment

**Risk:**

```txt
Granting UPDATE to authenticated expands table-level permission.
```

**Mitigation:**

```txt
RLS remains enabled.
schedules_admin_all requires is_admin().
is_admin() checks admin_users by auth.uid() and role='admin'.
No INSERT/DELETE grants are added.
No schedule_months grants are added.
No production project is touched.
```

**Remaining caution:**

```txt
If is_admin() or admin_users policies are wrong, UPDATE grant could increase risk.
Therefore pre-check SQL must confirm is_admin() before grant application.
```

## 10. Smoke test plan after future grant

After GRANT is applied (future manual apply phase), before write adapter implementation:

```txt
- staging shell still loads
- Schedule dry-run UI still works
- Update dry-run still actualWrite:false
- Duplicate dry-run still actualWrite:false
- No non-dry-run button appears
- Profile PoC still works
- Debug Panel still works
```

**Important:**

```txt
Grant application alone must not expose any non-dry-run UI.
```

Staging shell URL (dry-run only):

```txt
/__admin-staging-shell/musician-basic/
```

## 11. Non-dry-run PoC dependency

```txt
Even after UPDATE grant is applied, non-dry-run PoC remains blocked until:
- write adapter is implemented behind strict guards
- target test row is selected
- beforeSnapshot is captured
- rollback SQL is prepared
- approval ID is confirmed (G-6-e5-schedule-non-dry-run-poc)
- manual execution is explicitly approved
```

## 12. Relationship to write adapter implementation

```txt
This grant prep does not implement ScheduleWriteAdapter.
After grant prep, the next safe phase may be:
G-6-e4-schedule-update-grant-manual-apply-prep
or
G-6-e4-schedule-write-adapter-implementation
depending on review outcome.
```

**Recommended next:**

```txt
G-6-e4-schedule-update-grant-manual-apply-prep — DONE (see schedule-update-grant-manual-apply-prep.md)
Next: manual SQL execution by user, then G-6-e4-schedule-update-grant-manual-apply-result
```

**G-6-e4-schedule-update-grant-manual-apply-prep（完了）:** [schedule-update-grant-manual-apply-prep.md](./schedule-update-grant-manual-apply-prep.md) — final manual apply procedure; pre-check/grant/after-verify/rollback/smoke test; GRANT not executed by Cursor.

**Reason:**

```txt
Keep the permission change manual, explicit, and separately recorded.
```

## 13. Gate decision

```txt
readyForG6E4ScheduleUpdateGrantManualApplyPrep: true (see schedule-update-grant-manual-apply-prep.md)
readyForManualGrantApply: true
readyForG6E4ScheduleUpdateGrantManualApplyResult: false
readyForG6E4ScheduleWriteAdapterImplementation: false
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
grantExecuted: false
grantChangesPerformed: false
writeAdapterImplemented: false
dbWritesPerformed: false
```

## 14. Final safety statement

This phase prepares the UPDATE grant only.

No GRANT is executed.  
No REVOKE is executed.  
No schedule records are written.  
No RLS policy is changed.  
No write adapter is implemented.  
No production data is touched.  
No `/admin` route is connected.

Schedule write implementation remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-update-grant-prep.mjs \
  --out-dir tools/static-to-astro/output/schedule-update-grant-prep/gosaki
```
