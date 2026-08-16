# Discography site-owner authz Slice B — VERSION 47→50 secret-revision investigation

- **Phase:** `discography-site-owner-authz-slice-b-version-50-secret-revision-investigation`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (read-only · Save not executed)**
- **HEAD:** `5d256e5dace06736b59e157492c6f3f33046681d`
- **Prior:** `discography-site-owner-authz-slice-b-operational-save-execution-final-hardening`
- **This phase:** determine whether live `functions list` VERSION 50 is a Secret revision, not a code deploy · **no** Secret mutate · **no** owner POST · **no** Save · **no** deploy · **no** function download · **no** DB write · **no** production · **no** commit/push by Cursor

Cursor did **not** run `secrets set` / `unset` / `functions deploy` / function body GET.

Staging only: `kmjqppxjdnwwrtaeqjta`. Production `vsbvndwuajjhnzpohghh` **forbidden**.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-version-50-secret-revision-investigation
VERSION_50_CAUSED_BY_SECRET_REVISION: true
LIVE_CODE_UNCHANGED_FROM_V47: true
LIVE_CAN_WRITE_SITE_AUTHZ_STILL_PRESENT: true
VERSION_GUARD_SHOULD_NOW_BE_50: true
SAFE_TO_RESUME_SLICE_B_PREFLIGHT: false
REMOTE_ESZIP_DOWNLOADED: false
EZBR_SHA256_FETCHED: false
EDGE_DEPLOY_EXECUTED: false
SECRETS_CHANGED: false
SAVE_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
PRODUCTION_BLOCKED: true
SERVICE_ROLE_USED: false
STOP_REASONS: locked packet still requires VERSION 47; live list is VERSION 50; do not Secret ON / Save until VERSION guard + UPDATED_AT pin are updated in a later packet phase
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-version-guard-update
DEFERRED_SAVE: discography-site-owner-authz-slice-b-operational-save-execution
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`LIVE_CODE_UNCHANGED_FROM_V47: true` is a **metadata + git + operator** conclusion. Remote eszip was **not** downloaded this phase.

`LIVE_CAN_WRITE_SITE_AUTHZ_STILL_PRESENT: true` is **inferred** from unchanged Slice A bundle identity. This phase did **not** re-run the owner POST probe (Secret ON forbidden).

`SAFE_TO_RESUME_SLICE_B_PREFLIGHT: false` means: do **not** continue the locked VERSION-47 packet. It is **not** a code-deploy incident and does **not** require redeploy.

---

## 1. What CLI `VERSION` is

`npx supabase@2.114.0 functions list --project-ref kmjqppxjdnwwrtaeqjta` is read-only `GET /v1/projects/{ref}/functions`.

| CLI column | Management API field | Meaning |
| --- | --- | --- |
| `VERSION` | `FunctionResponse.version` (int) | Function **metadata generation**. Also the `{version}` segment of hosted `DENO_DEPLOYMENT_ID` = `{project_ref}_{function_id}_{version}` (docs call this “version of the function code”, but it is the isolate/metadata counter, not an eszip hash). |
| `UPDATED_AT (UTC)` | `FunctionResponse.updated_at` (unix ms) | Last **function record** timestamp shown by CLI. Slice A deploy recorded **2026-08-15 14:12:36** for `gosaki-discography-save-dry-run`. |
| (not shown) | `ezbr_sha256` | Eszip bundle hash on `GET /v1/projects/{ref}/functions/{slug}`. **Not fetched** this phase (`SUPABASE_ACCESS_TOKEN` unset; download/GET body forbidden here). |

CLI `secrets set` / `unset` call **only** `POST` / `DELETE /v1/projects/{ref}/secrets`. They do **not** call `functions deploy`. Official docs: secrets apply on the next invocation; **no redeploy required**.

Platform issue [supabase#47739](https://github.com/supabase/supabase/issues/47739): `version` can increment in metadata even when the stored bundle is unchanged.

---

## 2. Observation (operator `functions list`)

Previous recorded Slice A inventory (post-deploy / probe docs):

| Slug | VERSION then | UPDATED_AT then |
| --- | --- | --- |
| `gosaki-discography-save-dry-run` | **47** | **2026-08-15 14:12:36** |

Current operator list: **every** listed Edge Function **+3**, `UPDATED_AT` **unchanged**.

| Slug family | then → now |
| --- | --- |
| discography save-dry-run | 47 → **50** |
| youtube-url-dry-run | 40 → **43** |
| youtube-url-save | 39 → **42** |
| schedule | 38 → **41** |
| about-content | 32 → **35** |
| youtube-supabase | 5 → **8** |
| about-supabase | 5 → **8** |

Staging Secret ops in this interval (operator; Cursor did not run them):

1. `GOSAKI_DISCOGRAPHY_SAVE_ARMED` **unset**
2. **set** `true`
3. **unset**

Edge **deploy**: none.

A code deploy of one slug would bump **that** slug’s VERSION **and** `UPDATED_AT`. A bulk deploy would bump **all** VERSIONs **and** all `UPDATED_AT`. Neither matches.

Uniform **+3** on unrelated slugs, with **unchanged** `UPDATED_AT`, matches **three project-secret revisions** (secrets are project-wide; each set/unset rolls isolate metadata for every function).

`VERSION_50_CAUSED_BY_SECRET_REVISION: true`

Do **not** redeploy to “restore VERSION 47”. That would replace the Slice A bundle timestamp and is a new deploy.

---

## 3. Live bundle vs Slice A VERSION 47

| Check | Result |
| --- | --- |
| Operator: no Edge deploy since Slice A | yes |
| `UPDATED_AT` still Slice A deploy time | yes (operator: unchanged vs prior list) |
| Uniform VERSION +3 across all slugs | yes (= 3 secret ops) |
| Git `supabase/functions/gosaki-discography-save-dry-run/` since `266f7b00` (Slice A Edge source) | **no diff** through HEAD `5d256e5d` |
| Remote eszip / `ezbr_sha256` | **not fetched** |

`LIVE_CODE_UNCHANGED_FROM_V47: true`

Byte-identity of the remote blob is **not** independently hashed this phase. Metadata + git + no-deploy is sufficient to reject “someone shipped new handler code”.

---

## 4. `UPDATED_AT` unchanged

CLI `UPDATED_AT` is `FunctionResponse.updated_at`. Secret set/unset does **not** rewrite that timestamp in this incident.

Treat **`UPDATED_AT = 2026-08-15 14:12:36`** as the **code-deploy pin** for `gosaki-discography-save-dry-run`. Treat **VERSION** as the **secrets/isolate generation** (currently 50).

Next Secret ON for Save will bump VERSION again (50 → 51) **before** POST. The VERSION check belongs **before** Secret ON, not after.

---

## 5. Authz still Slice A `can_write_site`

Local HEAD handler (unchanged since `266f7b00`):

- `assertCanWriteSiteForSiteSlug` → `rpc("can_write_site", { p_site_id })`
- **no** `assertOperatorIsAdmin` / `rpc("is_admin")` in this function dir

Slice A live probe already proved owner JWT passed that gate on the VERSION **47** bundle (`release_read_failed` on absent `discography-999`). That bundle’s `UPDATED_AT` is still the live pin.

This phase did **not** re-POST (arm check runs before `can_write_site`; Secret ON forbidden).

`LIVE_CAN_WRITE_SITE_AUTHZ_STILL_PRESENT: true`

---

## 6. Packet implication

Locked Slice B packet (`execution-final-hardening`) still has `VERSION_47_REQUIRED: true`. Live list is **50**. Correct STOP: do **not** Secret ON / Save on that packet.

`VERSION_GUARD_SHOULD_NOW_BE_50: true`

Next packet phase should:

1. Require `gosaki-discography-save-dry-run` **ACTIVE**
2. Require **VERSION 50** on the **pre-Secret** `functions list` (current secrets generation)
3. **Pin `UPDATED_AT` `2026-08-15 14:12:36`** as the Slice A code identity (do not accept a new timestamp)
4. After Secret ON, do **not** require VERSION 50 (expect 51)
5. Still: staging ref only · one owner POST · description-only · tracks DML skipped · unset regardless of result

Do **not** mix restoration. Do **not** redeploy.

`SAFE_TO_RESUME_SLICE_B_PREFLIGHT: false` until that guard update exists. Save still needs:

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 7. Explicit non-actions (this phase)

- No `functions deploy` / download / body GET
- No `secrets set` / `unset` / `secrets list` (list can print names; not needed)
- No owner POST / UI Save / SQL / PostgREST write
- No production ref
- No `service_role`
- No commit/push

---

## 8. Next

**`discography-site-owner-authz-slice-b-operational-save-version-guard-update`**

Then Save execution remains a **separate** approved phase.
