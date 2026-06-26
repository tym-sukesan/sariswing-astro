# G-11c13 — Gosaki YouTube URL save staging upload preflight

**Phase:** `G-11c13-gosaki-youtube-url-save-staging-upload-preflight`  
**Status:** preflight complete  
**Base commit:** `de2850e`  
**Package:** G-11c12 regeneration (`2026-06-26T05:47:15Z`)

## Summary

Read-only preflight before G-11c14 operator manual FTP upload. Upload source, staging destination, safety rules, rollback, and G-11c14 procedure documented.

**No FTP / upload / deploy / workflow_dispatch / Save / DB write in this phase.**

## 1. Upload source (confirmed)

| Item | Value |
|------|-------|
| **Local source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Upload unit** | **Contents** of `public-dist/` — not the folder itself, not the zip |
| **File count** | **27** |
| **Zip (backup only)** | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |
| `safeForStaticFtp` | `true` (G-11c12 manifest) |

### File inventory (G-11c13 read-only)

| Category | Paths |
|----------|-------|
| Home | `index.html` |
| Pages | `about/`, `contact/`, `discography/`, `link/`, `schedule/`, `2026-03/` … `2026-07/` |
| Admin (staging CMS) | `admin/index.html` |
| Assets | `_astro/*`, `assets/about/bands/*.jpg` |
| SEO | `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml` |

### Content checks (upload source)

| Check | Result |
|-------|--------|
| `index.html` exists | **yes** |
| `youtube-nocookie.com/embed/I-eY9YMq9GI` in home | **yes** |
| `Ke4F8JAQz-I` in package | **no** (entire `public-dist/`) |
| `.env` / secrets / tokens | **none detected** |
| Upload = `public-dist/` contents | **yes** (per `README-UPLOAD.md`) |

**YouTube change scope:** Primary visible change is home YouTube iframe (`index.html`). Other pages unchanged by embed JSON update.

## 2. Upload destination (staging only)

| Item | Value |
|------|-------|
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **FTP remote path** | `/cms-kit-staging/gosaki-piano/` |
| **Host** | Lolipop (operator credentials — not in repo) |

### Blocked targets

| Target | Status |
|--------|--------|
| Account FTP root `/` | **blocked** |
| Sariswing production | **blocked** |
| gosaki-piano.com production | **blocked** |
| TLHA / other site areas | **blocked** |
| `mirror --delete` / `sync --delete` | **blocked** (G-7f1) |

**Not Sariswing production.** Gosaki CMS Kit staging preview only.

## 3. Upload method (G-11c14 plan — not executed)

**Recommended: manual FTP only** (FileZilla / Lolipop FTP GUI).

### Operator procedure (G-11c14)

1. Open FTP client; navigate to **`/cms-kit-staging/gosaki-piano/`** — confirm **not** `/`.
2. Local side: open `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/`.
3. Select **all contents** inside `public-dist/` (27 files/dirs).
4. Upload with **overwrite** allowed; **no** mirror-delete / sync-delete / remote cleanup.
5. Priority file for this change: `index.html` (and `_astro/` if CSS hash changed).
6. Post-upload: verify staging home shows new embed (G-11c15).

### Scripts — do NOT run in G-11c14 without separate approval

| Script | Status |
|--------|--------|
| `deploy-public-dist-ftp.mjs --apply` | **suspended** (G-7f1) |
| `lftp mirror --delete` | **forbidden** |
| `npm run manual-upload:package` | package already built — re-run only if regenerating |

See `output/manual-upload/gosaki-piano/README-UPLOAD.md` and `CHECKLIST.md` (gitignored).

## 4. Pre-upload staging check (operator)

Before G-11c14 upload, note current live state:

```bash
curl -sS -o /dev/null -w "%{http_code}" https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
# Optional: save current home HTML snippet for comparison (may still show Ke4F8JAQz-I until upload)
```

Expected **before** upload: staging home may still embed `Ke4F8JAQz-I` (pre-G-11c12 package on server).

Expected **after** upload (G-11c15): `youtube-nocookie.com/embed/I-eY9YMq9GI`.

## 5. Rollback (documented — not executed)

| Situation | Action |
|-----------|--------|
| Bad upload / wrong path | **Stop** — do not mirror-delete or clean remote root |
| Revert staging files | Re-upload **previous** `gosaki-piano-manual-upload.zip` contents (if kept) or regenerate from `git revert 9f58889` + G-11c12 pipeline |
| Repo JSON wrong | `git revert 9f58889` on `main`, regenerate package, re-upload (new G-11c14 approval) |

**G-11c13:** no rollback execution.

## 6. G-11c14 explicit approval gate

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

**Permitted once:** manual upload of `public-dist/` contents → `/cms-kit-staging/gosaki-piano/`

**Not permitted without separate approval:**

- production upload / Sariswing production
- server root operations
- `mirror --delete` / `sync --delete`
- DB write / secrets set / workflow_dispatch
- additional uploads

## Safety gates (this phase)

| Gate | Value |
|------|-------|
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `mirrorDeletePlanned` | **false** |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c13-gosaki-youtube-url-save-staging-upload-preflight.mjs
```

## Next

`G-11c14-gosaki-youtube-url-save-staging-upload-execution` — operator-approved manual upload ×1.
