# CMS Core v2 — Next Kit Feature Comparison (post–YouTube)

- **Phase:** `cms-core-v2-next-kit-feature-comparison-planning`
- **Status:** **complete** — read-only comparison + minimal vertical-slice plan only
- **Date:** 2026-07-24
- **Baseline:** YouTube Admin+public Supabase live (`registry.siteEmbeds=true`); Save arm **false**; `contentsYoutubeCutoverExecuted: false`
- **Forbidden in this phase:** implementation · DB/SQL · Secrets · deploy/FTP · production · commit/push

**References:** [cms-core-v2-minimal-architecture-decision.md](./cms-core-v2-minimal-architecture-decision.md) · [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) · [cms-core-v2-youtube-supabase-registry-siteembeds-persistence.md](./cms-core-v2-youtube-supabase-registry-siteembeds-persistence.md)

---

## 1. Verdict

```txt
RECOMMENDED_NEXT_KIT_FEATURE: About → Supabase (Contents cutover)
PHASE: cms-core-v2-about-supabase-vertical-slice (planning next)
CMS_CORE_V2_NEXT_KIT_FEATURE_COMPARISON_COMPLETE: true
IMPLEMENTATION_EXECUTED: false
READY_FOR_ABOUT_SUPABASE_SLICE_PREFLIGHT: true
READY_FOR_ANY_DB_WRITE: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
CONTENTS_YOUTUBE_CUTOVER_EXECUTED: false
```

**Why About (not Schedule / Discography):** Schedule and Discography are already Supabase SoT (`supabaseFeatures.schedule/discography: true`) with operational admin + Save history. Treating them as “next Kit feature” mostly means `site_id` / membership hardening (ADR Phase 3 infrastructure), not a new product surface. About is the **last Contents API SoT** among primary CMS surfaces and maximizes reuse of the YouTube tenancy / dual-path pattern just proven.

---

## 2. Side-by-side comparison

| Candidate | SoT today | `supabaseFeatures` | Contents risk | Core v2 next work | Smallest slice | Risk | Kit/Core value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Discography** | `discography` + `discography_tracks` + Edge/RPC | **true** | No | `site_id` backfill + membership vs DEFINER RPC | Label UPDATE under `can_write_site` | Med–high (RPC) | Tenancy harden only |
| **About** | JSON + **GitHub Contents** | **false** | **Yes** | New table + YouTube-like dual-path cutover | One scalar / one block field | Med (HTML blob) | **Highest greenfield** |
| **Schedule** | `schedules` (+ derived `schedule_months` RO) | **true** | No | `site_id` + membership; no `schedule_months` write | One UPDATE under `can_write_site` | High (ops surface) | Client value high; Core = harden |
| **Contact** | HubSpot JSON embed | n/a | No | None for Core | — | Low | Low |
| **Bands** | Static JSON +/or About `about-bands-html` | n/a | Indirect via About | After About DB | One name string | Med (media) | Deferred (G-9a / ADR) |
| **YouTube retire** | Dual-path (DB live + Contents fallback) | **true** | Residual | Docs/ops cutover | Retire Contents Save only | Low–med | Debt cleanup (parallel OK) |

### Registry snapshot (`gosaki-piano`)

- `supabaseFeatures`: `schedule: true`, `discography: true`, `siteEmbeds: true`
- `cmsFeatures`: `youtube: true`, `aboutContent: true`, `aboutBandProfiles: true`, `contact: true`, `readOnlyAdmin: true`

### Tenancy reuse (`sites` / `site_members` / `platform_admins`)

| Candidate | Reuse of Core tenancy |
| --- | --- |
| **About (new)** | **Direct** — same FK + `can_write_site` + Edge JWT pattern as `site_embeds` |
| Schedule / Discography | **Later** — backfill `site_id`; Edge/RPC authz alignment (do not redesign schema in About slice) |
| Contact / Bands | Not a content-table write surface yet |

---

## 3. Per-candidate notes (SoT / paths)

### 3.1 Discography

- **SoT:** Supabase · live-read REST · Edge `gosaki-discography-save-dry-run` · operational RPC `gosaki_discography_operational_save`
- **Public:** registry-gated bake (`loadSiteDiscographyBundleForBuild`)
- **Core slice value:** membership-gated field UPDATE or `site_id` backfill — **not** a new CMS product

### 3.2 About (recommended)

- **SoT:** `config/sites/gosaki-piano-about-content.json` · Contents write via `gosaki-about-content-save` / dry-run Edge · approvals `G-12a-*`
- **Public:** convert hook (`gosaki-about-content.mjs`) patches About HTML from JSON blocks (`about-profile-html`, `about-bands-html`)
- **Admin:** `/admin/about/` Contents path; Save normally disarmed
- **Core fit:** ADR Phase 3 “About DB (optional)”; mirror YouTube staged cutover

### 3.3 Schedule

- **SoT:** `public.schedules` · Edge operational Save · G-6-g field slices (title/times) already executed on musician-basic
- **Public:** Supabase published rows → `/schedule/` + `/YYYY-MM/`
- **Constraint:** `schedule_months` read-only / derived — never write in Core slice
- **Core slice value:** tenancy harden; G-6-g3 `price` is product field work, not Contents migration

### 3.4 Other

- **Contact:** HubSpot portal/form IDs only — external form, not Core content table
- **Bands:** keep static / About HTML until About SoT is DB-native (avoid third SoT)
- **YouTube Contents retire:** optional parallel docs/ops; does not block About planning

---

## 4. Recommended minimal vertical slice — About → Supabase

### 4.1 Goal

```txt
Staging only: one About content row (or one block) in Postgres with site_id + site_slug
Admin dual-path (Contents default → Supabase opt-in) like YouTube
Build prefer DB + JSON fallback
Gated dry-run → one-field Save round-trip
Reuse sites / site_members / platform_admins / can_write_site
No Storage · no production · no Contents cutover until Save proven
```

### 4.2 Proposed table shape (draft — not applied)

Working name: `site_about_blocks` (or `site_page_blocks`)

| Column | Notes |
| --- | --- |
| `id` | uuid PK |
| `site_id` / `site_slug` | Composite FK → `sites` (same invariant as `site_embeds`) |
| `block_id` | e.g. `about-profile-html` |
| `html` or structured `body_text` | **Slice 1 prefer scalar text** extracted from profile (see 4.3) |
| `updated_at` / `updated_by` / `created_by` | Core common columns + optimistic lock |
| UNIQUE | `(site_id, block_id)` |

**Out of first slice:** full HTML CMS rewrite · bands structured CMS · image Storage · Contents path removal.

### 4.3 Smallest write surface (Option A — preferred)

**One scalar:** first biography paragraph text inside `about-profile-html` (or a dedicated `profile_lede` field), mirrored to public via surgical patch / convert hook — same spirit as YouTube `items[]` / `sort_order` PoC.

**Option B (acceptable):** whole `about-profile-html` block as opaque HTML string (faster wire-up, higher XSS/patch risk) — only if scalar extract proves too fragile in preflight.

### 4.4 Staged cutover (mirror YouTube)

```txt
1. Schema + RLS templates (staging) + seed from current JSON
2. Edge dry-run / Save (armed false) + membership authz
3. Admin dual-path env (Contents default; Supabase opt-in)
4. Admin staging path QA (Save disabled)
5. Public build-read prefer DB + JSON fallback
6. Optional registry flag (e.g. supabaseFeatures.aboutContent)
7. Gated Save round-trip → disarm
8. Later: Contents About retire (separate approval)
```

### 4.5 Explicit non-goals (this slice)

- Schedule / Discography `site_id` backfill
- Discography RPC redesign
- Bands CMS / Contact CMS
- YouTube Contents retire execution
- production / FTP apply / `service_role` / `/admin` production

### 4.6 Approval / arm sketch (names reserved — not registered in code yet)

```txt
Dry-run approval (draft): G-cms-v2-about-supabase-*-dry-run
Save approval (draft):    G-cms-v2-about-supabase-*-web-save-non-dry-run-slice
Env arm (draft):          PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED / *_SAVE_ARMED
```

Do **not** reuse `G-12a-*` or YouTube Supabase approval IDs.

### 4.7 Safety gates for next phase

```txt
readyForAboutSupabaseSlicePreflight: true
aboutSupabaseImplementationExecuted: false
aboutContentsPathUnchanged: true
youtubeSaveArmEnabled: false
contentsYoutubeCutoverExecuted: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
```

**Next safe gate:** operator re-accepted · **`readyForOperatorAboutMigrationApply: true`** · SELECT → migration → RLS → seed · Doc: `cms-core-v2-about-supabase-vertical-slice-apply-readiness.md`.

---

## 5. Deferred sequence (after About slice proven)

1. Optional: Contents **YouTube** retire (close dual-path debt)
2. About public bake + registry persistence (if not in same slice)
3. `site_id` backfill on `schedules` / `discography*` + Edge membership
4. Bands structured CMS only after About DB SoT is live

---

## Gates

```txt
cmsCoreV2NextKitFeatureComparisonComplete: true
recommendedNextKitFeature: about-supabase
readyForAboutSupabaseSlicePreflight: true
aboutSupabaseImplementationExecuted: false
scheduleDiscographyAlreadySupabase: true
contentsAboutStillSot: true
tenancyReuseSitesSiteMembersPlatformAdmins: true
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
implementationExecuted: false
```
