# Gosaki manual preview upload planning (G-9d2)

**Phase:** `G-9d2-gosaki-manual-preview-upload-planning`  
**Date:** 2026-06-17  
**Prior:** G-9d1 commit `821caa0`  
**Type:** operator checklist / planning only — **no FTP execution in this phase**

---

## 1. Background

G-9d / G-9d1 completed Gosaki schedule Supabase read + static fallback and generated a verified manual-upload preview package.

| Item | Status |
| --- | --- |
| Package | `output/manual-upload/gosaki-piano/` (gitignored) |
| `verify:manual-upload` | PASS (`safeForStaticFtp: true`, 20 files) |
| FTP auto-deploy | **disabled** (G-7f incident — see `ftp-deploy-root-delete-incident-and-safety-hardening.md`) |
| Next | Operator manual preview upload to scoped staging path |

This document is the **execution checklist** for G-9d2 upload. Cursor/AI must **not** connect to FTP or upload in the planning phase.

---

## 2. Source path

| Item | Path |
| --- | --- |
| **Upload source (local)** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Package root** | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| **Zip (optional reference)** | `gosaki-piano-manual-upload.zip` (do not unzip on server) |

**Upload rule:** Upload the **contents** of `public-dist/` — **not** the `public-dist` folder itself.

### Expected local files (G-9d1 verified)

```txt
public-dist/
├── index.html
├── about/index.html
├── contact/index.html
├── discography/index.html
├── link/index.html
├── schedule/
│   ├── index.html
│   ├── 2026-03/index.html
│   ├── 2026-04/index.html
│   ├── 2026-05/index.html
│   ├── 2026-06/index.html
│   └── 2026-07/index.html
├── 2026-03/index.html   (legacy stub)
├── 2026-04/index.html   (legacy stub)
├── 2026-05/index.html   (legacy stub)
├── 2026-06/index.html   (legacy stub)
├── 2026-07/index.html   (legacy stub)
├── _astro/index.*.css
├── robots.txt
├── sitemap-0.xml
└── sitemap-index.xml
```

Regenerate if missing:

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

---

## 3. Destination path

| Item | Value |
| --- | --- |
| **Remote FTP path** | `/cms-kit-staging/gosaki-piano/` |
| **Preview URL base** | `https://<preview-host>/cms-kit-staging/gosaki-piano/` |
| **Known staging host (operator)** | `yskcreate.weblike.jp` → `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Scope limits (mandatory)

```txt
✓ Upload only to /cms-kit-staging/gosaki-piano/
✗ Do NOT upload to FTP account root /
✗ Do NOT upload to gosaki-piano.com production public root
✗ Do NOT upload to Sariswing production paths
✗ Do NOT upload outside cms-kit-staging/
```

---

## 4. Upload targets

### Upload (overwrite OK within preview path)

| Path on server | Purpose |
| --- | --- |
| `index.html` | Home |
| `about/`, `contact/`, `discography/`, `link/` | Static pages |
| `schedule/` | **New** canonical schedule hub + month pages |
| `2026-03/` … `2026-07/` | Legacy month stubs (noindex) |
| `_astro/` | CSS bundle (required for layout) |
| `robots.txt` | Staging robots |
| `sitemap-0.xml`, `sitemap-index.xml` | Canonical schedule routes in sitemap |

### Do NOT upload

| Item | Reason |
| --- | --- |
| `public-dist/` folder itself | Wrong layout on server |
| `.env`, credentials, FTP config | Secrets |
| `src/`, `node_modules/`, Astro project | Not static export |
| `/admin` paths | Not in package; must not be added |
| Anything outside `public-dist/` contents | Scope violation |

### Do NOT delete

| Item | Reason |
| --- | --- |
| FTP account root `/` files/folders | G-7f incident risk |
| Sibling paths (`/cms-kit-staging/other-site/`, `/sari/`, etc.) | Out of scope |
| Remote folders not in local package | No mirror-delete |
| `.ftpaccess` | Do not edit or delete |

---

## 5. FTP safety rules

From G-7f1 hardening — operator must follow:

```txt
1. Confirm remote path is /cms-kit-staging/gosaki-piano/ BEFORE upload (pwd / path bar)
2. FileZilla: disable "Delete remote files not on local" / mirror / sync-delete
3. No lftp mirror --delete, no deploy-public-dist-ftp.mjs --apply
4. No workflow_dispatch deploy
5. Upload = overwrite files in preview path only; no bulk remote cleanup
6. If cd to destination fails → STOP (do not upload to parent or root)
7. If outcome unclear → STOP, record incident, ask human (G-7f1 failure behavior)
```

---

## 6. Operator approval (required before upload)

Operator must send explicit approval. Vague OK is **not** sufficient.

```txt
承認します。G-9d2 manual preview upload として、output/manual-upload/gosaki-piano/public-dist/ の中身のみを、preview path /cms-kit-staging/gosaki-piano/ に手動アップロードします。本番公開ルート、gosaki-piano.com本番、Sariswing本番には触りません。削除・mirror・sync delete は行いません。
```

Record approval ID: `G-9d2-gosaki-manual-preview-upload`

---

## 7. Pre-upload checklist

Operator completes **before** connecting to FTP:

- [ ] Git `working tree clean` (or note local-only output changes)
- [ ] Latest relevant commit ≥ `821caa0` (G-9d1)
- [ ] `output/manual-upload/gosaki-piano/public-dist/` exists locally
- [ ] `npm run verify:manual-upload` → PASS
- [ ] `public-dist/` contains: `index.html`, `schedule/`, `_astro/`, `robots.txt`, `sitemap-index.xml`
- [ ] `schedule/2026-03/` … `schedule/2026-07/` present (5 month pages + hub)
- [ ] Legacy stubs `2026-03/` … `2026-07/` present at public-dist root
- [ ] Destination confirmed: `/cms-kit-staging/gosaki-piano/` (not `/`, not production)
- [ ] FTP client: mirror / sync-delete / delete-remote-extras = **OFF**
- [ ] Operator approval text recorded (section 6)
- [ ] No Cursor/CI automated FTP — operator hands only

---

## 8. Upload procedure (operator)

1. Open FTP client (FileZilla / Lolipop FTP).
2. Navigate remote side to **`/cms-kit-staging/gosaki-piano/`**.
3. **Verify path** — must NOT be account root `/`.
4. Select local folder: `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/`.
5. Upload **all contents** (files + subfolders) into remote `/cms-kit-staging/gosaki-piano/`.
6. Ensure `_astro/` uploaded (CSS required).
7. Ensure `schedule/` tree uploaded (new G-9d routes).
8. Do **not** delete remote files missing from local package.
9. Note upload timestamp for result doc (G-9d2 execution phase).

---

## 9. Post-upload verification URLs

Replace `<preview-host>` with actual host (e.g. `yskcreate.weblike.jp`).

| URL | Expected |
| --- | --- |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/` | HTTP 200, layout + CSS |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/schedule/` | Hub with 2026-03〜2026-07 links |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/schedule/2026-07/` | 14 schedule events, `会場` text |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/2026-07/` | Legacy stub, noindex |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/robots.txt` | HTTP 200 |
| `https://<preview-host>/cms-kit-staging/gosaki-piano/sitemap-index.xml` | HTTP 200 |

### Schedule page checks

- [ ] `/schedule/` — links to `/schedule/2026-03/` … `/schedule/2026-07/` (canonical, with deployBase)
- [ ] `/schedule/2026-07/` — **14** event cards; `scheduleDataSource=static-fallback` in HTML comment (expected for G-9d1 package)
- [ ] `/schedule/2026-07/` — canonical = `https://<preview-host>/cms-kit-staging/gosaki-piano/schedule/2026-07/`

### Legacy stub checks

- [ ] `/2026-07/` — `noindex` in meta robots
- [ ] `/2026-07/` — canonical points to `/schedule/2026-07/`
- [ ] `/2026-07/` — thin stub (no full event card list)

### Sitemap / robots checks

- [ ] `sitemap-0.xml` includes `/schedule/2026-07/` (canonical)
- [ ] `sitemap-0.xml` does **not** include bare `/2026-07/` (legacy excluded)
- [ ] `robots.txt` present; staging noindex policy unchanged

### Success criteria

```txt
All primary routes HTTP 200
Schedule hub + 5 month pages render with CSS
Month counts match G-9d1: 13/10/12/11/14
Legacy stubs + sitemap canonical policy intact
No upload to wrong path detected
```

---

## 10. Stop conditions

**STOP immediately** if:

```txt
- Remote path is / or wrong directory
- cd /cms-kit-staging/gosaki-piano/ fails
- FTP client prompts to delete remote files / sync-delete
- Files appear at account root instead of cms-kit-staging
- Production domain (gosaki-piano.com) affected
- Outcome unclear after upload
- Unexpected mass deletion observed
```

On stop: do not retry, do not cleanup remotely, record incident, ask human (G-7f1).

---

## 11. Rollback policy

```txt
Rollback targets preview path /cms-kit-staging/gosaki-piano/ ONLY.
Operator performs manual rollback after visual confirmation.
Do NOT touch production root, gosaki-piano.com, Sariswing, or sibling FTP folders.
Automatic delete / mirror delete is FORBIDDEN.
```

### Rollback options (operator manual)

1. **Re-upload previous known-good package** from local backup / prior zip if kept.
2. **Selective file restore** — overwrite only changed files from last good `public-dist/`.
3. **Do not** run remote `rm`, `mirror --delete`, or bulk folder delete.

Document rollback in follow-up `gosaki-manual-preview-upload-execution-result.md` (G-9d2 execution phase).

---

## 12. Not executed in planning phase

- FTP connection / upload / mirror / delete
- `workflow_dispatch`
- DB write / Supabase SQL
- `service_role`
- Production deploy
- Manual upload (awaiting operator approval + execution phase)

---

## 13. Gates

```txt
gosakiManualPreviewUploadPlanningComplete: true
gosakiManualPreviewUploadChecklistReady: true
gosakiManualPreviewUploadSourceVerified: true
gosakiManualPreviewUploadDestinationScoped: true
gosakiManualPreviewUploadDeleteForbidden: true
readyForOperatorManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 14. Next phase

**G-9d2 execution** (separate): Operator performs upload per this checklist with approval ID `G-9d2-gosaki-manual-preview-upload`, then records result doc.
