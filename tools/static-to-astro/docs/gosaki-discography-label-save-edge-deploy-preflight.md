# G-20u43a — Gosaki Discography label Save Edge deploy preflight

**Phase:** `G-20u43a-gosaki-discography-label-save-edge-deploy-preflight`  
**Status:** **complete** — read-only preflight record only  
**Date:** 2026-07-17  
**HEAD at preflight:** `5c0d892` (= `origin/main`; working tree clean at phase **start**)  
**Deploy diff baseline (rollback):** `4c2e589` (pre-G-20u43 Edge source)  
**Prior:** G-20u43 label controlled Save slice local implementation

| Check | Status |
| --- | --- |
| Deploy target fixed | **yes** |
| Single-function deploy scope confirmed | **yes** |
| Deploy diff vs `4c2e589` documented | **yes** |
| Safety / rollback / smoke-test plan fixed | **yes** |
| Operator execution commands | **not in this doc** (ChatGPT later) |
| Edge deploy | **no** |
| Save request | **no** |
| DB write | **no** |
| env / Secret change | **no** |
| package / FTP | **no** |
| Production touched | **no** |

---

## Gates

```txt
phase: G-20u43a-gosaki-discography-label-save-edge-deploy-preflight
EDGE_DEPLOY_PREFLIGHT_READY: true
TARGET_PROJECT_FIXED: true
TARGET_FUNCTION_FIXED: true
SINGLE_FUNCTION_DEPLOY_CONFIRMED: true
NEW_SECRETS_REQUIRED: false
NON_WRITE_SMOKE_TEST_PLAN_FIXED: true
ROLLBACK_BASELINE_FIXED: true
ROLLBACK_PLAN_FIXED: true
EDGE_DEPLOY_EXECUTED: false
SAVE_REQUEST_EXECUTED: false
DB_WRITE_EXECUTED: false
CONTROLLED_SAVE_PREFLIGHT_READY: false
SERVICE_ROLE_USED: false
PRODUCTION_TOUCHED: false
```

**STOP:** This phase does **not** authorize Edge deploy, env/Secret mutation, authenticated Save, or STG package arm.  
**CONTROLLED_SAVE_PREFLIGHT_READY** remains **false** until a separate controlled Save execution-readiness phase after deploy + smoke.

---

## Deploy target (locked)

| Item | Value |
| --- | --- |
| Supabase project name | `static-to-astro-cms-staging` |
| Project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Production STOP | `vsbvndwuajjhnzpohghh` — **forbidden** |
| Edge Function (only) | **`gosaki-discography-save-dry-run`** |
| Endpoint path | `/functions/v1/gosaki-discography-save-dry-run` |
| Source commit to deploy | **`5c0d892`** (G-20u43 on main) |
| Rollback baseline commit | **`4c2e589`** |

**Out of scope:** all other Edge Functions · DB migrations · Secrets rotation · RLS · Storage · GitHub Actions · STG package regen · FTP.

---

## 1. Deploy diff (`4c2e589` → `5c0d892`)

### Files included in Edge deploy bundle

| File | Change |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | **+593 lines** — G-20u43 label slice + nested allowlist + update row classifier |
| `supabase/functions/gosaki-discography-save-dry-run/index.ts` | **comment only** (+5 / −4) — documents G-20u43; **no runtime / CORS change** |

**Local modules imported by deploy bundle:** **none** beyond `./handler.ts`.  
`handler.ts` imports only `npm:@supabase/supabase-js@2` (bundled by Supabase CLI).

**Other repo Edge Functions exist** (`admin-schedule`, `gosaki-youtube-url-dry-run`, etc.) but are **not** in this deploy scope.

### G-20u43 label slice additions (handler)

| Area | Addition |
| --- | --- |
| Constants | `G20U43_LABEL_SAVE_APPROVAL_ID`, `G20U43_LABEL_LEGACY_ID` (`discography-004`), label original/temporary strings |
| Router | `handleDiscographyEdgeDryRunHttpAsync`: `approvalId === G-20u43…` → `handleControlledG20u43LabelSaveHttp`; else existing `handleControlledG20u36eSaveHttp` |
| Registry | `SAVE_APPROVAL_REGISTRY` entry for G-20u43 save approval |
| Nested allowlist | `validateG20u43NestedSavePayload` — own enumerable keys for `release` / `trackPolicy` / `clientDryRun` |
| Auth | user JWT Bearer + `public.is_admin() === true` (same model as G-20u36e) |
| UPDATE | `discography.label` only · `.eq(site_slug).eq(legacy_id).eq(label, before).eq(updated_at, lock)` |
| Row count | `classifyG20u43LabelUpdateOutcome` — 0 rows → 409 · ≠1 → 500 · missing `updated_at` → 500 |
| Success body | includes `updated_at` + `updatedAt` |

### Nested allowlists (G-20u43 branch only)

| Object | Allowed keys |
| --- | --- |
| `release` | `title`, `artist`, `release_date`, `label`, `catalog_number`, `published`, `cover_image_url`, `purchase_url`, `streaming_url`, `description` |
| `trackPolicy` | `oneLineOneTrack`, `blankLinesIgnored`, `allowDuplicateTitles`, `allowEmptyTrackList` |
| `clientDryRun` | `totalBefore`, `totalAfter`, `added`, `removed`, `reordered`, `wouldWrite` (`false` required) |

Unknown own keys → `nested_payload_invalid` (400). Label-only diff enforced vs DB; non-label release scalar change rejected.

### Existing paths preserved

| Path | Impact |
| --- | --- |
| **dry-run** (`operation=dryRun`, `G-20u31…`) | **unchanged** — sync/async simulate path; no G-20u43 router |
| **track-title Save** (`G-20u36…` / `G-20u36f…`) | **unchanged** — still `handleControlledG20u36eSaveHttp` when approval ≠ G-20u43 |
| **CORS / OPTIONS** | **unchanged** — `index.ts` runtime identical; OPTIONS → `ok` + same `corsHeaders` |
| **readBack** | **unchanged** — optional `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` gate |

### Secrets / env

| Name | New for G-20u43? | Role |
| --- | --- | --- |
| `SUPABASE_URL` | **no** | staging project URL (existing) |
| `SUPABASE_ANON_KEY` | **no** | anon client for auth RPC + controlled Save (existing) |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | **no** | optional dry-run readBack (existing) |
| `SUPABASE_SERVICE_ROLE_KEY` | **not used** | handler sets `SUPABASE_SERVICE_ROLE_CONNECTED = false` |

**NEW_SECRETS_REQUIRED: false**

---

## 2. Deploy safety (preflight facts)

| Check | Result |
| --- | --- |
| Project ref = staging `kmjqppxjdnwwrtaeqjta` | **yes** |
| Production ref `vsbvndwuajjhnzpohghh` in deploy target | **no** — STOP if used |
| Function name exact match | **`gosaki-discography-save-dry-run`** |
| Deploy scope = single function | **yes** — do not batch-deploy other functions |
| DB migration bundled | **no** |
| Edge deploy alone causes DB write | **no** |
| Auto Save on deploy | **no** |
| cron / webhook / background trigger in function | **no** — HTTP request only |
| Save without authenticated explicit POST | **no** |
| STG package default `saveArmed` | **false** (`PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` unset) |
| Local shell unconditional arm | **no** — exact `"true"` only |

### UI arm (unchanged by this preflight)

- Env: `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED`
- Armed **only** when value === `"true"` (`isG20u41DiscographyOperationalSaveArmed`)
- STG package builds default disarmed; deploy does not change built packages

---

## 3. Pre-deploy verification (Cursor — non-write)

Run from `tools/static-to-astro`:

- `verify:g20u43-gosaki-discography-label-controlled-save-slice-local-implementation`
- `verify:g20u42-gosaki-discography-controlled-save-enablement-preflight`
- `verify:g20u25-discography-filtered-read-enablement`
- `verify:current-active-regression`
- `verify:g20u43a-gosaki-discography-label-save-edge-deploy-preflight`

Optional: `deno check` on `supabase/functions/gosaki-discography-save-dry-run/index.ts` (no network Save).

**Forbidden in this phase:** live endpoint dry-run POST · authenticated Save POST · DB write · deploy CLI.

**Deploy execution prerequisite:** commit preflight artifacts · confirm `HEAD = origin/main` · **working tree clean** immediately before operator deploy.

---

## 4. Post-deploy non-write smoke test plan (criteria only)

**Purpose:** confirm deploy did not widen write surface before any controlled Save execution.  
**Operator procedure:** ChatGPT presents commands; this doc fixes **expected outcomes only**.

### Must NOT cause DB write

| Case | Expected |
| --- | --- |
| OPTIONS preflight | HTTP success · CORS headers unchanged (`Access-Control-Allow-Origin: *`, `POST, OPTIONS`, `authorization, apikey, content-type`) |
| POST without `Authorization` + `operation=save` | **reject** (401/403 or controlled-save auth failure) — **no row change** |
| POST `operation=save` + wrong / missing `approvalId` | **reject** — not G-20u43 success |
| POST `operation=save` + G-20u43 approval + invalid nested payload (e.g. `release.extra`) | **400** `nested_payload_invalid` — **no row change** |
| POST unknown `operation` | **reject** |
| POST `operation=save` + G-20u43 + well-formed label payload **without** admin JWT | **reject** — **no row change** |

### Authenticated G-20u43 Save

**Do not send** in deploy smoke phase. Reserved for controlled Save **execution** phase with explicit approval.

### Read-only data unchanged checks

| Check | Baseline (pre-deploy / G-20u42 capture) |
| --- | --- |
| Filtered read (`site_slug=gosaki-piano`) | **4 releases · 34 tracks** (G-20u25) |
| `discography-004.label` | `Mardi Gras JAPAN Records` |
| `discography-004.updated_at` | `2026-07-10T05:59:35.138671+00:00` |
| Other releases | no unexpected label / scalar drift |

### Smoke failures (STOP deploy acceptance)

- Any case that must reject returns **2xx success**
- `discography-004.label` or `updated_at` changes after non-write smoke
- G-20u25 filtered read count drift without explanation
- CORS regression blocks existing admin dry-run client

---

## 5. Rollback plan (fixed · not executed)

| Item | Value |
| --- | --- |
| Rollback function | **`gosaki-discography-save-dry-run` only** |
| Rollback source commit | **`4c2e589`** |
| Method | Re-deploy function source from baseline commit via temporary worktree / checkout snapshot — **do not** `git reset` main |
| DB rollback | **not required** — deploy alone does not write DB |
| Post-rollback verify | OPTIONS/CORS OK · G-20u43 approval path absent on Edge · dry-run + track-title paths as at `4c2e589` · `discography-004.label` + `updated_at` unchanged |
| Rollback complete when | Staging function behavior matches `4c2e589` bundle · non-write smoke PASS · filtered read baseline unchanged |

---

## 6. Deploy success criteria (for operator execution phase)

| Criterion | Required |
| --- | --- |
| Deploy to staging `kmjqppxjdnwwrtaeqjta` | **yes** |
| Only `gosaki-discography-save-dry-run` deployed | **yes** |
| Deploy command exit 0 | **yes** |
| Function visible in staging functions list | **yes** |
| Non-write smoke (§4) outcomes match | **yes** |
| G-20u25 filtered read PASS | **yes** |
| `discography-004.label` = `Mardi Gras JAPAN Records` | **yes** |
| `discography-004.updated_at` = `2026-07-10T05:59:35.138671+00:00` | **yes** |
| Other releases unchanged | **yes** |
| Save request sent | **no** (smoke phase) |
| DB write | **no** (smoke phase) |
| Production change | **no** |

---

## 7. STOP conditions

| Condition | Action |
| --- | --- |
| Project ref unknown / ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Function name unknown / ≠ `gosaki-discography-save-dry-run` | **STOP** |
| Deploy includes other functions | **STOP** |
| New Secret required | **STOP** (current assessment: **none**) |
| Local verifier FAIL | **STOP** |
| `deno check` FAIL | **STOP** |
| Unintended CORS / auth diff in `index.ts` runtime | **STOP** |
| Rollback baseline `4c2e589` unreachable | **STOP** |
| Post-deploy `label` / `updated_at` drift without Save | **STOP** |
| Non-write case returns 2xx | **STOP** |
| Ambiguous network outcome | **STOP** — do not retry Save |
| Production connection possible | **STOP** |
| `service_role` required | **STOP** |

---

## Recommended next

**ChatGPT:** Edge deploy execution judgment + operator procedure (separate phase; not this doc).

Do **not** treat `EDGE_DEPLOY_PREFLIGHT_READY: true` as permission to execute authenticated label Save.
