# Discography site-owner authz — planning (read-only)

- **Phase:** `discography-site-owner-authz-planning`
- **Date:** 2026-08-12
- **Status:** **COMPLETE (docs / offline verifier only)**
- **HEAD:** `6240be7a0a853c671d7ce6affd3041ea08755bad`
- **Prior:** `cross-module-owner-authz-consistency-audit` → Discography **LEGACY**
- **This phase:** plan migration from `is_admin` / `admin_users` → ADR `can_write_site` · **no** code implementation · **no** SQL apply · **no** DB write · **no** env/arm · **no** commit/push by Cursor

**Forbidden:** add site owners to `admin_users`.
**Do not** copy Schedule SELECT+INSERT template blindly — Discography is parent `discography` + child `discography_tracks` with operational track **replace** (DELETE+INSERT).

---

## 0. Gates

```txt
DISCOGRAPHY_SITE_OWNER_AUTHZ_PLANNING_COMPLETE: true
CURRENT_AUTHZ_PATH: legacy_is_admin
TARGET_AUTHZ_PATH: sites_resolve_can_write_site_site_scoped_rls
MIGRATION_REQUIRED: true
IMPLEMENTATION_READY: true
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
DB_WRITE_EXECUTED: false
MIGRATION_EXECUTED: false
CODE_IMPLEMENTATION_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-implementation-and-migration-template
```

---

## 1. CURRENT_AUTHZ_PATH

```txt
signed-in JWT
  → (client) staging shell + dry-run/arm/approval fail-closed
  → Edge assertOperatorIsAdmin → rpc('is_admin') === true
     OR PostgREST under RLS discography*_admin_all (is_admin)
     OR SECURITY DEFINER rpc gosaki_discography_operational_save → public.is_admin()
  → write
```

| Layer | Mechanism | Owner without `admin_users`? |
| --- | --- | --- |
| Client scalar / track PoCs | signed-in only · **no** `can_write_site` | Denied by RLS/grants |
| Edge controlled / operational | `assertOperatorIsAdmin` → `is_admin` | **403 admin_required** |
| Operational RPC | DEFINER · `is_admin()` gate | **denied** |
| RLS write | `discography_admin_all` / `discography_tracks_admin_all` | **no** |
| Public read | `discography_public_select` / `discography_tracks_public_select` (`published`) | read published only |

**Evidence:** staging Saves under **admin JWT** (G-15 / G-18g2 / G-19b1 / G-20u36e/f). Owner write path **not** staging-proven (code/RLS negative).

**Site identity today:** hardcoded / payload `site_slug = 'gosaki-piano'` string filter — **not** `sites.id` + membership.

---

## 2. TARGET_AUTHZ_PATH

```txt
signed-in JWT
  → resolve public.sites by site_slug (unique active row)
  → rpc('can_write_site', { p_site_id: sites.id }) must be true
       (= is_platform_admin() OR is_site_member(site_id) for owner|editor)
  → Edge/runtime re-assert can_write_site (fail-closed)
  → writes under site-scoped RLS and/or DEFINER RPC re-gated to can_write_site
  → retain dry-run / dual-arm / approval IDs / optimistic lock
```

| Actor | Target |
| --- | --- |
| `site_members.owner` | SELECT (incl. unpublished) + allowlisted UPDATE · operational Save |
| `site_members.editor` | same (ADR) |
| `platform_admins.active` | same via `can_write_site` |
| legacy `is_admin` | transitional via retained `*_admin_all` — **not** owner substitute |
| anon | published SELECT only (unchanged) |

**Canonical helpers:** `sites` / `site_members` / `platform_admins` / `can_write_site(site_id)`
(ADR: `cms-core-v2-minimal-architecture-decision.md`)

---

## 3. Design answers (required clarifications)

### 3.1 Site unique resolve

1. Input: fixed Kit site_slug for Gosaki ops (`gosaki-piano`) or request `siteSlug` (must match).
2. `select id, site_slug, status from public.sites where site_slug = $slug limit 2`.
3. Fail-closed if 0 or >1 rows; optionally reject `status ≠ active` at Edge (YouTube Supabase pattern) — helpers themselves do **not** read `status` (ADR note).
4. Use `sites.id` only for `can_write_site`; keep row tenancy on **`site_slug`** columns (already migrated G-20u23). **No `site_id` column required for first slice** (Schedule site-writer join pattern).

### 3.2 Where to confirm `can_write_site`

| Location | Required? |
| --- | --- |
| Client (optional early UX) | Recommended for operational / future owner UI |
| Edge before any mutate | **Required** (replace `assertOperatorIsAdmin`) |
| Operational RPC body | **Required** (replace `is_admin()`) — DEFINER bypasses RLS |
| RLS policies | **Required** for PostgREST paths + writer SELECT |

### 3.3 Parent + tracks site-scoped RLS

Join pattern (do **not** hardcode `gosaki-piano` inside policy SQL):

```sql
exists (
  select 1 from public.sites s
  where s.site_slug = <table>.site_slug
    and public.can_write_site(s.id)
)
```

Apply to **both** `discography` and `discography_tracks` (tracks use `site_slug` column; bind parent via `site_slug` + `discography_legacy_id` in RPC/app logic).

### 3.4 Cross-site write prevention

- Payload `site_slug` must equal resolved site.
- All UPDATE/DELETE/INSERT predicates retain `site_slug` + legacy_id (RPC already does).
- RLS `with check` / `using` via `can_write_site` on that slug’s `sites.id`.
- Reject foreign `site_slug` even if caller is platform_admin writing wrong slug by mistake (Edge identity check).

### 3.5 Platform admin compatibility

`can_write_site` already ORs `is_platform_admin()` — no separate Discography bridge. Do not require `admin_users`.

### 3.6 INSERT / UPDATE / DELETE policies needed

| Command | `discography` | `discography_tracks` | Product need |
| --- | --- | --- | --- |
| SELECT (writer) | **yes** site-writer | **yes** site-writer | hydrate unpublished |
| UPDATE | **yes** site-writer (PostgREST slices) | **yes** (title / future) | scalar + track title |
| INSERT | **defer** (no album CREATE) | **yes if** non-DEFINER track replace | operational replace |
| DELETE | **no** (album DELETE forbidden) | **yes if** non-DEFINER track replace | replace only |

**Recommended strategy (phased):**

| Slice | Authz change | Grants |
| --- | --- | --- |
| **A (primary)** | Edge + RPC: `is_admin` → `can_write_site`; add **writer SELECT** RLS both tables | No table UPDATE re-GRANT; operational Save stays DEFINER |
| **B** | Add site-writer **UPDATE** RLS both tables | Minimal column/table GRANT only if PostgREST owner slices must work without DEFINER |
| **C** | Track INSERT/DELETE RLS **only if** retiring DEFINER replace | Prefer keep replace inside RPC until B proven |

Album **CREATE** / album **DELETE**: out of scope (remain absent). Soft-unpublish only if later product asks.

### 3.7 Public read impact

**None intended.** Do not alter `discography_public_select` / `discography_tracks_public_select`. Anon published counts must stay stable in staging SELECT-only checks.

### 3.8 Optimistic lock / TX

- Album: keep `updated_at` trigger + `expectedBeforeUpdatedAt` (scalar + RPC).
- Tracks: no `updated_at` trigger today; operational replace is all-or-nothing in one RPC TX.
- Do not split album UPDATE and track replace across two client round-trips without a new TX design.

### 3.9 Dry-run / arm / fail-closed

Retain: `PUBLIC_ADMIN_WRITE_DRY_RUN` default, per-slice arms, `GOSAKI_DISCOGRAPHY_SAVE_ARMED`, approval IDs, single-arm mutex. Authz swap must not weaken arms.

### 3.10 RESTRICTIVE slice policies

Existing RESTRICTIVE UPDATE policies (G-20u36e title · G-20u43 label prep) **AND** with new PERMISSIVE site-writer policies — keep them; they narrow columns even for owners (good).

---

## 4. REQUIRED_CODE_CHANGES (next implementation phase — not this phase)

| Area | Change |
| --- | --- |
| Edge `handler.ts` (+ mirror) | Replace `assertOperatorIsAdmin` with sites resolve + `assertCanWriteSite`; all Save branches |
| Operational client (optional) | Early `can_write_site` for clearer errors |
| PostgREST adapters | No authz change required if RLS+grants correct; optional client gate |
| RPC migration SQL | Redefine `gosaki_discography_operational_save` gate: `is_admin` → resolve site → `can_write_site` |
| Docs / verifiers | Implementation + apply-result phases |
| `/admin` | **Do not touch** |

**Out of this planning:** actual TS/SQL edits.

---

## 5. REQUIRED_RLS_CHANGES

| Policy (proposed names) | Table | Cmd | Notes |
| --- | --- | --- | --- |
| `discography_site_writer_select` | `discography` | SELECT | Slice A |
| `discography_tracks_site_writer_select` | `discography_tracks` | SELECT | Slice A |
| `discography_site_writer_update` | `discography` | UPDATE | Slice B |
| `discography_tracks_site_writer_update` | `discography_tracks` | UPDATE | Slice B |
| `discography_tracks_site_writer_insert` | `discography_tracks` | INSERT | Slice C only |
| `discography_tracks_site_writer_delete` | `discography_tracks` | DELETE | Slice C only · replace-scoped via RLS alone is weak — prefer RPC |

**Retain:** `discography_admin_all`, `discography_tracks_admin_all`, public selects, RESTRICTIVE slice policies.
**Forward template style:** Schedule-like `CREATE POLICY` without DROP; stop on drift.
**Rollback template:** `DROP POLICY IF EXISTS` new policies only · restore prior RPC definition from known migration.

**Grants (G-20u36a context):** authenticated table UPDATE currently **0**. Slice A owner operational path does **not** need re-GRANT. Slice B must document exact GRANT surface (prefer column-level) — separate approval.

---

## 6. MIGRATION_REQUIRED

**`MIGRATION_REQUIRED: true`**

1. RLS forward (+ rollback) templates for writer SELECT (then UPDATE).
2. RPC redefine (`is_admin` → `can_write_site`) + rollback SQL.
3. Staging apply only after SELECT-only preflight + explicit operator approval (destructive-class: DB mutation).

Schema column add (`site_id`): **not required** for Slice A/B if slug→sites join used.

---

## 7. RISKS

| Risk | Mitigation |
| --- | --- |
| DEFINER RPC bypasses RLS — wrong gate = cross-tenant write | Dual check Edge + RPC; bind `site_slug` on every DML |
| Track DELETE+INSERT power | Keep inside single RPC TX; no free-form DELETE API |
| Re-GRANT UPDATE reopens broad writes | Prefer Slice A first; Slice B column GRANT + RESTRICTIVE |
| Owner still cannot SELECT unpublished without writer SELECT | Ship SELECT policies in Slice A with RPC gate |
| Mixing Schedule INSERT-only template | Explicit UPDATE (+ optional tracks INSERT/DELETE) design above |
| Historical admin Save PASS ≠ owner PASS | New staging owner JWT matrix required |
| `sites.status` not in helpers | Edge reject non-active if product requires |

---

## 8. BLOCKERS (before staging apply / owner Save)

| ID | Blocker |
| --- | --- |
| B1 | Offline RLS + RPC templates not authored yet (next phase) |
| B2 | Staging SELECT-only fingerprint of current `pg_policies` / grants for discography\* not refreshed in this planning doc |
| B3 | Owner JWT fixture (`site_members` owner · `is_admin=false`) must exist on staging for proof |
| B4 | Explicit operator approval required before any SQL apply / RPC replace / GRANT |
| B5 | Operational Save Edge deploy + arm still separate gates after authz code lands |

**Non-blockers for planning completeness:** public read OK; `site_slug` column present; ADR helpers exist on staging (used by Schedule CREATE / About·YouTube Supabase).

---

## 9. STAGING_TEST_PLAN (after implementation + apply — not now)

Order (fail-closed; stop on ambiguity):

1. **SELECT-only baseline** — policy names, grant counts, album/track row counts, published counts.
2. **Apply Slice A** (writer SELECT + RPC redefine) — one approved apply.
3. **Anon** — published SELECT unchanged; unpublished invisible.
4. **Owner JWT** (`can_write_site` true · `is_admin` false) — SELECT unpublished albums/tracks for `gosaki-piano`.
5. **Non-member JWT** — SELECT unpublished denied; Save denied.
6. **Dry-run** operational / controlled — no write.
7. **Armed Save once** (separate approval) — owner operational or controlled slice; verify `updated_at` / tracks TX; fingerprint after.
8. **Cross-site** — wrong `site_slug` rejected.
9. **Platform admin** — `can_write_site` true path still works.
10. **Rollback drill** (optional staging) — drop new policies / restore RPC; re-baseline.

Do **not** treat prior admin controlled-Save PASS as owner authz PASS.

---

## 10. ROLLBACK_PLAN

```txt
1. stop · do not retry · do not cleanup ad-hoc
2. DROP POLICY new discography*_site_writer_* only (rollback template)
3. CREATE OR REPLACE FUNCTION gosaki_discography_operational_save … prior is_admin body (from 20260721100000 migration / tagged rollback file)
4. REVOKE any Slice B grants added in that slice
5. SELECT-only verify policy list + anon published counts
6. record incident · ask human
```

Never rollback by adding owners to `admin_users`.
Never touch production project `vsbvndwuajjhnzpohghh`.

---

## 11. Why not copy Schedule site-writer wholesale

| Schedule CREATE (ALIGNED) | Discography |
| --- | --- |
| Single table INSERT | Parent UPDATE + child replace |
| No DELETE policy | Tracks DELETE inside RPC |
| Site-writer SELECT+INSERT only | Needs SELECT (+ UPDATE; INSERT/DELETE tracks later) |
| No DEFINER write RPC | Operational DEFINER is primary multi-row TX |
| Grants simpler | Table UPDATE revoked; column GRANT / DEFINER history |

Closest **code** reference for Edge gate: About/YouTube Supabase `can_write_site`.
Closest **RLS join** reference: `cms-core-v2-schedules-site-writer-rls.template.sql` (extend cmds for Discography).

---

## 12. IMPLEMENTATION_READY / next phase

**`IMPLEMENTATION_READY: true`** — planning sufficient to author offline:

- Edge/RPC gate swap design
- RLS forward/rollback **templates** (no apply)
- offline verifiers

**`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-implementation-and-migration-template`**

Then: SELECT-only staging preflight → apply Slice A (separate approvals) → owner Save proof.

Alternate Kit Primary if Discography deferred: `schedule-update-site-writer-rls-planning`.

---

## 13. Evidence files

| Kind | Path |
| --- | --- |
| Audit | `docs/cross-module-owner-authz-consistency-audit.md` |
| ADR | `docs/cms-core-v2-minimal-architecture-decision.md` |
| Edge | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |
| RPC | `supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql` |
| Client scalar | `src/lib/admin/staging-write/discography-scalar-field-save.ts` |
| Client tracks | `…/gosaki-discography-g18g2-…`, `…/g19b1-…` |
| Operational UI | `templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts` |
| site_slug migration | `docs/discography-site-slug-migration-execution-result.md` |
| Grants remediation | `docs/gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md` |
| Schedule RLS ref | `scripts/supabase/cms-core-v2-schedules-site-writer-rls.template.sql` |
| About/YouTube gate ref | `gosaki-about-supabase-save-dry-run/handler.ts`, `gosaki-youtube-supabase-save-dry-run/handler.ts` |

---

## 14. Explicit non-actions (this phase)

- No TS/SQL implementation beyond docs + offline verifier registration
- No SQL Editor / migration apply / GRANT / REVOKE
- No Edge deploy · no arm ON · no Save · no FTP · no production
- No commit/push unless operator separately requests
