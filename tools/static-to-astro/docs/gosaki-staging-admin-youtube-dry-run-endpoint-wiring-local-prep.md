# G-11c4a — Gosaki staging admin YouTube dry-run endpoint wiring local prep

**Phase:** `G-11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep`  
**Status:** **complete** — endpoint wired in static admin; JWT auth UI; package regenerated; **no FTP / no deploy / no writes**  
**Date:** 2026-06-25  
**Prior:** G-11c3b Edge Function deploy execution (commit `5844d6f`)

| Check | Status |
| --- | --- |
| Staging dry-run endpoint in admin HTML | **yes** |
| JWT / Bearer dry-run request path | **yes** |
| Save / Publish / Deploy | **disabled** |
| `supabase functions deploy` re-run | **no** |
| FTP / upload | **no** |

---

## Gates

```txt
gosakiStagingAdminYoutubeDryRunEndpointWiringLocalPrepComplete: true
phase: G-11c4a
readyForG11c4bStagingAdminUploadAndE2eDryRun: true
supabaseEdgeFunctionDeployExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Scope

Wire Gosaki **static** read-only admin (`/admin/`) to the deployed staging Edge Function dry-run endpoint.

- **Endpoint (staging only):** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run`
- **Blocked:** production ref `vsbvndwuajjhnzpohghh`
- **Save / JSON write / deploy:** not in scope

Browser E2E dry-run against live staging is **deferred** to G-11c4b after operator FTP upload.

---

## 2. Endpoint wiring design

| Layer | Mechanism |
| --- | --- |
| Build-time URL | `resolveG11c4aDryRunEndpoint()` — `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT` or G-11c4a staging default constant |
| HTML data attr | `data-gosaki-youtube-dry-run-endpoint` on `<body>` |
| UI status | `dry-run endpoint: configured (...)` when URL present |
| Supabase URL | `resolveG11c4aSupabaseUrl()` — env or `https://kmjqppxjdnwwrtaeqjta.supabase.co` |
| Anon key | `PUBLIC_SUPABASE_ANON_KEY` at build only — **public** key baked into `data-gosaki-supabase-anon-key` |

**No secrets in repo:** anon key comes from operator `.env.local` at build time only (not committed).

---

## 3. Auth / JWT policy

Edge Function has `verify_jwt = true` + `requireAdminUser`.

| Item | Policy |
| --- | --- |
| Session | `@supabase/supabase-js` (CDN) + staging anon key |
| Dry-run headers | `Authorization: Bearer <access_token>`, `apikey: <anon key>`, `Content-Type: application/json` |
| `service_role` | **never** in browser or build output |
| Unauthenticated | UI shows `auth_required`; dry-run blocked client-side |
| Login | Minimal email/password form on static admin page (staging Supabase Auth) |

Aligns with existing staging shell pattern (`getStagingSupabaseClient` + Bearer token) but implemented in static inline script for G-11b admin page.

---

## 4. Admin UI changes

Files:

- `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`

Additions:

- **Staging Auth** section (login / logout / status)
- Endpoint configured indicator
- Dry-run response shows `ok`, `dryRun`, `wouldWrite`, `changedFields`, `next.videoId`
- Explicit copy: **保存されません / dry-run のみ**
- Save / Publish / Deploy remain **disabled**

---

## 5. Local build commands (executed)

```bash
cd tools/static-to-astro

# Load staging anon from local .env.local (not committed); set public endpoint URL
set -a && source ../../.env.local && set +a
export PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run"
export PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co"

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
node tools/static-to-astro/scripts/verify-g11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep.mjs
```

---

## 6. Safety confirmations

| Item | Status |
| --- | --- |
| Production Supabase (`vsbvndwuajjhnzpohghh`) | **not used** |
| Additional `supabase functions deploy` | **no** |
| DB / SQL write | **no** |
| JSON repo write | **no** |
| GitHub Actions / `workflow_dispatch` | **no** |
| FTP / FileZilla | **no** |
| `src/pages/admin` | **unchanged** |
| `service_role` in HTML | **no** |

---

## 7. Not done (G-11c4a)

- FTP upload of regenerated `admin/index.html`
- Live browser dry-run E2E against staging Edge Function
- Save / Publish / Deploy enablement

---

## 8. Next phase

`G-11c4b-gosaki-staging-admin-youtube-dry-run-endpoint-upload-and-e2e` — operator manual upload of `public-dist/admin/` + browser dry-run verification.

---

## References

- G-11c3b: `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`
- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
- `supabase/functions/gosaki-youtube-url-dry-run/index.ts`
