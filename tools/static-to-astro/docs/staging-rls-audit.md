# Staging RLS Audit

## 1. Purpose

**Phase:** `G-6-rls-audit`

This phase audits staging RLS and GRANT state before broader write expansion (G-6-e).

This phase audits staging RLS and GRANT state before broader write expansion.
It is read-only.
It does not change policies.
It does not change grants.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase. All audit SQL is for **manual execution** in Supabase SQL Editor on project `static-to-astro-cms-staging` only.

Follows [staging-profile-write-hardening.md](./staging-profile-write-hardening.md) and [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md).

## 2. Scope

**Primary tables:**

```txt
- public.profile
- public.admin_users
```

**Secondary (read-only context for future G-6-e planning):**

```txt
- public.schedules
- public.schedule_months
- public.discography
- public.discography_tracks
```

**Out of scope for this phase:**

```txt
- policy changes
- GRANT changes
- schema changes
- production project
- /admin route
```

## 3. Current known state from G-6-d

Recorded from G-6-d profile write PoC and hardening — not re-verified by Cursor in this phase.

**public.profile:**

```txt
- profile table exists
- one seed row exists (bio updated by first manual non-dry-run)
- SELECT granted to anon, authenticated
- UPDATE granted to authenticated
- SELECT policy: Public can read profile
- UPDATE policy: Admins and editors can update profile
- UPDATE policy depends on public.admin_users and auth.uid()
```

**public.admin_users:**

```txt
- columns: user_id, email, role, created_at
- no is_active column
- authenticated SELECT grant added (manual, during G-6-d)
- self-read SELECT policy added:
  Authenticated users can read own admin user row
  USING (user_id = auth.uid())
- additional policies visible in dashboard (require audit):
  admin_users_admin_delete
  admin_users_admin_insert
  admin_users_admin_select
  admin_users_admin_update
```

**G-6-d incident (resolved for profile update):**

```txt
Symptom: permission denied for table admin_users on profile Save
Cause: profile UPDATE policy references admin_users; authenticated lacked SELECT on own row
Fix (user manual): GRANT SELECT + self-read RLS policy on admin_users
Result: profile non-dry-run update succeeded
```

## 4. Manual read-only audit SQL

Run these in **Supabase SQL Editor** on `static-to-astro-cms-staging` only. Cursor must not execute them.

### 4.1 Table list

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

### 4.2 RLS enabled check

```sql
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;
```

### 4.3 Policy list

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
order by tablename, policyname;
```

### 4.4 Grants for key tables

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profile', 'admin_users', 'schedules', 'schedule_months', 'discography', 'discography_tracks')
order by table_name, grantee, privilege_type;
```

### 4.5 admin_users columns

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'admin_users'
order by ordinal_position;
```

### 4.6 profile columns

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profile'
order by ordinal_position;
```

### 4.7 Current admin user row check

Compare with your Supabase Auth user. Replace placeholder only in SQL Editor — do not commit real emails if policy requires redaction.

```sql
select user_id, email, role, created_at
from public.admin_users
where email = '<YOUR_ADMIN_EMAIL>';
```

### 4.8 Profile row count

```sql
select count(*) as profile_count
from public.profile;
```

### 4.9 Profile current state

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

**Safety when pasting results:**

```txt
Do not paste passwords, access tokens, recovery tokens, service role keys, or anon keys into chat or docs.
Redact UUIDs if sharing externally.
```

## 5. Audit criteria

### profile

```txt
- SELECT should be public if public site needs to read profile
- UPDATE should be restricted to authenticated admins/editors only
- INSERT should not be allowed unless explicitly needed for G-6-e
- DELETE should not be allowed in early CMS Kit phase
- UPDATE policy must not allow arbitrary authenticated users
- profile should remain single-row for current PoC scope
- UPDATE policy dependency on admin_users must remain narrow
```

### admin_users

```txt
- anon should not read admin_users
- authenticated should not read all admin_users unless explicitly justified
- self-read policy should be narrow: user_id = auth.uid()
- insert/update/delete policies must not allow privilege escalation
- role changes should not be possible by ordinary authenticated users
- policies that depend on admin_users.role must avoid circular privilege escalation
```

### Secondary tables (context only)

```txt
- document RLS enabled state before any schedule/discography write planning
- no write GRANT assumed until separate approval phase
```

## 6. Known concern: admin_users admin policies

Policies visible on staging (audit targets — **not judged dangerous in this phase**):

```txt
admin_users_admin_delete
admin_users_admin_insert
admin_users_admin_select
admin_users_admin_update
```

Before G-6-e implementation, review each policy:

```txt
- qual (USING expression)
- with_check (WITH CHECK expression)
- whether policy allows role escalation
- whether an admin can accidentally delete their own access
- whether insert/update/delete should be disabled in early CMS Kit phase
- whether admin_* policies are broader than self-read + admin maintenance needs
```

## 7. updated_by relation

From [staging-profile-write-hardening.md](./staging-profile-write-hardening.md):

```txt
- updated_by remains NULL after G-6-d successful update
- updated_by should eventually reference auth.uid()
- DB trigger using auth.uid() may be preferable after RLS audit
- any trigger/policy implementation waits until RLS audit is reviewed
- no updated_by implementation in G-6-rls-audit phase
```

## 8. G-6-e gate after RLS audit

```txt
readyForG6EPlanning: true
readyForG6EImplementation: false until:
- RLS audit result reviewed (auditStatus advances from not_run)
- admin_users policies understood and documented
- next write target scoped (table, operation, fields)
- approval ID defined for next phase
- dry-run path implemented for that target
- rollback plan defined
- non-dry-run remains manually gated (PUBLIC_ADMIN_WRITE_DRY_RUN=true default)
```

## 9. Expected audit result status values

Use when recording manual SQL results:

| Status | Meaning |
| --- | --- |
| `not_run` | Audit SQL not yet run by user |
| `manual_sql_collected` | User ran SQL; results collected locally |
| `review_required` | Results need human/assistant review |
| `safe_for_planning` | No blockers for G-6-e-planning doc only |
| `safe_for_limited_implementation` | Narrow next write may proceed after separate approval |
| `blocked` | Policy/grant issues must be fixed before any G-6-e implementation |

**Initial state (this phase):**

```txt
auditStatus: not_run
```

## 10. Recommended next step

```txt
1. Run manual read-only audit SQL in Supabase SQL Editor (staging project only)
2. Paste sanitized results back into ChatGPT/Cursor for review
3. Update auditStatus in config or a follow-up result doc when reviewed
4. Do not run policy or GRANT changes yet
5. Proceed to G-6-e-planning only after review_required is cleared
```

## 11. Final safety statement

```txt
This RLS audit phase is read-only.
It does not change staging data or policies.
It does not touch production.
It does not enable G-6-e implementation by itself.
Cursor does not execute SQL or connect to the database.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-rls-audit.mjs \
  --out-dir tools/static-to-astro/output/staging-rls-audit/gosaki
```
