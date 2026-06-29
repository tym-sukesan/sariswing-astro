# G-16b — Gosaki Discography G-16a artist public reflection local regen and upload preflight

**Phase:** `G-16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; Continuous `artist` verified in generated HTML; minimal 1-file upload plan ready; **operator manual upload pending**  
**Date:** 2026-06-29  
**Base commit:** `db59af7`  
**Prior:** [gosaki-discography-g16a-artist-save-result.md](./gosaki-discography-g16a-artist-save-result.md) (G-16a-execution)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c)

| Check | Status |
| --- | --- |
| G-16a Save (`artist` on discography-001) | **complete** |
| Public generation path surveyed | **yes** |
| Supabase read + convert hook | **yes** — existing `artist` patch + G-16b minimal bounds/regex fix |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| Continuous `artist` in local HTML | **PASS** — `ごさきりかこTrio feat.石川周之介` |
| Old `Feat.` absent (Continuous item) | **PASS** |
| G-15c SKYLARK `purchase_url` maintained | **PASS** |
| G-15e About Us!! `artist` maintained | **PASS** |
| Continuous / SKYLARK / Ja-Jaaaaan! | **present** (unchanged) |
| PoC / audit markers absent | **PASS** |
| `discographyDataSource=supabase` | **PASS** (local package) |
| CSS / JS hash vs prior package | **unchanged** — minimal 1-file upload |
| Live staging `/discography/` | **stale** — Continuous still `Feat.` (pre-upload HTTP) |
| Post-upload HTTP verify | **not executed** (execution phase) |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG16bArtistPublicReflectionLocalRegenComplete: true
gosakiDiscographyG16bArtistPublicReflectionUploadPreflightComplete: true
phase: G-16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight
readyForG16bPublicReflectionUploadExecution: true
readyForG16bDiscographyArtistReflectionClosure: false
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
continuousPurchaseUrlBaselineRecorded: true
aboutUsArtistReflectionMaintained: true
```

**Live staging Continuous `artist` still stale** until operator manual upload (separate execution phase).

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Target row (G-16a Save — reference)

| Field | Value |
| --- | --- |
| **id** | `00f4cd00-cfb6-43b3-991a-211b2d7c92ef` |
| **legacy_id** | `discography-001` |
| **title** | `Continuous` |
| **route** | `/discography/` |
| **field** | `artist` only |
| **artist (before public)** | `ごさきりかこTrio Feat.石川周之介` |
| **artist (after DB Save)** | `ごさきりかこTrio feat.石川周之介` |
| **updated_at** | `2026-06-29T05:05:20.905888+00:00` |

### purchase_url baseline (read-only — correct values)

| legacy_id | title | `purchase_url` (DB + public) |
| --- | --- | --- |
| discography-001 | Continuous | `https://gosakirikako.base.shop/` |
| discography-002 | SKYLARK | `https://gosakirikako.base.shop/` |

**Note:** G-16a-d3 preflight misrecorded `purchase_url: null` on `001` — see G-16a-execution result doc §8.

**SKYLARK / About Us!! / Ja-Jaaaaan! — DB rows not modified in G-16a.**

---

## 2. Public page generation survey

| Layer | Role |
| --- | --- |
| **Wix HTML fixture** | `fixtures/gosaki-piano/discography.html` — crawled pass-through body |
| **Convert** | `convert-static-to-astro.mjs` → `discography/index.astro` |
| **G-15c hook** | `patchGosakiDiscographySupabaseFields` — `purchase_url` patch (maintained) |
| **G-15e extension** | same hook — `artist` patch on `「title」/artist` h2 pattern |
| **G-16b fix** | bounds + regex hardening for Continuous (`item1` repeater id, zwsp, title collision) |
| **Build** | Astro static → `dist/discography/index.html` |
| **Package** | `static-public` → `manual-upload/.../public-dist/discography/index.html` |

**Wix artist markup (Continuous):**

```html
​「Continuous」/ごさきりかこTrio Feat.石川周之介
```

(U+200B before `「`; repeater id `comp-llexymga__item1`.)

**Patch rule:** within repeater item matched by album `title`, replace `「{title}」/{old}` with `「{title}」/{artist}` from Supabase.

**Not in scope:** full Discography CMS page regen, tracks/personnel/price, cover images, streaming_url public patch.

---

## 3. Live staging (read-only, pre-upload)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**HTTP:** **200** (72,682 bytes)

| Check | Live (pre-upload) |
| --- | --- |
| Continuous h2 artist | `ごさきりかこTrio Feat.石川周之介` (**stale**) |
| Continuous h2 new artist | **absent** |
| About Us!! h2 artist | `ごさきりかこTrio` (**G-15e reflected**) |
| `discographyDataSource=supabase` | **present** |
| `https://gosakirikako.base.shop/` (page) | **4** (Continuous + SKYLARK × href/text) |
| `https://gosaakiii.base.shop/` (page) | **absent** |
| CSS hash | `index.YcHrHZH4.css` |

Expected: Continuous artist stale until operator uploads local `discography/index.html`.

---

## 4. Hook implementation (G-16b minimal fix)

**File:** `scripts/lib/supabase-discography-read.mjs`

| Change | Detail |
| --- | --- |
| `REPEATER_ITEM_START_RE` | match `comp-llexymga__item1` **and** `comp-llexymga__item-*` (was `item-` only) |
| `findDiscographyRepeaterItemBounds` | prefer `「title」` needle over bare title (avoids track-name collision on "Continuous") |
| `patchDiscographyItemArtist` | allow optional U+200B before `「` in h2 regex |
| `patchGosakiDiscographySupabaseFields` | unchanged API — purchase_url + artist in one pass |

**Why G-15e worked but Continuous did not until G-16b:**

- About Us!! has no zwsp before `「` and unique title string
- Continuous uses `comp-llexymga__item1` (no hyphen) — old regex missed bounds
- Bare `indexOf("Continuous")` could match track list text

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
   Discography data: discographyDataSource=supabase (4 releases, 1 purchase_url + 4 artist patch(es))
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

### CSS / JS hash (before vs after G-16b regen)

| Asset | Hash | Changed? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

**Decision:** minimal upload = **1 HTML file only** — do **not** upload `_astro/` or full `public-dist/`.

### Regenerated file diff (scope note)

| File | Changed? | Note |
| --- | --- | --- |
| `public-dist/discography/index.html` | **yes** — Continuous artist | **upload target** |
| Other 26 files | content-equivalent for this change | **out of upload scope** |
| `_astro/*` | unchanged hash | **not needed** |

---

## 7. Discography HTML — Continuous artist reflection (local package)

**File:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Result |
| --- | --- |
| `discographyDataSource=supabase` | **PASS** |
| Continuous item h2 | `「Continuous」/ごさきりかこTrio feat.石川周之介` |
| Continuous item old artist (`Feat.`) | **absent** |
| Page-level `Feat.石川` | **0** |
| Page-level `feat.石川` | **1** |
| About Us!! item h2 | `「About Us!!」/ごさきりかこTrio` |
| SKYLARK new `purchase_url` | **PASS** |
| Continuous `purchase_url` | `https://gosakirikako.base.shop/` |
| Page `https://gosaakiii.base.shop/` | **absent** |
| Page `https://gosakirikako.base.shop/` | **present** (count **4**) |
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
3. HTTP verify: Continuous shows `ごさきりかこTrio feat.石川周之介`; `Feat.` absent in Continuous item; G-15c/G-15e reflections unchanged
4. Do **not** upload `_astro/` or full tree unless hash changes

**FTP auto-apply:** still **suspended** (`readyForAnyFutureFtpApply: false`). Manual upload only with explicit approval.

---

## 9. Implementation files (commit scope)

| File | Change |
| --- | --- |
| `scripts/lib/supabase-discography-read.mjs` | G-16b bounds/regex fix for Continuous artist patch |
| `docs/gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md` | **this doc** |
| `scripts/verify-g16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.mjs` | verifier |

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
node tools/static-to-astro/scripts/verify-g16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.mjs
```

---

## 12. Next phase

**G-16b-upload** — operator manual upload `discography/index.html` ×1 + HTTP verify (separate explicit approval).

Then **G-16b-f** — public reflection closure doc (mirror G-15e-f).
