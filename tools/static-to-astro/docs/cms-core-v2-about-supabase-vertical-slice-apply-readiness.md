# CMS Core v2 — About Supabase Vertical Slice Apply Readiness

- **Phase:** `cms-core-v2-about-supabase-vertical-slice-apply-readiness`
- **Status:** **complete** — final audit of existing SQL templates; **no SQL apply / DB write / implementation**
- **Date:** 2026-07-24
- **Baseline HEAD (authoring):** `f32b112` (confirm with `git rev-parse --short HEAD` at apply time)
- **Prior:** [cms-core-v2-about-supabase-vertical-slice-preflight.md](./cms-core-v2-about-supabase-vertical-slice-preflight.md)
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-vertical-slice-apply-readiness.mjs`

```txt
CMS_CORE_V2_ABOUT_SUPABASE_VERTICAL_SLICE_APPLY_READINESS_COMPLETE: true
READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY: true
SQL_TEMPLATES_CHANGE_REQUIRED: false
ABOUT_SUPABASE_IMPLEMENTATION_EXECUTED: false
SQL_APPLY_EXECUTED: false
DB_WRITE_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
CONTENTS_ABOUT_PATH_UNCHANGED: true
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

**Apply可否:** **YES（staging only）** — after §3 SELECT-only PASS + AGENTS one-file approval form.

**Cursor / agent must not apply.** Operator pastes templates in Supabase SQL Editor on `kmjqppxjdnwwrtaeqjta` only.

---

## 1. Template audit verdict (no SQL change)

| File | Re-run / unexpected state | Verdict |
| --- | --- | --- |
| Migration | `CREATE TABLE IF NOT EXISTS` + recreate triggers; **STOP if table already exists with wrong shape** (IF NOT EXISTS will not alter columns) | **OK for first apply** when pre-SELECT shows table **absent** |
| RLS | `DROP POLICY IF EXISTS` + recreate; fail-closed `REVOKE ALL` then column GRANT; fails if `can_write_site` missing | **OK** (idempotent) |
| Seed | Upserts **only** `(gosaki-piano, about, profile.lede)`; STOPs if site/table missing; re-run refreshes **this key only** to seed baseline | **OK** |
| Seed rollback | DELETE only if exact seed `value_text` matches | **OK** (fail-safe if value drifted → 0 rows deleted → STOP/ask) |
| RLS rollback | Drop 4 policies + revoke; no row delete | **OK** |
| DDL rollback | Drop triggers/fns + `DROP TABLE` **without CASCADE**; does not touch tenancy/`site_embeds` | **OK** |

**`SQL_TEMPLATES_CHANGE_REQUIRED: false`** for first staging apply under the operational STOP rules below.

**Residual (documented, not blocking first apply):** migration does not auto-validate an *existing* wrong-shaped `site_page_fields`. Pre-apply SELECT must prove table **absent** (preferred) or columns match §4.

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

### Seed (exactly one logical row)

| Key | Value |
| --- | --- |
| site | `gosaki-piano` |
| page_key | `about` |
| field_key | `profile.lede` |
| value_text | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| published | `true` |
| sort_order | `10` |

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
```

**PASS:** expected columns present · triggers `site_page_fields_set_updated_at` + `site_page_fields_set_audit_actors` · FK + unique exist · grants still revoked (fail-closed until RLS).

**STOP:** missing columns/triggers/FK · unclear error → no RLS apply yet.

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

-- Expect no service_role grants on this table:
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'site_page_fields'
  and grantee ilike '%service%';
```

**PASS:** 4 policies (public select + admin select/insert/update) · anon/authenticated SELECT · authenticated column INSERT/UPDATE · **0** service_role rows.

**STOP:** missing policy · unexpected DELETE privilege · service_role grant appears.

### 5.3 After seed

```sql
select site_slug, page_key, field_key, value_text, published, sort_order, updated_at
from public.site_page_fields
where site_slug = 'gosaki-piano';

select count(*)::int as gosaki_field_count
from public.site_page_fields
where site_slug = 'gosaki-piano';
```

**PASS:** exactly **1** gosaki row · keys `about` / `profile.lede` · exact seed `value_text` · `published=true` · `sort_order=10`.

**STOP:** 0 rows · >1 unexpected fields for this apply · value mismatch.

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

## 7. Gate: `readyForOperatorAboutMigrationApply`

| Item | Value |
| --- | --- |
| Preflight complete | true |
| Templates audited · change required | **false** |
| Apply order + SELECT + STOP locked | this doc |
| Contents / G-12a impact | **none** from SQL apply |
| **`readyForOperatorAboutMigrationApply`** | **`true`** |

**Still false / forbidden until separate phases:** Edge deploy · admin dual-path code · Save arm · FTP · production · Contents About cutover · `aboutSupabaseImplementationExecuted`.

**Next after successful operator apply:** record apply result doc → local Edge/admin dual-path implementation (arms false).

---

## Gates

```txt
cmsCoreV2AboutSupabaseVerticalSliceApplyReadinessComplete: true
readyForOperatorAboutMigrationApply: true
sqlTemplatesChangeRequired: false
aboutSupabaseImplementationExecuted: false
sqlApplyExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
contentsAboutPathUnchanged: true
aboutAccessAssignmentReusesYoutubeMembership: true
serviceRoleUsed: false
readyForAnyFutureFtpApply: false
```
