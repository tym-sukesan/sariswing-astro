# Gosaki About HTML content public reflection package prep (G-10h5-1)

**Phase:** `G-10h5-1-gosaki-about-html-content-public-reflection-package-prep`  
**Status:** **complete** — local convert + build + manual-upload package verified; **no FTP / upload**  
**Date:** 2026-06-24  
**Prior:** G-10h4d bands Save (commit `c3b0d56`), G-10h4b profile Save (commit `e2d378a`)

| Check | Status |
| --- | --- |
| Source JSON markers (G-10h4b / G-10h4d) | **yes** |
| Convert + build | **yes** |
| Generated `about/index.astro` markers | **yes** |
| `public-dist/about/index.html` profile marker | **yes** |
| `public-dist/about/index.html` bands marker | **stripped by Astro build** (see §6) |
| Bands HTML content in public-dist | **yes** |
| Single `band-profiles` section | **yes** |
| `noindex` / `deployBase` | **yes** |
| `safeForStaticFtp: true` | **yes** |
| Manual-upload package | **yes** |
| FTP / FileZilla / upload | **no** |
| DB / Supabase write | **no** |
| Image file ops | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-about-bands-html-static-json-write-execution.md](./gosaki-about-bands-html-static-json-write-execution.md) (G-10h4d)
- [gosaki-about-profile-html-static-json-write-execution.md](./gosaki-about-profile-html-static-json-write-execution.md) (G-10h4b)
- [gosaki-about-html-content-seed-json-and-convert-hook.md](./gosaki-about-html-content-seed-json-and-convert-hook.md) (G-10h2)

**Verifier note:** Pre-execution JSON Save verifiers remain valid. Post-G-10h4d package prep uses `verify-g10h5-1-gosaki-about-html-content-public-reflection-package-prep.mjs`.

---

## Gates

```txt
gosakiAboutHtmlContentPublicReflectionPackagePrepComplete: true
phase: G-10h5-1
readyForG10h5_2GosakiAboutHtmlStagingManualUploadByOperator: true
bandsMarkerStrippedInPublicBuild: true
actualJsonWriteExecuted: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
cursorImageFileOpsExecuted: false
workflowDispatchExecuted: false
doNotReRunG10h4bRunScript: true
doNotReRunG10h4dRunScript: true
routineDevSaveEnv: G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED=false
```

---

## 1. Source JSON markers (commit `c3b0d56`)

| Block | Marker | Count |
| --- | --- | --- |
| `about-profile-html` | `<!-- G-10h4b profile save test -->` | 1 |
| `about-bands-html` | `<!-- G-10h4d bands save test -->` | 1 (tail) |

Cross-block isolation: profile has no G-10h4d marker; bands has no G-10h4b marker.

---

## 2. Local commands (executed)

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
cd /Users/toyamayusuke/sariswing-astro && npm run build
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g10h5-1-gosaki-about-html-content-public-reflection-package-prep.mjs
```

---

## 3. Generated Astro (`output/gosaki-piano-astro/src/pages/about/index.astro`)

| Check | Result |
| --- | --- |
| G-10h4b profile marker | **1** |
| G-10h4d bands marker | **1** |
| `BandProfilesSection` import | **absent** |
| `<BandProfilesSection />` | **absent** |
| `class="band-profiles"` sections | **1** |
| Bands content (e.g. ごさきりかこTrio) | **present** |

---

## 4. Public build (`public-dist/about/index.html`)

| Check | Result |
| --- | --- |
| File generated | **yes** |
| G-10h4b profile marker | **1** |
| G-10h4d bands marker | **0** (see §6) |
| Bands content reflected | **yes** |
| Single `band-profiles` | **yes** |
| `noindex,nofollow,noarchive` | **yes** |
| `deployBase` `/cms-kit-staging/gosaki-piano/` | **yes** |
| `safeForStaticFtp` | **true** |

---

## 5. Manual-upload package

| Path | Status |
| --- | --- |
| `output/manual-upload/gosaki-piano/public-dist/about/index.html` | **yes** |
| `README-UPLOAD.md` | **yes** |
| `CHECKLIST.md` | **yes** |
| `MANIFEST.json` | **yes** |
| `gosaki-piano-manual-upload.zip` | **yes** |
| `verify:manual-upload` | **PASS** (20 files) |

### Operator upload (G-10h5-2 — not executed in G-10h5-1)

**Upload source (local):**

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
```

**Upload target (remote):**

```txt
/cms-kit-staging/gosaki-piano/
```

**Rules:**

- Upload **contents** of `public-dist/` — **not** the `public-dist` folder itself
- Overwrite existing staging files only
- **No** mirror / sync / `--delete` / remote folder delete
- Confirm remote path is `/cms-kit-staging/gosaki-piano/` — **not** account root `/`
- See `README-UPLOAD.md` + `CHECKLIST.md` in package

**After upload — About QA:**

- `/about/` HTTP 200
- Profile section + Bands / Projects section visible
- No duplicate Bands / Projects blocks
- `noindex` maintained
- canonical / og:url use staging host

---

## 6. Bands marker build behavior (known)

The G-10h4d test comment is appended after the bands block `<style>` in JSON. Convert injects it into `about/index.astro` before `</BaseLayout>`. Astro build **strips** the HTML comment that immediately follows a page-level `<style>` block, so:

- **JSON + generated `.astro`:** marker present (Save path verified)
- **`public-dist/about/index.html`:** marker absent; **bands HTML content is still reflected**

Profile marker survives because it is embedded inside Wix profile HTML content, not after a page-level `<style>`.

**No re-Save in G-10h5-1.** Future optional fix: move test comment inside `<section class="band-profiles">` (separate phase).

---

## 7. Not executed (G-10h5-1)

- FTP / FileZilla / staging upload
- `workflow_dispatch`
- DB / Supabase write
- Image add / delete / move / overwrite
- G-10h4b / G-10h4d run script re-execution
- `.env` / `.env.local` edit
- commit / push (deferred to operator)

---

## 8. Next

| Phase | Goal |
| --- | --- |
| **G-10h5-2** | Operator manual upload from package + staging About QA |
| **G-10h5-3** | (optional) bands marker placement fix for public-dist traceability |

---

## 9. Changed files (G-10h5-1 — uncommitted)

- `tools/static-to-astro/docs/gosaki-about-html-content-public-reflection-package-prep.md` (this doc)
- `tools/static-to-astro/scripts/verify-g10h5-1-gosaki-about-html-content-public-reflection-package-prep.mjs` (new)
- AI context docs
- Local output (gitignored): `output/gosaki-piano-astro/`, `output/static-public/`, `output/manual-upload/`
