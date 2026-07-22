# CMS Core v2 — Minimal Architecture Decision (Phase 1)

- **Phase:** `cms-core-v2-minimal-architecture-planning`
- **Status:** **complete** — architecture decisions only; **no implementation / migration / DB write**
- **Date:** 2026-07-22
- **Repo HEAD at planning:** `e7d568d` (= `origin/main`)
**Goal:** Fix the smallest multi-tenant CMS Core for ~10 sites so Phase 2 **YouTube Supabase Vertical Slice** can implement against a stable contract.

**Reuses (do not duplicate):**

| Doc | Reuse for |
| --- | --- |
| [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) | `site_embeds` field set, YouTube normalize, Gosaki routes |
| [schedule-optimistic-lock-enablement-planning.md](./schedule-optimistic-lock-enablement-planning.md) | `expectedBeforeUpdatedAt` contract |
| [private-server-side-allowlist-plan.md](./private-server-side-allowlist-plan.md) | why browser allowlists are not SoT |
| [gosaki-staging-online-cms-architecture-planning.md](./gosaki-staging-online-cms-architecture-planning.md) | static host: Save ≠ Node API; Edge for writes |
| [cms-kit-architecture.md](./cms-kit-architecture.md) | Save → export/build → deploy dataflow (product layer) |
| Schedule / Discography Gosaki admin | **reference implementations** — do not break |

**Out of Phase 1:** code, DB migration execution, RLS/GRANT/REVOKE apply, Secrets, Edge deploy, FTP, production, DNS, Contents API write, auto-deploy, revision tables, `deploy_jobs`, billing, SSR.

---

## 1. Verdict

```txt
CMS_CORE_V2_MINIMAL_ARCHITECTURE_PLANNED: true
READY_FOR_PHASE_2_YOUTUBE_SUPABASE_VERTICAL_SLICE: true
IMPLEMENTATION_EXECUTED: false
DB_MIGRATION_EXECUTED: false
YOUTUBE_CONTENTS_API_PATH_CHANGED: false
```

Core v2 SoT for tenancy + authz is **Postgres tables + RLS**, with **Edge Function** as the only trusted write façade for field guards / optimistic lock / dry-run. Auth custom claims and `ADMIN_EMAILS` remain a **legacy bridge**, not the multi-tenant SoT.

---

## 2. Tenancy tables (minimal)

### 2.1 `sites`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uuid` PK | **`site_id`** — stable FK target |
| `site_slug` | `text` UNIQUE NOT NULL | Human / config / URL id (`gosaki-piano`) |
| `display_name` | `text` | Operator label |
| `status` | `text` | `active` \| `suspended` (MVP: `active` only) |

**`sites.status` / Phase 2 authz:** `is_platform_admin()`, `is_site_member()`, and `can_write_site()` **do not** read `sites.status`. A `suspended` site still passes those helpers if membership/`platform_admins.active` allows it. Edge `gosaki-youtube-supabase-save-dry-run` separately rejects `status ≠ active`. Incorporating `status` into DEFINER helpers is a future approved change (new approval + verifier assertions) — **not** done in the initial staging apply templates.
| `created_at` / `updated_at` | `timestamptz` | Standard |

One row per customer site. ~10 sites share one staging Supabase project (`kmjqppxjdnwwrtaeqjta` today). Production Sariswing project remains **out of scope**.

### 2.2 `site_members`

| Column | Type | Rule |
| --- | --- | --- |
| `site_id` | `uuid` FK → `sites` | Tenant |
| `user_id` | `uuid` FK → `auth.users` | Member |
| `role` | `text` | `owner` \| `editor` only in Core v2 |
| PK | `(site_id, user_id)` | One role per membership |

### 2.3 `platform_admins`

| Column | Type | Rule |
| --- | --- | --- |
| `user_id` | `uuid` PK → `auth.users` | Kit operator / YSK |
| `created_at` | `timestamptz` | Audit |
| `active` | `boolean NOT NULL default true` | Soft revoke without deleting the row |

Cross-site break-glass for staging Kit work. **Not** a substitute for per-site `owner`.

**Immediate revoke contract:** `active = false` makes `is_platform_admin()` return false on the next call (no JWT refresh required). The user loses all-site assist rights immediately while site `owner`/`editor` membership (if any) is unchanged.

---

## 3. `site_id` + `site_slug` coexistence

| Concern | Decision |
| --- | --- |
| **RLS / FK / membership** | Always `site_id` |
| **Config, admin UI labels, onboarding JSON, public filters today** | `site_slug` |
| **New content tables (Phase 2+)** | **Both:** `site_id` NOT NULL FK + denormalized `site_slug` NOT NULL (kept in sync by Edge/trigger) |
| **Existing Gosaki rows** (`schedules`, `discography*`) | Keep `site_slug`; backfill `site_id` in a later approved migration — **not** required to start Phase 2 YouTube table |

**Why both:** Gosaki already filters on `site_slug='gosaki-piano'`. Renaming every query before YouTube slice would expand risk. UUID FK is the long-term isolation key; slug stays the operator-facing key.

**Invariant:** `content.site_slug` must equal `sites.site_slug` for `content.site_id`. Enforced in DB by composite FK `site_embeds (site_id, site_slug) → sites (id, site_slug)` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`). Edge also rejects mismatch.

**Column privileges (Phase 2 `site_embeds`):** authenticated clients receive column-level `INSERT`/`UPDATE` only (see RLS template). `created_by` / `updated_by` are set by `tg_site_embeds_set_audit_actors` from `auth.uid()` — not from client payloads. `updated_at` remains trigger-owned.

---

## 4. Authorization principles

| Role | Scope | Can do (Core v2) | Cannot do |
| --- | --- | --- | --- |
| **editor** | one `site_id` | Content UPDATE/INSERT within module allowlists | Manage members; platform ops; cross-site |
| **owner** | one `site_id` | Same as editor + future member invite | Platform-wide admin |
| **platform_admin** | all sites (staging Kit) | Same content ops for debugging / onboarding | Bypass field allowlists / approval gates |

**UI roles are informational.** Security boundary = JWT + DB membership/platform table + Edge guards + RLS.

**Gosaki Phase 2 default:** one `owner` (customer) + optional `platform_admin` (operator). `editor` schema exists but need not be seeded yet.

---

## 5. `platform_admins` table vs Auth custom claims

| Option | Verdict |
| --- | --- |
| **`platform_admins` table (SoT)** | **Adopt** — revocable without waiting for JWT refresh; auditable; fits 10-site Kit |
| **`app_metadata.role = admin`** | Legacy Sariswing / Edge bridge only — migrate readers to table check |
| **`ADMIN_EMAILS` Edge secret** | Temporary operator allowlist — OK for current Gosaki Edges; **not** Core v2 multi-tenant SoT |
| **Custom JWT claims as SoT** | **Reject** for Core v2 — claim drift, hard revocation, poor audit |

**Transition:** Phase 2 YouTube Edge may still accept legacy admin bridge **or** `platform_admins` / `site_members` — prefer membership tables for new code paths; do not remove legacy bridge until all Gosaki Edges cut over (later phase).

---

## 6. Dual defense: RLS + Edge Function

```txt
Browser (anon key + user JWT)
  → Edge Function (authn, role, site scope, field allowlist, normalize, dry-run, optimistic lock, approvalId)
  → Postgres (RLS: membership / platform_admin / published public SELECT)
```

| Layer | Must enforce | Must not rely on alone |
| --- | --- | --- |
| **RLS** | Tenant isolation; anon cannot write; public SELECT only `published` | Field allowlists, URL normalize, approval IDs |
| **Edge** | Payload allowlist, `expectedBeforeUpdatedAt`, dry-run vs save, YouTube normalize, site_id/slug match | Skipping RLS via broad `service_role` writes without equivalent checks |

**Kit write preference:** user-scoped client inside Edge (JWT) so RLS applies. `service_role` only if an approved slice explicitly requires it **and** Edge re-implements equivalent site+field checks (Schedule/Discography historical pattern). **Browser never gets `service_role`.**

---

## 7. `updated_by`

| Rule | Decision |
| --- | --- |
| Column | `updated_by uuid NULL` → `auth.users` on all Core content tables |
| Writer | Edge (or BEFORE UPDATE trigger from `auth.uid()`) — **never** trust client body |
| First Save | Set from JWT `sub`; leave NULL only for seeded/migrated rows until first write |

---

## 8. Optimistic lock — common contract

Align with Schedule G-6-f9/f10 / Discography:

```txt
Request:  expectedBeforeUpdatedAt: string  // exact current row.updated_at
DB:       BEFORE UPDATE trigger sets updated_at = now()
Edge:     SELECT … FOR check; reject if mismatch → optimistic_lock_failed; actualWrite=false
Client:   after Save, adopt after.updated_at as new baseline
```

| Required | Notes |
| --- | --- |
| `updated_at timestamptz NOT NULL` | Trigger-owned |
| `expectedBeforeUpdatedAt` on every non-dry-run UPDATE | Omit only for explicit INSERT |
| Dry-run | SELECT-only stale check allowed; no write |

---

## 9. Save / build / deploy separation

| Stage | Meaning | Phase 2 YouTube |
| --- | --- | --- |
| **Save** | Persist content in Supabase | Edge dry-run / gated Save → `site_embeds` |
| **Build** | Convert / Astro SSG / package from HEAD or DB export | Operator or later CI; **not** auto on Save |
| **Deploy** | Upload package to host | Manual FTP only; auto FTP still suspended (`readyForAnyFutureFtpApply: false`) |

**Current YouTube/About Contents API Save** creates a **git commit on `main`** — treat as high-risk external write (AGENTS.md). Phase 1 **does not change** that path. Phase 2 introduces a **parallel Supabase Save**; cutover of public read is a Phase 2 sub-step with rollback to JSON/Contents.

```txt
Save  ≠  Publish
Publish  ≠  Deploy
Contents API commit  ≠  Core v2 Save
```

---

## 10. Content table common columns

Every new CMS content table (starting with `site_embeds`):

```txt
id              uuid PK
site_id         uuid NOT NULL FK → sites
site_slug       text NOT NULL          -- denormalized; must match sites.site_slug
created_at      timestamptz NOT NULL
updated_at      timestamptz NOT NULL   -- trigger
updated_by      uuid NULL             -- auth.users
+ module fields + published / sort_order as needed
```

**Deferred (not Core v2 minimal):** `revisions`, soft-delete columns beyond existing module patterns, `deploy_jobs`, billing.

---

## 11. Media boundary

| In Core v2 / Phase 2 | Out until later |
| --- | --- |
| External URLs (YouTube, existing CDN image URLs on Schedule) | Supabase Storage upload |
| Normalize URL → embed URL in Edge | `media_assets` table / image CMS |
| No Storage write in vertical slice | Browser direct Storage |

Discography / Schedule image fields stay as URL strings until an explicit media phase.

---

## 12. Gosaki migration stance

| Asset | Stance |
| --- | --- |
| Schedule + Discography admin UIs | **Keep** — reference; no rewrite in Phase 1–2 |
| `site_slug = gosaki-piano` rows | Keep; add `sites` row; backfill `site_id` later |
| YouTube JSON + Contents API Save | **Analyze + leave running** until Phase 2 Supabase path verified |
| About Contents API | **Unchanged** in Phase 1–2 |
| Seed `site_embeds` | From `gosaki-piano-youtube-embed.json` (current `youtu.be/I-eY9YMq9GI`) on staging only |

**Dual-read order for public (Phase 2):** prefer Supabase `site_embeds` when env + rows exist; else existing JSON baked at convert (no blank home).

---

## 13. Phase 2 — YouTube Supabase Vertical Slice (explicit scope)

### In scope

1. Staging-only schema drafts + operator-approved migration plan for:
   - `sites` / `site_members` / `platform_admins` (minimal seed: `gosaki-piano`)
   - `site_embeds` (provider=`youtube`) per G-9a field set + Core common columns
2. Edge dry-run + gated Save (approval ID + env arm), optimistic lock, URL normalize → `youtube-nocookie.com/embed/{id}`
3. Admin UI on existing Gosaki YouTube route / staging shell — wire to Supabase path **without** removing Contents path until cutover flag
4. Public read: build-time or packaged fetch with JSON fallback
5. Rollback plan (below)
6. Docs + AI context updates for the slice; **no** new per-slice planning sprawl beyond what Phase 2 needs

### Out of scope (Phase 2)

- About / Schedule / Discography schema redesign
- Contents API behavior change for About
- Production Supabase / production host / DNS
- FTP `--apply` / `workflow_dispatch`
- Storage / media CMS
- SSR runtime CMS
- Multi-item YouTube UX beyond existing JSON `items[]` minimal parity
- RLS apply without explicit operator approval
- Automatic deploy after Save

### Rollback (Phase 2)

```txt
1. Disarm Save env / Edge arm (fail closed)
2. Public/admin read flag → JSON SoT (gosaki-piano-youtube-embed.json / Contents path)
3. Optional: DELETE/UPDATE site_embeds rows only with approved rollback SQL (staging)
4. Do not delete sites / site_members as part of YouTube rollback
5. Ambiguous Save outcome → stop; no retry; ask human (AGENTS.md)
```

### Success criteria (Phase 2 done when)

```txt
Staging YouTube Save round-trip via Supabase works once under explicit approval
Public staging can show embed from site_embeds OR documented fallback
Contents path still available until operator signs cutover
Schedule/Discography/About admin behavior unchanged
No production touch
```

---

## 14. Implementation sequence (after Phase 1)

```txt
Phase 1  ✅ this ADR
Phase 2  YouTube Supabase vertical slice (schema → Edge → admin → public read → gated Save)
Phase 3+ Extend Core membership UX; backfill site_id on schedules/discography; About DB (optional); media
```

**Vertical-slice ops:** one surface at a time; dry-run default; single-arm; no parallel Contents + Supabase Save arms; update AI docs only at meaningful phase boundaries (avoid verifier sprawl).

---

## 15. Open items (non-blocking for Phase 2 start)

| Item | Note |
| --- | --- |
| Exact Edge auth helper cutover date from `ADMIN_EMAILS` → tables | Can ship Phase 2 with dual-check |
| Whether public YouTube is build-time SELECT vs client hydrate | Prefer build-time + fallback first (matches current static package) |
| When to drop Contents API YouTube Save | After ≥1 successful Supabase round-trip + operator sign-off |
| `site_id` backfill on schedules/discography | Separate migration phase |

---

## Gates

```txt
cmsCoreV2MinimalArchitecturePlanned: true
readyForPhase2YoutubeSupabaseVerticalSlice: true
youtubeContentsApiPathUnchanged: true
scheduleDiscographyAboutReferencePreserved: true
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
implementationExecuted: false
```
