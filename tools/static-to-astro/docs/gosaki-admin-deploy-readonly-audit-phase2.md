# gosaki-admin-deploy-readonly-audit-phase2

Phase: `gosaki-admin-deploy-readonly-audit-phase2`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Prior: `gosaki-admin-deploy-readonly-audit`  
Constraint: read-only. No implementation, commit, Edge deploy, workflow_dispatch, Secret mutate, FTP, or production change.

kmjq live functions list (phase 1): **no** `trigger-deploy`, **no** `deploy-status`.

```txt
DEPLOY_AUDIT_PHASE2_RESULT: PASS
EXISTING_TRIGGER_DEPLOY: repo yes / kmjq no / as-is to Gosaki: NO
EXISTING_DEPLOY_STATUS: repo yes / kmjq no / owner: NO / as-is to Gosaki: NO
ADMIN_DEPLOY_UI: Gosaki none; Kit scaffold only; live button+poll = Sariswing AdminDeployBar
GITHUB_WORKFLOW: deploy.yml (Sariswing FTP); gosaki-youtube-url-save-staging.yml (JSON, no FTP); public-dist-ftp-deploy.yml template (not enabled)
PRODUCTION_UPLOAD_STEP: Sariswing = FTP lftp mirror dist/; Gosaki production CI upload = UNIMPLEMENTED (FileZilla only)
REQUIRED_SECRET_NAMES: see §5 (values not recorded)
SARISWING_VS_GOSAKI_GAP: full Path B present on Sariswing; Gosaki has Save+local generate only
MINIMUM_RESTORE_PLAN: cannot restore by N as-is deploys; need 1 new workflow + 2 forked Edge deploys + UI port + dedicated FTP secret names + G-7f1 approval
```

---

## 1. trigger-deploy

| Item | Value |
| --- | --- |
| In repo | **yes** |
| Path | `supabase/functions/trigger-deploy/index.ts` |
| Shared | `supabase/functions/_shared/admin-auth.ts`, `_shared/github.ts` |
| config.toml | `[functions.trigger-deploy]` `verify_jwt = true` |
| Intended project | **Sariswing production admin** (same family as `admin-schedule` / `AdminDeployBar`). **No** `site_slug` / kmjq / vsbvnd hardcoded. Runtime = whichever project you deploy it to. |
| kmjq | **not present** (live list) |
| Authz | `requireAdminUser`: JWT + `app_metadata.role=admin` **or** email in Edge Secret `ADMIN_EMAILS` |
| Not used | `can_write_site` |
| Arm / dry-run | **none** — every POST dispatches |

### Secrets (Edge, names only)

| Name | Required |
| --- | --- |
| `GITHUB_TOKEN` | yes (`getGitHubConfig` null → 500) |
| `GITHUB_REPO` | yes (`owner/name`) |
| `GITHUB_WORKFLOW_FILE` | no — default `deploy.yml` |
| `GITHUB_REF` | no — default `main` |
| `ADMIN_EMAILS` | yes for email-allowlist path |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | provided by Edge runtime |

kmjq already has `GITHUB_TOKEN` / `GITHUB_REPO` for **Contents** YouTube/About. That does **not** prove Actions `workflow` scope.

### workflow_dispatch body

```txt
POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflowFile}/dispatches
Authorization: Bearer GITHUB_TOKEN
body: { "ref": GITHUB_REF }   // default main
```

No `inputs`. Cannot select site / profile / dry-run.

### As-is deploy to kmjq / Gosaki?

**No.** Source would compile on kmjq, but:

1. Default `GITHUB_WORKFLOW_FILE=deploy.yml` → repo-root `npm run build` (Sariswing Astro) → `LOLIPOP_FTP_*` (Sariswing host).
2. Gosaki owner is `can_write_site`, typically **not** `is_admin` → **403**.
3. Gosaki `/admin/` does not call this function.
4. No vsbvnd STOP, no Gosaki package build.

Deploying as-is to kmjq is a **Sariswing-FTP foot-gun**, not a Gosaki restore.

---

## 2. deploy-status

| Item | Value |
| --- | --- |
| In repo | **yes** |
| Path | `supabase/functions/deploy-status/index.ts` |
| kmjq | **not present** |
| Authz | same `requireAdminUser` |
| Owner usable | **no** (same 403 as trigger-deploy) |

### How status is read

1. Client `deploy-api.ts` POSTs `{ runId? }` via `supabaseAdmin.functions.invoke("deploy-status")`.
2. Edge: if `runId` → `GET /repos/{owner}/{repo}/actions/runs/{runId}`; else latest run of `GITHUB_WORKFLOW_FILE`.
3. Map GitHub `status`/`conclusion` → `running` \| `success` \| `failure`.
4. UI polls every 12s up to 45 min (`deploy-trigger.ts`).

### As-is deploy to kmjq?

**No** for Gosaki owner restore. Same authz + same default workflow file. Safe only as a **status poller for the workflow `GITHUB_WORKFLOW_FILE` points at** after that file is a Gosaki workflow **and** authz is `can_write_site`.

---

## 3. Admin Deploy UI

| Surface | Button | Running / success / fail | Wired |
| --- | --- | --- | --- |
| Gosaki kit `/admin/` | **none** | n/a | Package copy list has no Deploy bar / `deploy-trigger.ts` |
| Kit `AdminDeployStatus.astro` | no | static props only (`data-scaffold`) | not in Gosaki package |
| Kit `AdminPublishButton.astro` | yes, **disabled** | no poll | prototype / example only |
| Kit `AdminPublishHistory.astro` | no | static table | scaffold |
| musician-basic prototype `#publish` | disabled | display examples | `connectedToRuntime: false` |
| Sariswing `AdminDeployBar.astro` | `#triggerDeploy` 「公開サイトを更新」 | yes: デプロイ中 / 🟢成功 / 🔴失敗 / last-run | **yes** → trigger-deploy |

Registry (`admin-ui-components-registry.json`): `admin-publish-button` / `admin-deploy-status` = **scaffold, productionReady false, connectedToRuntime false**. `admin-github-dispatch-client` = **planned, not implemented in kit**.

Live UX to copy for Gosaki is **Sariswing** `src/components/admin/AdminDeployBar.astro` + `src/scripts/admin/deploy-trigger.ts` + `src/lib/admin/deploy-api.ts` — **do not modify `src/pages/admin` for Gosaki**; port into kit templates.

---

## 4. GitHub Actions (all deploy-related)

### Enabled (`.github/workflows/`)

| File | `workflow_dispatch` | Site select | Build | Public step |
| --- | --- | --- | --- | --- |
| `deploy.yml` | yes, **no inputs** | **none** (always Sariswing) | repo-root `npm run build` | **FTP** `lftp mirror -R dist/` → `LOLIPOP_FTP_*` |
| `gosaki-youtube-url-save-staging.yml` | yes, many inputs | `site_slug` allowlist | JSON patch script | **GitHub Contents commit** — **no FTP / no public-dist** |

Gosaki production static build (`npm run build:gosaki:production` in `tools/static-to-astro`) is **not** in any enabled workflow.

`deploy.yml` passes `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` from **GitHub Actions secrets** into Sariswing `astro build`. Those names are **not** a Gosaki kmjq bake path.

### Template (not copied to `.github/workflows/`)

`tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml`

- `workflow_dispatch` inputs: `site_slug`, `fixture_dir`, `base_url`
- Old convert + `export-supabase-json` + **`SUPABASE_SERVICE_ROLE_KEY`**
- FTP `lftp mirror -R --delete` of `public-dist/`
- **Not** `build:gosaki:production`
- Assumes admin **excluded**; current Gosaki production **includes** `/admin/`
- Secret names: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

Do **not** enable this template as-is (G-7f `--delete` + service_role + stale pipeline).

### Local CLI (not GitHub)

`tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs` — **staging env only**; production env rejected. `readyForAnyFutureFtpApply: false`.

---

## 5. Production upload

| Mechanism | Sariswing `deploy.yml` | Gosaki production |
| --- | --- | --- |
| FTP (`lftp`) | **yes** — `dist/` → `LOLIPOP_FTP_*` | **CI: no**. Operator **FileZilla** of `public-dist/` |
| SFTP | no | no |
| rsync | no | no |
| GitHub Pages | no | no |
| Other | — | Contents JSON workflow is not site FTP |

**Gosaki production server upload in GitHub Actions: unimplemented.**  
Profile `remotePath` still `TBD_G-20i`. Values of FTP credentials are **not** listed here.

### Secret **names** only

Sariswing workflow: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `LOLIPOP_FTP_HOST`, `LOLIPOP_FTP_USER`, `LOLIPOP_FTP_PASSWORD`, `LOLIPOP_FTP_REMOTE_DIR`.

Template (unused): `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.

Staging CLI names: `GOSAKI_STAGING_FTP_SERVER`, `GOSAKI_STAGING_FTP_USERNAME`, `GOSAKI_STAGING_FTP_PASSWORD`, `GOSAKI_STAGING_FTP_SERVER_DIR`.

Edge: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_WORKFLOW_FILE`, `GITHUB_REF`, `ADMIN_EMAILS`.

---

## 6. Sariswing vs Gosaki gap

```txt
Sariswing:
  AdminDeployBar (owner/platform admin UI)
    → trigger-deploy (requireAdminUser)
    → deploy.yml
    → astro build + FTP dist/
    → deploy-status poll

Gosaki:
  Save Edge on kmjq (can_write_site)  ✓
  build:gosaki:production local       ✓
  FileZilla public-dist               ✓
  Deploy button                       ✗
  trigger-deploy / deploy-status      ✗ (not on kmjq)
  Gosaki production workflow          ✗
  Gosaki production FTP in CI         ✗
  owner-capable Deploy authz          ✗
```

---

## 7. How many as-is deploys restore it?

**Zero.** Deploying the two existing Edge functions to kmjq does **not** restore Gosaki owner Deploy. It would still default to `deploy.yml` (Sariswing FTP) and 403 the owner. Kit scaffolds do not invoke Edge.

### Minimum restore (reuse patterns, not Path B as-is)

Concrete sequence (implementation later; this phase does not run it):

1. **Code — 1 new workflow** under `.github/workflows/` (e.g. Gosaki production public-dist). Pattern from `deploy.yml` (dispatch + Node 22 + lftp) but:
   - `tools/static-to-astro` `npm run build:gosaki:production`
   - kmjq `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` only (no `service_role`)
   - upload `output/manual-upload/gosaki-piano-production/public-dist/`
   - G-7f1: no `--delete`; fail-exit; `cd`+`pwd`; dedicated remote dir; **not** `LOLIPOP_FTP_*`
2. **Config — GitHub Actions secrets** (names to choose; values never in repo): kmjq public URL/anon + **new** Gosaki production FTP quartet (not Sariswing `LOLIPOP_*`, not staging `GOSAKI_STAGING_FTP_*` unless proven same host — do not assume).
3. **Code — fork** `trigger-deploy` / `deploy-status` (or new slugs): `can_write_site` + `site_slug=gosaki-piano` + `GITHUB_WORKFLOW_FILE` = step-1 YAML + vsbvnd STOP + dual arm. **Do not** leave default `deploy.yml`.
4. **Deploy — 2 Edge functions** to **kmjq only** (`--project-ref kmjqppxjdnwwrtaeqjta`).
5. **Config — kmjq Edge secrets**: `GITHUB_WORKFLOW_FILE` = new YAML; confirm token can `workflow_dispatch`; optional `GOSAKI_DEPLOY_ARMED`.
6. **Code — port** Sariswing `AdminDeployBar` + poll client into **kit** Gosaki `/admin/` (not `src/pages/admin`). Kit `AdminDeployStatus` is display-only — insufficient.
7. **Operator —** `build:gosaki:production` + FileZilla so baked admin JS hits kmjq functions.
8. **Operator —** G-7f1 explicit approval before first real FTP from Actions.

**Count:** 1 new workflow + 2 Edge deploys (after fork) + UI port + Actions/Edge secret **names** + 1 package bake + 1 FTP-safety approval.  
**Not:** “deploy 2 existing functions.”

---

## 8. Not done

Implementation, commit, Edge deploy, dispatch, Secret set, FTP, production change. FTP credential **values** not recorded.
