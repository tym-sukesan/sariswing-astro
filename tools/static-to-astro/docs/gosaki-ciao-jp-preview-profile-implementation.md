# Gosaki ciao.jp preview profile implementation

**Phase:** `gosaki-ciao-jp-preview-profile-implementation`
**Status:** **COMPLETE (local profile only · package not generated)**
**Date:** 2026-08-18
**HEAD baseline:** `818b80d2da3a02f3f2845a7004c87be251b639c8`
**Prior:** `gosaki-production-publication-data-live-readonly-check`

| Check | Status |
| --- | --- |
| Profile `ciao-preview` | **yes** |
| `deployBase=/gosaki-piano/` | **yes** |
| Preview origin `https://gotosaki.ciao.jp` | **yes** |
| Distinct output trees | **yes** (does not overwrite staging / production) |
| Admin excluded | **yes** (forced off, same as production) |
| noindex / robots Disallow | **yes** (subdir build path) |
| Staging / production profile values unchanged | **yes** |
| Preview package generated | **no** |
| FTP / DNS / SSL / DB write / `.env.local` | **no** |
| commit / push | **no** |

---

## Gates

```txt
gosakiCiaoJpPreviewProfileImplementationComplete: true
phase: gosaki-ciao-jp-preview-profile-implementation
PROFILE_NAME: ciao-preview
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
deployBase: /gosaki-piano/
remotePath: /gosaki-piano/
ADMIN_EXCLUDED: true
NOINDEX: true
ROBOTS_DISALLOW_ALL: true
PREVIEW_PACKAGE_GENERATED: false
READY_FOR_PREVIEW_PACKAGE_GENERATION: true
STAGING_PRODUCTION_REGRESSION: none (dry-run + g20u2/u3/u12/u17 PASS)
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-package-generation
```

**Supabase SoT (build-time):** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Why a third profile

DNS 切替前の確認 URL は subdirectory:

```txt
https://gotosaki.ciao.jp/gosaki-piano/
remote: /gosaki-piano/
deployBase: /gosaki-piano/
```

Final production は同じ remote folder でも **HTML が別物**:

```txt
https://www.gosaki-piano.com/
remote: /gosaki-piano/
deployBase: /
```

既存 `staging`（weblike `/cms-kit-staging/gosaki-piano/` + Admin）と `production`（www root, indexable）はどちらも ciao.jp preview ではない。production HTML を ciao.jp に置くと host-root `/_astro/` / `/about/` が漏れる。

---

## 2. Profile `ciao-preview`

| Field | Value |
| --- | --- |
| origin | `https://gotosaki.ciao.jp` |
| baseUrl | `https://gotosaki.ciao.jp/gosaki-piano` |
| publicUrl / publicBaseUrl | `https://gotosaki.ciao.jp/gosaki-piano/` |
| deployBase | `/gosaki-piano/` |
| remotePath / intendedRemotePath | `/gosaki-piano/` |
| astroOut | `output/gosaki-piano-astro-ciao-preview` |
| staticPublicOut | `output/static-public/gosaki-piano-ciao-preview` |
| manualUploadOut | `output/manual-upload/gosaki-piano-ciao-preview` |
| packageKey | `gosaki-piano-ciao-preview` |
| Admin | **off** (`includeReadOnlyAdmin` forced false) |
| seo | `stagingNoindex=true` · `robotsDisallowAll=true` · `productionIndexable=false` |
| supabaseProjectRef | `kmjqppxjdnwwrtaeqjta` |

Canonical / og:url は既存 `applyBaseUrlToSeo` + `--base-url` / `--deploy-base` で:

```txt
https://gotosaki.ciao.jp/gosaki-piano/...
```

Assets / nav / Schedule hub month links は Astro `base=/gosaki-piano/` + `withBase()`（既存 convert 経路）。subdir のため `BASE_URL !== "/"` で noindex meta、`generateRobotsTxt` は `Disallow: /`（Sitemap 行なし）。

---

## 3. npm / CLI (generation not executed this phase)

```bash
cd tools/static-to-astro
npm run build:gosaki:ciao-preview:dry-run
npm run preflight:gosaki:ciao-preview
npm run verify:gosaki-ciao-preview-profile
# next phase only:
# npm run build:gosaki:ciao-preview
```

---

## 4. Verification

Dedicated offline verifier:

```txt
node scripts/verify-gosaki-ciao-jp-preview-profile-implementation.mjs
→ 76 passed, 0 failed
```

Checks: profile resolution, deployBase, canonical/og:url, noindex/robots, convert args, Admin off, output-tree isolation, unknown-profile throw, **dry-run only** of ciao-preview / staging / production.

Regression (this HEAD, no package regen):

| Verifier | Result | Note |
| --- | --- | --- |
| g20u2 site-registry | PASS | staging/production values unchanged |
| g20u3 build-site-package CLI | PASS | |
| g20u12 README/checklist | PASS | staging/production commands unchanged |
| g20u17 post-build verifier registry | PASS | |
| ciao-preview / staging / production `--dry-run` | PASS | |
| g20u4 / g20u5 | FAIL (pre-existing) | on-disk **staging** package stale vs HEAD; not caused by this profile |
| g20u21 | 1 FAIL (pre-existing) | `site-generator-hooks.mjs` string gate; this phase did not edit that file |

---

## 5. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Preview package generate (`build:gosaki:ciao-preview` without dry-run) | **no** |
| Production / staging package generate | **no** |
| FTP / remote access | **no** |
| DNS / SSL | **no** |
| DB write / Save / Edge / `service_role` | **no** |
| `.env.local` change | **no** |
| commit / push | **no** |

---

## 6. Next phase

`gosaki-ciao-jp-preview-package-generation` — generate the ciao-preview package into `output/manual-upload/gosaki-piano-ciao-preview/` only. Do **not** overwrite staging or production trees. Do **not** FTP / DNS.
