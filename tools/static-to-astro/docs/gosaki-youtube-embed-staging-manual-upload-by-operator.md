# Gosaki YouTube embed staging manual upload by operator (G-10d2)

**Phase:** `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator`  
**Status:** **preflight complete** — operator checklist + post-upload QA plan ready; **staging upload not executed by Cursor**  
**Date:** 2026-06-23  
**Prior:** G-10d1 package prep (commit `17fd5ec`); G-10c2 YouTube JSON Save; G-10d local HTML verified

| Check | Status |
| --- | --- |
| Package exists locally | **yes** |
| YouTube embed in package home | **yes** |
| `verify-g10d1` / `verify:manual-upload` | **PASS** (G-10d1) |
| Operator upload procedure documented | **yes** |
| Post-upload QA checklist documented | **yes** |
| Cursor FTP / upload / delete | **no** |
| Staging upload executed | **pending operator** |

Prior docs:

- [gosaki-youtube-embed-manual-upload-package-prep.md](./gosaki-youtube-embed-manual-upload-package-prep.md) (G-10d1)
- [gosaki-manual-preview-upload-planning.md](./gosaki-manual-preview-upload-planning.md) (G-9d2 baseline)
- [ftp-deploy-root-delete-incident-and-safety-hardening.md](./ftp-deploy-root-delete-incident-and-safety-hardening.md) (G-7f1)

---

## Gates

```txt
gosakiYoutubeEmbedStagingManualUploadPreflightComplete: true
gosakiYoutubeEmbedStagingManualUploadExecuted: false
phase: G-10d2
readyForOperatorGosakiYoutubeEmbedStagingManualUpload: true
readyForG10d2aStagingUploadQaFinalization: false
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
cursorClickedSave: false
```

**Do not re-click G-10c Save.**

**Next after operator upload + QA report:** `G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization`

---

## A. Upload preflight (G-10d2 — complete)

| # | Check | Result |
| --- | --- | --- |
| 1 | `git status --short` clean | **yes** (`HEAD = origin/main = 17fd5ec`) |
| 2 | Package exists | **yes** `output/manual-upload/gosaki-piano/` |
| 3 | `public-dist/index.html` exists | **yes** |
| 4 | `youtube-nocookie.com/embed/Ke4F8JAQz-I` in package home | **yes** |
| 5 | `.gosaki-youtube-embed` in package home | **yes** |
| 6 | `noindex` meta in package home | **yes** |
| 7 | Contents are staging upload source | **yes** (20 files, no admin/api) |
| 8 | `deployBase` | `/cms-kit-staging/gosaki-piano/` |
| 9 | `safeForStaticFtp` | **true** |
| 10 | FTP auto-deploy / workflow_dispatch / deploy | **not executed** |

**Verifier:** `node tools/static-to-astro/scripts/verify-g10d2-gosaki-youtube-embed-staging-manual-upload-by-operator-preflight.mjs`

---

## B. Operator FileZilla checklist (one screen)

Copy this checklist. Complete **top to bottom** before and during upload.

### Paths

| | Path |
| --- | --- |
| **Local upload source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Remote destination** | `cms-kit-staging/gosaki-piano/` (server path: `/cms-kit-staging/gosaki-piano/`) |
| **Staging URL (after upload)** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Upload rule

Upload **`public-dist/` の中身** — not the `public-dist` folder itself.

Correct on server:

```txt
/cms-kit-staging/gosaki-piano/index.html
/cms-kit-staging/gosaki-piano/about/
/cms-kit-staging/gosaki-piano/_astro/
...
```

Wrong:

```txt
/cms-kit-staging/gosaki-piano/public-dist/index.html   ← NO
```

### Before FTP

- [ ] Local package verified: `npm run verify:manual-upload` → PASS (or G-10d1 verifier PASS)
- [ ] Open `output/manual-upload/gosaki-piano/README-UPLOAD.md` + `CHECKLIST.md`
- [ ] FTP client: **mirror / sync / sync-delete / delete-remote-extras = OFF**
- [ ] Record operator approval (section below) before connecting

### During FTP (FileZilla / ロリポップFTP)

1. Connect with operator credentials (Cursor does **not** connect).
2. Remote pane: navigate to **`cms-kit-staging/gosaki-piano/`** — **confirm NOT account root `/`**.
3. Local pane: open `…/output/manual-upload/gosaki-piano/public-dist/`.
4. Select **all files and subfolders inside `public-dist/`** (index.html, about/, _astro/, schedule/, …).
5. Upload to remote `gosaki-piano/` — **overwrite existing files OK**.
6. **Do not** delete remote files first. **Do not** empty remote folder. **Do not** use sync/mirror.

### Allowed

- File **overwrite** upload within `/cms-kit-staging/gosaki-piano/` only

### Forbidden

- Delete remote files or folders
- Sync / mirror / `--delete` / delete-remote-extras
- Upload to `/`, production root, or paths outside `cms-kit-staging/gosaki-piano/`
- FTP auto-deploy scripts (`deploy-public-dist-ftp.mjs --apply`)
- `workflow_dispatch` deploy
- Remote cleanup / “整理” of unrelated files

### Operator approval (required — copy and send before upload)

```txt
承認します。G-10d2 Gosaki YouTube embed staging manual upload として、tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/ の中身のみを、preview path /cms-kit-staging/gosaki-piano/ に手動アップロードします。本番公開ルート、gosaki-piano.com本番、Sariswing本番には触りません。削除・mirror・sync delete は行いません。
```

Approval ID: `G-10d2-gosaki-youtube-embed-staging-manual-upload`

---

## C. Post-upload staging QA (operator reports completion → then verify)

After operator confirms upload finished, check staging in a browser.

### URLs

| Page | URL |
| --- | --- |
| Home | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| About | `…/about/` |
| Schedule hub | `…/schedule/` |
| Contact | `…/contact/` |

### QA checklist

- [ ] **1.** Top page loads (HTTP 200, no fatal error page)
- [ ] **2.** YouTube section visible on home (heading “YouTube” or `.gosaki-youtube-embed`)
- [ ] **3.** iframe `src` contains `youtube-nocookie.com/embed/Ke4F8JAQz-I`
- [ ] **4.** Layout not severely broken (header, schedule block, footer readable)
- [ ] **5.** Navigation works (Home, About, Schedule, Contact links)
- [ ] **6.** About / Schedule / Contact pages open (HTTP 200)
- [ ] **7.** `noindex` maintained (View Source or DevTools → `<meta name="robots" content="noindex…">`)

### DevTools quick check (home)

1. Open `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
2. **View Page Source** or **Elements** tab → search (`Cmd+F` / `Ctrl+F`):
   - `youtube-nocookie.com/embed/Ke4F8JAQz-I` → **found**
   - `gosaki-youtube-embed` → **found**
3. Optional: Network tab → `index.html` → 200; `_astro/*.css` → 200

### If QA fails

- **Stop** — do not retry with mirror/delete/sync
- Do not clean up remote root
- Record URL, screenshot, and what differs from local package
- Ask before further FTP changes (G-7f1 failure behavior)

---

## D. Go / No-Go (preflight)

| Decision | Status |
| --- | --- |
| **Operator may proceed with manual upload** | **GO** |
| Conditions | Package verified; paths scoped; approval recorded; mirror/delete OFF |
| Cursor executes upload | **NO** — operator only |

---

## E. Not executed (G-10d2 preflight phase)

- FTP connection / upload / delete
- `lftp` / `mirror` / `--delete` / `rsync` / `scp` / `sftp`
- `deploy` / `workflow_dispatch`
- Staging upload (operator pending)
- Save / JSON write / DB write by Cursor
- `src/pages/admin` changes

---

## F. Package reference (G-10d1)

```json
{
  "deployBase": "/cms-kit-staging/gosaki-piano/",
  "stagingUrl": "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/",
  "fileCount": 20,
  "safeForStaticFtp": true,
  "ftpAutoDeployUsed": false
}
```

YouTube target: `videoId` `Ke4F8JAQz-I` — `yt-placeholder-01` in `gosaki-piano-youtube-embed.json`.
