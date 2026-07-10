# G-20u21 — Generic read-only admin flag

**Phase:** `G-20u21-generic-read-only-admin-flag`  
**Base:** `7c0a939` (G-20u20 complete)  
**Scope:** Registry / package-profile driven read-only admin inclusion — **no FTP / deploy / DB write**

## Purpose

Replace Gosaki-only naming (`includeGosakiReadOnlyAdmin`) with a generic flag resolved from `config/sites/registry.json` and deploy profiles. Preserve:

| Profile | `includesAdmin` | `includeReadOnlyAdmin` |
| --- | --- | --- |
| Gosaki staging | **true** | **true** |
| Gosaki production | **false** | **false** |
| Pilot staging | **false** | **false** |

## Flag locations

### Package inclusion (primary)

`registry.json` → `sites.{siteKey}.packageProfiles.{profile}`:

| Field | Role |
| --- | --- |
| `includeReadOnlyAdmin` | **Primary** — controls static-public copy + MANIFEST |
| `includesAdmin` | Manifest-oriented mirror (same semantics) |
| `includeGosakiReadOnlyAdmin` | **Legacy alias** — kept for backward compat |

Resolution: `scripts/lib/site-admin-features.mjs` → `resolvePackageAdminFlags()`  
Consumed by: `site-registry.mjs` → `resolveSitePackageBuildProfile()` / `resolvePackageManifestMetaFromRegistry()`

### CMS capability (convert-time inject)

`registry.json` → `sites.{siteKey}.cmsFeatures.readOnlyAdmin`:

| Site | Value |
| --- | --- |
| `gosaki-piano` | `true` — Gosaki read-only admin HTML may be generated |
| `pilot-sample-static` | `false` — noop |

Gated in `site-generator-hooks.mjs` via `isCmsFeatureEnabled(siteKey, "readOnlyAdmin")`.

**Note:** `cmsFeatures.readOnlyAdmin` controls *whether hooks inject admin at convert time*. `packageProfiles.includeReadOnlyAdmin` controls *whether `admin/` is copied into the manual-upload `public-dist`*.

## Resolution priority

`resolvePackageAdminFlags(siteKey, profileName)`:

1. `production` profile → always `{ includeReadOnlyAdmin: false, includesAdmin: false }`
2. `packageProfiles.includeReadOnlyAdmin`
3. `packageProfiles.includeGosakiReadOnlyAdmin` (legacy)
4. `packageProfiles.includesAdmin`
5. Deploy profile `includeReadOnlyAdmin` / `includeGosakiReadOnlyAdmin`
6. Gosaki non-production default `true` (backward compat)
7. Other sites default `false`

## Pipeline integration

| Stage | Module | Flag used |
| --- | --- | --- |
| Build profile | `site-registry.mjs` | `resolvePackageAdminFlags` |
| Static-public verify | `static-public-artifact-verifier.mjs` | `--include-read-only-admin` (legacy `--include-gosaki-read-only-admin`) |
| Manual-upload MANIFEST | `manual-upload-package.mjs` | `includesAdmin` + `includeReadOnlyAdmin` |
| Build log | `build-site-package-core.mjs` | `includeReadOnlyAdmin:` |
| Production validation | `site-registry.mjs` | requires `includeReadOnlyAdmin=false` or legacy alias |

## Sitemap safety (unchanged — G-20t1)

Admin HTML may exist in **staging** packages but must **never** appear in sitemaps:

- `scripts/lib/sitemap-exclusions.mjs` — `/admin/` excluded
- `verify-site-package-core.mjs` — staging sitemap must not list `/admin/`
- Production packages omit `admin/` entirely (`includeReadOnlyAdmin: false`)

## Adding a new site

1. Set `cmsFeatures.readOnlyAdmin` — `true` if site uses read-only admin inject hooks; else `false`.
2. Set `packageProfiles.staging.includeReadOnlyAdmin` — usually `true` for musician CMS Kit staging previews; `false` for static-only pilots.
3. Set `packageProfiles.production.includeReadOnlyAdmin` — **always `false`** for public production uploads.
4. Optional legacy alias `includeGosakiReadOnlyAdmin` — same value as generic flag if needed for old scripts.

## Upload rules (unchanged)

- **Production upload:** STOP until G-20j explicit operator approval
- **Before any upload:** rebuild at current HEAD + `preflight` PASS
- **No FTP auto-apply** — manual package only (`readyForAnyFutureFtpApply: false`)
- On-disk packages are **stale** after commits until regen

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u21-generic-read-only-admin-flag
npm run verify:current-active-regression
```

## Not executed

- No FTP / deploy / mirror / delete
- No DB write / SQL mutation
- No package upload / regen in this phase
- No production changes

## Gates

```txt
genericReadOnlyAdminFlagComplete: true
gosakiStagingIncludesAdmin: true
gosakiProductionExcludesAdmin: true
pilotStagingExcludesAdmin: true
```
