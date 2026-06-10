# Profile Schema Apply Prep

## 1. Purpose

**G-6-d-schema-apply-prep prepares a manual staging-only SQL package.**

This phase turns the G-6-d-blocker alignment plan into executable SQL files for **user manual application** in Supabase SQL Editor on `static-to-astro-cms-staging` only.

```txt
G-6-d-schema-apply-prep prepares a manual staging-only SQL package.
Cursor must not execute SQL.
No table is created in this phase.
No RLS policy is created or changed in this phase.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.
```

Follows:

- [profile-schema-alignment-plan.md](./profile-schema-alignment-plan.md) (G-6-d-blocker)
- [staging-profile-update-poc-implementation.md](./staging-profile-update-poc-implementation.md) (G-6-d)

SQL files (manual only):

- `sql/staging/profile-schema-apply.sql`
- `sql/staging/profile-schema-rollback.sql`

## 2. Current blocker

```txt
Expected:
- public.profile table
- name / bio columns
- one seed row

Actual:
- public.profile does not exist
- current tables: admin_users, discography, discography_tracks, schedule_months, schedules
```

G-6-d non-dry-run and real dry-run before-snapshot reads remain blocked until schema is applied manually.

## 3. Confirmed admin_users schema

Observed on `static-to-astro-cms-staging` (user-confirmed via Supabase SQL Editor):

```txt
public.admin_users:
- user_id uuid
- email text
- role text
- created_at timestamptz
```

```txt
There is no is_active column.
Do not use is_active in RLS policies.
```

RLS update condition (reference):

```sql
exists (
  select 1
  from public.admin_users
  where user_id = auth.uid()
    and role in ('admin', 'editor')
)
```

## 4. Manual application overview

**G-6-d-schema-apply-prep does not execute these steps.** User runs them in Supabase SQL Editor after approval.

```txt
1. Confirm staging project
2. Confirm production is not selected
3. Review SQL
4. Create public.profile table
5. Add updated_at trigger
6. Insert one seed row
7. Enable RLS
8. Add read policy
9. Add update policy for admin/editor
10. Run verification SQL
11. Return to G-6-d dry-run QA
```

Recommended file: copy sections from `sql/staging/profile-schema-apply.sql` or run the full file in order after review.

## 5. SQL package: create profile table

**MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.**  
Run only in Supabase SQL Editor for `static-to-astro-cms-staging` after user approval.

```sql
create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  bio text not null default '',
  catchphrase text not null default '',
  website_url text not null default '',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id)
);
```

Full script: `sql/staging/profile-schema-apply.sql`.

## 6. SQL package: updated_at trigger

**MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.**

```sql
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profile;

create trigger set_profile_updated_at
before update on public.profile
for each row
execute function public.set_profile_updated_at();
```

Function name `set_profile_updated_at` is profile-specific to avoid collisions with other tables.

## 7. SQL package: seed row

**MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.**

Requirements:

```txt
- exactly one initial row
- idempotent
- demo-safe text
- no real email
- no secret
- no customer private data
```

```sql
insert into public.profile (name, bio, catchphrase, website_url, social_links)
select
  'Demo Artist',
  'Demo biography for staging CMS verification.',
  '',
  '',
  '{}'::jsonb
where not exists (select 1 from public.profile);
```

## 8. SQL package: enable RLS

**MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.**

```sql
alter table public.profile enable row level security;
```

## 9. SQL package: read policy

**Option A — authenticated only:**

```sql
create policy "Authenticated users can read profile"
on public.profile
for select
to authenticated
using (true);
```

**Option B — anon + authenticated (included in apply SQL file):**

```sql
create policy "Public can read profile"
on public.profile
for select
to anon, authenticated
using (true);
```

**Recommendation:** For CMS Kit staging shell and future public site read, **Option B** is the default in `profile-schema-apply.sql`. If profile must not be readable by anon, use Option A instead and update read-only adapter expectations. Customer public-read requirements may override this choice.

## 10. SQL package: update policy for admin/editor

**MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.**

Requirements:

```txt
- to authenticated
- anon cannot update
- role in ('admin', 'editor') only
- admin_users.user_id = auth.uid()
- is_active is not used
```

```sql
create policy "Admins and editors can update profile"
on public.profile
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  )
);
```

## 11. SQL package: optional insert/delete policies

```txt
No insert policy is required for G-6-d.
No delete policy is required for G-6-d.
No publish policy is required for G-6-d.
```

Do **not** create insert or delete policies in this package. Seed uses service-role or SQL Editor session with sufficient privileges during manual apply — not client insert policy.

## 12. Verification SQL

Run after manual apply (read-only):

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'profile';
```

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profile'
order by ordinal_position;
```

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'profile'
order by policyname;
```

Confirm update policy does **not** reference `is_active`.

## 13. Rollback / cleanup SQL

**MANUAL STAGING SQL. DO NOT RUN UNLESS YOU INTEND TO REMOVE THE STAGING PROFILE TABLE.**  
Never run on production.

See `sql/staging/profile-schema-rollback.sql` (commented — uncomment only after backup):

```sql
drop trigger if exists set_profile_updated_at on public.profile;
drop function if exists public.set_profile_updated_at();
drop table if exists public.profile;
```

- Never run on production
- Staging only after seed/demo review
- Backup row values if non-demo data was added

## 14. Pre-apply checklist

```txt
[ ] Supabase project is static-to-astro-cms-staging
[ ] Production project is not selected
[ ] SQL has been reviewed
[ ] public.profile does not already exist
[ ] admin_users schema confirmed: user_id, email, role, created_at
[ ] is_active is not used
[ ] seed text contains no real private data
[ ] rollback SQL is understood
[ ] user explicitly approves manual SQL execution
```

## 15. Post-apply checklist

```txt
[ ] public.profile table exists
[ ] name column exists
[ ] bio column exists
[ ] seed row exists
[ ] RLS enabled
[ ] read policy exists
[ ] update policy exists
[ ] update policy uses admin_users.user_id and role
[ ] update policy does not use is_active
[ ] no insert/delete policy added
[ ] G-6-d dry-run QA can be retried
```

## 16. Decision states

```txt
readyForManualSchemaApply:
- SQL reviewed
- staging confirmed
- approval granted

schemaApplied:
- profile table exists
- seed row exists
- policies exist

readyForG6DDryRunRetry:
- profile table exists
- name/bio columns exist
- seed row exists

readyForG6DNonDryRun:
- dry-run passes
- RLS role behavior confirmed
- rollback ready
```

G-6-d-schema-apply-prep completion: `readyForManualSchemaApply: true`, `readyForG6DNonDryRun: false`.

## 17. Next phase recommendation

```txt
G-6-d-schema-apply: user manually applies profile schema SQL to staging
```

Then:

```txt
G-6-d dry-run retry
G-6-d first non-dry-run staging profile update
G-6-d-result report
```

**Do not proceed to G-6-e create operation** until profile write PoC path is complete and separately approved.

## 18. Final safety statement

```txt
G-6-d-schema-apply-prep prepares SQL for manual staging application only.
Cursor does not execute SQL.
No table is created by Cursor.
No RLS policy is changed by Cursor.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.
```

## Report

```bash
node tools/static-to-astro/scripts/report-profile-schema-apply-prep.mjs \
  --out-dir tools/static-to-astro/output/profile-schema-apply-prep/gosaki
```
