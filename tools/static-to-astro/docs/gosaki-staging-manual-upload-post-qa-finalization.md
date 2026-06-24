# Gosaki staging manual upload post-QA finalization (G-10h5-2a)

**Phase:** `G-10h5-2a-gosaki-staging-manual-upload-post-qa-finalization`  
**Status:** **complete** — operator manual staging upload **succeeded**; read-only staging QA **PASS**; documentation only  
**Date:** 2026-06-25  
**Prior:** G-10i1 package prep (commit `e5beedc`); G-10g4 Contact photo; G-10g1–G-10g3 Contact HubSpot layout

| Check | Status |
| --- | --- |
| Operator manual FTP upload | **yes** (FileZilla — operator) |
| Cursor / AI FTP upload | **no** |
| Staging read-only QA | **PASS** (Cursor HTTP fetch) |
| Operator visual QA | **PASS** (About bands images) |
| Blocking failure | **none** |
| Additional upload / delete / mirror | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-bands-projects-images-package-prep.md](./gosaki-about-bands-projects-images-package-prep.md) (G-10i1)
- [gosaki-about-html-staging-manual-upload-preflight.md](./gosaki-about-html-staging-manual-upload-preflight.md) (G-10h5-2)

---

## Gates

```txt
gosakiStagingManualUploadPostQaFinalizationComplete: true
gosakiStagingManualUploadExecuted: true
gosakiStagingManualUploadQaPassed: true
phase: G-10h5-2a
readyForGosakiClientPreviewOrNextModule: true
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
cursorDbWriteExecuted: false
cursorImageOpsExecuted: false
rollbackNeeded: false
```

**Do not re-run G-10h4b / G-10h4d Save scripts.**

---

## 1. Operator manual upload (executed)

| Item | Value |
| --- | --- |
| Method | Operator manual — FileZilla |
| **Local source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Upload rule** | **`public-dist/` の中身のみ**（フォルダ自体ではない） |
| **Remote destination** | `/cms-kit-staging/gosaki-piano/` |
| **Staging base URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Package commit | `e5beedc` (G-10i1 About bands images + prior Contact/About) |

### Upload policy (operator confirmed)

| Policy | Result |
| --- | --- |
| Overwrite upload only | **yes** |
| Delete remote files | **no** |
| Sync / mirror | **no** |
| `--delete` | **no** |
| FTP auto-deploy | **no** |
| `workflow_dispatch` | **no** |
| Production gosaki-piano.com touched | **no** |
| Sariswing production touched | **no** |

---

## 2. Staging read-only QA (Cursor — PASS)

**URLs checked:** top, `/about/`, `/contact/` + 5 band image assets

### Top — `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| `noindex,nofollow,noarchive` | **yes** |
| `canonical` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `og:url` | staging URL |
| `deployBase` refs | **yes** |

### About — `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| About profile (`後藤 沙紀`, About heading) | **yes** |
| Bands / Projects section | **yes** |
| `class="band-profiles"` count | **1** (no duplicate) |
| `<img class="band-profile__image">` | **5** |
| Placeholder div | **none** |
| Band display order | **OK** (see below) |
| Image path refs in HTML | **5/5** `assets/about/bands/*.jpg` |
| `noindex` / canonical / og:url | staging About URL |

**Band order (verified):**

1. ごさきりかこTrio (`band-gosakirika-trio`)
2. 新谷健介オノマトペ (`band-onomatope`)
3. ケアレスホーネッツ (`band-careless-hornets`)
4. 紀々音(ききおと) (`band-kikioto`)
5. カリビアンファンクション (`band-caribbean-function`)

### Band images (HTTP HEAD)

| File | URL | HTTP | Content-Type |
| --- | --- | --- | --- |
| `gosakirikako_trio.jpg` | `.../assets/about/bands/gosakirikako_trio.jpg` | **200** | image/jpeg |
| `onomatopoeia.jpg` | `.../assets/about/bands/onomatopoeia.jpg` | **200** | image/jpeg |
| `careless_hornets.jpg` | `.../assets/about/bands/careless_hornets.jpg` | **200** | image/jpeg |
| `kikioto.jpg` | `.../assets/about/bands/kikioto.jpg` | **200** | image/jpeg |
| `caribbean_function.jpg` | `.../assets/about/bands/caribbean_function.jpg` | **200** | image/jpeg |

### Contact — `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| HubSpot script (`21392032.js`) | **1** |
| `hs-form-frame` | **1** |
| `#gosaki-contact-hubspot-embed` | **yes** |
| Wix form `#comp-kei80g91` | **absent** |
| `noindex` / canonical / og:url | staging Contact URL |

---

## 3. Operator visual QA (reported — PASS)

Operator confirmed on staging `/about/`:

- 5 band images visible
- Display order OK
- Image aspect ratios OK
- Card layout OK
- No duplicate Bands section
- No overall About layout breakage

---

## 4. What was not done

- Cursor FTP / FileZilla / upload / deploy
- DB / Supabase writes
- Image file create / modify / delete / move
- `about-profile-html` / `about-bands-html` re-Save
- G-10h4b / G-10h4d run script re-execution
- `src/pages/admin` changes

---

## 5. Next phase (suggested)

- Share staging URL with gosaki client for broader preview feedback, **or**
- Resume deferred modules (Schedule price slice G-6-g3, discography images G-10f, etc.) per product priority
