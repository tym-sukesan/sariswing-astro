# RLS Write Policy Review Plan

## 1. Purpose

G-6-b defines how **RLS write policies** and **role enforcement** must be reviewed before any staging write PoC (G-6-d+). It follows [write-operation-safety-plan.md](./write-operation-safety-plan.md) (G-6-a).

**G-6-b is a review/planning phase only.**

- No RLS policy is created or changed in G-6-b
- No SQL is executed in G-6-b
- No database write is implemented
- No write adapter is implemented
- No Storage operation is implemented
- No Publish operation is implemented
- No `/admin` route is connected
- No production data is touched

Related:

- [schema-mapping-rls-read-policy-review.md](./schema-mapping-rls-read-policy-review.md) (G-5z-c-prep read policies)
- [private-server-side-allowlist-plan.md](./private-server-side-allowlist-plan.md) (server-side allowlist)
- [write-operation-safety-plan.md](./write-operation-safety-plan.md) (G-6-a)

## 2. Current state

At G-6-a / pre-G-6-b:

| Flag | Value |
| --- | --- |
| `planningOnly` | `true` |
| `canWrite` | `false` |
| `writeOperationsEnabled` | `false` |
| `writeAdapterImplemented` | `false` |
| `dbWriteImplemented` | `false` |
| `rlsPolicyChanged` | `false` |
| `storageConnected` | `false` |
| `publishConnected` | `false` |
| `adminRouteConnected` | `false` |
| `productionDataTouched` | `false` |
| `readyForG6B` | `true` (G-6-a complete) |
| `readyForG6Implementation` | `false` |

Staging shell: `/__admin-staging-shell/musician-basic/` only.

## 3. RLS principle

| Principle | Detail |
| --- | --- |
| Database boundary | **RLS is the database-side boundary** for writes |
| Browser role | Browser role display is **not** a security boundary |
| Viewer | Viewer must **never** write |
| Editor | Editor writes must be **scoped** (tables, columns, draft-only initially) |
| Admin | Admin writes must remain **staging-limited** until production readiness gate |
| Production | Production writes forbidden before **G-6-j** production readiness gate |
| Delete | **Physical delete avoided**; logical delete preferred |
| Review gate | Write policy must be **reviewed before any real write** |
| Service role | Service role must **never** be used in browser |

## 4. Role enforcement model

### Current (G-5y / staging shell)

```txt
- staging shell can display role/allowlist status
- mock allowlist exists (G-5y-e-a)
- browser role display is informational
- no trusted server-side role enforcement for writes yet
- no admin_users table enforcement yet
```

### Required before write (G-6-d+)

```txt
- role must be verified server-side or database-side
- RLS must enforce write permissions
- viewer must be read-only
- editor/admin write scope must be explicit per table/operation
- production publish must remain disabled in G-6 phases
```

## 5. Role source options

| option | security | implementation complexity | customer portability | multi-customer suitability | recommended phase | notes |
| --- | --- | --- | --- | --- | --- | --- |
| **A: private env allowlist** | Medium (if server-only) | Low | Low | Low | G-6-d interim only | Not final production model; OK for isolated staging experiments |
| **B: Edge Function role check** | High (if done correctly) | High | Medium | Medium | G-6+ optional | Adds ops surface; not first choice for CMS Kit v1 |
| **C: admin_users table + RLS** | High | Medium | High | High | **G-6-d+ target** | Clean long-term for single/multi-customer |
| **D: custom claims / app_metadata** | High | Medium | Medium | Medium | After schema review | JWT claims must sync with DB truth |

**Recommendation:**

For early single-customer CMS Kit deployments, **admin_users table + RLS** is likely the cleanest long-term model, but it should be introduced after explicit schema review.

For immediate staging experiments, **server-side/private allowlist** can be used only as an **intermediate gate**, not as the final production model.

## 6. Table inventory for write policies

| table | module | read policy status | write policy needed | initial write operation | risk level | role requirement | staging-only | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile` | profile | reviewed (G-5z-c-prep) | yes | **update-only** (text) | Low | admin, editor | yes | single row; first PoC |
| `links` | links | reviewed | yes | update, then create/reorder | Low–Medium | editor+ after profile | yes | URL validation |
| `schedules` | schedule | reviewed | yes | create/update later | Medium | editor+ | yes | publish toggle separate |
| `discography` | discography | reviewed | yes | text update later | Medium | editor+ | yes | image separate (G-6-h) |
| `news` | news | likely / confirm | yes | draft create/update | High | editor+ | yes | table mapping confirm |

### First write PoC target (G-6-d)

```txt
profile:
- single row
- update-only
- text fields only (name, bio)
- no publish
- no delete
- rollback simple
- approval: G-6-d-staging-profile-update-poc
```

## 7. Module-by-module RLS write requirements

### profile

- **update-only first** (G-6-d)
- admin and editor only; viewer read-only
- single row (`limit 1` on read)
- no delete in PoC
- require `updated_at`, `updated_by` before write goes live
- **first write PoC candidate**

### links

- create / update / reorder after profile PoC
- URL validation at app + policy layer (https, length)
- editor allowed after profile PoC success
- **logical delete only** (`deleted_at`)

### schedules

- create / update / duplicate / logical delete / restore (G-6-e+)
- high public visibility when `published = true`
- **publish toggle** = separate approval (G-6-i)
- date/time and venue field validation required

### discography

- create / update / reorder / logical delete (text-first)
- cover image assignment **separated from Storage upload** (G-6-h)
- G-6 initial: text-only update only

### news

- create / update draft; published toggle high risk
- **highest public visibility** when published
- table mapping must be confirmed on staging project
- initially **draft-only** create/update; no publish toggle until G-6-i

## 8. Draft RLS policy skeletons

**DRAFT ONLY. DO NOT RUN IN G-6-b.**  
This SQL is for review only and must be adapted per customer project.

### admin_users concept

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-b.
-- This SQL is for review only and must be adapted per customer project.
-- Example admin_users table concept
-- create table admin_users (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id),
--   email text,
--   role text check (role in ('admin', 'editor', 'viewer')),
--   is_active boolean default true,
--   created_at timestamptz default now()
-- );
```

### Role helper concept

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-b.
-- This SQL is for review only and must be adapted per customer project.
-- Example role helper concept
-- create function current_admin_role()
-- returns text
-- language sql
-- security definer
-- set search_path = public
-- as $$
--   select role from admin_users
--   where user_id = auth.uid()
--     and is_active = true
--   limit 1
-- $$;
```

**Note:** `security definer` functions require careful review (search_path, grants, leak prevention).

### Profile update policy concept

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-b.
-- This SQL is for review only and must be adapted per customer project.
-- Example update policy concept
-- create policy "Admins and editors can update profile in staging"
-- on profile
-- for update
-- to authenticated
-- using (current_admin_role() in ('admin', 'editor'))
-- with check (current_admin_role() in ('admin', 'editor'));
```

### Anon write block (verify absent)

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-b.
-- This SQL is for review only and must be adapted per customer project.
-- Verify: no policy grants insert/update/delete to anon on content tables.
-- Default deny when RLS enabled and no permissive write policy for anon.
```

Skeletons are **not** production-ready. Table/column names vary per customer project.

## 9. Write policy checklist

Before first staging write (G-6-d):

```txt
[ ] staging Supabase project confirmed
[ ] production project excluded
[ ] target table confirmed
[ ] target columns confirmed
[ ] RLS enabled on target table
[ ] existing read policies reviewed (G-5z-c-prep)
[ ] anon write blocked (no insert/update/delete for anon)
[ ] authenticated write scoped by role
[ ] viewer cannot write
[ ] editor/admin role source confirmed (not browser-only)
[ ] updated_at / updated_by behavior defined
[ ] rollback procedure documented (G-6-a)
[ ] logical delete fields defined where needed
[ ] test user accounts prepared (staging only)
[ ] dry-run or disabled UI state exists (G-6-c)
[ ] approval ID prepared (G-6-d-staging-profile-update-poc)
```

## 10. Test scenarios

After RLS write policies are **implemented** (post G-6-b, on staging only):

### viewer

- can read allowed rows
- cannot update
- cannot create
- cannot delete

### editor

- can update allowed draft/staging fields (per policy)
- cannot publish initially
- cannot physical delete
- cannot write outside allowed tables

### admin

- can perform approved staging writes
- cannot production publish in G-6
- cannot bypass rollback requirements

### unauthenticated

- cannot write anything

### wrong project / production

- **no write test** should be performed on production

## 11. Rollback and audit requirements

| Field / artifact | Purpose |
| --- | --- |
| `updated_at` | last change timestamp |
| `updated_by` | user id or email ref |
| `deleted_at` | logical delete marker |
| `deleted_by` | who soft-deleted |
| before/after snapshot | rollback for single-field updates |
| audit log (candidate) | append-only change history |
| rollback manifest (candidate) | batch undo for reorder operations |
| logical delete first | no physical delete as default editor action |

## 12. Preflight for G-6-c / G-6-d

### readyForG6C

```txt
- RLS write policy review plan exists (this document)
- disabled action behavior defined (G-6-a §10)
- role enforcement model chosen or narrowed
- first write PoC target selected (profile update-only)
```

### notReadyForG6D until

```txt
- staging project confirmed
- RLS write policy reviewed and approved for target table
- role enforcement reviewed (not browser-only)
- rollback procedure written
- approval ID G-6-d-staging-profile-update-poc issued
- G-6-c disabled write scaffold complete
```

**G-6-b does not authorize G-6-d.** Planning only.

## 13. Approval gates

| Approval ID | Phase |
| --- | --- |
| `G-6-b-rls-write-policy-review` | This plan (review complete) |
| `G-6-c-disabled-write-actions-scaffold` | Disabled write UI |
| `G-6-d-staging-profile-update-poc` | First staging write |
| `G-6-e-staging-create-operation` | Create operations |
| `G-6-f-staging-logical-delete-restore` | Logical delete / restore |
| `G-6-g-staging-reorder-duplicate` | Reorder / duplicate |
| `G-6-h-staging-media-write-plan` | Media / Storage |
| `G-6-i-staging-publish-plan` | Publish workflow |
| `G-6-j-production-readiness-gate` | Production |

## 14. Forbidden operations

```txt
- Running draft SQL in G-6-b
- Creating RLS policies in G-6-b
- Changing RLS policies in G-6-b
- DB writes in G-6-b
- write adapter implementation in G-6-b
- service role in browser
- browser-only role enforcement for writes
- production DB write
- physical delete as default action
- production publish
- /admin route connection
```

## 15. G-6-b completion criteria

```txt
rlsWritePolicyReviewPlanCreated: true
draftSqlClearlyMarkedDoNotRun: true
roleEnforcementModelReviewed: true
tableWritePolicyInventoryCreated: true
moduleRlsRequirementsCreated: true
testScenariosCreated: true
rollbackAuditRequirementsCreated: true
readyForG6C: true
readyForG6D: false
readyForG6Implementation: false
canWrite: false
writeOperationsEnabled: false
rlsPolicyChanged: false
dbWriteImplemented: false
```

```bash
node tools/static-to-astro/scripts/report-rls-write-policy-review-plan.mjs \
  --out-dir tools/static-to-astro/output/rls-write-policy-review-plan/gosaki
```

## 16. Next phase recommendation

**Proceed to:** **G-6-c: disabled write action scaffold**

G-6-c still does **not** perform real DB writes. It adds UI for Save / Create / Delete / Publish etc. in **disabled** state with messages explaining which approval gate enables each action.

**Do not yet:** G-6-d staging profile update PoC.

## 17. Final safety statement

**G-6-b is a review/planning phase only.**

```txt
No SQL is executed.
No RLS policy is created or changed.
No database write is implemented.
No write adapter is implemented.
No Storage operation is implemented.
No Publish operation is implemented.
No GitHub dispatch is implemented.
No FTP deploy is performed.
No /admin route is connected.
No production data is touched.
```
