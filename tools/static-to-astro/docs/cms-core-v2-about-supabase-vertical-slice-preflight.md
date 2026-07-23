# CMS Core v2 — About Supabase Vertical Slice Preflight

- **Phase:** `cms-core-v2-about-supabase-vertical-slice-preflight`
- **Status:** **complete** — docs + SQL templates only; **no apply / implementation / DB write**
- **Date:** 2026-07-24
- **Baseline HEAD (authoring):** `d6a0ed855956688831c9d3d0d76fcaadd3bcd6c5` (`d6a0ed8`)
- **Prior:** [cms-core-v2-next-kit-feature-comparison.md](./cms-core-v2-next-kit-feature-comparison.md) · YouTube Core live on staging
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-vertical-slice-preflight.mjs`

```txt
CMS_CORE_V2_ABOUT_SUPABASE_VERTICAL_SLICE_PREFLIGHT_COMPLETE: true
ABOUT_SUPABASE_IMPLEMENTATION_EXECUTED: false
READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY: false
SQL_APPLY_EXECUTED: false
DB_WRITE_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
CONTENTS_ABOUT_PATH_UNCHANGED: true
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

---

## 1. Purpose

Lock schema / RLS / grants / dual-path / seed / rollback **before** any staging SQL apply or admin/Edge implementation for About → Supabase.

**First write surface:** structured scalar **`about` / `profile.lede`** (= first biography paragraph from current Contents JSON SoT).

**Not in this phase:** SQL apply · Edge deploy · admin dual-path code · Save · FTP · production · Contents cutover · opaque HTML as primary model.

---

## 2. Current About paths (SoT inventory)

| Layer | Today | Paths / IDs |
| --- | --- | --- |
| **SoT** | Repo JSON + **GitHub Contents** commits on `main` | `config/sites/gosaki-piano-about-content.json` |
| **Admin live-read** | Contents GET via dry-run Edge | `gosaki-about-content-dry-run` |
| **Dry-run / Save** | Contents write | Save: `gosaki-about-content-save` · approvals **`G-12a-*`** (do **not** reuse) |
| **Structured parse** | `heading` / `body` (paragraphs) / `imageAlt` | `supabase/functions/_shared/gosaki-about-html-patch.ts` |
| **Public/build** | Convert hook patches About HTML from JSON blocks | `gosaki-about-content.mjs` · `cmsFeatures.aboutContent` |
| **Registry** | `cmsFeatures.aboutContent: true` · **no** `supabaseFeatures.about*` | `config/sites/registry.json` |

**Seed lede (from JSON SoT first `<p>`):**

```txt
後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。
```

---

## 3. Schema decision: singleton vs ordered blocks

| Option | Shape | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| **A. Singleton** `site_about_profiles` | 1 row/site · columns `heading`,`lede`,`body`,… | Typed columns; simple lock | About-only; each new field = DDL; Kit reuse weak | Reject for Kit Core |
| **B. Ordered HTML blocks** `site_about_blocks` | `(site_id, block_id)` + `html` | Mirrors JSON blocks | **Opaque HTML primary** — XSS/patch fragility; hard to generalize | **Reject** |
| **C. Keyed page fields** `site_page_fields` | `(site_id, page_key, field_key)` + `value_text` + optional `sort_order` | Scalar-first; Kit-general; one-field slice natural; column grants clear | Slightly more abstract than singleton | **Recommend** |

### Recommended table: `public.site_page_fields`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `site_id` / `site_slug` | uuid / text | Composite FK → `sites(id, site_slug)` · **ON DELETE RESTRICT** · **ON UPDATE CASCADE** |
| `page_key` | text NOT NULL | Slice 1: `about` |
| `field_key` | text NOT NULL | Slice 1: `profile.lede` |
| `value_text` | text NOT NULL | Plain text scalar (not HTML) |
| `published` | boolean NOT NULL default false | Public SELECT only when true |
| `sort_order` | integer NOT NULL default 0 | Future multi-field ordering; seed `10` |
| `created_at` / `updated_at` | timestamptz | `updated_at` trigger — optimistic lock SoT |
| `created_by` / `updated_by` | uuid → `auth.users` ON DELETE SET NULL | Set by audit trigger from `auth.uid()` only |
| UNIQUE | `(site_id, page_key, field_key)` | One value per field per site |

**Reuse (already on staging from YouTube):** `sites` · `site_members` · `platform_admins` · `is_platform_admin()` · `is_site_member(uuid)` · `can_write_site(uuid)`.

**Out of slice 1 columns:** HTML blobs · Storage paths · bands · full `profile.body`.

---

## 4. Dual-path / env / approval (reserved — not wired yet)

| Concern | Contract |
| --- | --- |
| Default Admin path | **Contents** (unchanged) until opt-in flag |
| Admin Supabase path flag | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` |
| Client Save arm | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` |
| Server Save arm | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |
| Build-read prefer DB | `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` **or** future `registry.supabaseFeatures.sitePageFields` |
| Fallback | Empty/error → keep JSON / Contents SoT (no blank About) |
| Dry-run approval | `G-cms-v2-about-supabase-profile-lede-dry-run` |
| Save approval | `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice` |

**Do not reuse:** `G-12a-*` · `G-cms-v2-youtube-supabase-*` · YouTube Contents approvals.

**Single-arm:** Contents About Save and Supabase About Save must not both be armed.

---

## 5. Authz / GRANT / RLS (fail-closed)

### Policies (draft)

| Policy | Role | Rule |
| --- | --- | --- |
| Public SELECT | `anon`, `authenticated` | `published = true` |
| Admin SELECT | `authenticated` | `can_write_site(site_id)` |
| INSERT / UPDATE | `authenticated` | `can_write_site(site_id)` |
| DELETE | — | **none** (deferred) |

### Column-level GRANTs (authenticated)

- **INSERT:** `site_id`, `site_slug`, `page_key`, `field_key`, `value_text`, `published`, `sort_order`
- **UPDATE:** `value_text`, `published`, `sort_order`
- **NOT client-writable:** `id`, `created_at`, `created_by`, `updated_at`, `updated_by`; on UPDATE also freeze `site_id` / `site_slug` / `page_key` / `field_key` via audit trigger

### Fail-closed sequence

1. `REVOKE ALL` on `site_page_fields` from `PUBLIC` / `anon` / `authenticated`
2. Minimal re-GRANT SELECT (+ column writes above)
3. `service_role`: **not granted / not used**

Tenancy table policies/grants already applied for YouTube — **do not re-apply** sites RLS in this About RLS template (About RLS file only touches `site_page_fields`).

---

## 6. Prerequisites (staging must already have)

| Check | Expect |
| --- | --- |
| Project ref | `kmjqppxjdnwwrtaeqjta` only |
| Tables | `sites`, `site_members`, `platform_admins`, `site_embeds` |
| Helpers | `is_platform_admin()`, `is_site_member(uuid)`, `can_write_site(uuid)` |
| Site row | `gosaki-piano` |
| Access | At least one `site_members` owner and/or `platform_admins.active=true` (from YouTube access assignment) |

If tenancy missing → **STOP**. Apply YouTube Core templates first under a **separate** approved phase — do not fold into About apply.

**Access assignment for About:** **no new INSERT template**. Reuse existing membership. SELECT-only readiness is in §9.

---

## 7. Apply order (future — not this phase)

| # | File | Purpose |
| --- | --- | --- |
| 0 | (ops) | Confirm project `kmjqppxjdnwwrtaeqjta` + §9 SELECT PASS |
| 1 | `cms-core-v2-site-page-fields-migration.template.sql` | DDL + triggers for `site_page_fields` only |
| 2 | `cms-core-v2-site-page-fields-rls.template.sql` | RLS + fail-closed GRANT on `site_page_fields` |
| 3 | `cms-core-v2-gosaki-about-profile-lede-seed.template.sql` | Upsert `about` / `profile.lede` for `gosaki-piano` |

**Required approval form (apply):**

```txt
承認します。この操作を1回だけ実行してください。
```

Vague “OK” is insufficient. One file per approval preferred.

`readyForOperatorAboutMigrationApply` stays **false** until a separate apply-gate phase flips it after this preflight is accepted.

---

## 8. Rollback order (future — reverse; explicit approval each step)

| # | File / ops | Scope |
| --- | --- | --- |
| 1 | (ops) | Disarm About Supabase path/Save arms; Contents remains default |
| 2 | `cms-core-v2-gosaki-about-profile-lede-seed-rollback.template.sql` | DELETE **only** seed row (exact site/page/field/value) |
| 3 | `cms-core-v2-site-page-fields-rls-rollback.template.sql` | Drop About policies + revoke grants — **no row delete** |
| 4 | `cms-core-v2-site-page-fields-migration-rollback.template.sql` | Drop `site_page_fields` + triggers — **does not** drop tenancy / `site_embeds` |

**STOP:** unclear mid-apply → stop, no retry, no cleanup without new approval (AGENTS).

**Note:** Full YouTube Core DDL rollback must be updated later to treat `site_page_fields` as a known dependent (or drop About first). Do not run YouTube tenancy rollback while `site_page_fields` exists.

---

## 9. Operator SELECT-only readiness (1 paste · staging)

Run **before** any About DDL apply. No INSERT/UPDATE/DELETE/DDL.

```sql
-- =============================================================================
-- CMS Core v2 About — SELECT-ONLY readiness (pre-apply)
-- Project MUST be: kmjqppxjdnwwrtaeqjta
-- STOP: vsbvndwuajjhnzpohghh
-- =============================================================================

-- A) Project / table presence
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'sites', 'site_members', 'platform_admins', 'site_embeds', 'site_page_fields'
  )
order by 1;

-- B) Authz helpers (signatures)
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_platform_admin', 'is_site_member', 'can_write_site')
order by 1, 2;

-- C) gosaki site
select id, site_slug, status, updated_at
from public.sites
where site_slug = 'gosaki-piano';

-- D) Access present?
select 'site_members' as kind, count(*)::int as n
from public.site_members m
join public.sites s on s.id = m.site_id
where s.site_slug = 'gosaki-piano'
union all
select 'platform_admins_active', count(*)::int
from public.platform_admins
where active = true;

-- E) site_page_fields already exists? (expect 0 rows in A until About apply)
select count(*)::int as site_page_fields_rows
from information_schema.tables
where table_schema = 'public' and table_name = 'site_page_fields';
```

### SELECT PASS

- Project is staging
- Tenancy + helpers + `gosaki-piano` present
- Access count ≥ 1 (members and/or active platform_admins)
- `site_page_fields` absent (first About apply) **or** empty/compatible if re-entry documented

### SELECT STOP

- Wrong project / production
- Missing `sites` / helpers / `gosaki-piano`
- Zero access rows
- Incompatible pre-existing `site_page_fields` shape

---

## 10. Seed contract (profile.lede)

| Field | Value |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| `page_key` | `about` |
| `field_key` | `profile.lede` |
| `value_text` | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| `published` | `true` |
| `sort_order` | `10` |

Seed uses `ON CONFLICT (site_id, page_key, field_key) DO UPDATE` for **this key only**.

Rollback DELETE requires matching `site_slug` + `page_key` + `field_key` + exact `value_text` (seed baseline).

---

## 11. Staged implementation order (after apply gate — future)

```txt
1. Operator SELECT-only PASS (§9)
2. Approved apply: migration → RLS → seed (staging only)
3. Post-apply verification SELECT (table + seed row + grants)
4. Local implementation: Edge dry-run/Save (arms false) + admin dual-path + build fallback
5. Admin path package QA (Save disabled)
6. Public build-read QA
7. Optional registry.sitePageFields persistence
8. Gated Save round-trip → disarm
9. Later: Contents About retire (separate approval)
```

---

## 12. STOP / PASS gates

### This preflight PASS when

- Schema recommendation = `site_page_fields` (scalar; not opaque HTML)
- SQL templates exist with DO NOT EXECUTE + staging/production STOP refs
- Approval IDs reserved and distinct from G-12a / YouTube
- Dual-path + fallback + arms documented
- Access = reuse existing tenancy (no new membership INSERT template)
- `readyForOperatorAboutMigrationApply: false`
- Verifier PASS · `git diff --check` clean

### Always STOP

- production `vsbvndwuajjhnzpohghh`
- `service_role`
- SQL apply / DB write / Secret / Edge deploy / FTP / Function invoke without explicit AGENTS approval
- Reusing `G-12a-*` or YouTube Supabase approval IDs
- Arming Contents About Save and Supabase About Save together
- Writing `schedule_months` / Discography / YouTube as part of About apply

---

## 13. Artifacts

| Kind | Path |
| --- | --- |
| Preflight (this) | `docs/cms-core-v2-about-supabase-vertical-slice-preflight.md` |
| Migration | `scripts/supabase/cms-core-v2-site-page-fields-migration.template.sql` |
| RLS | `scripts/supabase/cms-core-v2-site-page-fields-rls.template.sql` |
| Seed | `scripts/supabase/cms-core-v2-gosaki-about-profile-lede-seed.template.sql` |
| Migration rollback | `scripts/supabase/cms-core-v2-site-page-fields-migration-rollback.template.sql` |
| RLS rollback | `scripts/supabase/cms-core-v2-site-page-fields-rls-rollback.template.sql` |
| Seed rollback | `scripts/supabase/cms-core-v2-gosaki-about-profile-lede-seed-rollback.template.sql` |
| Verifier | `scripts/verify-cms-core-v2-about-supabase-vertical-slice-preflight.mjs` |

---

## Gates

```txt
cmsCoreV2AboutSupabaseVerticalSlicePreflightComplete: true
recommendedAboutSchema: site_page_fields
aboutFirstFieldKey: about/profile.lede
opaqueHtmlPrimaryModel: false
tenancyReuseSitesSiteMembersPlatformAdmins: true
aboutAccessAssignmentReusesYoutubeMembership: true
readyForOperatorAboutMigrationApply: false
aboutSupabaseImplementationExecuted: false
contentsAboutPathUnchanged: true
sqlApplyExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false
readyForAnyFutureFtpApply: false
```

**Next gate:** operator accepts preflight → separate phase flips `readyForOperatorAboutMigrationApply` (still one-file apply approvals) → then local Edge/admin implementation planning.
