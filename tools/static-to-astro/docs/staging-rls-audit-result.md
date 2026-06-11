# Staging RLS Audit Result

## 1. Purpose

**Phase:** `G-6-rls-audit-result`

This document records the manual read-only staging RLS audit results from Supabase SQL Editor on project `static-to-astro-cms-staging`.

This document records the manual read-only staging RLS audit results.
It does not change database policies.
It does not change grants.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor did not execute SQL. The user ran read-only audit SQL manually.

Follows [staging-rls-audit.md](./staging-rls-audit.md).

## 2. Summary

```txt
profileStatus: mostly_ok
adminUsersPolicyStatus: structurally_ok_but_review_required
grantStatus: too_broad_cleanup_recommended
auditStatus: manual_sql_collected
reviewStatus: review_required
safeForPlanning: true
safeForLimitedImplementation: false
readyForG6EPlanning: true
readyForG6EImplementation: false
recommendedNextPhase: G-6-rls-grant-cleanup-plan
```

**Review conclusion:**

```txt
profile / admin_users RLS design does not appear fundamentally broken.
However, anon / authenticated have broad TRUNCATE / TRIGGER / REFERENCES grants on key tables.
A GRANT cleanup plan should be created before G-6-e implementation.
```

## 3. Tables and RLS

**Table list (public schema):**

```txt
public.admin_users
public.discography
public.discography_tracks
public.profile
public.schedule_months
public.schedules
```

Evaluation: as expected.

**RLS enabled (all public tables):**

| table | rls_enabled | rls_forced |
| --- | --- | --- |
| admin_users | true | false |
| discography | true | false |
| discography_tracks | true | false |
| profile | true | false |
| schedule_months | true | false |
| schedules | true | false |

Evaluation: RLS enabled on all tables — good.

## 4. Policies reviewed

**admin_users:**

```txt
- Authenticated users can read own admin user row
- admin_users_admin_delete
- admin_users_admin_insert
- admin_users_admin_select
- admin_users_admin_update
```

**discography / discography_tracks / schedule_months / schedules:**

```txt
- *_admin_all
- *_public_select
```

**profile:**

```txt
- Public can read profile
- Admins and editors can update profile
```

Evaluation: overall pattern is public SELECT + admin ALL on content tables; profile is public read + admin/editor update; admin_users has admin management policies.

## 5. admin_users policy detail

| policyname | cmd | qual | with_check |
| --- | --- | --- | --- |
| Authenticated users can read own admin user row | SELECT | `(user_id = auth.uid())` | NULL |
| admin_users_admin_delete | DELETE | `is_admin()` | NULL |
| admin_users_admin_insert | INSERT | NULL | `is_admin()` |
| admin_users_admin_select | SELECT | `is_admin()` | NULL |
| admin_users_admin_update | UPDATE | `is_admin()` | `is_admin()` |

Evaluation:

```txt
Existing admins appear to manage admin_users only.
INSERT / UPDATE use with_check: is_admin() — not unrestricted.
admin_users is a privilege table; treat carefully before G-6-e.
```

## 6. is_admin() review

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.role = 'admin'
  );
$function$
```

Evaluation:

```txt
is_admin() checks auth.uid() against admin_users.user_id and role = 'admin'.
Design appears sound.
SECURITY DEFINER with search_path = public is explicit.
Function owner / execute privileges / circular reference remain future audit topics.
```

## 7. Grants review

**Broad grants on key tables (anon / authenticated):**

| table | grantee | privilege_type |
| --- | --- | --- |
| admin_users | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |
| discography | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |
| discography_tracks | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |
| profile | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |
| profile | authenticated | UPDATE |
| schedule_months | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |
| schedules | anon, authenticated | REFERENCES, TRIGGER, TRUNCATE |

**Required note:**

```txt
anon/authenticated currently have TRUNCATE / TRIGGER / REFERENCES grants on key CMS tables.
These are not needed for normal CMS operation.
A dedicated grant cleanup plan should be created before G-6-e implementation.
```

Evaluation:

```txt
TRUNCATE / TRIGGER / REFERENCES are unnecessary for typical CMS reads/writes.
TRUNCATE is not protected by RLS in the same way as row policies.
Not safe_for_limited_implementation until GRANT cleanup is planned and reviewed.
```

## 8. Schema checks

**admin_users columns:**

```txt
user_id: uuid, not null
email: text, nullable
role: text, not null, default 'admin'
created_at: timestamptz, not null, default now()
```

Note: no `is_active` column. `role` default `'admin'` — review before any future insert workflows.

**profile columns:**

```txt
id: uuid, not null, default gen_random_uuid()
name: text, not null, default ''
bio: text, not null, default ''
catchphrase: text, not null, default ''
website_url: text, not null, default ''
social_links: jsonb, not null, default '{}'
created_at: timestamptz, not null, default now()
updated_at: timestamptz, not null, default now()
updated_by: uuid, nullable
```

Note: `updated_by` nullable; remains NULL after G-6-d update.

## 9. Data state

**admin user row check:** SQL run with `<YOUR_ADMIN_EMAIL>` placeholder — no rows returned. Not a blocker for this audit; re-run with real email locally if needed.

**profile row count:** `1` — single-row PoC as expected.

**profile current state (id redacted):**

```txt
id: f4eadb9c-…-ddb55dbec6fa
name: Demo Artist
bio: Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
updated_at: 2026-06-11 14:47:36.540991+00
updated_by: NULL
```

Evaluation: G-6-d non-dry-run result preserved; no additional writes.

## 10. Risk assessment

**Low concern:**

```txt
- profile single row
- RLS enabled on all public CMS tables
- is_admin() checks auth.uid() and role = 'admin'
- profile UPDATE gated by admin/editor policy
```

**Medium concern:**

```txt
- admin_users management policies need continued review
- role default is 'admin' on admin_users
- updated_by remains NULL
- admin_users insert/update/delete may not be needed in early CMS Kit phase
```

**High concern before G-6-e:**

```txt
- broad TRUNCATE / TRIGGER / REFERENCES grants to anon and authenticated on key tables
```

## 11. Recommended next phase

```txt
Recommended next: G-6-rls-grant-cleanup-plan — DONE (see staging-rls-grant-cleanup-plan.md)
```

**G-6-rls-grant-cleanup-plan（完了）:** [staging-rls-grant-cleanup-plan.md](./staging-rls-grant-cleanup-plan.md) — REVOKE/GRANT draft for TRUNCATE/TRIGGER/REFERENCES; not executed; `readyForManualCleanupDecision: true`; `readyForG6EImplementation: false`.

**G-6-rls-grant-cleanup-manual-apply-prep（完了）:** [staging-rls-grant-cleanup-manual-apply-prep.md](./staging-rls-grant-cleanup-manual-apply-prep.md) — final manual REVOKE SQL; user applied in Supabase SQL Editor.

**G-6-rls-grant-cleanup-result（完了）:** [staging-rls-grant-cleanup-result.md](./staging-rls-grant-cleanup-result.md) — manual REVOKE succeeded; `grantStatus: broad_grants_removed_cleanup_applied`; `readyForG6EPlanning: true`; `readyForG6EImplementation: false`.

**Suggested order:**

```txt
1. G-6-rls-audit-result (this document)
2. G-6-rls-grant-cleanup-plan — DONE
3. G-6-rls-grant-cleanup-manual-apply-prep — DONE
4. G-6-rls-grant-cleanup-result — DONE
5. G-6-e-planning (next; planning only)
6. G-6-e implementation only after separate approval
```

## 12. Gate state

```txt
auditStatus: manual_sql_collected
reviewStatus: review_required
safeForPlanning: true
safeForLimitedImplementation: false
readyForG6EPlanning: true
readyForG6EImplementation: false
dbWritesPerformed: false
policyChangesPerformed: false
grantChangesPerformed: false
```

## 13. Final safety statement

```txt
This audit result is read-only documentation.
No policies were changed.
No grants were changed.
No staging data was modified.
No production data was touched.
G-6-e implementation remains blocked until grant cleanup is planned and reviewed.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-rls-audit-result.mjs \
  --out-dir tools/static-to-astro/output/staging-rls-audit-result/gosaki
```
