# Discography site-owner authz Slice A — Edge deploy preflight

- **Phase:** `discography-site-owner-authz-slice-a-edge-deploy-preflight`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (read-only preflight · deploy not executed)**
- **HEAD:** `b435a9e5d16bc5ecbbbd85b4c7127a77088225c3`
- **Prior:** `discography-site-owner-authz-slice-a-staging-apply-result-recording`
- **This phase:** inspect local Edge source + staging function inventory before deploying `gosaki-discography-save-dry-run` · **no** Edge deploy · **no** Secrets change · **no** DB write · **no** arm ON · **no** Save · **no** commit/push by Cursor

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-edge-deploy-preflight
EDGE_PREFLIGHT_PASS: true
FUNCTION_NAME: gosaki-discography-save-dry-run
FUNCTION_SOURCE_PATH: supabase/functions/gosaki-discography-save-dry-run/
HANDLER_MIRROR_IN_SYNC: true
INDEX_MIRROR_IN_SYNC: false
MIRROR_IN_SYNC: false
EDGE_AUTHZ_CAN_WRITE_SITE: true
LEGACY_IS_ADMIN_EDGE_GATE_PRESENT: false
CALLER_JWT_PRESERVED: true
REQUIRED_SECRETS: SUPABASE_URL,SUPABASE_ANON_KEY
OPTIONAL_EXISTING_SECRETS: GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED,GOSAKI_DISCOGRAPHY_SAVE_ARMED
NEW_SECRETS_REQUIRED: false
SERVICE_ROLE_USED: false
DEPLOY_COMMAND: supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
ROLLBACK_PLAN: redeploy same function only to staging ref from last live bundle (VERSION 46 / correlated commit 87ffe0ec)
NON_MUTATING_POST_DEPLOY_PROBE_READY: true
LIVE_EDGE_SLICE_A_AUTHZ_CONFIRMED: false
LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED: true
STOP_REASONS: none
STAGING_EDGE_DEPLOY_READY: true
EDGE_DEPLOY_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
REAL_SAVE_EXECUTED: false
ARMS_OFF: true
SECRETS_CHANGED: false
OWNER_ADDED_TO_ADMIN_USERS: false
PRODUCTION_UNCHANGED: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-edge-deploy
```

`STAGING_EDGE_DEPLOY_READY: true` means the **operator** may deploy after explicit approval. Cursor must **not** run `supabase functions deploy`.

`LIVE_EDGE_SLICE_A_AUTHZ_CONFIRMED: false` is expected. Live staging is VERSION **46** (2026-07-21). Slice A source is HEAD `266f7b00`+ (2026-08-15). Do **not** treat live Edge as already `can_write_site`.

`MIRROR_IN_SYNC: false` is **index.ts only**. Handler is byte-eq. Deploy CLI uses **root** `supabase/functions/`, not the tools mirror. Non-blocking for deploy-from-root.

---

## 1. Function identity

| Item | Value |
| --- | --- |
| Function name | **`gosaki-discography-save-dry-run`** |
| Deploy source (SoT) | `supabase/functions/gosaki-discography-save-dry-run/` |
| Files in bundle | `index.ts` · `handler.ts` |
| Tools mirror | `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/` |
| Endpoint | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| `config.toml` block | **absent** — do **not** add in this phase |
| Other functions | **out of scope** — do not batch-deploy |

`supabase/config.toml` lists other functions with `verify_jwt = true` but **not** this slug. Historical deploys still succeeded. Gateway JWT default for this slug is **not** inferred from config. OPTIONS this phase returned HTTP 200 with `sb-project-ref: kmjqppxjdnwwrtaeqjta`. Unauthenticated POST was **not** sent.

---

## 2. Mirror sync

| File | Root vs tools mirror |
| --- | --- |
| `handler.ts` | **byte-eq** (`HANDLER_MIRROR_IN_SYNC: true`) |
| `index.ts` | **not** byte-eq (`INDEX_MIRROR_IN_SYNC: false`) |

Tools `index.ts` is a stale G-20u36d-era draft: it does not always forward `Authorization`, and it can take the sync handler when readBack is off. **Root** `index.ts` always calls `handleDiscographyEdgeDryRunHttpAsync` and forwards `req.headers.get("authorization")`.

Deploy uses root. Do not deploy from the tools mirror path.

---

## 3. Local handler authz (Slice A source)

### 3.1 Site-scoped gate (present)

`assertCanWriteSiteForSiteSlug`:

1. `siteSlug` must equal singleton `gosaki-piano` (`SITE_SLUG`).
2. `client.from("sites").select("id,site_slug,status").eq("site_slug", slug)` — exact one row.
3. Fail-closed: `site_resolve_failed` / `site_resolve_ambiguous` / `site_slug_mismatch` / `site_suspended` / `invalid_jwt`.
4. `client.rpc("can_write_site", { p_site_id: siteId })` — `data !== true` → `can_write_site_denied`.

Wired into:

- `handleOperationalDiscographySaveHttp`
- `handleControlledG20u43LabelSaveHttp`
- `handleControlledG20u36eSaveHttp`

### 3.2 Legacy admin gate (absent in local source)

- `assertOperatorIsAdmin` — **absent**
- `.rpc("is_admin")` — **absent**
- Comment-only mention of legacy `is_admin` remains (must not be treated as a live gate)

`LEGACY_IS_ADMIN_EDGE_GATE_PRESENT: false` applies to **local HEAD source only**.

### 3.3 Caller JWT preserved (design)

`createUserJwtSupabaseClient`:

- `createClient(url, anonKey, { global: { headers: { Authorization } } })`
- `assertStagingSupabaseUrl` blocks production ref `vsbvndwuajjhnzpohghh` and requires staging ref `kmjqppxjdnwwrtaeqjta`
- No `SUPABASE_SERVICE_ROLE_KEY`

Root `index.ts` forwards the request `Authorization` header into the handler. The same user-JWT client then:

1. Resolves `sites` (PostgREST, caller JWT)
2. Calls `can_write_site` (caller JWT)
3. SELECTs the discography row (caller JWT)
4. Calls `gosaki_discography_operational_save` (caller JWT)

RPC is SECURITY DEFINER and **re-checks** `can_write_site` in the caller JWT context (already applied on staging DB). Edge PASS does not skip RPC authz.

`CALLER_JWT_PRESERVED: true` is **local design**. Live VERSION 46 was **not** downloaded; do not claim live already does this Slice A path.

---

## 4. Dry-run vs armed Save

| Path | Arm | JWT / `can_write_site` | DB write |
| --- | --- | --- | --- |
| `operation=dryRun` | not required | not used | **no** (simulate; optional anon readBack SELECT only) |
| `operation=save` · arm off | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` must be exact `"true"` | **not reached** | **no** — 403 `not_armed` first |
| `operation=save` · arm on · invalid payload | armed | may stop before JWT | **no** |
| `operation=save` · arm on · valid · JWT | armed | Edge `can_write_site` then RPC | **yes** (out of this phase) |

Arm parse: `isDiscographySaveArmed()` → env === `"true"` only.

First post-deploy probe **must keep arm off**. That probe **cannot** prove live Edge `can_write_site`. It **does** prove Save cannot reach RPC write while disarmed.

---

## 5. Secrets (names only · values not displayed · not changed)

| Name | Required for this deploy? | Role |
| --- | --- | --- |
| `SUPABASE_URL` | **yes** (existing Edge runtime) | staging URL; production ref blocked in handler |
| `SUPABASE_ANON_KEY` | **yes** (existing Edge runtime) | anon key for user-JWT client |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | **no** (optional, existing) | dry-run anon SELECT readBack |
| `GOSAKI_DISCOGRAPHY_SAVE_ARMED` | **must not** be exact `"true"` for first probe | Save arm |
| `SUPABASE_SERVICE_ROLE_KEY` | **not used** | `SUPABASE_SERVICE_ROLE_CONNECTED = false` |

`NEW_SECRETS_REQUIRED: false`

`SECRETS_CHANGED: false` (this phase did not list or mutate secret values)

---

## 6. Live staging function (inventory only · behavior not Slice-A-PASS)

Read-only `supabase functions list --project-ref kmjqppxjdnwwrtaeqjta`:

| Field | Value |
| --- | --- |
| NAME / SLUG | `gosaki-discography-save-dry-run` |
| STATUS | ACTIVE |
| VERSION | **46** |
| UPDATED_AT (UTC) | **2026-07-21 04:52:27** |
| Project | `kmjqppxjdnwwrtaeqjta` |

OPTIONS (no body, no JWT): HTTP 200 · CORS `POST, OPTIONS` · `sb-project-ref: kmjqppxjdnwwrtaeqjta`.

### What this does **not** prove

- Live handler is Slice A `can_write_site`
- Live still uses `is_admin`
- Live source SHA

Last **documented** deploy of this slug was G-20u43a **v9** (2026-07-16, commit `5c0d8922`, `is_admin`). VERSION 46 is later. Timestamp correlates with commit `87ffe0ec` (2026-07-21 10:38 JST, atomic operational Save, **still** `assertOperatorIsAdmin` / `rpc("is_admin")`). Bundle was **not** downloaded this phase — correlation only.

Slice A Edge source (`266f7b00`, 2026-08-15) is **after** VERSION 46. Live cannot be treated as Slice A.

### Expected delta if live ≈ `87ffe0ec` (correlation, not proof)

| File | vs HEAD `b435a9e5` |
| --- | --- |
| `index.ts` | **identical** to `87ffe0ec` |
| `handler.ts` | +114 / −27 — `assertOperatorIsAdmin` → `assertCanWriteSiteForSiteSlug` |

Operational RPC call path already exists in `87ffe0ec`. Slice A deploy does **not** add a new write RPC; it changes the Edge gate in front of the existing RPC.

---

## 7. Deploy command (locked · not executed)

From repo root `~/sariswing-astro`:

```bash
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

**Forbidden:**

- omitting `--project-ref` (`supabase/.temp/linked-project.json` is production `vsbvndwuajjhnzpohghh`)
- `--project-ref vsbvndwuajjhnzpohghh`
- deploying any other function in the same command
- Secrets set/unset
- arm ON
- Save POST that can reach RPC write

---

## 8. Rollback

Redeploy **only** `gosaki-discography-save-dry-run` to staging ref.

1. Last live inventory: VERSION **46** @ `2026-07-21 04:52:27` UTC.
2. Correlated local source: `87ffe0ec` (atomic Save · `is_admin` Edge gate). Confirm before rollback if a later undocumented deploy occurred.
3. Restore that tree’s `supabase/functions/gosaki-discography-save-dry-run/` and:

```bash
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

Do not rollback DB RLS/RPC as part of Edge rollback. Do not touch production.

Operator should record VERSION immediately before the Slice A deploy so rollback target stays exact.

---

## 9. Non-mutating post-deploy probe (arm OFF)

Ready without arm, without data write:

| Probe | Expected | Proves |
| --- | --- | --- |
| OPTIONS | 200 + CORS | function still serves |
| POST `operation=save` without Authorization | reject (401/403) · no row change | unauthenticated Save blocked |
| POST `operation=dryRun` (registered dry-run approval) | simulate path · no RPC | dry-run still non-writing |
| POST `operation=save` + operational approval + owner JWT · **arm OFF** | 403 `not_armed` **before** JWT/`can_write_site` | first probe does not reach RPC write |

**Not** in first probe:

- arm ON
- authenticated Save that passes arm
- treating 403 `not_armed` as Edge `can_write_site` PASS
- owner → `admin_users`

Live Edge `can_write_site` proof is a **later** phase (arm or a dedicated stop-before-RPC probe). `NON_MUTATING_POST_DEPLOY_PROBE_READY: true` · `LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED: true`.

---

## 10. Production / linked-project trap

| Check | Result |
| --- | --- |
| Staging ref in deploy command | `kmjqppxjdnwwrtaeqjta` |
| Production ref in deploy command | **forbidden** `vsbvndwuajjhnzpohghh` |
| Handler `PRODUCTION_REF_STOP` | present (block URL) |
| `supabase/.temp/linked-project.json` | **production** `vsbvndwuajjhnzpohghh` — never rely on default link |

---

## 11. Explicit non-execution this phase

- Edge deploy
- Secrets list values / Secrets mutate
- DB write / SQL apply
- arm ON
- Save
- owner → `admin_users`
- commit / push
- FTP / workflow_dispatch / production

---

## 12. Residual hazards (do not block this preflight)

1. Tools `index.ts` mirror stale — deploy from root only.
2. Linked project is production — `--project-ref` is mandatory.
3. Live VERSION 46 Slice A authz **unconfirmed** — expected; that is why deploy is next.
4. Function missing from `config.toml` — do not change JWT config in the deploy phase.

`STOP_REASONS: none`
`STAGING_EDGE_DEPLOY_READY: true` (operator approval still required)
`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-edge-deploy`
