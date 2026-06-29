# G-15c — Gosaki Discography public reflection local regen and upload preflight

**Phase:** `G-15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight`  
**Status:** **complete** — local package regen **succeeded**; SKYLARK `purchase_url` verified in generated HTML; minimal 1-file upload plan ready; **operator manual FTP upload pending**  
**Date:** 2026-06-28  
**Base commit:** `a32e95d`  
**Prior:** [gosaki-discography-updated-at-trigger-apply-result.md](./gosaki-discography-updated-at-trigger-apply-result.md) (G-15b-f8-execution)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c)

| Check | Status |
| --- | --- |
| G-15b Save (`purchase_url`) | **complete** |
| Public generation path surveyed | **yes** |
| Supabase read + convert hook (B) | **implemented** |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| SKYLARK `purchase_url` in local HTML | **PASS** |
| Old `gosaakiii.base.shop` absent (page) | **PASS** |
| Continuous / About Us!! / Ja-Jaaaaan! | **unchanged** (spot-check) |
| PoC / audit markers absent | **PASS** |
| `discographyDataSource=supabase` | **PASS** (local package) |
| CSS / JS hash vs prior package | **unchanged** — minimal 1-file upload |
| Live staging `/discography/` | **stale** — SKYLARK still `gosaakiii` (pre-upload HTTP) |
| Post-upload HTTP verify | **not executed** (execution phase) |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyPublicReflectionLocalRegenComplete: true
gosakiDiscographyPublicReflectionUploadPreflightComplete: true
phase: G-15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight
readyForG15cPublicReflectionUploadExecution: true
readyForG15cDiscographyReflectionClosure: false
packageRegenExecuted: true
minimalUploadScopeConfirmed: true
cssJsHashChanged: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
postUploadHttpVerifyExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
continuousReleaseTouched: false
aboutUsReleaseTouched: false
jaJaaaaanReleaseTouched: false
```

**Live staging `/discography/` still stale** until operator manual upload (separate execution phase).

**Output artifacts:** under `tools/static-to-astro/output/` — **gitignored**. Not committed.

---

## 1. Target row (G-15b Save — reference)

| Field | Value |
| --- | --- |
| **id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` |
| **route** | `/discography/` |
| **purchase_url (before public)** | `https://gosaakiii.base.shop/` |
| **purchase_url (after DB Save)** | `https://gosakirikako.base.shop/` |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` |

**Continuous / About Us!! / Ja-Jaaaaan! — not touched.**

---

## 2. Public page generation survey

| Layer | Role today |
| --- | --- |
| **Wix HTML fixture** | `fixtures/gosaki-piano/discography.html` — crawled pass-through body |
| **Convert** | `convert-static-to-astro.mjs` → `discography/index.astro` |
| **G-15c hook (new)** | `loadGosakiDiscographyDataForBuild` + `patchGosakiDiscographyPurchaseUrls` in `supabase-discography-read.mjs` |
| **Build** | Astro static → `dist/discography/index.html` |
| **Package** | `static-public` → `manual-upload/.../public-dist/discography/index.html` |
| **Admin JSON** | `config/sites/gosaki-piano-discography.json` — **not** used by public build |
| **Supabase (pre-G-15c)** | admin read only; public Wix HTML unchanged |

**Chosen route (B):** At convert time, read staging Supabase `discography` (anon, read-only) and patch `purchase_url` links inside each Wix repeater item (matched by album `title`). Avoids one-off hand-editing `output/` and aligns public reflection with DB SoT for link fields.

**Not in scope:** full Discography CMS page regen, tracks CMS, cover images, INSERT/DELETE.

---

## 3. Local regen command

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Env source:** existing repo `.env` / `.env.local` (read-only — not modified).

**Pipeline executed:**

```txt
1. convert-static-to-astro.mjs  fixtures/gosaki-piano → output/gosaki-piano-astro
   Discography data: discographyDataSource=supabase (4 releases, 1 purchase_url patch)
2. verify-static-public-artifact.mjs  → PASS (safeForStaticFtp: true)
3. npm run manual-upload:package
4. npm run verify:manual-upload  → PASS
```

**Overall:** `G-11c4b package build: PASS`

---

## 4. Generation output

| Artifact | Path |
| --- | --- |
| Hook module | `scripts/lib/supabase-discography-read.mjs` |
| Astro project | `output/gosaki-piano-astro/` |
| Manual upload package | `output/manual-upload/gosaki-piano/` |
| Upload source HTML | `output/manual-upload/gosaki-piano/public-dist/discography/index.html` |

| Metric | Before regen | After regen |
| --- | --- | --- |
| **File count** | **27** | **27** |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | (unchanged) |
| **safeForStaticFtp** | `true` | **true** |

### CSS / JS hash (before vs after regen)

| Asset | Hash | Changed? |
| --- | --- | --- |
| CSS | `index.YcHrHZH4.css` | **no** |
| JS | `index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | **no** |

**Decision:** minimal upload = **1 HTML file only** — do **not** upload `_astro/` or full `public-dist/`.

### Regenerated file diff (scope note)

| File | Changed? | Note |
| --- | --- | --- |
| `public-dist/discography/index.html` | **yes** — SKYLARK shop URL | **upload target** |
| Other 26 files | content-equivalent for this change | **out of upload scope** |
| `_astro/*` | unchanged hash | **not needed** |

---

## 5. Discography HTML — SKYLARK reflection (local package)

**File:** `output/manual-upload/gosaki-piano/public-dist/discography/index.html`

| Check | Result |
| --- | --- |
| `discographyDataSource=supabase` | **PASS** |
| Page `gosakirikako.base.shop` count | **4** (href + text × Continuous + SKYLARK) |
| Page `gosaakiii.base.shop` count | **0** |
| SKYLARK repeater item has new URL | **PASS** |
| SKYLARK repeater item has old URL | **absent** |
| Continuous / About Us!! / Ja-Jaaaaan! titles | **present** (unchanged) |

**SKYLARK purchase link (local, excerpt):**

```html
<a href="https://gosakirikako.base.shop/" target="_self" rel="noreferrer noopener" class="wixui-rich-text__text">https://gosakirikako.base.shop/</a>
```

### PoC / audit markers — must be absent (local)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `PoC` | **absent** |
| `G-15` | **absent** |
| `dry-run` | **absent** |

**Note:** Wix HTML contains many `data-testid="..."` attributes. Verifier checks explicit audit strings above, not bare substring `test`.

---

## 6. Live staging (read-only, pre-upload)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`  
**HTTP:** **200**

| Check | Live (pre-upload) |
| --- | --- |
| `gosaakiii.base.shop` (page) | **2** (SKYLARK href + text) |
| `gosakirikako.base.shop` (page) | **2** (Continuous only) |
| SKYLARK item old URL | **present** (stale) |
| SKYLARK item new URL | **absent** |
| `discographyDataSource=supabase` | **absent** |

Expected until operator uploads local `discography/index.html`.

---

## 7. Upload scope decision

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
3. HTTP verify: SKYLARK section shows `https://gosakirikako.base.shop/`; `gosaakiii.base.shop` absent on page
4. Do **not** upload `_astro/` or full tree unless hash changes

**FTP auto-apply:** still **suspended** (`readyForAnyFutureFtpApply: false`). Manual upload only with explicit approval.

---

## 8. Implementation files (committed scope)

| File | Change |
| --- | --- |
| `scripts/lib/supabase-discography-read.mjs` | **new** — Supabase read + Wix HTML `purchase_url` patch |
| `scripts/convert-static-to-astro.mjs` | load discography bundle for Gosaki fixture |
| `scripts/lib/astro-generator.mjs` | apply patch on `/discography/` page generation |
| `docs/gosaki-discography-public-reflection-local-regen-and-upload-preflight.md` | **this doc** |
| `scripts/verify-g15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight.mjs` | verifier |

---

## 9. Forbidden operations (this phase)

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

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight.mjs
```

---

## 11. Next phase

**G-15c-upload** — operator manual upload `discography/index.html` ×1 + HTTP verify (separate explicit approval).
