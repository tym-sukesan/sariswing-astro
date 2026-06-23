# Gosaki About HTML content seed JSON + convert hook (G-10h2)

**Phase:** `G-10h2-gosaki-about-html-content-seed-json-and-convert-hook`  
**Status:** **complete** — seed JSON + convert hook + local convert/build/package verified; **no admin UI / no Save / no FTP**  
**Date:** 2026-06-23  
**Prior:** G-10h1 preflight (commit `a02eb87`)

| Check | Status |
| --- | --- |
| Seed JSON created | **yes** |
| Convert hook implemented | **yes** |
| Local convert + build | **PASS** |
| `safeForStaticFtp` | **true** |
| Admin About page | **no** (G-10h3) |
| Static JSON write API | **no** (G-10h4) |
| Image file mutation | **no** |
| JSON write API / Save | **no** |
| FTP / deploy | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-html-content-cms-implementation-preflight.md](./gosaki-about-html-content-cms-implementation-preflight.md) (G-10h1)
- [gosaki-about-html-content-cms-planning.md](./gosaki-about-html-content-cms-planning.md) (G-10h)

---

## Gates

```txt
gosakiAboutHtmlContentSeedJsonAndConvertHookComplete: true
phase: G-10h2
readyForG10h3GosakiAboutHtmlContentAdminUi: false
configJsonFileCreated: true
convertHookImplemented: true
adminAboutPageImplemented: false
staticJsonWriteImplemented: false
cursorAdminSaveImplemented: false
cursorJsonWriteExecuted: false
cursorDbWriteExecuted: false
cursorImageFileMutationExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
workflowDispatchExecuted: false
```

G-10h3 admin read-only preview: see [gosaki-about-html-content-admin-readonly-preview.md](./gosaki-about-html-content-admin-readonly-preview.md).

---

## 1. Seed JSON

**Path:** `tools/static-to-astro/config/sites/gosaki-piano-about-content.json`

| Field | Value |
| --- | --- |
| `siteSlug` | `gosaki-piano` |
| `page` | `about` |
| `version` | `1` |
| `previewPath` | `about/` |
| Max per-block `html` | 100,000 chars |
| Max total | 200,000 chars |

### Blocks

| id | enabled | seed source | html length (approx) |
| --- | --- | --- | --- |
| `about-profile-html` | `true` | `fixtures/gosaki-piano/about.html` → `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]` inner | ~3,816 |
| `about-bands-html` | `true` | `BandProfilesSection.astro` markup + styles from `gosaki-piano-band-profiles.json` | ~7,717 |

**Safety:** no `<script>`, `<iframe>`, `on*` handlers, or `javascript:` URLs in seed HTML.

---

## 2. Profile block extraction

**Anchor:** `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]` inner HTML only.

**Includes:** About heading (`WRchTxt16`), biography (`comp-jrqh3smr`), portrait (`comp-jrtenw0n`).

**Excludes:** section wrapper, BaseLayout, nav, footer.

---

## 3. Bands block seed

Static HTML equivalent of G-8a `BandProfilesSection`:

- `<section class="band-profiles">` with 5 band cards
- Placeholder `Photo` div per band (no image files added)
- Inline `<style>` from `BandProfilesSection.astro` for visual parity
- Image paths ready for later: `/images/bands/{band-id}.jpg`

---

## 4. Convert hook

**Module:** `tools/static-to-astro/scripts/lib/gosaki-about-content.mjs`

**Orchestration:** `astro-generator.mjs` — after `applyGosakiAboutBandProfiles()`, before `applyGosakiHomeYouTubeEmbed()`.

**Scope:** `gosaki-piano` fixture → `src/pages/about/index.astro` only.

| Block state | Behavior |
| --- | --- |
| Config missing | no-op (Wix + G-8a fallback) |
| `enabled: false` | skip block |
| `html: ""` | skip block |
| enabled + non-empty | replace profile grid inner / replace `<BandProfilesSection />` |
| Profile anchor missing when block active | **fail-fast** (convert abort) |

**Output copy:** `src/data/gosaki-about-content.json` in generated astro tree.

---

## 5. Local verification

### Commands

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run manual-upload:package
npm run verify:manual-upload
```

Repo root:

```bash
cd /Users/toyamayusuke/sariswing-astro
npm run build
```

### Results

| Check | Result |
| --- | --- |
| `about/index.astro` profile HTML from JSON | **PASS** |
| `about/index.astro` bands HTML from JSON | **PASS** |
| No `BandProfilesSection` import/component | **PASS** |
| Single `band-profiles` section | **PASS** |
| `public-dist/about/index.html` | **PASS** |
| `noindex` maintained | **PASS** |
| `deployBase` `/cms-kit-staging/gosaki-piano/` | **PASS** |
| `safeForStaticFtp: true` | **PASS** |
| Manual-upload package includes `about/index.html` | **PASS** |
| Repo root `npm run build` | **PASS** |

---

## 6. Fallback verification

Unit-tested in `verify-g10h2-*.mjs` via `applyAboutContentToPage()`:

| Case | Result |
| --- | --- |
| Empty `html` on both blocks | Keeps `BandProfilesSection` + original profile inner |
| `enabled: false` | Keeps fallback |
| enabled + non-empty | Profile inner replaced; component removed |

**Not re-run:** full convert with config file removed (documented no-op in hook).

---

## 7. Not executed (G-10h2)

- Staging admin About UI (`G-10h3`)
- Static JSON write API / Save (`G-10h4`)
- Image add / delete / move / overwrite
- JSON write via API / Save click
- DB write / Supabase update
- FTP / deploy / `workflow_dispatch`
- `src/pages/admin` changes

---

## 8. Next phases

| Phase | Scope |
| --- | --- |
| **G-10h3** | Staging admin About UI — **complete** → [gosaki-about-html-content-admin-readonly-preview.md](./gosaki-about-html-content-admin-readonly-preview.md) |
| **G-10h4** | Static JSON write slice — profile block first |
| **G-10h4b** | Bands block write + optional band JPG drop |
| **G-10h5** | Package verify + operator re-upload |

---

## 9. Changed files (G-10h2)

| File | Change |
| --- | --- |
| `config/sites/gosaki-piano-about-content.json` | **new** — seed JSON |
| `scripts/lib/gosaki-about-content.mjs` | **new** — convert hook |
| `scripts/lib/astro-generator.mjs` | call hook after G-8a |
| `scripts/verify-g10h2-gosaki-about-html-content-seed-json-and-convert-hook.mjs` | **new** |
| `docs/gosaki-about-html-content-seed-json-and-convert-hook.md` | **new** |
| `docs/ai/00-current-state.md` | updated |
| `docs/ai/03-next-actions.md` | updated |
| `docs/ai/handoff-to-chatgpt.md` | updated |
