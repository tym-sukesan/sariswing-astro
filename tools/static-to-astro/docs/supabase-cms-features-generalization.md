# G-20u20 — Supabase CMS features generalization

**Phase:** `G-20u20-supabase-cms-features-generalization`  
**Base:** `8012bb7` (G-20u19 committed)  
**Scope:** Registry-driven CMS / Supabase feature flags; read-only loaders; hook gating. **No DB write / SQL migration.**

## Problem

Before G-20u20:

- `supabaseFeatures` had only `schedule` + `discography`
- YouTube / Contact / About injects ran unconditionally in Gosaki `applyPostGenerate`
- `site_embeds` table planned (G-9a) but no registry flag
- Pilot had Supabase off but no explicit CMS feature map

## Solution

### Registry fields (`config/sites/registry.json`)

**`supabaseFeatures`** — Supabase read paths (read-only):

| Flag | Gosaki | Pilot | Notes |
| --- | --- | --- | --- |
| `schedule` | `true` | `false` | `public.schedules` via site-aware loader |
| `discography` | `true` | `false` | Gosaki wrapper; generic stub for other sites |
| `siteEmbeds` | `false` | `false` | **TODO** — `public.site_embeds` migration (G-9f); no DB call yet |

**`cmsFeatures`** — static JSON / post-generate hooks (no Supabase in G-20u20):

| Flag | Gosaki | Pilot | Hook module |
| --- | --- | --- | --- |
| `youtube` | `true` | `false` | `gosaki-home-youtube-embed.mjs` (static JSON config) |
| `contact` | `true` | `false` | `gosaki-contact-hubspot-embed.mjs` |
| `aboutBandProfiles` | `true` | `false` | `gosaki-about-band-profiles.mjs` |
| `aboutContent` | `true` | `false` | `gosaki-about-content.mjs` |

**Slug semantics** (unchanged): `slugSemantics.supabaseSiteSlug` / `cmsSiteSlug` per site.

### Module: `site-cms-features.mjs`

- `resolveSupabaseFeatures(siteKey)` — includes `siteEmbeds`
- `resolveCmsFeatures(siteKey)` — youtube / contact / about*
- `resolveSiteCmsFeaturePlan(siteKey)` — combined plan + slugs
- `isSupabaseFeatureEnabled` / `isCmsFeatureEnabled`
- `loadSiteEmbedsDataForBuild` — returns `null` when disabled; stub when enabled pending G-9f migration

`site-registry.mjs` re-exports feature resolvers (delegates to `site-cms-features.mjs`).

### Loaders: `site-aware-supabase-loaders.mjs`

`loadSiteSupabaseDataForBuild` now returns:

```javascript
{ schedule, discography, embeds, plan }
```

- Feature off → bundle `null` (no Supabase call)
- Gosaki wrappers retained for schedule / discography

### Hooks: `site-generator-hooks.mjs`

Gosaki `applyPostGenerate` gates injects via `isCmsFeatureEnabled(siteKey, feature)`:

- `aboutBandProfiles`, `aboutContent`, `youtube`, `contact`
- `readOnlyAdmin` — unchanged (deferred to G-20u21 `includeGosakiReadOnlyAdmin` generalization)

## Deferred (no migration this phase)

| Item | Phase | Reason |
| --- | --- | --- |
| `public.site_embeds` table | G-9f | DB migration not approved |
| Supabase YouTube read | G-9g | Uses static JSON until table exists |
| `includeGosakiReadOnlyAdmin` rename | G-20u21 | Upload safety scope |
| Generic non-gosaki discography loader | Future | `site_slug` filter when multi-site rows exist |

## Adding a new site

1. Set `supabaseFeatures` and `cmsFeatures` in registry.
2. Use `loadSiteSupabaseDataForBuild` in convert / url-to-staging (already site-aware).
3. Register hook factory only if site-specific transforms needed.
4. Enable `siteEmbeds` only after G-9f migration + read loader implementation.

## Verifier

```bash
cd tools/static-to-astro
npm run verify:g20u20-supabase-cms-features
```

## Related

- G-20u13: `site-aware-supabase-loaders.md`
- G-9a: `gosaki-cms-scope-and-schedule-youtube-planning.md`
- G-20u16 audit: `remaining-site-specific-coupling-audit.md` § G-20u20
