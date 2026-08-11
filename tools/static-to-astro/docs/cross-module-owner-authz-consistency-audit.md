# CMS Core v2 — Cross-module owner authz consistency audit

- **Phase:** `cross-module-owner-authz-consistency-audit`
- **Date:** 2026-08-11
- **Status:** **COMPLETE (read-only audit / docs)**
- **HEAD:** `a073bbce534039fe1a9dbbf4058ed91258192f78`
- **This phase:** compare CMS write authorization models · **no** implementation · **no** SQL/DB write · **no** migration · **no** deploy · **no** env/arm · **no** commit/push by Cursor

Reference: Schedule TBD CREATE path (`can_write_site` + site-writer RLS) is **staging-proven** but is **not** treated as automatic SoT for every module — evaluated against ADR `cms-core-v2-minimal-architecture-decision.md`.

---

## 0. Gates

```txt
CROSS_MODULE_OWNER_AUTHZ_CONSISTENCY_AUDIT_COMPLETE: true
AUTHZ_MATRIX_COMPLETE: true
SCHEDULE_STATUS: PARTIAL
DISCOGRAPHY_STATUS: LEGACY
ABOUT_STATUS: PARTIAL
YOUTUBE_CURRENT_STATUS: LEGACY
YOUTUBE_SUPABASE_STATUS: ALIGNED
ADMIN_SHELL_STATUS: PARTIAL
REFERENCE_IMPLEMENTATION_FREEZE_READY: false
DB_WRITE_EXECUTED: false
MIGRATION_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
RECOMMENDED_NEXT_PRIMARY: discography-site-owner-authz-planning
```

---

## 1. ADR target model (evaluation yardstick)

From `cms-core-v2-minimal-architecture-decision.md`:

| Actor | Scope | Write |
| --- | --- | --- |
| `site_members.role=owner` | one `site_id` | content INSERT/UPDATE within allowlists |
| `site_members.role=editor` | one `site_id` | same content writes |
| `platform_admins.active` | cross-site assist | via `can_write_site` |
| legacy `admin_users` / `is_admin()` | transitional | **not** a substitute for site owner |

Helper: `can_write_site(p_site_id) = is_platform_admin() OR is_site_member(p_site_id)`
(`is_site_member` allows `owner` \| `editor`).

**Do not** add site owners to `admin_users` to “fix” gaps.

---

## 2. Status legend

| Status | Meaning |
| --- | --- |
| **ALIGNED** | Matches ADR: `sites` resolve + `can_write_site` (+ matching RLS/Edge) · owner/editor by design |
| **PARTIAL** | Mix of ADR-aligned and legacy paths, or shell-only gate without membership |
| **LEGACY** | Write SoT is `is_admin` / `admin_users` and/or `ADMIN_EMAILS` / `app_metadata.role=admin` |
| **NOT_APPLICABLE** | No product write surface |
| **UNKNOWN** | Insufficient code/docs to classify |

Evidence levels: **staging-proven** · **local-only** · **code-only** (do not conflate).

---

## 3. Authz matrix (write modules)

| Module / path | Client gate | Server / Edge gate | RLS / DB | `can_write_site` | `is_admin` / `admin_users` | Owner write? | Editor write? | DELETE | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Schedule TBD CREATE** | signed-in + sites + `can_write_site` | none (RLS) | `schedules_site_writer_{select,insert}` + public/admin retained | **yes** | no (as owner gate) | **yes** CREATE | **yes** (helper) | no product path | **staging-proven** | **ALIGNED** |
| **Schedule UPDATE / Edge save** | signed-in (+ mock warning) | Edge `rpc('is_admin')` | UPDATE via `schedules_admin_all` only (no site-writer UPDATE) | **no** | **yes** | **no** (unless also admin) | **no** | soft unpublish only | UPDATE staging under admin JWT | **LEGACY** |
| **Discography** | signed-in | Edge `assertOperatorIsAdmin` → `is_admin` · RPC DEFINER + `is_admin` | `discography*_admin_all` (`is_admin`) | **no** | **yes** | **no** (unless also admin) | **no** | no product DELETE | Saves staging-proven under admin | **LEGACY** |
| **About · GitHub Contents** | Bearer session | `requireAdminUser` (`ADMIN_EMAILS` / claims) | N/A (git) | **no** | no DB `is_admin` | **no** unless allowlisted | **no** | surgical patch only | **staging-proven** Contents | **LEGACY** |
| **About · Supabase `site_page_fields`** | JWT → Edge | sites + `can_write_site` | `site_page_fields_*` writer policies | **yes** | **no** | **yes** | **yes** | no DELETE policy | hydrate/Save docs; arms often off | **ALIGNED** |
| **YouTube · GitHub Contents (current ops)** | Bearer session | `requireAdminUser` | N/A (git) | **no** | no DB `is_admin` | **no** unless allowlisted | **no** | soft `published=false` | **staging-proven** Contents | **LEGACY** |
| **YouTube · Supabase `site_embeds`** | JWT → Edge | sites + `can_write_site` | `site_embeds_*` writer policies | **yes** | **no** | **yes** | **yes** | no DELETE policy | vertical slice + RLS apply; Save often disarmed | **ALIGNED** |
| **Admin staging shell** | signed-in only | DEV + `ENABLE_ADMIN_STAGING_SHELL` | n/a | **no** | mock role ≠ DB | UI visible if signed-in | n/a | n/a | **local-only** shell | **PARTIAL** |

---

## 4. Per-module detail (checklist 1–15)

### 4.1 Schedule — TBD CREATE (**ALIGNED** · staging-proven)

1. **Read:** Supabase `public.schedules` (anon published / JWT writer select)
2. **Write:** client INSERT `gosaki-schedule-tbd-create-oneshot-save.ts`
3. **Client gate:** session + `sites` resolve + `rpc('can_write_site', { p_site_id })`
4. **Server gate:** none (RLS)
5. **RLS:** `schedules_site_writer_select` / `_insert` (+ `schedules_public_select`, `schedules_admin_all`)
6. **can_write_site:** yes
7. **is_admin:** not used as owner gate
8. **platform_admins:** via `can_write_site`
9. **Site boundary:** fixed `site_slug=gosaki-piano` + RLS `sites.site_slug = schedules.site_slug`
10. **Owner Create:** yes
11. **Editor Create:** yes (helper)
12. **Cross-site:** fail-closed on `can_write_site` / payload
13. **Unpublished read:** writer SELECT; public published-only
14. **DELETE:** none in product (manual cleanup SQL only)
15. **Evidence:** oneshot CREATE SUCCESS 2026-08-08 · cleanup 2026-08-10

### 4.2 Schedule — UPDATE / general edit (**LEGACY**)

1–2. PostgREST UPDATE / Edge `gosaki-schedule-save-dry-run`
3. Client: signed-in
4. Edge: `assertOperatorIsAdmin` → `is_admin`
5. RLS: **no** site-writer UPDATE; relies on `schedules_admin_all`
6–7. can_write_site **no** · is_admin **yes**
10–11. Owner/editor UPDATE **no** without `admin_users`
14. Soft unpublish only
15. Staging UPDATE under admin JWT · **owner UPDATE not proven**

### 4.3 Discography (**LEGACY**)

1. Supabase `discography` / `discography_tracks`
2. Client UPDATE adapters + Edge `gosaki-discography-save-dry-run` + RPC `gosaki_discography_operational_save`
3. Client: signed-in · field/slice guards · **no** `can_write_site`
4. Edge: `assertOperatorIsAdmin` → `rpc('is_admin')` must be true
5. RLS: `discography_admin_all` / `discography_tracks_admin_all` (`is_admin`) + public published select + slice RESTRICTIVE policies
6. **can_write_site:** **no**
7. **is_admin / admin_users:** **yes** (primary SoT)
8. platform_admins: unused
9. Boundary: legacy_id / slice hardcodes; `site_slug` column exists but authz not membership-scoped
10. **Site owner write?** **No** by current design unless also legacy admin — **not staging-verified for owner** (owner path N/A)
11. Editor: **no**
12. Cross-site: weak at authz (admin ALL)
13. Unpublished: admin ALL vs public published
14. DELETE: none
15. Controlled Saves **staging-proven under is_admin** · owner path **code-only negative**

Key: `supabase/functions/gosaki-discography-save-dry-run/handler.ts` (`assertOperatorIsAdmin`).

### 4.4 About — Contents current ops (**LEGACY**)

1. GitHub JSON
2. Edge `gosaki-about-content-save` → Contents API
3–4. `requireAdminUser` (`ADMIN_EMAILS` / `app_metadata.role=admin`)
5–8. No RLS · no can_write_site · no admin_users table gate
10–11. Owner/editor **no** unless allowlisted
15. **staging-proven** Contents

### 4.5 About — Supabase Core v2 (**ALIGNED**)

1–2. `site_page_fields` · Edge `gosaki-about-supabase-save-dry-run`
3–4. JWT + sites + `can_write_site`
5. `site_page_fields` admin insert/update/select policies
6. **yes** · 7. **no** · 8. via helper
10–11. owner + editor **yes**
14. no DELETE policy
15. Documented staging roundtrips · routine arms often **false** → operational Save **partial**

### 4.6 YouTube — Contents current ops (**LEGACY**)

Same pattern as About Contents: `requireAdminUser` · no site membership · **staging-proven**.

### 4.7 YouTube — Supabase `site_embeds` (**ALIGNED**)

Same pattern as About Supabase: `assertCanWriteSite` · site_embeds RLS · owner+editor by design · Save often disarmed → treat live Save as **code/staging-partial**.

### 4.8 Admin staging shell (**PARTIAL**)

1–2. Host UI only
3. `staging-admin-auth-gate.ts` — signed-in only
4. DEV + env shell enable
5–8. No membership check at shell
9. `/__admin-staging-shell/musician-basic/` isolation (not `/admin`)
10. Any signed-in user sees UI; **module gates** decide write
15. **local-only**

Mock role (`staging-role-resolver.ts`) is **UI/warning only** — not `admin_users` SoT.

---

## 5. Findings

### BLOCKER (for “owner-run CMS” / reference freeze)

| ID | Finding |
| --- | --- |
| B1 | **Discography write requires `is_admin`** — pure `site_members` owner **cannot** Save by design |
| B2 | **Schedule UPDATE requires `is_admin` / `schedules_admin_all`** — site-writer policies are SELECT+INSERT only |
| B3 | **Authz models split** — owner may CREATE schedules / Save Supabase About·YouTube but fail Discography & Schedule edit & Contents Saves without legacy admin |

### BEFORE_GENERALIZATION

| ID | Finding |
| --- | --- |
| G1 | Discography needs site-scoped authz plan (client + Edge + RLS) mirroring ADR — **do not** add owner to `admin_users` |
| G2 | Schedule UPDATE needs site-writer UPDATE (and lock) policy plan + Edge cutover from `is_admin` |
| G3 | YouTube/About **Contents** paths need either retirement behind Supabase path or explicit “operator-only Contents” ADR exception |
| G4 | Staging shell should eventually surface membership (`can_write_site`) not mock-admin alone |
| G5 | Historical “client-ready / staging QA PASS” must not be read as current owner-authz PASS |

### NON_BLOCKING

| ID | Finding |
| --- | --- |
| N1 | Schedule TBD CREATE path already ADR-aligned and staging-proven |
| N2 | About/YouTube Supabase Edge already use `can_write_site` |
| N3 | `platform_admins` correctly modeled as assist, not owner substitute (ADR) |
| N4 | No product DELETE on most modules (good fail-closed default) |

---

## 6. Discography migration necessity

**Verdict: REQUIRED before owner-operated generalization.**

| Question | Answer |
| --- | --- |
| Can site owner write today? | **No** (code/RLS/Edge all require `is_admin`) |
| Staging-proven owner write? | **No** — owner path not exercised; admin path only |
| Fix by adding owner to `admin_users`? | **Forbidden** |
| Next work | Planning phase for Discography site-owner authz (client gate + Edge + RLS templates) |

---

## 7. Reference-implementation freeze

**`REFERENCE_IMPLEMENTATION_FREEZE_READY: false`**

Freeze as “Gosaki = ADR-complete owner CMS” is **not** ready while Discography + Schedule UPDATE + Contents ops remain legacy-admin. Freeze as “static staging preview package” remains orthogonal (ops share).

---

## 8. Recommended next Primary

**`discography-site-owner-authz-planning`** (docs-only)

Why first:
1. Clear **BLOCKER** for owner write
2. Highest user-visible CMS surface after Schedule
3. Schedule INSERT already proven; UPDATE can follow as second slice
4. Contents YouTube/About can stay operator-only until Supabase path is the default Save

Alternate (if Discography deferred): `schedule-update-site-writer-rls-planning`.

---

## 9. Key evidence files

| Area | Paths |
| --- | --- |
| ADR | `tools/static-to-astro/docs/cms-core-v2-minimal-architecture-decision.md` |
| Schedule owner | `src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-save.ts` · `docs/cms-core-v2-schedule-site-owner-authz-rls-implementation.md` · `scripts/supabase/cms-core-v2-schedules-site-writer-rls.template.sql` |
| Schedule UPDATE | `src/lib/admin/staging-write/schedule-general-update-trigger.ts` · `supabase/functions/gosaki-schedule-save-dry-run/handler.ts` |
| Discography | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` · `src/lib/admin/staging-write/discography-write-adapter.ts` |
| About Contents | `supabase/functions/gosaki-about-content-save/index.ts` · `_shared/admin-auth.ts` |
| About Supabase | `supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts` |
| YouTube Contents | `supabase/functions/gosaki-youtube-url-save/index.ts` |
| YouTube Supabase | `supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts` |
| Shell | `src/lib/admin/staging-auth/staging-admin-auth-gate.ts` · `staging-role-resolver.ts` |

---

## 10. Explicit non-actions

- No code/RLS/SQL changes
- No env/arm/process
- No owner→`admin_users` proposal
- No production / FTP / Contents write
- Commit/push only if operator separately requests docs commit
