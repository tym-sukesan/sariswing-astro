# Gosaki ciao.jp preview Wix-localized regeneration

**Phase:** `gosaki-ciao-jp-preview-wix-localized-regeneration`
**Status:** **COMPLETE (local package regenerated from clean HEAD · verified · FTP not executed)**
**Date:** 2026-08-18
**HEAD baseline:** `7de25b3550b882dbfaf40fd7b413779bb07c112d` (= `origin/main`)
**Prior:** `gosaki-wix-external-assets-localization` (committed) / `gosaki-wix-assets-localization-commit-push`

| Check | Status |
| --- | --- |
| Working tree at generate | **clean** |
| Official `npm run build:gosaki:ciao-preview` | **PASS** (including `--verify-build`) |
| `sourceCommit` | `7de25b3550b882dbfaf40fd7b413779bb07c112d` |
| Freshness / preflight | **PASS** |
| Public `static.wixstatic.com` | **0** |
| Public parastorage favicon | **0** |
| Localized assets in package | **14 / 14** · missing **0** |
| Intentional `wixsite.com` | **kept** |
| Staging / production fingerprints | **unchanged** |
| FTP / DNS / DB / Secret / Edge / commit | **no** |

---

## Gates

```txt
gosakiCiaoJpPreviewWixLocalizedRegenerationComplete: true
phase: gosaki-ciao-jp-preview-wix-localized-regeneration
generationHead: 7de25b3550b882dbfaf40fd7b413779bb07c112d
sourceCommit: 7de25b3550b882dbfaf40fd7b413779bb07c112d
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
deployBase: /gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
UPLOAD_CONTENTS_RULE: public-dist/ contents only (not the public-dist folder itself)
fileCount: 44
includesAdmin: false
NOINDEX: true
ROBOTS_DISALLOW_ALL: true
PUBLIC_WIXSTATIC_REFS: 0
PUBLIC_PARASTORAGE_REFS: 0
MISSING_LOCALIZED_ASSETS: 0
INTENTIONAL_WIXSITE_KEPT: true
READY_FOR_OPERATOR_MANUAL_UPLOAD: true
FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-wix-localized-manual-upload
```

**Supabase SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.
Build-time read used the existing package pipeline only. No extra live data audit.

---

## 1. Preflight

| Check | Result |
| --- | --- |
| HEAD | `7de25b3550b882dbfaf40fd7b413779bb07c112d` = `origin/main` |
| Working tree at generate start | **clean** |
| Profile `ciao-preview` | `deployBase=/gosaki-piano/` · Admin off · noindex · robots Disallow |
| SoT | `kmjqppxjdnwwrtaeqjta` |
| Extra live SELECT audit | **not re-run** |

---

## 2. Stale package lifecycle

Official relocate (no manual `rm`):

```txt
from: output/manual-upload/gosaki-piano-ciao-preview
to:   output/manual-upload/_stale-backup/gosaki-piano-ciao-preview/2026-08-18T13-17-50-655Z-7de25b3
prior sourceCommit: 0f84b2d1bf1e26da57a7ae6676751aa873931fc7
```

That backup still hotlinks Wix CDN and is **not** an upload source.

Remote `https://gotosaki.ciao.jp/gosaki-piano/` remains the old package until operator FileZilla overwrite.

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
| convert `--verify-build` / `astro build` | **success** |
| Schedule bake | supabase **74** events |
| Discography | **4** / **34** |
| static-public | **PASS** · excluded `admin` · 44 files · `safeForStaticFtp: true` |
| `verify:site-package` ciao-preview | **PASS** |
| freshness | **PASS** (`sourceCommit` = HEAD) |
| `preflight:gosaki:ciao-preview` | **PASS** |

`fileCount` 30 → **44** = previous public files + **14** localized images/favicon.

---

## 4. Wix localization (real public-dist)

| Check | Result |
| --- | --- |
| `static.wixstatic.com` | **0** |
| `static.parastorage.com` | **0** |
| Local prefix | `/gosaki-piano/images/wix-local/…` |
| Files under `public-dist/images/wix-local/` | **14** (all expected names present) |
| missing | **0** |
| Home KV / flyers | local |
| About portrait | local |
| Contact photo | local |
| Discography jackets (4) | local |
| Footer SNS icons | local on all HTML pages |
| Favicon | local on crawled pages (Home/About/Contact/Discography/Link) |
| `https://gosakirikakotrio.wixsite.com/gosakirikakotrio` | **kept** (Link + schedule 2026-08) |

Schedule hub / month pages have **no** `<link rel="icon">` (generated schedule layout historically omits favicon). They also have **0** Wix favicon CDN refs.

---

## 5. Usual preview gates

| Check | Result |
| --- | --- |
| Admin HTML | **absent** |
| robots meta | `noindex,nofollow,noarchive` |
| `robots.txt` | `Disallow: /` |
| canonical / og:url | `https://gotosaki.ciao.jp/gosaki-piano/…` |
| CSS/JS/nav prefix | `/gosaki-piano/_astro/` · no host-root `/_astro/` |
| Schedule hub months | `/gosaki-piano/schedule/2026-…` |
| weblike.jp | **0** |
| `www.gosaki-piano.com` in preview `<head>` | **0** |
| PoC / test markers | **0** |
| staging public-dist sha256 prefix | `ec546c9a3a6845a8` **unchanged** |
| production public-dist sha256 prefix | `23483a6260c2170e` **unchanged** |

---

## 6. Upload source (do **not** FTP this phase)

```txt
LOCAL_UPLOAD_SOURCE:
tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/

REMOTE_TARGET:
/gosaki-piano/

UPLOAD_CONTENTS_RULE:
public-dist/ の中身を入れる（public-dist/ フォルダ自体は入れない）
```

---

## 7. Next

`gosaki-ciao-jp-preview-wix-localized-manual-upload` — FileZilla packet / operator overwrite only. **Cursor must not FTP.**
