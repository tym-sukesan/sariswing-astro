# G-15e — Gosaki Discography artist public reflection local regen and upload preflight

**Phase:** `G-15e-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; About Us!! `artist` verified in generated HTML; minimal 1-file upload plan ready; **operator manual upload pending**  
**Date:** 2026-06-29  
**Base commit:** `db0ae06`  
**Prior:** [gosaki-discography-artist-save-result.md](./gosaki-discography-artist-save-result.md) (G-15d-execution)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c)

| Check | Status |
| --- | --- |
| G-15d Save (`artist` on discography-003) | **complete** |
| Public generation path surveyed | **yes** |
| Supabase read + convert hook extended | **yes** — `artist` patch added |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| About Us!! `artist` in local HTML | **PASS** — `ごさきりかこTrio` |
| Old `ごさきりかこtrio` absent (About Us item) | **PASS** |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| Continuous / SKYLARK / Ja-Jaaaaan! | **present** (unchanged) |
| PoC / audit markers absent | **PASS** |
| `discographyDataSource=supabase` | **PASS** (local package) |
| CSS / JS hash vs prior package | **unchanged** — minimal 1-file upload |
| Live staging `/discography/` | **stale** — About Us still `ごさきりかこtrio` (pre-upload HTTP) |
| Post-upload HTTP verify | **not executed** (execution phase) |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyArtistPublicReflectionLocalRegenComplete: true
gosakiDiscographyArtistPublicReflectionUploadPreflightComplete: true
phase: G-15e-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight
readyForG15ePublicReflectionUploadExecution: true
readyForG15eDiscographyArtistReflectionClosure: false
packageRegenExecuted: true
minimalUploadScopeConfirmed: true
cssJsHashChanged: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
postUploadHttpVerifyExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
skylarkPurchaseUrlReflectionMaintained: true
continuousReleaseTouched: false
jaJaaaaanReleaseTouched: false
```

**Live staging About Us!! `artist` still stale** until operator manual upload (separate execution phase).

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Target row (G-15d Save — reference)

| Field | Value |
| --- | --- |
| **id** | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| **legacy_id** | `discography-003` |
| **title** | `About Us!!` |
| **route** | `/discography/` |
| **field** | `artist` only |
| **artist (before public)** | `ごさきりかこtrio` |
| **artist (after DB Save)** | `ごさきりかこTrio` |
| **updated_at** | `2026-06-29T02:40:57.83085+00:00` |

**SKYLARK / Continuous / Ja-Jaaaaan! — DB rows not modified in G-15d.**

---

## 2. Public page generation survey

| Layer | Role |
| --- | --- |
| **Wix HTML fixture** | `fixtures/gosaki-piano/discography.html` — crawled pass-through body |
| **Convert** | `convert-static-to-astro.mjs` → `discography/index.astro` |
| **G-15c hook** | `patchGosakiDiscographySupabaseFields` — `purchase_url` patch (maintained) |
| **G-15e extension** | same hook — adds `artist` patch on `「title」/artist` h2 pattern |
| **Build** | Astro static → `dist/discography/index.html` |
| **Package** | `static-public` → `manual-upload/.../public-dist/discography/index.html` |

**Wix artist markup (About Us!!):**

```html
「About Us!!」/ごさきりかこtrio
```

**Patch rule:** within repeater item matched by album `title`, replace `「{title}」/{old}` with `「{title}」/{artist}` from Supabase.

**Not in scope:** full Discography CMS page regen, tracks/personnel/price, cover images, streaming_url public patch.

---

## 3. Live staging (read-only, pre-upload)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**HTTP:** **200**

| Check | Live (pre-upload) |
| --- | --- |
| About Us!! h2 artist | `ごさきりかこtrio` (**stale**) |
| About Us!! h2 new artist | **absent** |
| `discographyDataSource=supabase` | **present** (G-15c upload) |
| `https://gosakirikako.base.shop/` (page) | **present** (G-15c reflected) |
| `https://gosaakiii.base.shop/` (page) | **absent** |
| CSS hash | `index.YcHrHZH4.css` |

Expected: artist stale until operator uploads local `discography/index.html`.

---

## 4. Hook implementation (G-15e)

**File:** `scripts/lib/supabase-discography-read.mjs`

| Change | Detail |
| --- | --- |
| `DISCOGRAPHY_SELECT` | adds `artist` |
| `normalizeDiscographyRecord` | adds `artist` |
| `patchDiscographyItemArtist` | **new** — h2 `「title」/artist` replace |
| `patchGosakiDiscographySupabaseFields` | **new** — purchase_url + artist in one pass |
| `patchGosakiDiscographyPurchaseUrls` | kept as wrapper (backward compat) |

**Generator:** `astro-generator.mjs` calls `patchGosakiDiscographySupabaseFields` on `/discography/`.

---

## 5. Local regen command

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Env source:** existing repo `.env` / `.env.local` (read-only — not modified).

**Pipeline executed:**

```txt
1. convert-static-to-astro.mjs  fixtures/gosaki-piano → output/gosaki-piano-astro
   Discography data: discographyDataSource=supabase (4 releases, 4 purchase_url + 1 artist patch(es))
2. verify-static-public-artifact.mjs  → PASS (safeForStaticFtp: true)
3. npm run manual-upload:package
4. npm run verify:manual-upload  → PASS
```

**Overall:** `G-11c4b package build: PASS`

---

## 6. Generation output

| Artifact | Path |
| --- | --- |
| Hook module | `scripts/lib/supabase-discography-read.mjs` |
| Manual upload package | `output/manual-upload/gosaki-piano/` |
| Upload source HTML | `output/manual-upload/gosaki-piano/public-dist/discography/index.html` |

| Metric | Value |
| --- | --- |
| **File count** | **27** |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **safeForStaticFtp** | **true** |

### CSS / JS hash (before vs after G-15e regen)

| Asset | Hash | Changed? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

**Decision:** minimal upload = **1 HTML file only** — do **not** upload `_astro/` or full `public-dist/`.

### Regenerated file diff (scope note)

| File | Changed? | Note |
| --- | --- | --- |
| `public-dist/discography/index.html` | **yes** — About Us!! artist | **upload target** |
| Other 26 files | content-equivalent for this change | **out of upload scope** |
| `_astro/*` | unchanged hash | **not needed** |

---

## 7. Discography HTML — About Us!! artist reflection (local package)

**File:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Result |
| --- | --- |
| `discographyDataSource=supabase` | **PASS** |
| About Us!! item h2 | `「About Us!!」/ごさきりかこTrio` |
| About Us!! item old artist | **absent** |
| Page-level `ごさきりかこtrio` | **0** |
| SKYLARK new `purchase_url` | **PASS** |
| Page `https://gosaakiii.base.shop/` | **absent** |
| Page `https://gosakirikako.base.shop/` | **present** |
| Continuous / SKYLARK / Ja-Jaaaaan! titles | **present** |

### PoC / audit markers — must be absent (local)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `PoC` | **absent** |
| `dry-run` | **absent** |

---

## 8. Upload scope decision

| Option | Files | Decision |
| --- | --- | --- |
| **Minimal (recommended)** | **1** — `discography/index.html` | **Use this** |
| Full `public-dist/` | 27 | **not needed** (hash unchanged) |
| `_astro/` | 2 | **not needed** |

| | |
| --- | --- |
| **Local file** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| **Remote file** | `/cms-kit-staging/gosaki-piano/discography/index.html` |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` |

### Operator upload procedure (execution phase only — not run by Cursor)

1. Regenerate package if needed: `node scripts/build-gosaki-staging-admin-package.mjs`
2. FTP / hosting panel: upload **only** `discography/index.html` to remote path above
3. HTTP verify: About Us!! shows `ごさきりかこTrio`; `ごさきりかこtrio` absent in About Us item; SKYLARK `purchase_url` unchanged
4. Do **not** upload `_astro/` or full tree unless hash changes

**FTP auto-apply:** still **suspended** (`readyForAnyFutureFtpApply: false`). Manual upload only with explicit approval.

---

## 9. Implementation files (commit scope)

| File | Change |
| --- | --- |
| `scripts/lib/supabase-discography-read.mjs` | `artist` in SELECT + `patchGosakiDiscographySupabaseFields` |
| `scripts/lib/astro-generator.mjs` | use combined patch + log artist count |
| `docs/gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md` | **this doc** |
| `scripts/verify-g15e-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.mjs` | verifier |

---

## 10. Forbidden operations (this phase)

| Operation | Executed? |
| --- | --- |
| FTP / upload / deploy | **no** |
| DB write / Save | **no** |
| GRANT / policy / trigger | **no** |
| `workflow_dispatch` | **no** |
| `.env` / secrets change | **no** |
| Production / Sariswing | **no** |
| `service_role` | **no** |
| `src/pages/admin` change | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15e-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.mjs
```

---

## 12. Next phase

**G-15e-upload** — operator manual upload `discography/index.html` ×1 + HTTP verify (separate explicit approval).

Then **G-15e-f** — public reflection closure doc (mirror G-15c-f).
