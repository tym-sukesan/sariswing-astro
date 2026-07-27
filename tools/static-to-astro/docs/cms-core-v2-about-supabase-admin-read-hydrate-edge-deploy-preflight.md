# CMS Core v2 — About Supabase Admin read/hydrate Edge re-deploy preflight

**Phase:** `cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight`
**Status:** **preflight complete** — staging re-deploy readiness locked · **no Edge deploy / Secret / remote invoke / SQL / FTP / package**
**Date:** 2026-07-28
**Baseline HEAD:** `c93f9e862150ab11d0eeaa69e647cb6aea31777f`
**Prior:** [read/hydrate local implementation](./cms-core-v2-about-supabase-admin-read-hydrate-local-implementation.md) · first Edge deploy + post-deploy QA **PASS**
**Verifier:** `scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.mjs`
**Related:** [original deploy preflight](./cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.md) · [post-deploy QA runbook](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-runbook.md)

| Check | Status |
| --- | --- |
| Root ↔ tools mirror (`handler.ts` / `index.ts`) | **PASS** (byte identical) |
| `operation:"read"` contract review | **PASS** |
| Existing `dryRun` / `save_not_armed` contract | **retained** |
| Staging target locked | **yes** (`kmjqppxjdnwwrtaeqjta`) |
| Production `vsbvndwuajjhnzpohghh` | **STOP / untouched** |
| `supabase functions deploy` executed | **no** |
| Secret change / remote invoke | **no** |
| Save arm `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **unset / not `true`** (must stay) |
| `service_role` | **not used** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight
ABOUT_SUPABASE_ADMIN_READ_HYDRATE_EDGE_DEPLOY_PREFLIGHT_COMPLETE: true
EDGE_REDEPLOY_PREFLIGHT_READY: true
readyForAboutSupabaseAdminReadHydrateEdgeRedeployExecution: true
EDGE_DEPLOY_EXECUTED: false
EDGE_REDEPLOY_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
NEW_SECRETS_REQUIRED: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
MIGRATION_RLS_SEED_REAPPLY: false
baselineHead: c93f9e862150ab11d0eeaa69e647cb6aea31777f
```

**Do not deploy** until a separate execution phase with explicit AGENTS / operator approval:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 1. Deploy 可否

| Question | Answer |
| --- | --- |
| Staging 再deploy 可否（承認後） | **YES** — preflight PASS |
| 今すぐ deploy（承認なし） | **NO** |
| Production deploy | **NO / STOP** |
| Save arm を立ててよいか | **NO** — 未設定維持 |
| Function 複数同時 deploy | **NO** — 1件のみ |

---

## 2. Deploy target (locked)

| Item | Value |
| --- | --- |
| Project | `static-to-astro-cms-staging` |
| Project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Function (only) | **`gosaki-about-supabase-save-dry-run`** |
| URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run` |
| Source | `supabase/functions/gosaki-about-supabase-save-dry-run/{handler,index}.ts` |
| Mirror | `tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/` |
| Reason | Local `operation:"read"` SELECT-only hydrate must reach staging for Admin About live-read |

### Blocked

- `--project-ref vsbvndwuajjhnzpohghh`
- Other function names / batch deploy
- Contents About Edges (`gosaki-about-content-*`)
- Discography / Schedule / YouTube Edges
- Setting `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true`

---

## 3. Deploy command (documented — NOT executed)

From repo root `~/sariswing-astro` **after** explicit approval only:

```bash
supabase functions deploy gosaki-about-supabase-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

**Locked properties:**

- Staging ref only
- Exact single function name
- No `--no-verify-jwt`
- No Secret CLI in the same phase
- Deploy alone does not mutate `site_page_fields` (HTTP required; Save still needs arm)

`config.toml` already has:

```toml
[functions.gosaki-about-supabase-save-dry-run]
verify_jwt = true
```

Handler still enforces JWT + `can_write_site` for all POST operations including `read`.

---

## 4. Source contract review (static)

### 4.1 `operation:"read"`

| Item | Requirement | Status |
| --- | --- | --- |
| Auth | Bearer JWT + anon · `auth.getUser()` | **PASS** |
| Permission | `can_write_site(site_id)` must be `true` | **PASS** |
| Allowlist | `siteSlug=gosaki-piano` · `pageKey=about` · `fieldKey=profile.lede` only | **PASS** |
| Mutates | SELECT only · no INSERT/UPDATE/DELETE | **PASS** |
| `nextValueText` | **not required** (returns before `value_text_required` gate) | **PASS** |
| Save approval | **not required** | **PASS** |
| Response | `ok` · `operation:"read"` · `pageKey` · `fieldKey` · `valueText` · `updatedAt` · `didWrite/dbWrite/networkWrite:false` | **PASS** |
| `service_role` | unused · `SUPABASE_SERVICE_ROLE_CONNECTED=false` | **PASS** |

### 4.2 Existing contracts retained

| Contract | Status |
| --- | --- |
| `operation=dryRun` plan · WRITE_FALSE | **retained** |
| `operation=save` without arm → **403** `save_not_armed` · **`ok:false`** (plan spread then `ok:false`) | **retained** |
| Save UPDATE `value_text` only + optimistic lock | **retained** |
| Wrong site / page / field → **400** | **retained** |
| Missing JWT → **401** | **retained** |
| Contents G-12a parallel path | **unchanged** (not redeployed) |

### 4.3 Mirror

```bash
cmp supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts \
  tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts
cmp supabase/functions/gosaki-about-supabase-save-dry-run/index.ts \
  tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/index.ts
```

Expected: exit 0 (byte identical).

---

## 5. Save arm state

| Surface | Required state |
| --- | --- |
| Remote Function secret `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **unset** or not exactly `true` |
| Local `.env` / `.env.local` | must not set `=true` |
| Client `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | **false** (package bake separate) |
| During / after this re-deploy | **do not set** Save arm |

Disarmed Save probe must still return **403** · `error:"save_not_armed"` · **`ok:false`** · write flags false.

---

## 6. Post-deploy QA手順（実行は別フェーズ）

**This preflight does not invoke.** After approved re-deploy only:

### 6.1 Pre-QA SELECT (operator / SQL editor — SELECT only)

Capture baseline:

```sql
select value_text, updated_at, published, sort_order
from public.site_page_fields
where site_slug = 'gosaki-piano'
  and page_key = 'about'
  and field_key = 'profile.lede';
```

Expected seed `value_text` (unless intentionally changed earlier):
`後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。`

### 6.2 HTTP checks

Function URL:
`https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run`

| # | Case | Expected |
| --- | --- | --- |
| 1 | POST **without** `Authorization` | **401** · no DB write |
| 2 | Owner JWT · `operation:"read"` · allowlisted keys · **no** `nextValueText` · **no** Save approval | **200** · `ok:true` · `operation:"read"` · `valueText` matches DB · `didWrite/dbWrite/networkWrite:false` |
| 3 | Owner JWT · wrong `pageKey` or `fieldKey` | **400** |
| 4 | Owner JWT · `operation:"save"` · Save approval · arm unset | **403** · `save_not_armed` · **`ok:false`** · no row change |
| 5 | Optional: owner `operation:"dryRun"` with approval + `nextValueText` | **200** · write flags false (regression) |

### 6.3 Example read body

```json
{
  "operation": "read",
  "siteSlug": "gosaki-piano",
  "pageKey": "about",
  "fieldKey": "profile.lede"
}
```

### 6.4 Post-QA SELECT

Re-run the same SELECT. Require:

- `updated_at` **unchanged** vs pre-QA
- `value_text` **unchanged**

### 6.5 After QA PASS

1. Record result doc (new phase)
2. Regenerate Admin-path package (path env true · Save UI arm false · build-read unset)
3. Operator manual FTP of `public-dist/` only
4. Browser: `/admin/about/` hydrates lede from DB · Save still disabled · public About JSON unchanged

---

## 7. STOP conditions

Stop and ask human if:

- Production / wrong project ref might be targeted
- Deploy command would include other functions
- `service_role` or Secret change (esp. Save arm) is requested
- Deploy hangs / non-JSON / ambiguous outcome
- Desire to retry deploy without new approval
- `updated_at` changed during QA
- Migration / RLS / seed re-apply requested
- FTP / package / Contents Save bundled into deploy phase
- Rollback plan unclear

Failure rule:

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

---

## 8. Rollback / incident

| Situation | Action |
| --- | --- |
| Re-deploy not yet run | N/A |
| Re-deploy OK but QA fails | **STOP** · do not retry · do not arm Save · leave prior behavior for human review |
| Need previous bundle | Prefer leave current disarmed; re-deploy older commit **only** with new explicit approval |
| Accidental Save arm | Unset secret · verify `save_not_armed` · confirm row unchanged |
| DB write detected | STOP · no auto SQL rollback · ask human |

**This preflight does not authorize deploy, delete, or Secret change.**

---

## 9. Preflight verification (this phase)

```bash
cd ~/sariswing-astro
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-edge-deploy-preflight.mjs
git diff --check
```

**Not run:** `supabase functions deploy` · remote invoke · Secret CLI · SQL mutation · package · FTP.
