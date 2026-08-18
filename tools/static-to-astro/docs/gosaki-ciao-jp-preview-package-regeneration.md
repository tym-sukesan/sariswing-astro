# Gosaki ciao.jp preview package regeneration

**Phase:** `gosaki-ciao-jp-preview-package-regeneration`
**Status:** **COMPLETE (local package regenerated from clean HEAD · verified · FTP not executed)**
**Date:** 2026-08-18
**HEAD baseline:** `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` (= `origin/main`)
**Prior:** `gosaki-ciao-jp-preview-dirty-source-resolution`

| Check | Status |
| --- | --- |
| Dirty `c16af124` package used for upload | **no** (relocated to `_stale-backup`) |
| Regenerated from clean HEAD | **yes** |
| `sourceCommit` | `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` |
| Official `npm run build:gosaki:ciao-preview` | **PASS** (including `--verify-build`) |
| `save-arm-utils.ts` copied into astro-out | **yes** |
| Freshness / preflight | **PASS** |
| Staging / production fingerprints | **unchanged** |
| FTP / DNS / DB / `.env.local` / commit | **no** |

---

## Gates

```txt
gosakiCiaoJpPreviewPackageRegenerationComplete: true
phase: gosaki-ciao-jp-preview-package-regeneration
generationHead: 0f84b2d1bf1e26da57a7ae6676751aa873931fc7
sourceCommit: 0f84b2d1bf1e26da57a7ae6676751aa873931fc7
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
deployBase: /gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
UPLOAD_CONTENTS_RULE: public-dist/ contents only (not the public-dist folder itself)
fileCount: 30
includesAdmin: false
NOINDEX: true
ROBOTS_DISALLOW_ALL: true
DIRTY_PACKAGE_UPLOAD_FORBIDDEN: true
DIRTY_PACKAGE_RELOCATED: true
READY_FOR_MANUAL_PREVIEW_UPLOAD: true
FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-manual-upload-preflight
```

**Supabase SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Preflight

| Check | Result |
| --- | --- |
| HEAD | `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` = `origin/main` |
| Working tree at generate start | **clean** |
| Profile `ciao-preview` | `deployBase=/gosaki-piano/` · Admin off · noindex · robots Disallow |
| SoT | `kmjqppxjdnwwrtaeqjta` |
| Live SELECT | **not re-run** |

---

## 2. Dirty package lifecycle

Official relocate (no manual `rm -rf`):

```txt
from: output/manual-upload/gosaki-piano-ciao-preview
to:   output/manual-upload/_stale-backup/gosaki-piano-ciao-preview/2026-08-18T08-42-21-772Z-0f84b2d
prior sourceCommit: c16af124dfea7e4bce8b3bc2bca9df82192464ab
```

That backup is **not** an upload source.

---

## 3. Regeneration

```bash
cd tools/static-to-astro
npm run build:gosaki:ciao-preview
```

| Step | Result |
| --- | --- |
| git clean gate | `sourceTreeClean=true` |
| mutex | `no_operational_save_arm` |
| convert `--verify-build` / `astro build` | **success** (`save-arm-utils.ts` present under astro-out `src/lib/`) |
| Schedule bake | supabase **74** events |
| Discography | **4** / **34** |
| static-public | **PASS** · excluded `admin` · 30 files · `safeForStaticFtp: true` |
| verify-site-package | **PASS** |

---

## 4. Fresh package

| Field | Value |
| --- | --- |
| Package | `tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/` |
| **LOCAL_UPLOAD_SOURCE** | `tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/` |
| **REMOTE_TARGET** | `/gosaki-piano/` |
| **UPLOAD_CONTENTS_RULE** | **contents** of `public-dist/` — not the folder itself |
| `sourceCommit` | `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` |
| `generatedAt` | `2026-08-18T08:43:17.252Z` |
| `fileCount` | **30** |
| `includesAdmin` | **false** (`admin/` absent) |

Top dirs: `_astro/` · `about/` · `assets/` · `contact/` · `discography/` · `link/` · `schedule/` · legacy `2026-03`…`2026-08/` · `index.html` · `robots.txt` · sitemaps.

canonical / og:url = `https://gotosaki.ciao.jp/gosaki-piano/...` · noindex · robots `Disallow: /` · nav/CSS `/gosaki-piano/...` · Schedule months `/gosaki-piano/schedule/2026-03/` … `/2026-08/` · weblike / www head **none** · markers **none** · missing assets **0**.

Staging / production fingerprints unchanged (`07beea8f…` / `bab56b67…`).

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

---

## 6. Next

`gosaki-ciao-jp-preview-manual-upload-preflight` — FileZilla packet only. **Do not FTP** until that phase + explicit approval.
