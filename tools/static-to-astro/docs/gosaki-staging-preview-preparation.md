# G-7e — gosaki staging preview preparation

Phase: `G-7e-gosaki-staging-preview-preparation`  
Date: 2026-06-15  
Prior phase: `G-7d1-gosaki-live-route-static-public-compatibility-fix` (commit `de1dc0a`)

## Summary

Fixed canonical duplicate path and Wix production URL nav links on G-7d live crawl output. Re-converted / built / regenerated static-public without re-crawl. FTP upload plan created (dry-run only — no `--apply`).

## Problems addressed

### 1. Canonical / og:url duplicate deployBase

**Symptom:**

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/cms-kit-staging/gosaki-piano/
```

**Root cause:**

- `stagingBaseUrl` already includes deploy path (`.../gosaki-piano`)
- `buildDeployOrigin()` appended `deployBase` again at convert time
- `resolve-public-seo.ts` prepended `deployBase` to pathname that already contained it at build time

**Fix:**

- `buildDeployOrigin`: skip append when `baseUrl` already ends with deploy path
- `resolve-public-seo.ts`: strip leading `deployBase` from pathname before composing staging URL
- `canonicalHasDuplicateDeployBase()` in verifier

### 2. Nav Home Wix URL

**Symptom:**

```txt
href={withBase('https://www.gosaki-piano.com')}
→ /cms-kit-staging/gosaki-piano/https://www.gosaki-piano.com
```

**Root cause:** `htmlHrefToRoute()` left absolute production URLs unchanged.

**Fix:**

- `productionAbsoluteUrlToRoute()` maps same-origin production URLs → Astro routes (`/` or `/2026-07/`)
- Auto-detect production origin from fixture `manifest.json` or `--production-base-url` / pipeline config
- Header nav Home now: `withBase('/')`

## Code changes

| Area | Files |
| --- | --- |
| Canonical origin | `scripts/lib/deploy-base.mjs`, `templates/admin-cms/src/lib/resolve-public-seo.ts` |
| Link rewrite | `scripts/lib/path-transform.mjs`, `scripts/lib/header-transform.mjs`, `scripts/lib/astro-generator.mjs` |
| Staging preview verifier | `verifyStagingPreviewHtml()` in deploy-base + static-public manifest |
| Upload plan | `scripts/lib/staging-upload-plan.mjs`, `scripts/plan-staging-public-upload.mjs` |
| Pipeline gates | `url-to-staging-pipeline.mjs`, `url-to-staging-pipeline-plan.mjs` |
| Regression tests | `scripts/verify-url-to-staging-pipeline.mjs` (+6 G-7e tests) |

## Re-verification (no re-crawl)

Used existing local artifacts:

- `fixtures/gosaki-piano/` (G-7d crawl, gitignored)
- Re-convert + build → `output/gosaki-piano-astro/`

```bash
rm -rf output/gosaki-piano-astro
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician --verify-build

node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

node scripts/plan-staging-public-upload.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki-piano/public-dist \
  --site-slug gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --out tools/static-to-astro/output/deploy/gosaki-piano/staging-upload-plan.json
```

## Verifier results

| Check | Result |
| --- | --- |
| prepare-public | **PASS** |
| safeForStaticFtp | **true** |
| stagingPreviewOk | **true** |
| canonicalDoesNotContainProductionHost | **true** |
| canonicalDoesNotDuplicateDeployBase | **true** |
| ogUrlDoesNotContainProductionHost | **true** |
| navHomeRewritten | **true** |
| internalLinksRewritten | **true** |
| deployBaseCheckOk | true |
| seoFlagsOk | true |

**Example canonical (index):**

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
```

**Example month page:**

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/
```

## FTP dry-run / upload plan

Plan artifacts (gitignored `output/`):

- `output/deploy/gosaki-piano/staging-upload-plan.json`
- `output/deploy/gosaki-piano/staging-upload-plan.md`
- Pipeline also writes: `output/runs/gosaki-piano-staging-upload-plan.json`

| Item | Value |
| --- | --- |
| Local source | `output/static-public/gosaki-piano/public-dist/` |
| File count | 13 |
| Remote host | `yskcreate.weblike.jp` |
| Remote path | `/cms-kit-staging/gosaki-piano/` |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

**FTP `--apply` not executed.** No credentials in plan docs.

## Regression

| Command | Result |
| --- | --- |
| `npm run verify:url-staging` | 43 passed |
| `npm run verify:crawl` | 30 passed |
| `npm run build` (repo root) | PASS |

## Safety confirmation

| Action | Status |
| --- | --- |
| gosaki-piano.com re-crawl | **NOT executed** |
| FTP实アップロード / `--apply` | **NOT executed** |
| GitHub workflow_dispatch | **NOT executed** |
| DB write / Supabase SQL | **NOT executed** |
| Production / Sariswing本番 | **NOT touched** |
| Secrets in git | **NOT added** |
| output / generated fixture commit | **NOT committed** |

## Gate state

```txt
gosakiStagingPreviewPreparationComplete: true
readyForG7fGosakiStagingUploadExecution: true
```

## Proceed to G-7f?

**Yes**, subject to operator approval checklist in upload plan:

- Review staging upload plan + browser QA on staging URL after G-7f `--apply`
- `GOSAKI_STAGING_FTP_*` env locally (never commit)
- Explicit approval before `deploy-public-dist-ftp.mjs --apply --env staging`

## Operator approval checklist

- [ ] `prepare-public` PASS / `safeForStaticFtp: true`
- [ ] `stagingPreviewOk` true (canonical + nav checks)
- [ ] Upload plan reviewed (`staging-upload-plan.md`)
- [ ] Browser QA: noindex, robots, nav Home, internal links
- [ ] Staging FTP env present locally
- [ ] Approve G-7f upload execution

## Remaining issues

- Browser QA not yet run on live staging URL (requires G-7f upload or manual sync)
- Wix body content still links to external sites (Facebook, etc.) — expected; not nav/same-origin
- Contact form backend not migrated (existing G-7 scope out)
