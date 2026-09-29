# gosaki-admin-deploy-local-implementation

Phase: `gosaki-admin-deploy-local-implementation`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Status: **A–D local implementation complete** — no Edge deploy / Secret / dispatch / FTP / push

```txt
DEPLOY_LOCAL_IMPLEMENTATION_RESULT: PASS
WORKFLOW_FILE: .github/workflows/gosaki-piano-production-public-dist.yml
EDGE_SOURCE_FILES:
  supabase/functions/gosaki-production-deploy-trigger/{index.ts,handler.ts}
  supabase/functions/gosaki-production-deploy-status/{index.ts,handler.ts}
  supabase/functions/_shared/gosaki-production-deploy-auth.ts
  tools/static-to-astro/scripts/edge-functions/… (byte-eq mirrors)
ADMIN_UI_COMPONENT: AdminGosakiProductionDeployBar (portal /admin/ only)
VERIFIER_RESULT: 93 passed, 0 failed (npm run verify:gosaki-production-deploy)
SARISWING_DEPLOY_FILES_UNCHANGED: true
SAFE_TO_REVIEW_LOCALLY: true
SAFE_TO_PROCEED_TO_OPERATOR_GATED_PHASE: true (E–H still require explicit operator approval)
```

Forbidden this phase (not executed): Edge deploy, Supabase Secret set/unset, GitHub Actions Secret config, `workflow_dispatch`, FTP, production change, push, DB write, Storage write.

---

## A. Workflow

Path: `.github/workflows/gosaki-piano-production-public-dist.yml`

- `workflow_dispatch` · concurrency `gosaki-piano-production-deploy` · `contents: read`
- Requires `GITHUB_REF == refs/heads/main`
- `cd tools/static-to-astro` → `npm ci` → `npm run build:gosaki:production`
- Env: `GOSAKI_PRODUCTION_SUPABASE_URL` / `GOSAKI_PRODUCTION_SUPABASE_ANON_KEY` → `PUBLIC_SUPABASE_*`
- kmjq host required; `vsbvndwuajjhnzpohghh` STOP (booleans only in logs)
- All operational Save UI arms unset; `CMS_KIT_SITE_*_BUILD_READ` unset; `SUPABASE_SERVICE_ROLE_KEY` unset
- Client Deploy arm baked `PUBLIC_GOSAKI_PRODUCTION_DEPLOY_UI_ARMED=true` (not a Save mutex feature)
- Asserts `output/manual-upload/gosaki-piano-production/` public-dist + MANIFEST gates
- FTP: `lftp` `mirror -R` · **no `--delete`** · dedicated `GOSAKI_PRODUCTION_FTP_*` (never `LOLIPOP_FTP_*`)
- Remote dir via `scripts/gosaki-production-ftp-remote-dir-guard.mjs` (rejects `/` `.` `./` `~` `..`)
- `cd` then `pwd` match before mirror

Live FTP still **not** run this phase. G-7f1 `readyForAnyFutureFtpApply: false` until operator slice H.

---

## B. Edge source

| Slug | Authz | Arm |
| --- | --- | --- |
| `gosaki-production-deploy-trigger` | JWT + `can_write_site` after `sites.site_slug=gosaki-piano` | `GOSAKI_PRODUCTION_DEPLOY_ARMED === "true"` else 403 `deploy_not_armed` |
| `gosaki-production-deploy-status` | same authz | **not** required (poll) |

Hardcoded: workflow `gosaki-piano-production-public-dist.yml` · ref `main` · `GITHUB_REPO` from Edge env. Client `workflow` / `ref` / `repo` / `site` → 400. vsbvnd URL → STOP. `config.toml` `verify_jwt = true`. Tools mirrors byte-eq.

**Not** `requireAdminUser`. **Not** `getGitHubConfig()` (would default `deploy.yml`).

---

## C. Admin UI

- `AdminGosakiProductionDeployBar` on `AdminGosakiStagingOperatorHome` → package `/admin/` portal only
- Other admin routes (schedule / discography / youtube / about) do not include the bar
- `src/pages/admin` untouched
- Deploy button · 12s poll · 45min max · `deployInFlight` double-click lock
- Unarmed: disabled button + visible “Deploy 未武装”
- Dataset `data-gosaki-production-deploy-armed` from `PUBLIC_GOSAKI_PRODUCTION_DEPLOY_UI_ARMED` (exact `"true"`)
- Not registered in Save mutex inventory

---

## D. Verifier

`tools/static-to-astro/scripts/verify-gosaki-production-deploy.mjs`  
`npm run verify:gosaki-production-deploy` → **93 passed, 0 failed**

---

## Operator-gated next (E–H)

Do **not** start without explicit approval:

- E: kmjq Edge deploy of the two new slugs (`--project-ref kmjqppxjdnwwrtaeqjta`)
- F: GitHub Actions + kmjq Secret names (values never in git)
- G: first `workflow_dispatch` dry observation
- H: first live FTP (G-7f1 approval form required)

FileZilla of the existing production package remains the live upload until H.
