# Gosaki ciao.jp preview package generation

**Phase:** `gosaki-ciao-jp-preview-package-generation`
**Status:** **COMPLETE (local package generated · verified · FTP not executed)**
**Superseded for upload:** dirty-source STOP — see [gosaki-ciao-jp-preview-dirty-source-resolution.md](./gosaki-ciao-jp-preview-dirty-source-resolution.md)
**Date:** 2026-08-18
**HEAD baseline:** `c16af124dfea7e4bce8b3bc2bca9df82192464ab` (= `origin/main`)
**Prior:** `gosaki-ciao-jp-preview-profile-implementation`

| Check | Status |
| --- | --- |
| Preview package generated | **yes** (local) |
| `sourceCommit` = HEAD | **yes** (marker) |
| Working tree at generation end | **dirty** (helper copy + docs) |
| **Upload this package** | **no** — do not use as FileZilla source |
| verify-site-package / freshness / preflight | **PASS** (structure only; freshness vs HEAD, not vs dirty tree) |
| Staging / production packages overwritten | **no** |
| FTP / remote / DNS / SSL | **no** |
| commit / push | **no** |

---

## Gates

```txt
gosakiCiaoJpPreviewPackageGenerationComplete: true
phase: gosaki-ciao-jp-preview-package-generation
generationHead: c16af124dfea7e4bce8b3bc2bca9df82192464ab
sourceCommit: c16af124dfea7e4bce8b3bc2bca9df82192464ab
PREVIEW_PACKAGE_GENERATED: true
DIRTY_SOURCE_AT_GENERATION: true
READY_FOR_MANUAL_PREVIEW_UPLOAD: false
DO_NOT_UPLOAD_THIS_PACKAGE: true
FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-package-regeneration
```

**Supabase SoT (build-time):** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Pre-generation

| Check | Result |
| --- | --- |
| HEAD | `c16af124dfea7e4bce8b3bc2bca9df82192464ab` = `origin/main` |
| Working tree | clean at start |
| Profile `ciao-preview` | valid · `deployBase=/gosaki-piano/` · Admin off · noindex · robots Disallow |
| Dry-run | **PASS** |
| Live SELECT re-run | **not executed** (prior phase PASS) |

Staging / production fingerprints **before** (unchanged after):

```txt
staging MANIFEST     07beea8fc942866823009eba6c93673accf3bc8c69bf7c3f6e67723fc833f58d
production MANIFEST  bab56b67e6cda1e5f8bd7b6893b19bef08a04e98758bc51b87e8ed1b4bf190d7
```

---

## 2. Build

```bash
cd tools/static-to-astro
npm run build:gosaki:ciao-preview
```

First official convert/`--verify-build` **FAILED**: generated Admin TS imports `./save-arm-utils` but `applyGosakiStagingReadOnlyAdmin` did not copy `templates/site-extensions/gosaki-piano/save-arm-utils.ts`. Fresh astro-out cannot `astro build`.

Unblock (this phase):

1. Copy `save-arm-utils.ts` into gitignored `output/gosaki-piano-astro-ciao-preview/src/lib/`
2. `npm run build` in that astro-out — **PASS** (23 pages)
3. Official remaining steps: `verify-static-public-artifact` (`--include-read-only-admin false`) → `createManualUploadPackage` → `PACKAGE_RUN.json` → `verify-site-package`
4. Source fix: `applyGosakiStagingReadOnlyAdmin` now copies `save-arm-utils.ts` (required for official `npm run build:gosaki:ciao-preview` on a fresh astro-out). **Commit this fix before regeneration.** Do **not** upload the dirty-tree package.

Convert bake: 17 fixture pages · Schedule **74** events (supabase) · Discography **4** / **34** · YouTube supabase · About build-read off.

---

## 3. Package

| Field | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/` |
| **LOCAL_UPLOAD_SOURCE** | `tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/` |
| **REMOTE_TARGET** | `/gosaki-piano/` |
| **UPLOAD_CONTENTS_RULE** | Upload **contents** of `public-dist/` — **not** the `public-dist` folder itself |
| `sourceCommit` | `c16af124dfea7e4bce8b3bc2bca9df82192464ab` |
| `generatedAt` | `2026-08-18T08:23:54.962Z` |
| `fileCount` | **30** |
| `publicBaseUrl` | `https://gotosaki.ciao.jp/gosaki-piano/` |
| `deployBase` | `/gosaki-piano/` |
| `includesAdmin` | **false** |
| `ftpAutoDeployUsed` | **false** |

Top of `public-dist/`: `_astro/` · `about/` · `assets/` · `contact/` · `discography/` · `link/` · `schedule/` · legacy month stubs `2026-03`…`2026-08/` · `index.html` · `robots.txt` · sitemaps. **`admin/` absent.**

---

## 4. Verify

| Command | Result |
| --- | --- |
| `verify:gosaki:ciao-preview` / `verify-site-package` | **PASS** |
| `verify:package-freshness:gosaki:ciao-preview` | **PASS** (sourceCommit = HEAD) |
| `preflight:gosaki:ciao-preview` | **PASS** |
| static-public | **PASS** · `safeForStaticFtp: true` · excluded `admin` · 30 files |

| Check | Result |
| --- | --- |
| canonical / og:url | `https://gotosaki.ciao.jp/gosaki-piano/...` (home, about, discography, schedule, contact, month) |
| noindex | `noindex,nofollow,noarchive` |
| robots | `User-agent: *` / `Disallow: /` · no Sitemap |
| CSS / nav | `/gosaki-piano/_astro/...` · `/gosaki-piano/about/` etc. (no host-root `/_astro/` or `/about/`) |
| Schedule hub months | `/gosaki-piano/schedule/2026-03/` … `/2026-08/` |
| weblike.jp | **none** |
| www.gosaki-piano.com in head | **none** |
| PoC / test markers | **none** |
| missing local `/gosaki-piano/` assets | **0** |
| staging/production fingerprints | **unchanged** |

Note: `public-dist/_astro/` contains two **unreferenced** hashed JS files from convert-time Admin compile (`GosakiStagingReadOnlyAdminPage...js`). No `admin/` HTML, no public page links those files. Same generate-then-strip pattern as production Admin exclusion.

---

## 5. Operator upload (do **not** run this phase)

```txt
LOCAL_UPLOAD_SOURCE:
tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/

REMOTE_TARGET:
/gosaki-piano/

UPLOAD_CONTENTS_RULE:
public-dist/ の中身を入れる（public-dist/ フォルダ自体は入れない）
```

FileZilla: remote `/gosaki-piano/` を開き、ローカル `public-dist/` **配下のファイルとフォルダ**（`index.html`, `_astro/`, `about/` …）をその中へ。`public-dist` という階層を remote に作らない。

---

## 6. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| FTP / remote access / remote delete | **no** |
| DNS / SSL | **no** |
| DB write / SQL / Secret / Edge | **no** |
| production deploy | **no** |
| `.env.local` change | **no** |
| commit / push | **no** |

---

## 7. Next (superseded)

Do **not** upload this package. Dirty-source resolution: [gosaki-ciao-jp-preview-dirty-source-resolution.md](./gosaki-ciao-jp-preview-dirty-source-resolution.md). Next Primary after commit/push: `gosaki-ciao-jp-preview-package-regeneration` from **clean HEAD**.
