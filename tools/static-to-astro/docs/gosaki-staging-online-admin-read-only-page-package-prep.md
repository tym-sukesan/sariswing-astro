# G-11b — Gosaki staging online admin read-only page package prep

**Phase:** `G-11b-gosaki-staging-online-admin-read-only-page-package-prep`  
**Status:** **complete** — read-only admin in public-dist + manual-upload package  
**Date:** 2026-06-25  
**Prior:** G-11a architecture planning (`755ecbe`)

| Check | Status |
| --- | --- |
| Admin URL | `/cms-kit-staging/gosaki-piano/admin/` |
| Save / Publish / Deploy | **disabled** |
| API routes / Supabase / secrets | **none** |
| FTP / upload | **not executed** |

---

## Gates

```txt
gosakiStagingOnlineAdminReadOnlyPagePackagePrepComplete: true
phase: G-11b
adminUrl: /cms-kit-staging/gosaki-piano/admin/
readyForG11cYoutubeUrlWebSaveDryRunPoc: true
readyForOperatorManualUpload: true
cursorFtpUploadExecuted: false
cursorDbWriteExecuted: false
```

---

## Admin URL decision

**Adopted:** `/admin/` (under Gosaki deployBase)

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/
```

**Rationale:**

- G-11a recommended `/admin/` as public-facing alias
- `static-public` previously excluded `admin/` for Sariswing hybrid builds — G-11b adds **Gosaki read-only admin marker** detection to include `admin/index.html` only (still excludes `api/`)
- `/__admin/` was not needed because marker-based inclusion is safer than a second path convention

---

## Implementation

| Item | Path |
| --- | --- |
| Convert hook | `scripts/lib/gosaki-staging-read-only-admin.mjs` |
| Page template | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` |
| View model | `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts` |
| Styles | `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css` |
| Generated page | `output/gosaki-piano-astro/src/pages/admin/index.astro` |
| static-public include | `static-public-artifact-verifier.mjs` — `includeGosakiReadOnlyAdmin` when marker present |
| manual-upload allow | `manual-upload-package.mjs` — admin/ OK with read-only marker |

**Data sources (build-time embed):**

- `config/sites/gosaki-piano-youtube-embed.json`
- `config/sites/gosaki-piano-about-content.json`
- `config/sites/gosaki-piano-contact-hubspot.json`

**Displayed sections:** Site Overview, YouTube, About (profile + bands + 5 image filenames), Contact HubSpot, Schedule placeholder.

---

## Local commands (executed)

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

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g11b-gosaki-staging-online-admin-read-only-page-package-prep.mjs
```

---

## Operator next step

Upload `output/manual-upload/gosaki-piano/public-dist/` including **`admin/`** folder. **Cursor does not upload.**

Verify after upload:

- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` HTTP 200
- READ-ONLY banner visible
- Save buttons disabled

---

## Next phase

`G-11c-gosaki-youtube-url-web-save-dry-run-poc` — Edge Function dry-run (no FTP).

---

## Not done

- Save / Publish / Deploy
- Edge Function / GitHub Actions
- FTP upload
- `src/pages/admin` (Sariswing production) changes
