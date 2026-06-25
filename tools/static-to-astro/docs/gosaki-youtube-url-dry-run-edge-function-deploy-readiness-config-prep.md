# G-11c3a — Gosaki YouTube URL dry-run Edge Function deploy readiness config prep

**Phase:** `G-11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep`  
**Status:** **complete** — `config.toml` registration added; deploy checklist documented; **no deploy executed**  
**Date:** 2026-06-25  
**Prior:** G-11c2 deploy preflight (commit `df6e18e`); G-11c1 local prep (`8152d7c`)

| Check | Status |
| --- | --- |
| `config.toml` `[functions.gosaki-youtube-url-dry-run]` | **added** |
| `verify_jwt = true` | **yes** |
| Staging ref only in deploy docs | **yes** |
| `supabase functions deploy` executed | **no** |

---

## Gates

```txt
gosakiYoutubeUrlDryRunEdgeFunctionDeployReadinessConfigPrepComplete: true
phase: G-11c3a
readyForG11c3bEdgeFunctionDeployExecution: true
supabaseEdgeFunctionDeployExecuted: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. config.toml change

Added after existing admin function registrations:

```toml
[functions.gosaki-youtube-url-dry-run]
verify_jwt = true
```

Aligns with `admin-schedule`, `trigger-deploy`, and other admin Edge Functions. Runtime still enforces `requireAdminUser` in function source.

---

## 2. Target Supabase project (staging only)

| Item | Value |
| --- | --- |
| Project name | `static-to-astro-cms-staging` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| API host | `https://kmjqppxjdnwwrtaeqjta.supabase.co` |

### Blocked

| Item | Value |
| --- | --- |
| Production name | `sari-site` |
| Production ref | `vsbvndwuajjhnzpohghh` |

**G-11c3a confirmation:** No production ref in deploy command docs. No `supabase link` change.

---

## 3. Deploy command (documented only — NOT executed)

```bash
# STAGING ONLY — Operator explicit approval required (G-11c3b+)
supabase functions deploy gosaki-youtube-url-dry-run \
  --project-ref kmjqppxjdnwwrtaeqjta
```

**このコマンドは G-11c3b 以降、Operator が明示承認した場合のみ実行する。Cursor は実行しない。**

Post-deploy invoke URL:

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run
```

---

## 4. Deploy直前チェックリスト（G-11c3b Operator）

### Before deploy

- [ ] Git at expected commit; `config.toml` includes `[functions.gosaki-youtube-url-dry-run] verify_jwt = true`
- [ ] Confirm CLI `--project-ref kmjqppxjdnwwrtaeqjta` (**not** `vsbvndwuajjhnzpohghh`)
- [ ] Confirm **not** linked to Sariswing production Supabase
- [ ] `ADMIN_EMAILS` secret present on staging project (or set before first test)
- [ ] G-11c1 / G-11c2 / G-11c3a verifiers **PASS**
- [ ] Explicit approval recorded (one deploy only)

### Deploy (Operator only — G-11c3b)

```bash
supabase functions deploy gosaki-youtube-url-dry-run \
  --project-ref kmjqppxjdnwwrtaeqjta
```

### After deploy (smoke — G-11c3b+)

- [ ] Function listed in Supabase dashboard (staging project)
- [ ] POST with invalid body returns 400 (no auth) or 401 (no JWT)
- [ ] POST with admin JWT + valid dry-run payload returns `ok:true`, `wouldWrite:false`
- [ ] No DB rows changed; no JSON repo changes from function

---

## 5. Rollback plan (documented — not executed)

| Step | Action |
| --- | --- |
| 1 | Clear `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT` from admin build if set |
| 2 | `supabase functions delete gosaki-youtube-url-dry-run --project-ref kmjqppxjdnwwrtaeqjta` (Operator approval) |
| 3 | Revert `config.toml` registration if removing function permanently |
| 4 | No DB rollback — function does not write DB |

**If deploy outcome unclear:** stop; do not retry; record incident; ask human.

---

## 6. Local verification (G-11c3a)

```bash
node tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs
node tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs
node tools/static-to-astro/scripts/verify-g11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.mjs
```

---

## 7. Not done (G-11c3a)

- `supabase functions deploy`
- DB / Supabase data writes
- GitHub Actions / `workflow_dispatch`
- FTP / upload
- `.env` / `.env.local` changes
- `src/pages/admin` changes

---

## 8. Next phase

`G-11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution` — single staging deploy with explicit operator approval.

---

## References

- G-11c2: `gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md`
- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
- `supabase/config.toml`
- `supabase/functions/gosaki-youtube-url-dry-run/index.ts`
