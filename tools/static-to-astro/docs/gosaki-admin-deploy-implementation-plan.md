# gosaki-admin-deploy-implementation-plan

Phase: `gosaki-admin-deploy-implementation-plan`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Status: **plan complete** — local code for A–D not started this phase  
Forbidden this phase: Edge deploy, Secret set, workflow_dispatch, FTP, production change, credential values in docs

```txt
DEPLOY_IMPLEMENTATION_PLAN_RESULT: PASS
WORKFLOW_FILE: .github/workflows/gosaki-piano-production-public-dist.yml
EDGE_FUNCTIONS: gosaki-production-deploy-trigger · gosaki-production-deploy-status
ADMIN_UI_COMPONENT: AdminGosakiProductionDeployBar (port of AdminDeployBar) on /admin/ portal
AUTHZ: can_write_site after sites.site_slug=gosaki-piano (owner|editor|platform_admin)
SAFE_TO_START_LOCAL_IMPLEMENTATION: true
```

Do **not** deploy or rename Sariswing `trigger-deploy` / `deploy-status` / `deploy.yml`. Do **not** modify `src/pages/admin`.

---

## 0. Target flow

```txt
owner JWT (kmjq)
  → POST gosaki-production-deploy-trigger
  → can_write_site(gosaki-piano) + Deploy Edge arm
  → workflow_dispatch gosaki-piano-production-public-dist.yml ref=main
  → Actions: Save arms unset · kmjq PUBLIC_* · build:gosaki:production
  → lftp mirror -R public-dist/ (no --delete) into GOSAKI_PRODUCTION_FTP_REMOTE_DIR
  → UI polls gosaki-production-deploy-status
```

Public HTML reflects **kmjq build-read at Actions time**, not a live runtime CMS. Owner still Saves first, then Deploy.

---

## 1. WORKFLOW_FILE

**Path:** `.github/workflows/gosaki-piano-production-public-dist.yml`  
**Name:** `Gosaki piano production public-dist`  
**Trigger:** `workflow_dispatch` with **no inputs** (Edge cannot pass site/ref/workflow).  
**Concurrency:** `group: gosaki-piano-production-deploy` · `cancel-in-progress: false`  
**Permissions:** `contents: read` only (no Contents write).

### WORKFLOW_STEPS

1. Checkout `ref` from dispatch (Edge always sends `main`).
2. Setup Node 22.
3. Assert Actions `GOSAKI_PRODUCTION_SUPABASE_URL` contains `kmjqppxjdnwwrtaeqjta` and does **not** contain `vsbvndwuajjhnzpohghh`. Log only booleans (`url_host_kmjq`, `url_prod_stop`). Never echo URL/key.
4. `cd tools/static-to-astro`.
5. Export **only**:
   - `PUBLIC_SUPABASE_URL` ← `secrets.GOSAKI_PRODUCTION_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY` ← `secrets.GOSAKI_PRODUCTION_SUPABASE_ANON_KEY`
6. **Unset** all Save UI arms and `CMS_KIT_SITE_*_BUILD_READ`, `SUPABASE_SERVICE_ROLE_KEY`.
7. `npm ci` (or existing generate’s install) then `npm run build:gosaki:production`.
8. Assert `output/manual-upload/gosaki-piano-production/MANIFEST.json`: `safeForStaticFtp=true`, `ftpAutoDeployUsed=false`, `targetEnvironment=production`, `includesAdmin=true`.
9. Assert artifact dir exists; fail if `--delete` appears in the lftp script.
10. Install `lftp`.
11. FTP upload (see §6). Fail closed if `cd`/`pwd` mismatch.
12. Do not upload `output/gosaki-piano-astro-production` `dist/client` / `dist/server`.

Forbidden in this YAML: `LOLIPOP_FTP_*`, `deploy.yml` job reuse, `service_role`, `mirror --delete`, `public-dist-ftp-deploy.yml` copy-paste.

---

## 2. EDGE_FUNCTIONS

New slugs (not `trigger-deploy` / `deploy-status`):

| Slug | Path |
| --- | --- |
| `gosaki-production-deploy-trigger` | `supabase/functions/gosaki-production-deploy-trigger/` + tools mirror `scripts/edge-functions/…` |
| `gosaki-production-deploy-status` | `supabase/functions/gosaki-production-deploy-status/` + tools mirror |

Mirror byte-eq with other Gosaki functions. `config.toml` `verify_jwt = true`.

### Shared constants (hardcoded in source)

| Constant | Value |
| --- | --- |
| `SITE_SLUG` | `gosaki-piano` |
| `STAGING_PROJECT_REF` | `kmjqppxjdnwwrtaeqjta` |
| `PRODUCTION_REF_STOP` | `vsbvndwuajjhnzpohghh` |
| `WORKFLOW_FILE` | `gosaki-piano-production-public-dist.yml` |
| `DISPATCH_REF` | `main` |
| `DEPLOY_ARMED_ENV` | `GOSAKI_PRODUCTION_DEPLOY_ARMED` (exact `"true"`) |

Reject if `SUPABASE_URL` host contains `PRODUCTION_REF_STOP`. Require host contains `STAGING_PROJECT_REF`.

### trigger

- JWT user client (anon + `Authorization`) — no `service_role`.
- `assertCanWriteSiteForSiteSlug` (copy Schedule helper).
- Ignore JSON body for `workflow`, `ref`, `repo`, `site` (if present → 400).
- If Edge arm unset → 403 `deploy_not_armed` (no dispatch).
- `GITHUB_TOKEN` + `GITHUB_REPO` from Edge env; `GITHUB_WORKFLOW_FILE` / `GITHUB_REF` **must not** override source constants. If those env vars are set and differ from constants → 500 (misconfig).
- Dispatch body: `{ "ref": "main" }` only.
- Return `ok`, `startedAt`, `runId`, `status` like Sariswing trigger-deploy.

### status

- Same authz + project STOP + arm **not** required for poll (or require arm — prefer **require login + can_write_site only**, so unarmed UI can show last run as read-only; **dispatch** stays armed). Plan: **status = can_write_site, no Deploy arm**; trigger = can_write_site + arm.
- Fetch run by `runId` or latest run of **hardcoded** `WORKFLOW_FILE` only.
- Do not accept `workflowFile` / `repo` from client.
- Map to `running` \| `success` \| `failure`.

### AUTHZ

`can_write_site(sites.id)` after `site_slug=gosaki-piano` and `status=active`. Owner/editor/platform_admin as today. **Not** `requireAdminUser` / `ADMIN_EMAILS`.

---

## 3. ADMIN_UI_COMPONENT

**Place:** Gosaki **管理トップ** `/admin/` (`AdminGosakiStagingOperatorHome.astro`), below safety chips / auth bar, **above** module cards.

**Port from (do not edit in place):**

- `src/components/admin/AdminDeployBar.astro`
- `src/scripts/admin/deploy-trigger.ts`
- `src/lib/admin/deploy-api.ts`

**New kit files (names):**

- `templates/admin-cms/gosaki/components/AdminGosakiProductionDeployBar.astro`
- `templates/site-extensions/gosaki-piano/gosaki-production-deploy.ts`
- Copy into package via `gosaki-staging-read-only-admin.mjs`

Copy **not** used: Kit `AdminDeployStatus` / `AdminPublishButton` (scaffold, no poll).

### Behavior

| Feature | How |
| --- | --- |
| Button | 「公開サイトを更新」 · `data-gosaki-production-deploy` |
| Busy | 「デプロイ中...」 · `disabled` · in-flight flag (no second click) |
| Running / success / fail | same copy pattern as Sariswing bar |
| Poll | 12s, max 45min, `deploy-status` slug above |
| Invoke | `fetch` kmjq `/functions/v1/gosaki-production-deploy-trigger` with session JWT (same as Save), **not** Sariswing `supabaseAdmin` |
| Client arm | `PUBLIC_GOSAKI_PRODUCTION_DEPLOY_UI_ARMED=true` baked as `data-gosaki-production-deploy-armed` |
| Unarmed | button disabled; reason visible |
| Confirm | existing Sariswing confirm dialog |

**Save vs Deploy arms:** Deploy is **not** an operational Save mutex feature. Package generate for Actions: Save arms **unset**. Client Deploy arm may be true with `armedCount=0` for Saves. Do not add `gosaki-production-deploy` to Save mutex inventory.

Chip: later UI slice may add “保存後、公開サイトを更新で反映”. Do not claim auto-reflect.

`src/pages/admin` / `AdminDeployBar` on Sariswing: **untouched**.

---

## 4. Secret names (values never in repo/docs/chat)

### SUPABASE_SECRET_NAMES (kmjq Edge only)

| Name | Role |
| --- | --- |
| `GOSAKI_PRODUCTION_DEPLOY_ARMED` | exact `"true"` to allow dispatch |
| `GITHUB_TOKEN` | Actions dispatch + run GET (needs `workflow` scope; Contents-only token is insufficient) |
| `GITHUB_REPO` | `owner/name` of this repo |

Do **not** use Edge env to override workflow file or ref. Do **not** set `LOLIPOP_*` on kmjq. Do **not** put FTP passwords in Supabase.

### GITHUB_ACTIONS_SECRET_NAMES

| Name | Role |
| --- | --- |
| `GOSAKI_PRODUCTION_SUPABASE_URL` | kmjq project URL |
| `GOSAKI_PRODUCTION_SUPABASE_ANON_KEY` | kmjq anon |
| `GOSAKI_PRODUCTION_FTP_HOST` | FTP host |
| `GOSAKI_PRODUCTION_FTP_USER` | FTP user |
| `GOSAKI_PRODUCTION_FTP_PASSWORD` | FTP password |
| `GOSAKI_PRODUCTION_FTP_REMOTE_DIR` | exact remote directory for `cd`/`pwd` |

**Forbidden names in this workflow:** `LOLIPOP_FTP_*`, `GOSAKI_STAGING_FTP_*`, `FTP_SERVER` (old template), `SUPABASE_SERVICE_ROLE_KEY`.

Existence of values is **operator slice F**; this plan does not set them.

---

## 5. FTP_UPLOAD_COMMAND_STRATEGY

- Tool: `lftp` `mirror -R` **without** `--delete`, without `--allow-delete`.
- `set cmd:fail-exit true`.
- Sequence: connect → `cd` **only** `$GOSAKI_PRODUCTION_FTP_REMOTE_DIR` → `pwd` must match that secret (normalize trailing slash) → then mirror.
- If `cd` fails: **stop**. Do not mirror. Do not retry alternative dirs. Do not `cd /`.
- Block remote dir values: empty, `/`, `.`, `./`, `~`, `..`, `../`.
- **Do not** reuse staging `assessServerDirPath` (it requires staging keywords and treats `gosaki-piano.com` as dangerous). New production-only path check in the workflow script.
- Exclude remote names from overwrite if lftp supports glob exclude: `.ftpaccess`, `welcome.html`, `.htaccess`. Never add those files to `public-dist/`.
- Local source: `tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/` (trailing slash).
- Parallel: keep modest (e.g. 3) like Sariswing, no root wipe.
- On failure: leave remote as last successful mirror (no `--delete` ⇒ existing files remain).

G-7f1 operator approval still required before **slice H** first live FTP.

---

## 6. SAFETY_GATES

| Gate | Rule |
| --- | --- |
| `--delete` | forbidden in workflow and scripts |
| Directory | only `GOSAKI_PRODUCTION_FTP_REMOTE_DIR` |
| Site | hardcoded `gosaki-piano` + this workflow file |
| vsbvnd | Edge + Actions URL checks STOP |
| Sariswing FTP | no `LOLIPOP_FTP_*` |
| Save vs Deploy | separate env names; Actions Save arms off |
| Dispatch body | no client-chosen workflow/ref/repo |
| Destroy on fail | no delete mirror ⇒ no wipe of extra remote files |
| `.ftpaccess` | not in artifact; exclude from mirror if possible |
| `src/pages/admin` | no edits |
| `deploy.yml` | unchanged |
| Mutex | Deploy arm ≠ Save arm |

---

## 7. FILES_TO_CHANGE (local slices A–D)

| Slice | Files |
| --- | --- |
| A | `.github/workflows/gosaki-piano-production-public-dist.yml` (new) |
| B | `supabase/functions/gosaki-production-deploy-trigger/`, `…-status/`, `config.toml`, tools `scripts/edge-functions/` mirrors |
| C | `AdminGosakiProductionDeployBar.astro`, `gosaki-production-deploy.ts`, `AdminGosakiStagingOperatorHome.astro`, `gosaki-staging-read-only-admin.mjs` copy list, optional chip copy |
| D | `scripts/verify-gosaki-production-deploy-*.mjs` + `package.json` npm script |
| Docs | this file + AI SoT (this phase) |

**Do not change:** `supabase/functions/trigger-deploy/`, `deploy-status/`, `.github/workflows/deploy.yml`, `src/pages/admin/**`.

---

## 8. IMPLEMENTATION_ORDER

| ID | Slice | This plan |
| --- | --- | --- |
| **A** | workflow YAML + local verifier of YAML (no dispatch) | start next |
| **B** | Edge source + tools mirror + unit/contract verifier (no deploy) | |
| **C** | Admin bar on portal + package copy | |
| **D** | Combined local verifier | |
| **E** | Edge deploy kmjq `--project-ref kmjqppxjdnwwrtaeqjta` | **operator gate** |
| **F** | GitHub Actions secrets | **operator gate** |
| **G** | kmjq Edge secrets (`GOSAKI_PRODUCTION_DEPLOY_ARMED` unset until H) | **operator gate** |
| **H** | dry-run: arm off 403; then one armed dispatch after G-7f1 approval | **operator gate** |

First live FTP in H needs: `承認します。この操作を1回だけ実行してください。`

---

## 9. ESTIMATED_SCOPE

| Band | Effort |
| --- | --- |
| A–D local | ~2–4 working days |
| E–G operator | secrets + 2 function deploys |
| H | one controlled production deploy test |

---

## 10. SAFE_TO_START_LOCAL_IMPLEMENTATION

**true** for **A–D only**.  
**false** for E–H until a later explicit phase.

Next phase name: `gosaki-admin-deploy-workflow-local-implementation` (slice A).

---

## 11. Not done this phase

No workflow file added, no Edge source, no UI, no verifier beyond this doc, no commit required, no Edge/Secret/dispatch/FTP.
