# Staging RLS Grant Cleanup Plan

## 1. Purpose

**Phase:** `G-6-rls-grant-cleanup-plan`

This document plans a staging-only GRANT cleanup before broader write expansion (G-6-e).

This document plans a staging-only GRANT cleanup before broader write expansion.
It does not execute REVOKE.
It does not execute GRANT.
It does not change policies.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor does not connect to Supabase or execute SQL in this phase. All SQL below is **DRAFT ONLY** for manual review and future application on `static-to-astro-cms-staging` only.

Follows [staging-rls-audit-result.md](./staging-rls-audit-result.md).

## 2. Background

```txt
G-6-rls-audit-result found broad TRUNCATE / TRIGGER / REFERENCES grants for anon/authenticated on key CMS tables.
These grants are not needed for normal CMS operation.
G-6-e implementation remains blocked until cleanup is planned and reviewed.
```

Current gate (from audit result):

```txt
grantStatus: too_broad_cleanup_recommended
safeForLimitedImplementation: false
readyForG6EImplementation: false
recommendedNextPhase: G-6-rls-grant-cleanup-plan (this document)
```

## 3. Current broad grants detected

**admin_users:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**discography:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**discography_tracks:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**profile:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
authenticated: UPDATE
```

**schedule_months:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**schedules:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

## 4. Cleanup target

**Revoke from `anon`:**

```txt
TRUNCATE
TRIGGER
REFERENCES
```

**Revoke from `authenticated`:**

```txt
TRUNCATE
TRIGGER
REFERENCES
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

**Not in scope for this cleanup:**

```txt
SELECT grants (preserve unless separate read-access audit approves removal)
INSERT / DELETE grants (not listed as broad issue in audit; review separately if present)
profile authenticated UPDATE (preserve — required for G-6-d profile update via RLS)
```

## 5. Permissions to preserve

```txt
profile:
- anon SELECT if public site/profile read requires it
- authenticated SELECT if staging shell/profile read requires it
- authenticated UPDATE for profile, restricted by RLS policy (Admins and editors can update profile)

admin_users:
- authenticated SELECT if needed for profile UPDATE policy, self-read policy, and is_admin() checks

published content tables (discography, discography_tracks, schedules, schedule_months):
- anon SELECT where public published records are needed
- authenticated SELECT where admin preview/read is needed
```

**Important:**

```txt
Do not remove SELECT grants in this cleanup plan unless a separate read-access audit approves it.
```

## 6. Why TRUNCATE / TRIGGER / REFERENCES should be removed

**TRUNCATE:**

```txt
- not needed for CMS UI
- dangerous because it can remove all rows
- should not be available to anon/authenticated roles
- not protected by row-level policies the same way as DML
```

**TRIGGER:**

```txt
- not needed for client-side CMS operation
- trigger creation/manipulation should not be exposed to anon/authenticated roles
```

**REFERENCES:**

```txt
- not needed for current client-side CMS operation
- can be reviewed later if foreign key creation by client roles is ever needed (unlikely)
```

## 7. Manual staging cleanup SQL draft

**DRAFT ONLY. DO NOT RUN IN THIS PHASE. Cursor must not execute.**

Intended project: `static-to-astro-cms-staging` only. Never run on production.

```sql
-- DRAFT ONLY. DO NOT RUN IN THIS PHASE.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.

revoke truncate, trigger, references on table public.admin_users from anon, authenticated;
revoke truncate, trigger, references on table public.discography from anon, authenticated;
revoke truncate, trigger, references on table public.discography_tracks from anon, authenticated;
revoke truncate, trigger, references on table public.profile from anon, authenticated;
revoke truncate, trigger, references on table public.schedule_months from anon, authenticated;
revoke truncate, trigger, references on table public.schedules from anon, authenticated;
```

**Alternative split form** (if combined revoke syntax fails on your Postgres/Supabase version):

```sql
-- DRAFT ONLY — split form example for public.profile:
-- revoke truncate on table public.profile from anon, authenticated;
-- revoke trigger on table public.profile from anon, authenticated;
-- revoke references on table public.profile from anon, authenticated;
```

Repeat per table as needed.

## 8. Rollback SQL draft

**DRAFT ONLY. DO NOT RUN IN THIS PHASE.**

```sql
-- DRAFT ONLY. ROLLBACK FOR STAGING ONLY.
-- Intended project: static-to-astro-cms-staging only.
-- Never run on production.

grant truncate, trigger, references on table public.admin_users to anon, authenticated;
grant truncate, trigger, references on table public.discography to anon, authenticated;
grant truncate, trigger, references on table public.discography_tracks to anon, authenticated;
grant truncate, trigger, references on table public.profile to anon, authenticated;
grant truncate, trigger, references on table public.schedule_months to anon, authenticated;
grant truncate, trigger, references on table public.schedules to anon, authenticated;
```

```txt
Rollback restores the broad grants only if cleanup unexpectedly breaks staging behavior.
Rollback should not be used on production.
```

## 9. Before verification SQL

Run manually in Supabase SQL Editor **before** applying cleanup draft:

```sql
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profile', 'admin_users', 'schedules', 'schedule_months', 'discography', 'discography_tracks')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES', 'SELECT')
order by table_name, grantee, privilege_type;
```

Save sanitized output locally for before/after comparison.

## 10. After verification SQL

**Confirm broad grants removed:**

```sql
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profile', 'admin_users', 'schedules', 'schedule_months', 'discography', 'discography_tracks')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;
```

**Expected result:**

```txt
No rows returned.
```

**Confirm preserved DML/read grants:**

```sql
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profile', 'admin_users', 'schedules', 'schedule_months', 'discography', 'discography_tracks')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('SELECT', 'UPDATE', 'INSERT', 'DELETE')
order by table_name, grantee, privilege_type;
```

Expect `profile` + `authenticated` + `UPDATE` to remain if G-6-d profile update path is still required.

## 11. Functional smoke test after cleanup

Manual checklist after user applies cleanup (not in this phase):

```txt
[ ] Public read paths still work in staging shell
[ ] Supabase Auth login still works
[ ] profile read still works
[ ] profile dry-run Save still simulates payload only (PUBLIC_ADMIN_WRITE_DRY_RUN=true)
[ ] profile non-dry-run is not executed in cleanup apply phase unless separately approved
[ ] /admin route remains unconnected
[ ] production remains untouched
```

## 12. Risk assessment

**Low risk:**

```txt
- Removing TRIGGER / REFERENCES should not affect normal read/update CMS flows
```

**Medium risk:**

```txt
- Removing TRUNCATE should not break CMS flow, but verify no tooling relies on it
```

**High risk if not cleaned:**

```txt
- anon/authenticated keeping TRUNCATE grants before broader write expansion
```

## 13. Gate after cleanup plan

**This planning phase (no execution):**

```txt
cleanupPlanCreated: true
cleanupExecuted: false
rollbackExecuted: false
readyForManualCleanupDecision: true
readyForG6EPlanning: true
readyForG6EImplementation: false
grantChangesPerformed: false
policyChangesPerformed: false
```

**After manual cleanup (future phase):**

```txt
cleanupExecuted: true (user manual only)
safeForLimitedImplementation: may advance after verification — separate gate
readyForG6EImplementation: still false until G-6-e-planning + approval
```

## 14. Recommended next phase

```txt
Recommended next: G-6-rls-grant-cleanup-manual-apply-prep
```

Then, with user approval:

```txt
manual staging GRANT cleanup (user runs §7 draft in SQL Editor)
```

Do **not** proceed to G-6-e implementation until:

```txt
- cleanup applied and verified (§9–§11)
- audit result grantStatus updated or superseded by cleanup result doc
- G-6-e-planning completed
- separate approval ID for any new write scope
```

## 15. Final safety statement

```txt
This phase only creates a cleanup plan.
No grants are changed.
No policies are changed.
No database writes are performed.
No production data is touched.
G-6-e implementation remains blocked until cleanup is reviewed and manually applied or explicitly deferred.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-rls-grant-cleanup-plan.mjs \
  --out-dir tools/static-to-astro/output/staging-rls-grant-cleanup-plan/gosaki
```
