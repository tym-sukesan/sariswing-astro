# Profile Schema Alignment Plan

## 1. Purpose

**G-6-d-blocker is a schema alignment planning phase only.**

G-6-d implemented a gated staging profile update PoC targeting `public.profile` with `name` / `bio` columns. Staging project `static-to-astro-cms-staging` was reviewed and **`public.profile` does not exist**. This plan documents the blocker and defines how to align schema before resuming G-6-d non-dry-run write.

```txt
G-6-d-blocker is a schema alignment planning phase only.
No SQL is executed.
No table is created.
No RLS policy is created or changed.
No database write is performed.
No /admin route is connected.
No production data is touched.
```

Follows:

- [staging-profile-update-poc-implementation.md](./staging-profile-update-poc-implementation.md) (G-6-d)
- [staging-profile-update-poc-verification-checklist.md](./staging-profile-update-poc-verification-checklist.md) (G-6-d-verify)
- [rls-write-policy-review-plan.md](./rls-write-policy-review-plan.md) (G-6-b)

Staging shell route only: `/__admin-staging-shell/musician-basic/`.

## 2. Current blocker

**Expected by G-6-d implementation:**

```txt
- table: profile
- fields: name / bio
- operation: update
```

**Actual staging DB tables** (`static-to-astro-cms-staging`, `public` schema — observed, not modified in this phase):

```txt
- admin_users
- discography
- discography_tracks
- schedule_months
- schedules
```

**Blocker:**

```txt
public.profile does not exist in staging DB.
```

Also absent from observed staging tables (may exist in other projects or future phases): `links`, `news` — read-only adapter may fall back to mock for those modules.

## 3. Impact

```txt
- G-6-d non-dry-run profile update cannot proceed
- dry-run can still be used for UI/payload review
- real profile update requires schema alignment
- adapter currently targets profile table
- name/bio mapping must be confirmed
```

| Area | Status |
| --- | --- |
| `profile-update-poc-adapter.ts` | Targets `public.profile` — will fail on before-snapshot read until table exists |
| `supabase-read-only-data-adapter.ts` | `getProfile()` selects from `profile` — returns empty/error until table exists |
| Dry-run UI | Can still show payload / rollback instruction if read succeeds; blocked if no row |
| Non-dry-run write | **Stopped** until schema applied + RLS reviewed |
| G-6-e+ expansion | Blocked until profile PoC path is unblocked |

## 4. Recommended direction

```txt
Create a dedicated public.profile table for musician-basic CMS Kit.
Do not reuse admin_users, schedules, discography, or schedule_months as profile storage.
Keep profile independent from content modules.
Use profile as a single-row site/artist profile table.
```

Reasons:

```txt
- admin_users is for permissions
- schedules is for events
- discography is for works
- profile is site/artist-level information
- dedicated profile table keeps write PoC low-risk
```

## 5. Table name options

| option | pros | cons | G-6-d adapter compatibility | recommendation |
| --- | --- | --- | --- | --- |
| `profile` | Matches G-6-d adapter; single-site semantics; simple | Singular table name (acceptable in Postgres) | **Full** — no adapter rename | **Recommended** |
| `profiles` | Plural convention | Adapter + docs rename required | Low | Not for first alignment |
| `site_profile` | Explicit site scope | Rename adapter, config, docs | Low | Future multi-site only |
| `artist_profile` | Domain-specific | Rename across kit | Low | Optional alias later |
| `about_profile` | UI label match | Non-standard; rename cost | Low | Not recommended |

**Recommendation:** `public.profile`

## 6. Column options

**Recommended full column set:**

```txt
id uuid primary key
name text
bio text
catchphrase text
website_url text
social_links jsonb
created_at timestamptz
updated_at timestamptz
updated_by uuid nullable
```

**Minimal columns for G-6-d continuation:**

```txt
id
name
bio
updated_at
updated_by
```

**`display_name` vs `name`:**

```txt
G-6-d implementation currently maps display_name to name.
For the initial profile table, prefer name as the canonical column.
If display_name is desired later, add it in a separate schema revision and adapter update.
```

Optional columns (`catchphrase`, `website_url`, `social_links`) can be added at table creation but are **out of scope** for first G-6-d non-dry-run write (adapter allowlist remains `name`, `bio` only).

## 7. Minimal schema for G-6-d continuation

```txt
profile:
- id uuid primary key
- name text
- bio text
- updated_at timestamptz
- updated_by uuid nullable
```

**Seed row:**

```txt
Exactly one initial row should exist before first non-dry-run write.
```

Use demo-safe placeholder text only. No real customer emails or PII in seed.

## 8. DRAFT ONLY SQL skeleton

**Do not execute in G-6-d-blocker.** Apply only in a later approved phase (`G-6-d-schema-apply` or equivalent) on **staging** project only.

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- This SQL is for review only and must be applied manually in a later approved phase.
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

**Seed row (idempotent):**

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- This SQL is for review only and must be applied manually in a later approved phase.
insert into public.profile (name, bio, catchphrase, website_url, social_links)
select 'Demo Artist', 'Demo biography', '', '', '{}'::jsonb
where not exists (select 1 from public.profile);
```

**`updated_at` trigger (optional — review before apply):**

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- This SQL is for review only and must be applied manually in a later approved phase.
create or replace function public.set_profile_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
drop trigger if exists profile_set_updated_at on public.profile;
create trigger profile_set_updated_at
  before update on public.profile
  for each row execute function public.set_profile_updated_at();
```

## 9. RLS draft policy plan

**Not executed in G-6-d-blocker.**

Future policy intent:

```txt
Read:
- public/staging read policy depending on CMS requirements

Write:
- authenticated admin/editor only
- viewer cannot write
- anon cannot write
- production write forbidden until readiness gate
```

**DRAFT ONLY examples** — confirm `admin_users` columns (`user_id`, `role`, `is_active`) on staging before apply:

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- This SQL is for review only and must be applied manually in a later approved phase.
alter table public.profile enable row level security;
```

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- Example only. Must be reviewed per project.
-- create policy "Authenticated admins and editors can update profile"
-- on public.profile
-- for update
-- to authenticated
-- using (
--   exists (
--     select 1 from public.admin_users
--     where user_id = auth.uid()
--       and is_active = true
--       and role in ('admin', 'editor')
--   )
-- )
-- with check (
--   exists (
--     select 1 from public.admin_users
--     where user_id = auth.uid()
--       and is_active = true
--       and role in ('admin', 'editor')
--   )
-- );
```

Read policy for anon/authenticated preview must be designed separately (G-5z / G-6-b alignment). Policy names and conditions require staging project review.

## 10. Adapter alignment plan

**Current:**

```txt
profile-update-poc-adapter.ts targets public.profile
allowed fields: name / bio
```

**Plan:**

```txt
- If public.profile with name/bio is created, adapter can stay as-is.
- If table or columns differ, update adapter only in a later approved phase.
- Do not change adapter in G-6-d-blocker unless only comments/docs are needed.
```

`supabase-read-only-data-adapter.ts` already uses `PROFILE_SELECT = "id,legacy_id,name,bio,image_url"`. If `legacy_id` / `image_url` are not in minimal schema, either:

- add nullable columns in schema apply phase, or
- narrow read adapter select in a separate approved phase (not G-6-d-blocker).

Prefer adding optional nullable `legacy_id`, `image_url` columns in full schema if read adapter should work without code change.

## 11. Seed data plan

```txt
- one row only
- demo-safe placeholder text
- no real email
- no secrets
- no customer private info
- seed only after approval
- seed must be idempotent
```

Example values: `Demo Artist`, `Demo biography` — replace with project-specific staging content after customer approval.

## 12. Manual staging application checklist

Before applying DRAFT SQL to `static-to-astro-cms-staging`:

```txt
[ ] staging project confirmed: static-to-astro-cms-staging
[ ] production project excluded
[ ] SQL reviewed
[ ] profile table name confirmed
[ ] name/bio columns confirmed
[ ] RLS draft reviewed
[ ] admin_users schema confirmed
[ ] seed row reviewed
[ ] rollback/drop plan reviewed
[ ] user explicitly approves schema application
```

## 13. Rollback / cleanup plan

```txt
- if no production data exists, table can be dropped in staging after review
- if seed row only, delete/drop is acceptable in staging after approval
- production rollback requires separate plan
- do not drop any table automatically
```

**DRAFT ONLY cleanup (staging, after explicit approval):**

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-blocker.
-- This SQL is for review only and must be applied manually in a later approved phase.
-- drop table if exists public.profile cascade;
```

## 14. Decision states

```txt
blocked:
- profile table missing

readyForSchemaApply:
- plan reviewed
- SQL reviewed
- staging confirmed
- approval given

readyForG6DNonDryRun:
- profile table exists
- name/bio columns exist
- seed row exists
- RLS write policy reviewed/applied
- dry-run passes
```

**G-6-d-blocker completion:** `blocked` documented → `readyForSchemaApplyApproval: true`, `readyForG6DNonDryRun: false`.

## 15. Completion criteria

```txt
profileSchemaAlignmentPlanCreated: true
profileTableMissingDocumented: true
recommendedTableName: profile
recommendedColumnsDefined: true
draftSqlCreated: true
draftSqlExecuted: false
schemaApplied: false
rlsPolicyChanged: false
dbWritePerformed: false
readyForSchemaApplyApproval: true
readyForG6DNonDryRun: false
```

```bash
node tools/static-to-astro/scripts/report-profile-schema-alignment-plan.mjs \
  --out-dir tools/static-to-astro/output/profile-schema-alignment-plan/gosaki
```

## 16. Next phase recommendation

**G-6-d-schema-apply-prep（完了）:** [profile-schema-apply-prep.md](./profile-schema-apply-prep.md) — manual SQL package; `admin_users` without `is_active`; `sql/staging/profile-schema-apply.sql`; `readyForManualSchemaApply: true`.

**Next:**

```txt
G-6-d-schema-apply: user manually applies profile schema SQL to staging
```

**Do not proceed to G-6-d non-dry-run write** until:

1. `public.profile` exists on staging
2. Seed row exists
3. RLS policies reviewed/applied
4. [verification checklist](./staging-profile-update-poc-verification-checklist.md) §7 complete

## 17. Final safety statement

```txt
G-6-d-blocker is a planning phase only.
No SQL is executed.
No table is created.
No RLS policy is created or changed.
No database write is performed.
No non-dry-run profile update is executed.
No /admin route is connected.
No production data is touched.
```
