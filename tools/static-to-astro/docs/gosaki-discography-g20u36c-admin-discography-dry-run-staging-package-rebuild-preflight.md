# G-20u36c — Gosaki Discography admin dry-run staging package rebuild preflight

**Phase:** `G-20u36c-admin-discography-dry-run-staging-package-rebuild-preflight`  
**Status:** **complete** — package regen + preflight PASS · **FTP upload not executed**  
**Date:** 2026-07-12  
**Base commit:** `4595dce`  
**Prior:** G-20u36c admin dry-run fetch POST wiring (commit `4595dce`)

| Check | Status |
| --- | --- |
| Package regen | **PASS** |
| Preflight | **PASS** |
| Package freshness | **PASS** |
| Admin dry-run UI in package | **yes** |
| Save disabled | **yes** |
| operation=save | **not sent** |
| FTP upload | **not executed** |

---

## Gates

```txt
gosakiDiscographyAdminDryRunStagingPackageReadyForManualUpload: true
phase: G-20u36c-admin-discography-dry-run-staging-package-rebuild-preflight
sourceCommit: 4595dced99ac1ec1abf29f8e2aa2ba2739254e19
headMatchesSourceCommit: true
packageFreshness: PASS
preflightPass: true
saveEnabled: false
operationSaveSent: false
serviceRoleUsed: false
productionEndpointUsed: false
ftpUploadExecuted: false
cursorFtpUploadExecuted: false
proceedToManualFtpUpload: true
proceedToSave: false
```

---

## Executed scripts

| Step | Script | Result |
| --- | --- | --- |
| Wiring verifier | `npm run verify:g20u36c-admin-discography-dry-run-fetch-post-wiring` | **PASS** (56/56) |
| Active regression | `npm run verify:current-active-regression` | **PASS** (23/23) |
| Build + package | `npm run build:gosaki:staging` | **PASS** |
| Preflight | `npm run preflight:gosaki:staging` | **PASS** |
| Freshness | `npm run verify:package-freshness:gosaki:staging` | **PASS** |

`build:gosaki:staging` regenerates `output/static-public/gosaki-piano/public-dist` and `output/manual-upload/gosaki-piano/` (includes admin).

---

## Package output

| Item | Value |
| --- | --- |
| **Path** | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| **public-dist** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **sourceCommit** | `4595dced99ac1ec1abf29f8e2aa2ba2739254e19` |
| **HEAD** | `4595dce` (matches) |
| **generatedAt** | `2026-07-12T05:59:15.849Z` |
| **fileCount** | 31 |
| **includesAdmin** | true |
| **intendedRemotePath** | `/cms-kit-staging/gosaki-piano/` |
| **safeForStaticFtp** | true |

---

## Preflight checks

| Check | Result |
| --- | --- |
| verify-site-package | **PASS** |
| verify-package-upload-freshness | **PASS** (fresh) |
| Admin page generated | **yes** — `public-dist/admin/index.html` |
| Endpoint dry-run button | **yes** — `Endpoint dry-run (POST · no save)` × 4 albums |
| Dry-run only / No DB write / Save is still disabled | **present** |
| Endpoint target | `kmjqppxjdnwwrtaeqjta` / `gosaki-discography-save-dry-run` |
| Production ref `vsbvndwuajjhnzpohghh` in endpoint | **no** |
| `data-g20u36c-discography-dry-run-operation` | `dryRun` |
| operation=save in discography fetch | **no** |
| Save buttons | **disabled** |
| service_role / SUPABASE_SERVICE_ROLE_KEY | **absent** |
| localStorage approval persistence | **no** |
| sitemap `/admin/` exclusion | **yes** |
| FTP upload | **not executed** |

### Admin bundle notes

- G-20u36c phase marker in footer + body data attributes
- Client script bundle includes `buildDiscographyDryRunEndpointRequest` + fetch POST wiring (minified)
- Anon key embedded at build in `data-gosaki-supabase-anon-key` — **value not logged in this doc**

---

## STG QA note (clientDryRun contract)

First STG upload after G-20u36c wiring hit Edge **400**: `clientDryRun.wouldWrite must be false`.  
Source fix applied in follow-up phase — **package regen + re-upload required** before QA can PASS.

---

## Not executed

| Item | Status |
| --- | --- |
| FTP / lftp / mirror / sync / delete upload | **not executed** |
| STG browser QA | **not executed** (post-upload) |
| Edge re-deploy | **not executed** |
| SQL / DB write | **not executed** |
| Save enablement | **not executed** |

---

## Next phase

**Manual FTP upload** — operator checklist:

1. Confirm `preflight:gosaki:staging` **PASS** at upload time
2. Remote path: `/cms-kit-staging/gosaki-piano/`
3. Upload **contents** of `public-dist/` (not the folder itself)
4. Include `_astro/` + `admin/`
5. STG browser QA: Discography Editor → **Endpoint dry-run (POST · no save)**

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
