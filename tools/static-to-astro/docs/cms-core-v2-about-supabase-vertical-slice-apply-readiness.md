# CMS Core v2 — About Supabase Vertical Slice Apply Readiness

- **Phase:** `cms-core-v2-about-supabase-vertical-slice-apply-readiness`
- **Status:** **complete** — templates audited; **staging SQL apply recorded** in [cms-core-v2-about-supabase-vertical-slice-staging-apply-result.md](./cms-core-v2-about-supabase-vertical-slice-staging-apply-result.md)
- **Date:** 2026-07-24
- **Baseline HEAD (authoring):** `f32b112` (confirm with `git rev-parse --short HEAD` at apply time)
- **Prior:** [cms-core-v2-about-supabase-vertical-slice-preflight.md](./cms-core-v2-about-supabase-vertical-slice-preflight.md)
- **Result:** [cms-core-v2-about-supabase-vertical-slice-staging-apply-result.md](./cms-core-v2-about-supabase-vertical-slice-staging-apply-result.md)
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-vertical-slice-apply-readiness.mjs`

```txt
CMS_CORE_V2_ABOUT_SUPABASE_VERTICAL_SLICE_APPLY_READINESS_COMPLETE: true
READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY: false
READY_FOR_OPERATOR_ABOUT_RLS_APPLY: false
READY_FOR_OPERATOR_ABOUT_SEED_APPLY: false
ABOUT_SUPABASE_IMPLEMENTATION_EXECUTED: true
SQL_TEMPLATES_CHANGE_REQUIRED: false
SQL_APPLY_EXECUTED: true
DB_WRITE_EXECUTED: true
EDGE_DEPLOY_EXECUTED: false
CONTENTS_ABOUT_PATH_UNCHANGED: true
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
MIGRATION_SERVICE_ROLE_REVOKE_HARDEN: true
OPERATOR_REACCEPTED_AFTER_SERVICE_ROLE_REVOKE: true
RLS_SERVICE_ROLE_REVOKE_HARDEN: true
OPERATOR_REACCEPTED_AFTER_RLS_SERVICE_ROLE_REVOKE: true
SEED_FAIL_CLOSED_HARDEN: true
OPERATOR_REACCEPTED_AFTER_SEED_FAIL_CLOSED: true
MIGRATION_APPLIED_STAGING: true
MIGRATION_POSTCHECK_PASSED: true
MIGRATION_APPLIED_STAGING_POSTCHECK_PASS: true
RLS_APPLIED_STAGING: true
RLS_POSTCHECK_PASSED: true
SEED_APPLIED_STAGING: true
SEED_POSTCHECK_PASSED: true
ADMIN_ABOUT_SUPABASE_CUTOVER_EXECUTED: false
BUILD_ABOUT_SUPABASE_CUTOVER_EXECUTED: false
PRODUCTION_UNCHANGED: true
```

**Apply可否:** **Staging SQL apply: COMPLETE** — migration + RLS + seed applied on `kmjqppxjdnwwrtaeqjta` · all post-checks **PASS** · **`readyForOperatorAboutMigrationApply/RlsApply/SeedApply: false`** — **do not** re-run · Contents About remains default · Admin/build cutover **not** executed · production **unchanged**.

**Cursor / agent must not re-apply.** See staging apply result for operator post-check evidence.

---

## 1. Template audit verdict

| File | Re-run / unexpected state | Verdict |
| --- | --- | --- |
| Migration | `CREATE TABLE IF NOT EXISTS` + recreate triggers; fail-closed `REVOKE ALL` from **PUBLIC / anon / authenticated / service_role**; **STOP if table already exists with wrong shape** | **OK for first apply** when pre-SELECT shows table **absent** (re-accept gate after service_role revoke harden) |
| RLS | `DROP POLICY IF EXISTS` + recreate; fail-closed `REVOKE ALL` from **PUBLIC / anon / authenticated / service_role** then column GRANT to anon/authenticated only; fails if `can_write_site` missing; **never GRANT service_role** | **OK** (idempotent) — re-accept gate after RLS service_role revoke harden |
| Seed | Fail-closed plain **INSERT** only for `(gosaki-piano, about, profile.lede)`; STOPs if `gosaki-piano` ≠ 1 site row, target already ≥1 row, or post-INSERT verification mismatch; **no** `ON CONFLICT` upsert | **OK** (operator re-accepted) |
| Seed rollback | DELETE only if exact seed `value_text` matches | **OK** (fail-safe if value drifted → 0 rows deleted → STOP/ask) |
| RLS rollback | Drop 4 policies + revoke; no row delete | **OK** |
| DDL rollback | Drop triggers/fns + `DROP TABLE` **without CASCADE**; does not touch tenancy/`site_embeds` | **OK** |

**`SQL_TEMPLATES_CHANGE_REQUIRED: false`**. **`readyForOperatorAboutMigrationApply: false`** · **`readyForOperatorAboutRlsApply: false`** · **`readyForOperatorAboutSeedApply: false`** — staging apply **COMPLETE** · **`migrationAppliedStaging` / `rlsAppliedStaging` / `seedAppliedStaging: true`** with post-checks PASS · do **not** re-run.

**Residual (documented, not blocking first apply after re-accept):** migration does not auto-validate an *existing* wrong-shaped `site_page_fields`. Pre-apply SELECT must prove table **absent** (preferred) or columns match §4.

---

## 2. SQL execution order (apply)

| # | Action | File |
| --- | --- | --- |
| 0 | Confirm Dashboard project = `kmjqppxjdnwwrtaeqjta` · **STOP** if `vsbvndwuajjhnzpohghh` | — |
| 1 | **SELECT-only** readiness (§3) → PASS | paste in SQL Editor |
| 2 | Apply migration (1 approval) | `cms-core-v2-site-page-fields-migration.template.sql` |
| 3 | Post-migration SELECT (§5.1) → PASS | — |
| 4 | Apply RLS/GRANT (1 approval) | `cms-core-v2-site-page-fields-rls.template.sql` |
| 5 | Post-RLS SELECT (§5.2) → PASS | — |
| 6 | Apply seed (1 approval) | `cms-core-v2-gosaki-about-profile-lede-seed.template.sql` |
| 7 | Post-seed SELECT (§5.3) → PASS | — |

**Do not** reorder. **Do not** combine files in one paste. **Do not** run rollbacks as “cleanup” without separate rollback approval.

**Approval form (each apply file):**

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 3. First SELECT-only (pre-apply · required)

```sql
-- =============================================================================
-- CMS Core v2 About — SELECT-ONLY apply readiness
-- Project MUST be: kmjqppxjdnwwrtaeqjta
-- STOP: vsbvndwuajjhnzpohghh
-- No INSERT/UPDATE/DELETE/DDL
-- =============================================================================

-- A) Core tables (expect sites/site_members/platform_admins/site_embeds;
--    site_page_fields must be ABSENT for first About apply)
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'sites', 'site_members', 'platform_admins', 'site_embeds', 'site_page_fields'
  )
order by 1;

-- B) Authz helpers (expect is_platform_admin(); is_site_member(uuid); can_write_site(uuid))
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_platform_admin', 'is_site_member', 'can_write_site')
order by 1, 2;

-- C) sites composite unique (required for FK)
select c.conname
from pg_constraint c
join pg_class rel on rel.oid = c.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = 'sites'
  and c.conname = 'sites_id_site_slug_key';

-- D) gosaki site
select id, site_slug, status, updated_at
from public.sites
where site_slug = 'gosaki-piano';

-- E) Access reuse (no About access INSERT planned)
select 'site_members' as kind, count(*)::int as n
from public.site_members m
join public.sites s on s.id = m.site_id
where s.site_slug = 'gosaki-piano'
union all
select 'platform_admins_active', count(*)::int
from public.platform_admins
where active = true;

-- F) site_page_fields presence (first apply: expect 0)
select count(*)::int as site_page_fields_exists
from information_schema.tables
where table_schema = 'public' and table_name = 'site_page_fields';
```

### Pre-apply PASS

- Project is staging `kmjqppxjdnwwrtaeqjta`
- A includes `sites`, `site_members`, `platform_admins`, `site_embeds`
- A does **not** include `site_page_fields` (first apply)
- B has safe signatures (no client-uid-arg variants required for apply)
- C returns `sites_id_site_slug_key`
- D returns one `gosaki-piano` row (`status` preferably `active`)
- E: `site_members` ≥ 1 **or** `platform_admins_active` ≥ 1
- F = `0`

### Pre-apply STOP

- Production project / any doubt about project ref
- Missing tenancy / helpers / composite unique / `gosaki-piano`
- E both counts = 0 (no membership to reuse)
- F ≠ 0 (`site_page_fields` already exists) → **do not** re-run migration blindly; reconcile shape with human; new approval if re-entry
- `service_role` offered as “required”

---

## 4. Schema / RLS / seed contracts (locked)

### `public.site_page_fields` columns

`id`, `site_id`, `site_slug`, `page_key`, `field_key`, `value_text`, `published`, `sort_order`, `created_at`, `updated_at`, `created_by`, `updated_by`

- Composite FK → `sites(id, site_slug)` · **ON DELETE RESTRICT** · **ON UPDATE CASCADE**
- UNIQUE `(site_id, page_key, field_key)`
- `updated_at`: `tg_site_page_fields_set_updated_at`
- Audit: `tg_site_page_fields_set_audit_actors` from `auth.uid()`; freezes identity keys on UPDATE

### RLS / GRANT

| Item | Contract |
| --- | --- |
| Public SELECT | `published = true` (`anon` + `authenticated`) |
| Admin SELECT/INSERT/UPDATE | `can_write_site(site_id)` |
| DELETE policy | **none** |
| authenticated INSERT cols | `site_id, site_slug, page_key, field_key, value_text, published, sort_order` |
| authenticated UPDATE cols | `value_text, published, sort_order` |
| `service_role` | **not granted / not used** |
| Scope | `site_page_fields` only — does not alter `sites` / `site_embeds` RLS |

### Seed (exactly one logical row · fail-closed INSERT)

| Key | Value |
| --- | --- |
| site | `gosaki-piano` (exactly 1 `sites` row required) |
| page_key | `about` |
| field_key | `profile.lede` |
| value_text | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| published | `true` |
| sort_order | `10` |

- Pre-INSERT: target `(site_slug, page_key, field_key)` must be **0** rows; if ≥1 → `RAISE EXCEPTION` STOP (no overwrite)
- Write: plain `INSERT` **one** row — **no** `ON CONFLICT DO UPDATE`
- Pre-commit: exactly **1** target row with exact `value_text` / `published=true` / `sort_order=10`
- `created_by` / `updated_by`: may be **null** when run in SQL Editor (`auth.uid()` often null) — **acceptable** for this seed

### Tenancy / access

- **Reuse** existing `sites` / `site_members` / `platform_admins` / `can_write_site`
- **No Access INSERT** in About apply path — YouTube assignment already established membership; About RLS depends on `can_write_site`, not new rows
- Evidence gate: pre-apply SELECT E ≥ 1

### Contents About / G-12a

- About SQL templates do **not** touch GitHub Contents, `gosaki-about-content-*`, or `G-12a-*`
- Admin Contents path remains default until a **future** dual-path implementation
- Apply does **not** change Arms / Edge / JSON SoT

---

## 5. Post-step SELECT (after each apply)

### 5.1 After migration

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'site_page_fields'
order by ordinal_position;

select tgname from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'site_page_fields'
  and not t.tgisinternal
order by 1;

select conname, contype
from pg_constraint c
join pg_class rel on rel.oid = c.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public' and rel.relname = 'site_page_fields'
order by 1;

-- Fail-closed privileges: expect 0 rows for PUBLIC / anon / authenticated / service_role
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'site_page_fields'
  and (
    grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
    or grantee ilike '%service%'
  )
order by 1, 2;
```

**PASS:** expected columns present · triggers `site_page_fields_set_updated_at` + `site_page_fields_set_audit_actors` · FK + unique exist · privilege SELECT returns **0 rows** for PUBLIC / anon / authenticated / service_role (fail-closed until RLS re-GRANTs anon/authenticated only).

**STOP:** missing columns/triggers/FK · any privilege row for PUBLIC/anon/authenticated/service_role · unclear error → no RLS apply yet.

### 5.2 After RLS

```sql
select polname, polcmd
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'site_page_fields'
order by 1;

select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'site_page_fields'
order by 1, 2;

-- Expect 0 explicit table privileges for service_role:
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'site_page_fields'
  and (
    grantee = 'service_role'
    or grantee ilike '%service%'
  )
order by 1, 2;
```

**PASS:** 4 policies (public select + admin select/insert/update) · anon/authenticated SELECT · authenticated column INSERT/UPDATE · no DELETE privilege · **service_role privilege SELECT returns 0 rows**.

**STOP:** missing policy · unexpected DELETE privilege · any service_role (or `%service%`) table privilege · unclear error.

### 5.3 After seed

```sql
select site_slug, page_key, field_key, value_text, published, sort_order,
       created_by, updated_by, updated_at
from public.site_page_fields
where site_slug = 'gosaki-piano';

select count(*)::int as gosaki_field_count
from public.site_page_fields
where site_slug = 'gosaki-piano';
```

**PASS:** exactly **1** gosaki row · keys `about` / `profile.lede` · exact seed `value_text` · `published=true` · `sort_order=10`.
**Note:** `created_by` / `updated_by` may be **null** (SQL Editor) — still PASS if value/published/sort_order match.

**STOP:** 0 rows · >1 unexpected fields for this apply · value mismatch · accidental overwrite attempt (template should have stopped before commit).

---

## 6. Rollback conditions (separate approvals)

| When | Order | Notes |
| --- | --- | --- |
| Wrong project mid-flight | **STOP** — do not rollback on production; ask human | |
| Migration failed mid-statement | STOP · no retry · no auto-rollback | Ask human |
| Want to undo successful seed only | seed-rollback | Exact `value_text` required; if 0 deleted → value drifted → new scoped approval |
| Want to undo RLS | after seed-rollback (or if seed never applied) → RLS-rollback | No row delete |
| Want to drop table | after RLS-rollback → migration-rollback | No CASCADE; keeps tenancy/`site_embeds` |
| Unclear outcome | **STOP** · no retry · no cleanup | AGENTS destructive failure rule |

Rollback approval form (same AGENTS bar):

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 7. Gate: Staging SQL apply COMPLETE (do not re-run)

| Item | Value |
| --- | --- |
| Preflight complete | true |
| Migration applied + post-check | **PASS** · `migrationAppliedStaging: true` · `migrationPostcheckPassed: true` |
| RLS applied + post-check | **PASS** · `rlsAppliedStaging: true` · `rlsPostcheckPassed: true` |
| Seed applied + post-check | **PASS** · `seedAppliedStaging: true` · `seedPostcheckPassed: true` |
| Seed row | `gosaki-piano` / `about` / `profile.lede` · exact lede · `published=true` · `sort_order=10` · count=1 |
| `created_by` / `updated_by` | **null** (SQL Editor — acceptable) |
| Templates change required | **false** |
| Contents / G-12a | **unchanged** (default path) |
| Admin / build cutover | **not executed** |
| **`readyForOperatorAboutMigrationApply`** | **`false`** |
| **`readyForOperatorAboutRlsApply`** | **`false`** |
| **`readyForOperatorAboutSeedApply`** | **`false`** |
| Production | **unchanged** |

**Still false / forbidden until separate phases:** Edge deploy · Admin/build cutover packages · Save arm · FTP · production · Contents About cutover. Local dual-path code: **done** (`aboutSupabaseImplementationExecuted: true`).

**Next:** About admin + build dual-path planning/implementation (Contents default; Supabase opt-in; arms false). Do **not** re-run migration/RLS/seed. Detail: [staging-apply-result](./cms-core-v2-about-supabase-vertical-slice-staging-apply-result.md).

---

## Gates

```txt
cmsCoreV2AboutSupabaseVerticalSliceApplyReadinessComplete: true
readyForOperatorAboutMigrationApply: false
readyForOperatorAboutRlsApply: false
readyForOperatorAboutSeedApply: false
sqlTemplatesChangeRequired: false
migrationServiceRoleRevokeHarden: true
operatorReacceptedAfterServiceRoleRevoke: true
rlsServiceRoleRevokeHarden: true
operatorReacceptedAfterRlsServiceRoleRevoke: true
seedFailClosedHarden: true
operatorReacceptedAfterSeedFailClosed: true
migrationAppliedStaging: true
migrationPostcheckPassed: true
migrationAppliedStagingPostcheckPass: true
rlsAppliedStaging: true
rlsPostcheckPassed: true
seedAppliedStaging: true
seedPostcheckPassed: true
aboutSupabaseImplementationExecuted: true
sqlApplyExecuted: true
dbWriteExecuted: true
edgeDeployExecuted: false
contentsAboutPathUnchanged: true
adminAboutSupabaseCutoverExecuted: false
buildAboutSupabaseCutoverExecuted: false
aboutAccessAssignmentReusesYoutubeMembership: true
serviceRoleUsed: false
readyForAnyFutureFtpApply: false
productionUnchanged: true
```
