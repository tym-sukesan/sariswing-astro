# G-17e — Gosaki Discography label public reflection local regen and upload preflight

**Phase:** `G-17e-gosaki-discography-label-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — hook + local regen **succeeded**; label verified in generated HTML; **minimal 1-file upload blocked** (CSS asset reference changed)  
**Date:** 2026-06-29  
**Base commit:** `7219c6c`  
**Prior:** [gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md](./gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)

| Check | Status |
| --- | --- |
| G-17d Save (`label` on discography-004) | **complete** |
| `label` in `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` | **yes** |
| Local package regen | **yes** — convert + static-public + manual-upload package **PASS** |
| Ja-Jaaaaan! `label` in local HTML | **PASS** — `Mardi Gras JAPAN Records` |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| G-15e About Us!! `artist` maintained | **PASS** |
| G-16b Continuous `artist` maintained | **PASS** |
| `discographyDataSource=supabase` | **PASS** (local package) |
| CSS / JS vs live staging | **reference changed** — upload scope **not** 1-file-only |
| Live staging `/discography/` | **already shows** `Mardi Gras JAPAN Records` (Wix HTML) |
| FTP / upload | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG17eLabelPublicReflectionLocalRegenComplete: true
gosakiDiscographyG17eLabelPublicReflectionUploadPreflightComplete: true
phase: G-17e-gosaki-discography-label-public-reflection-local-regen-and-upload-preflight
readyForG17ePublicReflectionUploadExecution: false
readyForG17eDiscographyLabelReflectionClosure: false
packageRegenExecuted: true
minimalUploadScopeConfirmed: false
cssJsHashChanged: true
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
postUploadHttpVerifyExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
aboutUsArtistReflectionMaintained: true
continuousArtistReflectionMaintained: true
```

**STOP — minimal 1-file upload not confirmed.** Local `discography/index.html` references `_astro/BaseLayout.YcHrHZH4.css`; live staging references `_astro/index.YcHrHZH4.css` (same content hash suffix `YcHrHZH4`, different filename). Operator must choose upload scope before execution (see §8).

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Target row (G-17d Save — reference)

| Field | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **title** | `Ja-Jaaaaan!` |
| **field** | `label` only |
| **label (DB)** | `Mardi Gras JAPAN Records` |
| **updated_at** | `2026-06-29T07:36:49.044397+00:00` |
| **route** | `/discography/` |

---

## 2. Live staging (read-only GET, pre-upload)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**HTTP:** **200** (72,682 bytes)

| Check | Live (pre-upload) |
| --- | --- |
| Ja-Jaaaaan! item `label` | `Mardi Gras JAPAN Records` (**Wix HTML — already present**) |
| `discographyDataSource=supabase` | **present** |
| About Us!! h2 artist | `ごさきりかこTrio` (**G-15e**) |
| Continuous h2 artist | `ごさきりかこTrio feat.石川周之介` (**G-16b**) |
| `https://gosakirikako.base.shop/` | **4** |
| `https://gosaakiii.base.shop/` | **absent** |
| CSS ref in HTML | `_astro/index.YcHrHZH4.css` |

**Note:** Live public already matches DB label text; regen establishes Supabase-driven patch path for future label edits.

---

## 3. Hook implementation (G-17e)

**File:** `scripts/lib/supabase-discography-read.mjs`

| Change | Detail |
| --- | --- |
| `DISCOGRAPHY_SELECT` | add `label`, `catalog_number` |
| `normalizeDiscographyRecord` | map `label`, `catalog_number` |
| `patchDiscographyItemLabel` | **new** — paragraph between Release `</p>` and catalog `OMP-001` line |
| `DISCOGRAPHY_PUBLIC_PATCH_FIELD_ORDER` | add `label` after `artist` |
| `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` | `label` handler |
| `patchGosakiDiscographySupabaseFields` | track `labelPatches` |

**Wix label markup (Ja-Jaaaaan!):**

```html
<p>…Release 2015.03.21…</p>
<p>…Mardi Gras JAPAN Records…</p>
<p>…OMP-001…</p>
```

**Patch rule:** within repeater item matched by album `title`, set label paragraph text from Supabase `label` (insert paragraph if missing before catalog line).

**Convert log:** `discographyDataSource=supabase (4 releases, 1 purchase_url + 4 artist + 1 label patch(es))`

---

## 4. Local regen

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs   # convert PASS; verify-static-public needed astro build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run manual-upload:package
npm run verify:manual-upload
```

**Pipeline:** convert → astro build → static-public **PASS** → manual-upload package **PASS** (27 files).

---

## 5. Local HTML verification

**File:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html` (73,176 bytes)

| Check | Result |
| --- | --- |
| `discographyDataSource=supabase` | **PASS** |
| Ja-Jaaaaan! + `Mardi Gras JAPAN Records` | **PASS** (in item segment) |
| About Us!! / `ごさきりかこTrio` | **PASS** |
| Continuous / `ごさきりかこTrio feat.石川周之介` | **PASS** |
| `ごさきりかこTrio Feat.石川周之介` | **absent** |
| SKYLARK + `https://gosakirikako.base.shop/` | **PASS** |
| `https://gosaakiii.base.shop/` | **absent** |
| 4 titles (Continuous, SKYLARK, About Us!!, Ja-Jaaaaan!) | **PASS** |
| Audit markers (`[CMS Kit staging]`, `PoC`, `dry-run`) | **absent** |

---

## 6. CSS / JS hash (live vs local package)

| Asset | Live staging | Local package | Changed? |
| --- | --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | `BaseLayout.YcHrHZH4.css` | **yes** (filename ref; suffix `YcHrHZH4` same) |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | same | **no** |

```txt
cssJsHashChanged: true
```

**Decision:** **Do not** proceed with minimal 1-file `discography/index.html` upload alone — HTML would reference missing `BaseLayout.YcHrHZH4.css` on server.

---

## 7. Upload scope (operator decision required)

| Option | Files | Status |
| --- | --- | --- |
| Minimal 1-file HTML only | `discography/index.html` | **blocked** (CSS ref mismatch) |
| HTML + new CSS | `discography/index.html` + `_astro/BaseLayout.YcHrHZH4.css` | candidate — operator approval |
| Full `public-dist/` (27 files) | all | safest if unsure |

| | |
| --- | --- |
| **Local HTML** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote HTML** | `/cms-kit-staging/gosaki-piano/discography/index.html` |

**Next phase:** `G-17e-upload` — operator manual upload + HTTP verify (after scope decision).

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17e-gosaki-discography-label-public-reflection-local-regen-and-upload-preflight.mjs
```
