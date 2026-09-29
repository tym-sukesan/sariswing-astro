# gosaki-admin-deploy-readonly-audit

Phase: `gosaki-admin-deploy-readonly-audit`  
Date: 2026-09-28  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-prestage`  
Branch: `hotfix/gosaki-disable-test-youtube`

Read-only identification of why Gosaki CMS cannot complete **Save → Deploy → public reflect** from the admin UI alone. No implementation, Secret mutate, Edge deploy, workflow_dispatch, GitHub write, FTP, DB/Storage write, production change, commit, or push.

```txt
DEPLOY_AUDIT_RESULT: PASS
CURRENT_DEPLOY_FLOW: Save(kmjq) → Cursor build:gosaki:production → FileZilla public-dist
CURRENT_BLOCKER: no Gosaki Deploy UI + no Gosaki production workflow + kmjq has no trigger-deploy + FTP auto-apply suspended (G-7f) + deploy.yml is Sariswing-only
ADMIN_UI_STATE: absent (not disabled)
EDGE_FUNCTION: trigger-deploy / deploy-status exist in repo only; **not on kmjq**
AUTHZ: requireAdminUser (ADMIN_EMAILS / app_metadata.role=admin) — not can_write_site
REQUIRED_SECRETS: GITHUB_TOKEN GITHUB_REPO [GITHUB_WORKFLOW_FILE GITHUB_REF] + GitHub Actions PUBLIC_SUPABASE_* + dedicated Gosaki FTP keys (not Sariswing LOLIPOP_FTP_*)
GITHUB_WORKFLOW: .github/workflows/deploy.yml = Sariswing astro+FTP; Gosaki production build workflow = missing
PRODUCTION_UPLOAD_MECHANISM: human FileZilla of public-dist/; auto FTP suspended
MISSING_PIECES: UI · Gosaki workflow · kmjq-scoped Edge dispatch · owner authz · dedicated FTP secrets · G-7f1-safe upload (no --delete)
MINIMUM_RESTORE_PLAN: new gosaki production workflow + new/forked Edge on kmjq (can_write_site + arm) + admin Deploy button; do not reuse deploy.yml / LOLIPOP_FTP_* / trigger-deploy as-is
RISKS: G-7f root delete · Sariswing FTP mix-up · --delete · service_role in old template · owner 403
SAFE_TO_IMPLEMENT_NEXT: true (planning/restore slice only; not live dispatch/FTP)
```

Live `supabase functions list --project-ref kmjqppxjdnwwrtaeqjta` **completed** (read-only). kmjq ACTIVE slugs: `gosaki-youtube-url-dry-run`, `gosaki-youtube-url-save`, `gosaki-discography-save-dry-run`, `gosaki-schedule-save-dry-run`, `gosaki-about-content-dry-run`, `gosaki-about-content-save`, `gosaki-youtube-supabase-save-dry-run`, `gosaki-about-supabase-save-dry-run`. **`trigger-deploy` and `deploy-status` are not deployed on kmjq.**

---

## 0. Two deploy paths (do not mix)

### Path A — Gosaki current (what production actually uses)

```txt
owner Save (kmjq Edge, can_write_site, dual Save arm)
  → DB / Storage (already live)
  → operator Cursor: npm run build:gosaki:production (anon build-read, kmjq)
  → public-dist/
  → human FileZilla → gosaki-piano.com document root
```

Chip on Gosaki `/admin/`: `本番CMS｜保存内容は公開ページへ自動反映されません`.

### Path B — Sariswing existing (source exists; not Gosaki)

```txt
Sariswing /admin AdminDeployBar 「公開サイトを更新」
  → Edge trigger-deploy (requireAdminUser)
  → GitHub workflow_dispatch deploy.yml ref=GITHUB_REF (default main)
  → npm run build  (= repo-root astro build = Sariswing site, not Gosaki package)
  → lftp mirror dist/ using GitHub Secrets LOLIPOP_FTP_*
  → Edge deploy-status polls the run
```

Inventory (G-5j / G-5n): **do not port `trigger-deploy` until staging/production workflow separation**. `deploy.yml` target is **Sariswing production FTP**, not Gosaki.

---

## 1. Admin Deploy UI

| Surface | Deploy button | Notes |
| --- | --- | --- |
| Gosaki production `/admin/` (kit templates) | **absent** | Portal cards: Schedule / Discography / YouTube / Profile only. No Deploy card, no `triggerDeploy`. |
| Earlier Gosaki staging HTML | `Deploy（無効）` | Intentionally **removed** (G-20u39b3 / G-20u39b4 verifiers: must **not** restore disabled Publish/Deploy/FTP row). |
| Sariswing `src/pages/admin` | **present** | `AdminDeployBar` + `deploy-trigger.ts` · `#triggerDeploy` · idle label `公開サイトを更新`. Login/forgot/reset set `showDeployBar={false}`. **Do not modify this surface for Gosaki.** |
| Kit scaffold | display-only | `AdminDeployStatus.astro` / `publish-example.astro` — not wired. |

**Why production cannot use it (direct):** Gosaki customer admin has **no control**. The only clickable Deploy bar belongs to **Sariswing** admin and would dispatch **Sariswing** `deploy.yml`.

**Armed condition:** none on Gosaki. No `PUBLIC_GOSAKI_DEPLOY_*` env. Sariswing bar is session-gated only (`button.disabled` until login); no dual Save-style arm.

**Owner operable?** Gosaki owner can log into kit `/admin/` and Save (when Save arms on). They **cannot** Deploy from that UI. Path B authz is **platform admin** (`requireAdminUser`), and docs record owner `can_write_site=true` / `is_admin=false` — so even a naive wire of Path B would **403 the owner**.

---

## 2. Admin → Edge

| Item | Value |
| --- | --- |
| Functions | `trigger-deploy`, `deploy-status` |
| Endpoint | `POST https://<project>.supabase.co/functions/v1/trigger-deploy` (and `deploy-status`) |
| Client | `src/lib/admin/deploy-api.ts` → `invokeAdminEdgeFunction` (Sariswing `supabaseAdmin` JWT) |
| JWT | `config.toml` `verify_jwt = true` |
| Authz | `requireAdminUser`: Bearer JWT + `app_metadata.role=admin` **or** email in `ADMIN_EMAILS` |
| Secrets | `GITHUB_TOKEN`, `GITHUB_REPO` required. `GITHUB_WORKFLOW_FILE` default `deploy.yml`. `GITHUB_REF` default `main`. |
| Arm / dry-run | **none**. Every successful POST **always** `workflow_dispatch`. No `dryRun` body branch. |
| Site scope | **none**. No `site_slug`. No kmjq vs vsbvnd STOP inside the function. |
| Gosaki kit admin | **does not invoke** these functions. |

kmjq already has `GITHUB_TOKEN` / `GITHUB_REPO` for **Contents API** YouTube/About Saves. That is **not** proof of `workflow` scope for Actions dispatch. This audit did not read Secret values.

**Do not call Path B against vsbvnd.** Linked CLI historically points at Sariswing production; any future Edge work must use `--project-ref kmjqppxjdnwwrtaeqjta`.

---

## 3. Edge → GitHub

`trigger-deploy` POSTs:

`https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflowFile}/dispatches`

Body: `{ ref: config.ref }` only (no `inputs`).

| Env | Role |
| --- | --- |
| `GITHUB_TOKEN` | PAT / token for dispatch + run poll |
| `GITHUB_REPO` | `owner/name` |
| `GITHUB_WORKFLOW_FILE` | default `deploy.yml` |
| `GITHUB_REF` | default `main` |

Owner vs platform admin: Path B is **platform-admin Edge**, not `can_write_site`. GitHub token lives on the **Supabase project** that hosts the function (Sariswing vs kmjq must not be mixed).

---

## 4. GitHub Actions

### 4.1 `.github/workflows/deploy.yml` (enabled)

- Trigger: `workflow_dispatch` only
- Build: **`npm run build`** at **repo root** → Sariswing Astro `dist/`
- Env: `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` from **GitHub Actions secrets** (Sariswing-oriented)
- Upload: `lftp` `mirror -R` of `dist/` → `LOLIPOP_FTP_*` (host/user/password/remote dir). **No `--delete`** here (unlike the kit template)
- **Not** `tools/static-to-astro` `build:gosaki:production`
- **Not** kmjq Gosaki bake
- **Must not** be the Gosaki customer Deploy target

### 4.2 `.github/workflows/gosaki-youtube-url-save-staging.yml`

Contents JSON patch for **legacy YouTube URL Save**. Explicitly **no FTP**. Superseded for current YouTube by kmjq `site_embeds` + public bake. Not a production static deploy.

### 4.3 Template `tools/static-to-astro/templates/github-actions/public-dist-ftp-deploy.yml`

- **Not copied** into `.github/workflows/` (docs: Phase 3-V not enabled)
- Old convert + `export-supabase-json` + **`SUPABASE_SERVICE_ROLE_KEY`** (forbidden for Gosaki routine generate)
- `mirror -R --delete` — **unsafe** post G-7f
- Assumes public-dist **excludes admin**; current Gosaki production package **includes** `/admin/` (noindex)

### 4.4 Local hardened FTP CLI

`deploy-public-dist-ftp.mjs` / `public-dist-ftp-deployer.mjs`:

- `--env staging` only; production env **rejected**
- Staging secret **names** (values not documented): `GOSAKI_STAGING_FTP_*`
- G-7f1: `cmd:fail-exit`, pwd check, block `/` `.` empty, `--delete` default off
- Gate: `readyForAnyFutureFtpApply: false`

### 4.5 Production FTP credentials

- **Not** in repo. This audit does not print host/user/password/path.
- Operator FileZilla is the live production upload method.
- Profile `gosaki-piano.deploy-profiles.json` production `remotePath` is still `TBD_G-20i` (config not updated after cutover).
- Automated path would need **dedicated Gosaki production** GitHub Secrets — **not** `LOLIPOP_FTP_*` (Sariswing).

---

## 5. Why it is stopped (classification)

| Category | Applies? | Detail |
| --- | --- | --- |
| UI gate | **yes (primary)** | No Deploy button on Gosaki admin; disabled row removed on purpose |
| Edge gate | **yes** | Path B always dispatches; no Gosaki arm; no dry-run; no site STOP |
| Secret不足 | **partial** | kmjq Contents token exists; workflow-dispatch scope + Gosaki FTP Actions secrets **unverified / unwired** |
| GitHub workflow不足 | **yes** | No workflow that runs `build:gosaki:production` + Gosaki public-dist FTP |
| GitHub Actions Secret不足 | **likely yes** | Need kmjq public URL/anon + Gosaki FTP keys; must not reuse Sariswing FTP secrets |
| FTP credentials不足 | **for automation** | Human FileZilla has them; CI does not (by design after G-7f) |
| production upload step未実装 | **yes (admin-driven)** | Generate exists; auto upload to gosaki-piano.com not implemented/enabled |
| authz不足 | **yes for owner Deploy** | Path B = `requireAdminUser`; Gosaki Save = `can_write_site` |
| safety上意図的に停止 | **yes** | G-7f FTP `--apply` suspended; G-5n; AGENTS.md `workflow_dispatch` / FTP apply need explicit approval |
| その他 | chip copy | UI **states** that public pages do not auto-reflect |

---

## 6. Minimum restore (reuse patterns, do not invent a new system)

**Forbidden reuse:** wire Gosaki UI → existing `trigger-deploy` → `deploy.yml` → `LOLIPOP_FTP_*`. That updates **Sariswing**, not Gosaki.

Reuse instead:

1. **Workflow pattern** of `deploy.yml` (`workflow_dispatch` + Node 22 + lftp) but:
   - job cwd `tools/static-to-astro`
   - `npm run build:gosaki:production`
   - export **only** kmjq `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (no `service_role`)
   - upload `output/manual-upload/gosaki-piano-production/public-dist/`
   - G-7f1: no `--delete`; `cmd:fail-exit`; `cd`+`pwd` match; block `/`; dedicated Gosaki remote dir
2. **Edge pattern** of `trigger-deploy` / `deploy-status` as a **new kmjq function** (or hard-gated fork), **not** changing Sariswing Path B:
   - `can_write_site` after `site_slug=gosaki-piano`
   - dual arm (`PUBLIC_…` client + Edge Secret)
   - `GITHUB_WORKFLOW_FILE` = the new Gosaki YAML only
   - STOP if project ref is `vsbvndwuajjhnzpohghh`
3. **UI pattern** of `AdminDeployBar` copied into **kit** Gosaki `/admin/` (not `src/pages/admin`).
4. **Lift** `readyForAnyFutureFtpApply` only after operator G-7f1 approval form — first slice can stop at **dry-run dispatch / no FTP**.

Suggested next phase name: `gosaki-admin-deploy-restore-planning` (still no dispatch/FTP).

---

## 7. Risks

- Repeating G-7f (`mirror --delete` after failed `cd` → FTP login root)
- Dispatching `deploy.yml` onto Gosaki click → Sariswing `dist/` to Sariswing FTP
- Using template `public-dist-ftp-deploy.yml` (`--delete` + `service_role` + stale convert)
- Owner 403 if authz stays `requireAdminUser`
- `GITHUB_TOKEN` without Actions `workflow` scope
- Baking wrong HEAD / missing Save arm so public HTML lags DB
- Mixing vsbvnd Edge or Actions secrets with kmjq

---

## 8. Not done this phase

- implementation
- Secret set/unset
- Edge deploy / functions list (hung, not retried)
- workflow_dispatch
- GitHub write
- FTP
- commit / push
- printing FTP credential values
