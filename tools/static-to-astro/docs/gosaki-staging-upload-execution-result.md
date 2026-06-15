# G-7f gosaki staging FTP upload — execution result

- **Phase:** `G-7f-gosaki-staging-upload-execution`
- **Last updated:** 2026-06-15
- **Status:** **aborted** — FTP upload attempted once; connection hang; upload success unconfirmed; staging QA not performed

---

## Summary

| Item | Value |
|------|-------|
| **G-7f FTP upload attempted** | `true` |
| **Upload completed** | `false` / `unknown` |
| **Upload success confirmed** | no |
| **Reason** | FTP connection hang; FileZilla also unable to connect at same time |
| **Additional retries** | none (per operator instruction) |
| **Staging URL QA** | not performed |
| **readyForG7gGosakiBrowserQaAndClientReview** | `false` |

---

## Preflight result

| Check | Result |
|-------|--------|
| `static-public` exists | PASS — 13 files |
| `safeForStaticFtp` | PASS (`true`) |
| `stagingPreviewOk` | PASS (`true`) |
| Upload plan | PASS (gitignored under `output/deploy/gosaki-piano/`) |
| Remote path staging-only | PASS — `/cms-kit-staging/gosaki-piano/` |
| FTP dry-run | PASS (`applied: false`, `ftpConnected: false`) |
| Production / gosaki-piano.com / Sariswing | NOT touched |
| `workflow_dispatch` | NOT executed |
| DB / Supabase | NOT touched |
| Secrets in git | none added |
| `output/` / generated fixtures | NOT committed |

---

## FTP path alignment result

Operator aligned local `GOSAKI_STAGING_FTP_SERVER_DIR` to `/cms-kit-staging/gosaki-piano/` (`.env.local`, gitignored — not committed).

```txt
remote target path = /cms-kit-staging/gosaki-piano/  ✓
artifact deployBase = /cms-kit-staging/gosaki-piano/  ✓
staging URL        = https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/  ✓
```

| Item | Value |
|------|-------|
| **Local source path** | `tools/static-to-astro/output/static-public/gosaki-piano/public-dist/` |
| **Remote target path** | `/cms-kit-staging/gosaki-piano/` |
| **Artifact deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **File count** | 13 |
| **Mirror / delete** | `mirror -R --delete` |
| **Legacy cleanup target** | `rm -r -f public-dist` under remote server dir |
| **noindex / robots** | verified locally (G-7e) — not re-verified on live staging |
| **canonical / og:url** | verified locally — staging URL; not re-verified on live staging |

---

## FTP access restriction status

Operator confirmed Lolipop FTP access restriction screen:

- Connection source IP: `116.0.181.107` — **on allowlist**
- `.ftpaccess`: **not deleted** (maintained)
- Lolipop admin「削除」button: **not pressed**
- Cursor egress IP at attempt time: `116.0.181.107` (matches allowlist)

Despite allowlist alignment, `deploy-public-dist-ftp.mjs --apply` hung on `lftp` and FileZilla could not connect concurrently — treated as host-side or transient FTP connectivity failure.

---

## Upload approval

- **Received:** yes  
  `承認します。G-7f staging FTP upload を1回だけ実行してください。`

---

## Upload command (attempted once)

```bash
cd /Users/toyamayusuke/sariswing-astro

node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs \
  --public-dir tools/static-to-astro/output/static-public/gosaki-piano/public-dist \
  --site-slug gosaki-piano \
  --env staging \
  --report tools/static-to-astro/output/deploy/gosaki-piano/STAGING_FTP_DEPLOY_REPORT.md \
  --manifest tools/static-to-astro/output/deploy/gosaki-piano/staging-ftp-deploy-manifest.json \
  --apply
```

---

## Upload result

| Item | Value |
|------|-------|
| **Attempted** | yes (once) |
| **Completed** | false / unknown |
| **Success / failure** | unknown — process hung; operator aborted phase |
| **Uploaded files count** | unknown |
| **Failed files count** | unknown |
| **Remote path (intended)** | `/cms-kit-staging/gosaki-piano/` |
| **FTP connected (confirmed)** | no — `lftp` did not return; manifest not updated to apply mode |
| **Manifest after attempt** | still dry-run snapshot (`applied: false`, `ftpConnected: false`) |
| **Staging URL HTTP check during attempt** | `404` on root (upload not confirmed) |

### Abort details

- `lftp` subprocess remained in running state ~30+ minutes with no deploy script completion output
- Operator confirmed FileZilla also unable to connect at same time
- Operator instruction: **abort G-7f upload; no additional retries**
- Do not delete `.ftpaccess` or modify Lolipop FTP access restriction

---

## Browser QA result

**Not performed** — upload success unconfirmed; staging URL not validated post-upload.

Planned URLs (deferred until FTP connectivity resolved and upload succeeds):

- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/`
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-07/`
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt`

---

## Known issues

1. **FTP connectivity failure** — `lftp` hang + FileZilla failure; root cause unresolved (host, transient outage, or server-side restriction).
2. No `_astro/` assets in live-crawl build (minimal inline CSS).
3. FTP path alignment (gosaki vs gosaki-piano) — resolved in preflight before attempt.

---

## Not executed

- Successful FTP upload completion
- Staging browser QA
- `workflow_dispatch`
- DB writes
- Supabase SQL
- Production deploy
- gosaki-piano.com production domain change
- Sariswing production deploy
- `.ftpaccess` deletion
- Additional FTP retries

---

## Rollback / cleanup plan

- No confirmed remote changes from this attempt — rollback not required unless partial upload discovered later.
- If partial upload suspected after connectivity restored: inspect remote `/cms-kit-staging/gosaki-piano/` via FTP; re-mirror from local `public-dist` only after new preflight + approval.
- Staging path only — never production root or gosaki-piano.com.

---

## Next action

**Do not re-run FTP upload until FTP connectivity is resolved.**

1. Resolve Lolipop FTP connectivity (FileZilla test from operator machine; confirm server status / access restriction / credentials).
2. Re-run G-7f preflight (`plan-staging-public-upload.mjs` + `deploy-public-dist-ftp.mjs --dry-run`).
3. Obtain new operator approval before any upload retry.

---

## Gate

```txt
gosakiStagingUploadPreflightComplete: true
ftpPathAlignedWithDeployBase: true
gosakiStagingUploadAttemptedInG7f: true
ftpDeployExecutedInG7f: false
ftpDeployCompletedInG7f: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

Reason: FTP upload hung; success unconfirmed; staging QA not performed.
