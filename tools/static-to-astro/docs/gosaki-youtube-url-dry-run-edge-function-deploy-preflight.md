# G-11c2 — Gosaki YouTube URL dry-run Edge Function deploy preflight

**Phase:** `G-11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight`  
**Status:** **preflight complete** — deploy readiness documented; **no deploy executed**  
**Date:** 2026-06-25  
**Prior:** G-11c1 local prep (commit `8152d7c`)

| Check | Status |
| --- | --- |
| Function source static review | **PASS** |
| Staging project target documented | **yes** |
| Production Supabase touched | **no** |
| `supabase functions deploy` executed | **no** |

---

## Gates

```txt
gosakiYoutubeUrlDryRunEdgeFunctionDeployPreflightComplete: true
phase: G-11c2
readyForG11c3EdgeFunctionDeployExecution: true
supabaseEdgeFunctionDeployExecuted: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

**Do not deploy** until `G-11c3-gosaki-youtube-url-dry-run-edge-function-deploy-execution` with explicit operator approval.

---

## 1. Target Supabase project (staging only)

| Item | Value |
| --- | --- |
| **Allowed** project name | `static-to-astro-cms-staging` |
| **Allowed** project ref | `kmjqppxjdnwwrtaeqjta` |
| **Allowed** API host | `https://kmjqppxjdnwwrtaeqjta.supabase.co` |

### Blocked (must not deploy / link / write)

| Item | Value |
| --- | --- |
| Production project name | `sari-site` |
| Production project ref | `vsbvndwuajjhnzpohghh` |
| Production host | `https://vsbvndwuajjhnzpohghh.supabase.co` |

**Preflight confirmation:** G-11c2 docs and verifier reference **staging ref only**. No production ref in deploy command. No `supabase link` change executed.

---

## 2. Function under review

| File | Role |
| --- | --- |
| `supabase/functions/gosaki-youtube-url-dry-run/index.ts` | Entry — POST + OPTIONS; `requireAdminUser` |
| `supabase/functions/_shared/gosaki-youtube-url-dry-run.ts` | Validation; `dryRun` only; `wouldWrite: false` |
| `supabase/functions/_shared/gosaki-youtube-staging-current.ts` | In-memory current snapshot (no DB) |
| `supabase/functions/_shared/admin-auth.ts` | JWT + admin allowlist; CORS headers |

**Function name (deploy):** `gosaki-youtube-url-dry-run`

**Invoked URL (after deploy):**

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run
```

---

## 3. Existing Edge Function patterns (read-only survey)

| Function | Auth | service_role | CORS | OPTIONS |
| --- | --- | --- | --- | --- |
| `admin-schedule` | `requireAdminUser` | **yes** (DB CRUD) | `*` via `admin-auth` | yes |
| `trigger-deploy` | `requireAdminUser` | no | `*` | yes |
| `deploy-status` | `requireAdminUser` | no | `*` | yes |
| `admin-news` / `admin-site-page` / `admin-instagram` | `requireAdminUser` | varies | `*` | yes |
| **`gosaki-youtube-url-dry-run`** | `requireAdminUser` | **no** | `*` (shared) | yes |

### JWT / admin role

- Client sends `Authorization: Bearer <user JWT>` (Supabase Auth session).
- Edge uses **anon key** + `auth.getUser()` — **not** `service_role`.
- Admin gate: `app_metadata.role === "admin"` **or** email in `ADMIN_EMAILS` secret.

### `config.toml` (local dev)

Existing functions have `verify_jwt = true`. **`gosaki-youtube-url-dry-run` is not yet listed** — add before G-11c3 deploy:

```toml
[functions.gosaki-youtube-url-dry-run]
verify_jwt = true
```

Runtime still enforces `requireAdminUser`; `verify_jwt` aligns with other admin functions.

---

## 4. G-11c1 function source preflight

| Check | Result |
| --- | --- |
| `index.ts` exists | **yes** |
| `_shared` imports (`../_shared/*.ts`) | **valid relative paths** |
| Deno `jsr:@supabase/functions-js/edge-runtime.d.ts` | **same as existing functions** |
| `npm:@supabase/supabase-js@2` (via admin-auth) | **same as existing functions** |
| Function name consistent | `gosaki-youtube-url-dry-run` |
| `siteSlug` allowlist | `gosaki-piano` only |
| `module` allowlist | `youtube-embed` only |
| `field` allowlist | `embedCode` only |
| `dryRun === true` required | **yes** |
| `wouldWrite` | always `false` |
| JSON file write | **none** |
| DB write / `createServiceClient` | **none** |
| `workflow_dispatch` / GitHub / FTP | **none** |

**Static import graph:**

```txt
index.ts
  → _shared/admin-auth.ts
  → _shared/gosaki-youtube-url-dry-run.ts
       → _shared/gosaki-youtube-staging-current.ts
```

**Deploy readiness:** **yes** — structure matches repo conventions; no blocking TypeScript/import issues found in static review.

---

## 5. Security preflight

| Control | Status |
| --- | --- |
| Secrets in browser / admin HTML | **no** — endpoint URL only (set at build in G-11c3+) |
| `service_role` in gosaki function | **no** |
| `GITHUB_TOKEN` | **not used** |
| FTP secrets | **not used** |
| Production Supabase ref in function source | **no** |
| Sariswing `/admin` changes | **no** |
| `requireAdminUser` before dry-run logic | **yes** |

---

## 6. CORS / admin UI connection

### Current CORS (inherited from `admin-auth.ts`)

```txt
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

**PoC note:** Matches existing admin Edge Functions (`admin-schedule`, `trigger-deploy`). Staging admin origin:

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/
```

**G-11c2 assessment:** `*` is acceptable for **dry-run PoC** on staging CMS staging project, consistent with current admin functions. **G-11c4+** may tighten to `https://yskcreate.weblike.jp` with explicit `Origin` check if required.

### Admin UI gaps (post-deploy — G-11c3+)

G-11c1 static admin fetch currently sends:

- `Content-Type: application/json` only
- **No** `Authorization` JWT
- **No** `apikey` header

After deploy, staging admin must add Supabase Auth session + headers before dry-run calls succeed. **Not in G-11c2 scope.**

---

## 7. Deploy command (documented only — NOT executed)

### Preflight checklist (operator — before G-11c3)

1. Confirm active Supabase CLI target: **`kmjqppxjdnwwrtaeqjta` only**
2. Confirm **not** linked to `vsbvndwuajjhnzpohghh`
3. Add `[functions.gosaki-youtube-url-dry-run] verify_jwt = true` to `supabase/config.toml` (commit in G-11c3 prep)
4. Confirm `ADMIN_EMAILS` secret exists on staging project (or set before first test)
5. Obtain explicit approval ID for one deploy

### Deploy command (G-11c3 execution phase only)

```bash
# From repo root — STAGING ONLY
supabase functions deploy gosaki-youtube-url-dry-run \
  --project-ref kmjqppxjdnwwrtaeqjta
```

**Do not run** without G-11c3 approval form.

### Optional: verify secrets (read-only CLI — G-11c3)

```bash
supabase secrets list --project-ref kmjqppxjdnwwrtaeqjta
```

Do not paste secret values into chat or docs.

### Post-deploy admin wiring (G-11c3+)

Rebuild Gosaki admin with:

```txt
PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT=https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run
```

(Use staging anon key + user JWT in fetch — implementation phase G-11c3+.)

---

## 8. Env / secrets required at runtime

| Variable | Required for this function | Source |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Auto-injected by Supabase |
| `SUPABASE_ANON_KEY` | yes | Auto-injected |
| `ADMIN_EMAILS` | recommended | Project secret (comma-separated) |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | Not used |
| `GITHUB_TOKEN` | **no** | Not used |
| FTP / Lolipop secrets | **no** | Not used |

---

## 9. Rollback plan (documented — not executed)

| Step | Action |
| --- | --- |
| 1 | Stop using staging admin dry-run button (clear `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT`) |
| 2 | Delete function from staging only: `supabase functions delete gosaki-youtube-url-dry-run --project-ref kmjqppxjdnwwrtaeqjta` (G-11c3 rollback approval) |
| 3 | No DB rollback — function does not write DB |
| 4 | No JSON rollback — function does not write repo files |
| 5 | Re-upload prior `admin/` static package if admin UI was changed for endpoint |

**If deploy outcome unclear:** stop; do not retry; record incident; ask human (G-7f1 pattern).

---

## 10. Local verification (G-11c2)

```bash
node tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs
node tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs
```

---

## 11. Not done (G-11c2)

- `supabase functions deploy`
- DB / Supabase data writes
- GitHub Actions / `workflow_dispatch`
- FTP / FileZilla / upload
- `src/pages/admin` changes
- `.env` / `.env.local` changes

---

## 12. Next phase

`G-11c3-gosaki-youtube-url-dry-run-edge-function-deploy-execution` — single deploy to staging with explicit operator approval + post-deploy smoke test.

---

## References

- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
- G-11a: `gosaki-staging-online-cms-architecture-planning.md`
- `supabase/config.toml`
- `supabase/functions/_shared/admin-auth.ts`
