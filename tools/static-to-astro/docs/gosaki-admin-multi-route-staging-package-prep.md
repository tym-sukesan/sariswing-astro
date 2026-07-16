# G-20u39b4 — Gosaki admin multi-route staging package prep

Phase: `G-20u39b4-gosaki-admin-multi-route-staging-package-and-manual-upload-prep`  
Date: 2026-07-16  
Basis: G-20u39b2 IA · G-20u39b3 local portal/routes  
HEAD at start: `ba286b1` (= `origin/main`, clean)

## Scope

Implement staging **static package generation wiring** so convert/apply emits multi-route `/admin/` pages that reuse G-20u39b3 portal / nav / safety chips.

- Dry-run / module verification only
- **No** real package generation · public-dist · FTP · STG upload · Save enable · SQL · Edge · `src/pages/admin/**` (repo production tree)

## Routes prepared (generated under Astro outDir)

| Generated Astro page | Public route (with deployBase) |
| --- | --- |
| `src/pages/admin/index.astro` | `/cms-kit-staging/gosaki-piano/admin/` (portal only) |
| `src/pages/admin/schedule/index.astro` | `…/admin/schedule/` |
| `src/pages/admin/discography/index.astro` | `…/admin/discography/` |
| `src/pages/admin/youtube/index.astro` | `…/admin/youtube/` |
| `src/pages/admin/about/index.astro` | `…/admin/about/` |

Contact / Link / Settings: **not** generated.

## Reuse (no UI duplication)

- `AdminGosakiStagingOperatorHome` · `AdminGosakiStagingNav` · `AdminGosakiStagingSafetyChips` copied into package outDir as `src/components/gosaki-admin/*`
- Path imports rewritten to `gosaki-package-admin-paths.ts` (`BASE_URL` + `admin/…`)
- Shared chrome CSS: `templates/admin-cms/gosaki/styles/gosaki-admin-shell-chrome.css`

## Generation source

- `applyGosakiStagingReadOnlyAdmin()` writes component + 5 thin pages + chrome + paths + CSS + dashboard JSON
- `GosakiStagingReadOnlyAdminPage.astro` is now a multi-route component (`page` prop)

## Gates

```txt
STAGING_ADMIN_MULTI_ROUTE_GENERATION_IMPLEMENTED: true
STAGING_ADMIN_MULTI_ROUTE_DRY_RUN_PASSED: true
SAVE_REMAINS_DISABLED: true
PRODUCTION_ADMIN_EXCLUSION_PRESERVED: true
FRESH_PACKAGE_GENERATION_REQUIRED_AFTER_COMMIT: true
packageGenerationExecuted: false
ftpUploadExecuted: false
saveEnabled: false
srcPagesAdminModified: false
serviceRoleUsed: false
```

## Verifier

```bash
npm run verify:g20u39b4-gosaki-admin-multi-route-staging-package-prep
```

## Recommended next

`G-20u39b5-gosaki-admin-multi-route-staging-package-generation-at-head`
