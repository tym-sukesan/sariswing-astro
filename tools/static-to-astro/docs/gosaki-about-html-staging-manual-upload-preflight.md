# Gosaki About HTML staging manual upload preflight (G-10h5-2)

**Phase:** `G-10h5-2-gosaki-about-html-staging-manual-upload-preflight`  
**Status:** **complete** — package verified; Operator may proceed with FileZilla manual upload  
**Date:** 2026-06-24  
**Prior:** G-10h5-1 package prep (commit `f427f9c`); G-10h4d bands Save (`c3b0d56`); G-10h4b profile Save (`e2d378a`)

| Check | Status |
| --- | --- |
| Package exists locally | **yes** |
| About profile in package | **yes** |
| Bands / Projects in package | **yes** |
| Single `band-profiles` section | **yes** |
| `noindex` / `deployBase` | **yes** |
| `safeForStaticFtp: true` | **yes** |
| Operator manual upload | **pending** (Operator only) |
| Cursor FTP / FileZilla / upload | **no** |

Prior docs:

- [gosaki-about-html-content-public-reflection-package-prep.md](./gosaki-about-html-content-public-reflection-package-prep.md) (G-10h5-1)
- [gosaki-manual-staging-upload-package.md](./gosaki-manual-staging-upload-package.md) (G-7g)
- [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) (G-7f1)

**Do not re-run G-10h4b / G-10h4d run scripts. Do not re-Save About JSON.**

---

## Gates

```txt
gosakiAboutHtmlStagingManualUploadPreflightComplete: true
phase: G-10h5-2
readyForOperatorGosakiAboutHtmlStagingManualUpload: true
gosakiAboutHtmlStagingManualUploadExecuted: false
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
cursorDeployExecuted: false
cursorDbWriteExecuted: false
cursorImageFileOpsExecuted: false
doNotReRunG10h4bRunScript: true
doNotReRunG10h4dRunScript: true
```

---

## A. Upload preflight (G-10h5-2 — complete)

| # | Check | Result |
| --- | --- | --- |
| 1 | `git status --short` clean | **yes** (`HEAD = origin/main = f427f9c`) |
| 2 | Package exists | **yes** `output/manual-upload/gosaki-piano/` |
| 3 | `public-dist/about/index.html` exists | **yes** |
| 4 | Profile content (後藤 沙紀) | **yes** |
| 5 | G-10h4b profile marker in package about | **1** |
| 6 | Bands content (ごさきりかこTrio) | **yes** |
| 7 | G-10h4d bands marker in package about | **0** (expected — Astro build strip; bands body OK) |
| 8 | Single `band-profiles` section | **yes** (count = 1) |
| 9 | `noindex,nofollow,noarchive` | **yes** |
| 10 | `deployBase` `/cms-kit-staging/gosaki-piano/` | **yes** |
| 11 | `safeForStaticFtp` | **true** |
| 12 | `verify:manual-upload` | **PASS** (20 files) |
| 13 | G-10h5-1 verifier | **PASS** (38/38) |
| 14 | FTP / workflow_dispatch / deploy | **not executed** |

**Verifier:**

```bash
node tools/static-to-astro/scripts/verify-g10h5-2-gosaki-about-html-staging-manual-upload-preflight.mjs
```

---

## B. Operator FileZilla checklist (one screen)

### Paths

| | Path |
| --- | --- |
| **Local upload source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Remote destination** | `cms-kit-staging/gosaki-piano/` (server: `/cms-kit-staging/gosaki-piano/`) |
| **Staging URL (after upload)** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Before upload

- [ ] FTP host / credentials correct (FileZilla or Lolipop FTP)
- [ ] Remote pane: navigate to **`/cms-kit-staging/gosaki-piano/`** — **NOT** account root `/`
- [ ] Local pane: open `…/output/manual-upload/gosaki-piano/public-dist/`
- [ ] Select **contents** of `public-dist/` — **not** the `public-dist` folder itself
- [ ] **No** mirror / sync / delete-remote-extras / `--delete`
- [ ] Overwrite existing staging files only — **no** remote folder delete
- [ ] Do not delete unrelated remote folders

### Upload action

- Upload selected files/folders from local `public-dist/` **contents** into remote `/cms-kit-staging/gosaki-piano/`
- Expected remote layout: `/cms-kit-staging/gosaki-piano/about/index.html` (not `…/public-dist/about/…`)

### After upload — URL QA

| URL | Check |
| --- | --- |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | HTTP 200, noindex |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/` | HTTP 200, noindex |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/` | HTTP 200 |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/` | HTTP 200 |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt` | HTTP 200 |

### After upload — About page QA

- [ ] Profile section visible (後藤 沙紀 bio)
- [ ] **Bands / Projects** section visible (ごさきりかこTrio 等)
- [ ] **No duplicate** Bands / Projects blocks
- [ ] canonical / og:url use staging host (`yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`)
- [ ] Nav Home → staging path under `/cms-kit-staging/gosaki-piano/`

**Note:** G-10h4d bands HTML comment marker may not appear in built HTML; verify **bands body content**, not comment marker.

### If something looks wrong

- Stop immediately
- Do not retry with mirror/delete
- Do not clean up remote root
- Record what you see and ask before further changes

---

## C. Package README / CHECKLIST

Package `README-UPLOAD.md` and `CHECKLIST.md` already document:

- Upload source: `public-dist/` contents
- Upload target: `/cms-kit-staging/gosaki-piano/`
- No `public-dist` folder on server
- Mirror / delete-remote-extras forbidden
- Overwrite-only upload
- Post-upload URL checks including `/about/`

**No package regeneration in G-10h5-2** — G-10h5-1 package reused as-is.

---

## D. Operator approval form (execution phase only)

When ready to upload, Operator may use:

```txt
承認します。G-10h5-2 Gosaki About HTML staging manual upload として、tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/ の中身のみを、preview path /cms-kit-staging/gosaki-piano/ に手動アップロードします。本番公開ルート、gosaki-piano.com本番、Sariswing本番には触りません。削除・mirror・sync delete は行いません。
```

Approval ID: `G-10h5-2-gosaki-about-html-staging-manual-upload`

---

## E. Not executed (G-10h5-2)

- FTP / FileZilla / staging upload
- `workflow_dispatch`
- DB / Supabase write
- Image add / delete / move / overwrite
- G-10h4b / G-10h4d run script re-execution
- About JSON re-Save
- Package regeneration
- commit / push (deferred)

---

## F. Next

| Phase | Goal |
| --- | --- |
| **G-10h5-2a** | Operator manual upload + staging About QA finalization |

---

## G. Changed files (G-10h5-2 — uncommitted)

- `tools/static-to-astro/docs/gosaki-about-html-staging-manual-upload-preflight.md` (this doc)
- `tools/static-to-astro/scripts/verify-g10h5-2-gosaki-about-html-staging-manual-upload-preflight.mjs` (new)
- AI context docs
