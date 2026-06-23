# Gosaki YouTube embed manual upload package prep (G-10d1)

**Phase:** `G-10d1-gosaki-youtube-embed-manual-upload-package-prep`  
**Status:** **complete** — local manual-upload package generated and verified; **staging upload not executed**  
**Date:** 2026-06-23  
**Prior:** G-10d public reflection verified (commit `c489315`); G-10c2 JSON Save (`5d5b1f1`)

| Check | Status |
| --- | --- |
| Manual-upload package generated | **yes** (local only) |
| Package includes YouTube embed on home | **yes** |
| `verify:manual-upload` | **PASS** |
| `safeForStaticFtp` | **true** |
| FTP / deploy / workflow_dispatch | **not executed** |
| Staging manual upload | **not executed** |
| Cursor Save / JSON write / DB write | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-embed-public-reflection-verification.md](./gosaki-youtube-embed-public-reflection-verification.md) (G-10d)
- [gosaki-manual-staging-upload-package.md](./gosaki-manual-staging-upload-package.md) (G-7g baseline)

---

## Gates

```txt
gosakiYoutubeEmbedManualUploadPackagePrepComplete: true
phase: G-10d1
readyForGosakiYoutubeEmbedStagingManualUploadByOperator: true
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorClickedSave: false
cursorExecutedJsonWrite: false
```

**Do not re-click G-10c Save.**

---

## 1. Manual-upload package flow (confirmed)

```txt
fixtures/gosaki-piano
  ↓ convert + build (--verify-build)
output/gosaki-piano-astro/dist/
  ↓ verify-static-public-artifact.mjs (copies to public-dist, writes manifest)
output/static-public/gosaki-piano/public-dist/
  ↓ npm run manual-upload:package (local copy + zip + operator docs — NO FTP)
output/manual-upload/gosaki-piano/
  ├── public-dist/          ← operator uploads **contents** of this folder
  ├── README-UPLOAD.md
  ├── CHECKLIST.md
  ├── MANIFEST.json
  └── gosaki-piano-manual-upload.zip
```

**Scripts (no network / no FTP):**

| Step | Command |
| --- | --- |
| Convert + build | `node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro --base-url … --deploy-base … --site-profile musician --verify-build` |
| Static-public | `node scripts/verify-static-public-artifact.mjs --astro-dir tools/static-to-astro/output/gosaki-piano-astro --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` |
| Package | `npm run manual-upload:package` |
| Verify package | `npm run verify:manual-upload` |

`create-manual-upload-package.mjs` / `manual-upload-package.mjs`: **local `fs.cpSync` + `zip` only** — no `ftp`, `lftp`, `mirror`, `--delete`, `rsync`, `deploy`, or `workflow_dispatch`.

---

## 2. Commands executed (G-10d1)

From repo root / `tools/static-to-astro`:

```bash
# Re-convert after BaseLayout inject fix (see §5)
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

**Not executed:** FTP, deploy, workflow_dispatch, staging upload, `manual-upload:package` with any remote step.

---

## 3. Package output

| Item | Value |
| --- | --- |
| **Package directory** | `tools/static-to-astro/output/manual-upload/gosaki-piano/` (gitignored) |
| **Upload source (local)** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Zip** | `gosaki-piano-manual-upload.zip` |
| **fileCount** | **20** |
| **safeForStaticFtp** | **true** |
| **ftpAutoDeployUsed** | **false** |

---

## 4. Staging target (operator — not executed in G-10d1)

| Item | Value |
| --- | --- |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **Remote FTP path** | `/cms-kit-staging/gosaki-piano/` |
| **Upload rule** | Upload **contents** of `public-dist/` — not the `public-dist` folder itself |

---

## 5. Package contents verification

### 5.1 Home YouTube embed

**File:** `public-dist/index.html`

| Check | Result |
| --- | --- |
| `.gosaki-youtube-embed` | **yes** |
| `youtube-nocookie.com/embed/Ke4F8JAQz-I` | **yes** |
| `noindex` meta | **yes** |
| Staging canonical / og:url | **yes** (`yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`) |

### 5.2 Other required assets (sample)

| Path | Present |
| --- | --- |
| `index.html` | yes |
| `_astro/index.BLo1v8SX.css` | yes |
| `robots.txt` | yes |
| `sitemap-index.xml` / `sitemap-0.xml` | yes |
| `about/`, `contact/`, `discography/`, `link/` | yes |
| `schedule/` hub + `schedule/2026-XX/` | yes |
| Legacy stubs `2026-03/` … `2026-07/` | yes |

---

## 6. Blocker fixed during package prep

`injectYouTubeEmbedIntoHomePage()` passed the entire page body (including `<BaseLayout>`) through cheerio, corrupting Astro component syntax and breaking `noindex` / nav checks.

**Fix:** `splitBaseLayoutOpenAndInner()` — cheerio runs only on inner Wix HTML; `<BaseLayout>` wrapper preserved.

File: `scripts/lib/gosaki-home-youtube-embed.mjs`

After fix: `safeForStaticFtp: true`, `verify:manual-upload` PASS.

---

## 7. Operator manual upload checklist (G-10d2 — not executed)

### Before upload

- [ ] Confirm local package: `npm run verify:manual-upload` → PASS
- [ ] Open `output/manual-upload/gosaki-piano/README-UPLOAD.md` and `CHECKLIST.md`
- [ ] FTP to Lolipop — navigate to **`/cms-kit-staging/gosaki-piano/`** (not account root `/`)
- [ ] Select **contents** of local `public-dist/` (not the folder itself)
- [ ] **Do not** use mirror / sync / delete-remote-extras / `--delete`
- [ ] Overwrite existing files in scoped path only — no remote cleanup

### After upload — verify

- [ ] `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` HTTP 200
- [ ] Home page shows YouTube section with `Ke4F8JAQz-I` embed
- [ ] `noindex` on HTML pages
- [ ] Nav / schedule / discography spot-check HTTP 200

### Explicit approval required (G-7f1)

Operator must use documented approval form before any FTP upload. FTP auto-apply remains **suspended** (`readyForAnyFutureFtpApply: false`).

---

## 8. Next phase

| Phase | Goal |
| --- | --- |
| **G-10d2** | `gosaki-youtube-embed-staging-manual-upload-by-operator` — operator FTP upload + staging browser QA (YouTube embed on live staging) |

---

## 9. Safety

- No FTP connection / upload / mirror / delete in G-10d1
- No deploy / workflow_dispatch
- No Save / JSON write / DB write by Cursor
- `src/pages/admin` unchanged
- Sariswing production untouched
