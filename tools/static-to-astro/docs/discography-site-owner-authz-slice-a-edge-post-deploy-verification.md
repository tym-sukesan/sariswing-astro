# Discography site-owner authz Slice A — Edge post-deploy verification

- **Phase:** `discography-site-owner-authz-slice-a-edge-post-deploy-verification`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (non-mutating probe · no data write)**
- **HEAD:** `ee686db10e78f5c983dbf4a68b0e9c25933845db`
- **Prior:** `discography-site-owner-authz-slice-a-edge-deploy-preflight` · operator staging Edge deploy
- **This phase:** verify live `gosaki-discography-save-dry-run` on staging with arm OFF · **no** re-deploy · **no** Secrets change · **no** DB write · **no** real Save · **no** commit/push by Cursor

This probe **does not** prove live Edge `can_write_site`. Do **not** treat that as PASS.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-edge-post-deploy-verification
EDGE_POST_DEPLOY_RESPONDS: true
OPTIONS_PASS: true
UNAUTH_SAVE_REJECT_PASS: true
DRY_RUN_PASS: true
NOT_ARMED_PASS: true
DATA_UNCHANGED: true
ALBUMS_CURRENT: 4
TRACKS_CURRENT: 34
LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false
LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED: true
STOP_REASONS: none
POST_DEPLOY_VERIFICATION_PASS: true
EDGE_DEPLOY_EXECUTED: true
LIVE_STAGING_FUNCTION_VERSION: 47
RPC_WRITE_REACHED: false
REAL_SAVE_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
ARMS_OFF: true
SECRETS_CHANGED: false
SECRETS_VALUES_LOGGED: false
JWT_LOGGED: false
PRODUCTION_UNCHANGED: true
OWNER_ADDED_TO_ADMIN_USERS: false
CURRENT_POLICY_FP: fa62157c08cffc8b49c38256ad8dfe26
CURRENT_GRANTS_FP: 88986aa562aad21b7defa89648288083
CURRENT_RPC_FP: f4d50563f2e08abcfcded8e8ade7fb3b
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-planning
```

---

## 1. Deploy inventory (read-only)

| Item | Value |
| --- | --- |
| Project | `kmjqppxjdnwwrtaeqjta` |
| Function | `gosaki-discography-save-dry-run` |
| STATUS | ACTIVE |
| VERSION | **47** (was 46 @ 2026-07-21) |
| UPDATED_AT (UTC) | **2026-08-15 14:12:36** |
| Production deploy | **none** |
| Secrets changed this phase | **no** |

Operator reported: `Deployed Functions on project kmjqppxjdnwwrtaeqjta`. Cursor did **not** re-run deploy.

---

## 2. Probe results (sanitized)

Endpoint: `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`

All responses had `sb-project-ref: kmjqppxjdnwwrtaeqjta`. Production ref was not requested.

| Probe | HTTP | Result |
| --- | --- | --- |
| OPTIONS | **200** | body `ok` · CORS `POST, OPTIONS` · `authorization, x-client-info, apikey, content-type` |
| POST `operation=save` · no `Authorization` | **401** | `Missing authorization header` · gateway reject · no handler Save |
| POST `operation=dryRun` · Bearer anon | **200** | `ok: true` · `operation: dryRun` · `didWrite/dbWrite/networkWrite/saveEnabled: false` |
| POST `operation=save` · operational approval · Bearer anon · arm OFF | **403** | `reasonCode: save_not_armed` · `saveReadiness: save_not_armed` · write flags **false** · **no** `rpc` key |

`wouldWrite: true` on dryRun is the historical schema-only baseline (empty snapshot vs probe payload). It is **not** a DB write. `didWrite` / `dbWrite` remained **false**.

`save_not_armed` is returned **before** JWT/`can_write_site`/RPC. This proves the first Save path cannot reach RPC write while disarmed. It does **not** prove live `can_write_site`.

Anon REST SELECT (staging only):

| Table | Count |
| --- | --- |
| `discography` `site_slug=eq.gosaki-piano` | **4** |
| `discography_tracks` `site_slug=eq.gosaki-piano` | **34** |

---

## 3. What this does **not** prove

- Live Edge `assertCanWriteSiteForSiteSlug` executed
- Live `can_write_site` returned true for owner JWT
- Caller JWT context inside the deployed bundle beyond the arm-off Save stop
- Real Save / RPC write success

`LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false`

---

## 4. Operator non-mutating probe packet (optional re-run)

Use staging env only. Do **not** print `$PUBLIC_SUPABASE_ANON_KEY`. Do **not** send owner JWT. Do **not** set arm ON.

```bash
STG=kmjqppxjdnwwrtaeqjta
URL="https://${STG}.supabase.co/functions/v1/gosaki-discography-save-dry-run"

# 1. OPTIONS
curl -sS -D - -o /dev/null -X OPTIONS "$URL"

# 2. Unauthenticated Save
curl -sS -D - -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -d '{"operation":"save","approvalId":"gosaki-discography-operational-save","siteSlug":"gosaki-piano","legacyId":"discography-001"}'

# 3. dryRun (anon Bearer · values not echoed)
curl -sS -X POST "$URL" \
  -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"operation":"dryRun","approvalId":"G-20u31-gosaki-discography-save-dry-run-endpoint","siteSlug":"gosaki-piano","legacyId":"discography-001","tracksText":"Probe Track A\nProbe Track B","release":{"title":"Slice A post-deploy probe","artist":"Probe","published":true},"trackPolicy":{"oneLineOneTrack":true,"blankLinesIgnored":true,"allowDuplicateTitles":true,"allowEmptyTrackList":false},"clientDryRun":{"wouldWrite":false}}'

# 4. Save not_armed (anon Bearer · arm must stay OFF)
curl -sS -X POST "$URL" \
  -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"operation":"save","approvalId":"gosaki-discography-operational-save","siteSlug":"gosaki-piano","legacyId":"discography-001"}'
```

Forbidden in this packet: production host `vsbvndwuajjhnzpohghh` · owner JWT · `GOSAKI_DISCOGRAPHY_SAVE_ARMED=true` · RPC write payloads that pass arm.

---

## 5. Explicit non-execution

- Edge re-deploy
- Secrets mutate / secret values printed
- JWT / token logged
- arm ON
- real Save (arm-on path)
- DB write / migration
- owner → `admin_users`
- production
- commit / push

---

## 6. Next

`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-planning`

Planning only until explicit approval. Still **no** real Save. Live `can_write_site` remains unconfirmed.
