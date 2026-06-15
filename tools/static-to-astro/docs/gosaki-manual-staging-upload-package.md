# G-7g gosaki manual staging upload package

- **Phase:** `G-7g-gosaki-manual-staging-upload-package`
- **Last updated:** 2026-06-15
- **Status:** package generated — **operator manual upload pending**

---

## Reason

FTP auto-deploy disabled after G-7f root mirror delete incident. Staging preview will be published via **operator manual FTP upload** (FileZilla / Lolipop FTP), not `deploy-public-dist-ftp.mjs --apply`.

---

## Source

| Item | Path |
|------|------|
| **public-dist source** | `tools/static-to-astro/output/static-public/gosaki-piano/public-dist/` |
| **static-public manifest** | `safeForStaticFtp: true`, `stagingPreviewOk: true` |
| **File count** | 13 |

---

## Manual upload package

| Item | Path |
|------|------|
| **Package directory** | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| **Zip archive** | `tools/static-to-astro/output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |
| **README** | `README-UPLOAD.md` |
| **Checklist** | `CHECKLIST.md` |
| **Manifest** | `MANIFEST.json` |

Generate (no FTP):

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

---

## Upload instructions (operator)

**Remote path:** `/cms-kit-staging/gosaki-piano/`

**Upload:** contents of package `public-dist/` — **not** the `public-dist` folder itself.

**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

See `output/manual-upload/gosaki-piano/README-UPLOAD.md` and `CHECKLIST.md` (gitignored).

---

## safeForStaticFtp result

| Check | Result |
|-------|--------|
| `safeForStaticFtp` | `true` |
| `stagingPreviewOk` | `true` (source manifest) |
| Package verify | PASS |

---

## Not executed

- FTP connection / upload / sync
- `mirror` / `mirror --delete` / remote delete
- `workflow_dispatch`
- DB writes / Supabase SQL
- Production deploy
- `.ftpaccess` changes

---

## Next action

1. Operator manually uploads `public-dist/` **contents** to `/cms-kit-staging/gosaki-piano/`
2. Browser QA on staging URLs (see CHECKLIST.md)
3. Record QA in follow-up phase if needed

---

## Gates

```txt
gosakiManualUploadPackageCreated: true
ftpAutoDeployStillDisabled: true
readyForManualStagingUploadByOperator: true
readyForAnyFutureFtpApply: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

Reason: package ready; operator upload + browser QA not yet done.
