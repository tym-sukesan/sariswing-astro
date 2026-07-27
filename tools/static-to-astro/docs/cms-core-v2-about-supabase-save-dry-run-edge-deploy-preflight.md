# CMS Core v2 — About Supabase `gosaki-about-supabase-save-dry-run` Edge deploy preflight

**Phase:** `cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight`

**Status:** **preflight complete** — deploy readiness locked; **no Edge deploy / Secret change / remote invoke / SQL / FTP**

**Date:** 2026-07-24

**Source HEAD (preflight):** `1806366` (`feat: add About Supabase dual path`)

**Prior:** dual-path local implementation · staging migration/RLS/seed applied

**Verifier:** `scripts/verify-cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.mjs`

**Related:** [local-implementation](./cms-core-v2-about-supabase-vertical-slice-local-implementation.md) · [FTP post QA](./cms-core-v2-about-supabase-ftp-post-qa.md)

| Check | Status |
| --- | --- |
| Function source static review | **PASS** |
| Root ↔ tools mirror byte match | **PASS** |
| Staging project target locked | **yes** (`kmjqppxjdnwwrtaeqjta`) |
| Production `vsbvndwuajjhnzpohghh` | **STOP / untouched** |
| `supabase functions deploy` executed | **no** |
| Secret change / remote Function call | **no** |
| Save arm (`GOSAKI_ABOUT_SUPABASE_SAVE_ARMED`) | **unset / not `true`** (local + intended remote) |
| service_role | **not used** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight
ABOUT_SUPABASE_EDGE_DEPLOY_PREFLIGHT_COMPLETE: true
EDGE_DEPLOY_PREFLIGHT_READY: true
readyForAboutSupabaseEdgeDeployExecution: true
EDGE_DEPLOY_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
NEW_SECRETS_REQUIRED: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
MIGRATION_RLS_SEED_REAPPLY: false
```

**Do not deploy** until a separate execution phase with explicit AGENTS / operator approval of the form:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 1. Deploy target (locked)

| Item | Value |
| --- | --- |
| Project name | `static-to-astro-cms-staging` |
| Project ref | **`kmjqppxjdnwwrtaeqjta`** |
| API host | `https://kmjqppxjdnwwrtaeqjta.supabase.co` |
| Function name (only) | **`gosaki-about-supabase-save-dry-run`** |
| Invoked URL (after deploy) | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run` |
| Source paths | `supabase/functions/gosaki-about-supabase-save-dry-run/{handler,index}.ts` |
| Tools mirror | `tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/` (must match root) |

### Blocked

| Item | Value |
| --- | --- |
| Production project ref | `vsbvndwuajjhnzpohghh` — **STOP** |
| Batch deploy of other functions | **forbidden** |
| Contents About Edges | `gosaki-about-content-dry-run` / `gosaki-about-content-save` — **do not redeploy** |
| Discography / Schedule / YouTube Edges | **out of scope** |
| Secret set of `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true` | **forbidden in deploy phase** |

---

## 2. Deploy command (documented — NOT executed)

From repo root `~/sariswing-astro` (after AGENTS approval only):

```bash
supabase functions deploy gosaki-about-supabase-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

**Preflight confirms:**

- Command targets staging ref only — never `--project-ref vsbvndwuajjhnzpohghh`
- Single function name exact match
- No `--no-verify-jwt` override in the locked command
- Deploy alone does **not** write `site_page_fields` (HTTP request required; Save additionally requires arm)

`config.toml` local entry (added in this preflight for parity with other admin functions):

```toml
[functions.gosaki-about-supabase-save-dry-run]
verify_jwt = true
```

Runtime still enforces JWT + `can_write_site` in handler.

---

## 3. Source / dependency review

| File | Role |
| --- | --- |
| `handler.ts` | Auth, allowlist, dry-run plan, gated Save UPDATE |
| `index.ts` | `Deno.serve` · OPTIONS CORS · JSON response |

**Imports:** `npm:@supabase/supabase-js@2` only (no `_shared` from other functions).
**Root ↔ mirror:** `diff` of `handler.ts` and `index.ts` → **identical** (exit 0).

| Check | Result |
| --- | --- |
| Endpoint name | `gosaki-about-supabase-save-dry-run` |
| Site | `gosaki-piano` only |
| Slice | `page_key=about` · `field_key=profile.lede` only |
| Staging URL gate | `SUPABASE_URL` must include `kmjqppxjdnwwrtaeqjta`; production ref → `403 production_ref_stop` |
| Auth | `Authorization: Bearer <user JWT>` + anon key client · `auth.getUser()` |
| Permission | `sites` lookup → RPC `can_write_site(p_site_id)` must be `true` |
| `service_role` | **not** imported / **not** used · `SUPABASE_SERVICE_ROLE_CONNECTED = false` |
| Dry-run (`operation=dryRun` or default) | SELECT + plan only · `didWrite/dbWrite=false` · **no** `.update` |
| Save (`operation=save`) | Requires approval ID + `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED===true` + optimistic lock |
| Field write allowlist | UPDATE body: **`value_text` only** (published/sort_order not mutated in Save path) |
| Optimistic lock | `expectedBeforeUpdatedAt` must match row `updated_at`; UPDATE also `.eq("updated_at", before)` |
| Fingerprint | JSON of page/field/valueText/published/sortOrder/updatedAt |
| Contents API / GitHub | **not used** (parallel G-12a path retained elsewhere) |

### Status codes (handler)

| Case | Status | Notes |
| --- | --- | --- |
| OPTIONS | 204 (handler) / 200 `ok` (index CORS short-circuit) | CORS headers on index |
| Non-POST | 405 | |
| Bad JSON / wrong site / wrong page·field / approval mismatch / empty value | 400 | |
| Missing/invalid JWT | 401 | |
| Production URL / non-staging URL / site missing / `can_write_site` deny / Save not armed | 403 | Save → `save_not_armed` |
| Row missing (seed required) | 404 | |
| Stale lock / 0-row update | 409 | |
| Load/update DB error | 500 | |
| Dry-run OK / Save no-change / Save write OK | 200 | Write only when armed + changed |

### CORS (`index.ts`)

```txt
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Content-Type: application/json (POST responses)
```

---

## 4. Save arm state (current)

| Surface | State |
| --- | --- |
| Env name | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` |
| Armed when | value **exactly** `"true"` |
| Local repo `.env` / `.env.local` | **unset** (no match) |
| Intended remote Function secret at deploy | **unset or not `true`** — do **not** set during deploy |
| Client UI arm | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` default **false** (package/bake separate) |
| Handler behavior if Save called while disarmed | **403** `save_not_armed` · **`ok:false`** · `didWrite=false` · `saveArmed=false` (plan diagnostics kept; `plan.ok` must not overwrite) |

**Deploy phase must leave Save disarmed.** Controlled Save is a later phase with its own approval ID `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice`.

Dry-run approval ID: `G-cms-v2-about-supabase-profile-lede-dry-run`.

---

## 5. Impact on existing Edge Functions

| Function | This deploy |
| --- | --- |
| `gosaki-about-content-dry-run` / `gosaki-about-content-save` | **unchanged** (not in deploy command) |
| `gosaki-youtube-*` / `gosaki-discography-save-dry-run` / `gosaki-schedule-save-dry-run` | **unchanged** |
| `admin-*` / `trigger-deploy` / `deploy-status` | **unchanged** |
| New function only | **creates** `gosaki-about-supabase-save-dry-run` on staging |

No shared `_shared` edits. Bundle is self-contained under the function directory.

---

## 6. Post-deploy remote dry-run QA (plan only — not executed here)

**Forbidden until deploy execution phase:** live curl / Admin invoke / authenticated Save / Secret change.

After operator deploy (separate phase), non-write / dry-run QA criteria:

| Case | Expected |
| --- | --- |
| `supabase functions list --project-ref kmjqppxjdnwwrtaeqjta` | New function present · version active |
| OPTIONS | CORS headers present · success |
| POST without `Authorization` | **401** · no DB write |
| POST `operation=dryRun` + valid JWT + `can_write_site` + approval `G-cms-v2-about-supabase-profile-lede-dry-run` + `about`/`profile.lede` | **200** · `didWrite=false` · `dbWrite=false` · plan with before/after |
| POST wrong `pageKey`/`fieldKey` | **400** |
| POST `operation=save` while arm unset | **403** `save_not_armed` · **`ok:false`** · **no** row change |
| POST `operation=save` + wrong approval | **400** · no write |
| Seeded `value_text` / `updated_at` baseline | **unchanged** after dry-run / disarmed Save probes |
| Other Edge endpoints | smoke optional · must remain reachable (no redeploy) |

**Do not** arm Save or run authenticated successful Save in deploy QA.

---

## 7. STOP conditions

Stop immediately and ask human if any of:

- Deploy target might be production / wrong project ref
- Command would deploy more than this one function
- `service_role` appears necessary
- Secret change requested (especially Save arm)
- Outcome of deploy or QA is ambiguous / hang / non-JSON
- Desire to re-run migration / RLS / seed
- FTP / Contents Save / workflow_dispatch involved
- Rollback unclear

Failure rule (AGENTS):

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

---

## 8. Rollback / incident plan

| Situation | Action |
| --- | --- |
| Deploy not yet run | N/A — stay undeployed |
| Deploy succeeded but QA fails (ambiguous) | **STOP** — do not retry deploy · do not set Save arm · do not delete without explicit approval |
| First-deploy rollback (approved) | Prefer leave function in place disarmed; **or** approved one-shot `supabase functions delete gosaki-about-supabase-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta` |
| Accidental Save arm | Unset secret / set not `true` · verify Save returns `save_not_armed` · check row unchanged |
| DB row wrongly written | STOP · do not auto-rollback SQL · ask human (seed rollback only with explicit approval) |

**This preflight does not authorize delete or redeploy.**

---

## 9. Pre-deploy verification (this phase)

```bash
cd tools/static-to-astro
node scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs
node scripts/verify-cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.mjs
# root/mirror: included in preflight verifier
git -C ../.. diff --check
```

**Not run here:** `supabase functions deploy` · remote invoke · Secret CLI · SQL.

---

## 10. Deploy readiness decision

| Question | Answer |
| --- | --- |
| Deploy 可否 (staging · AGENTS承認後) | **YES** — preflight PASS |
| Deploy now without approval? | **NO** |
| Save arm during/after deploy QA? | **NO** — keep disarmed |
| Next after approved deploy | Remote dry-run QA → Admin-path package (`PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED`) → operator manual FTP + [ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md) |

```txt
EDGE_DEPLOY_PREFLIGHT_READY: true
readyForAboutSupabaseEdgeDeployExecution: true
EDGE_DEPLOY_EXECUTED: false
```
