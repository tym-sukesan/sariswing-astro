# Discography site-owner authz Slice A — live Edge `can_write_site` probe planning

- **Phase:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-planning`
- **Date:** 2026-08-15
- **Status:** **COMPLETE (planning / read-only · probe not executed)**
- **HEAD:** `cdcdff7ddf86d30e5126c697e53f2ecb12571c3a`
- **Prior:** `discography-site-owner-authz-slice-a-edge-post-deploy-verification`
- **This phase:** design a fail-closed way to prove VERSION **47** live Edge `can_write_site` for a pure site-owner JWT **without** Discography data write · **no** arm change · **no** Save · **no** DB write · **no** deploy · **no** Secrets change · **no** commit/push

Do **not** treat the already-PASS DB RPC owner probe as live Edge PASS.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-live-can-write-site-probe-planning
LIVE_EDGE_AUTHZ_PROBE_POSSIBLE: true
ARM_ON_REQUIRED: true
EDGE_PROCESS_ORDER: arm → payload_validation → JWT_client → can_write_site → SELECT_row → lock/frozen/no_change → operational_RPC
SAFE_STOP_POINT: release_read_failed after can_write_site (non-existent format-valid legacy_id)
RPC_REACHED: false
DATA_WRITE_REACHABLE: false
REQUIRED_CONFIG_CHANGES: Edge secret GOSAKI_DISCOGRAPHY_SAVE_ARMED exact true (temporary) · no redeploy · UI arm stays off
READY_FOR_OPERATOR_PROBE: false
LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false
PROBE_EXECUTED: false
ARM_CHANGED: false
SECRETS_CHANGED: false
REAL_SAVE_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
DB_RPC_PROBE_IS_NOT_LIVE_EDGE_PROOF: true
PRODUCTION_UNCHANGED: true
OWNER_ADDED_TO_ADMIN_USERS: false
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-preflight
```

`READY_FOR_OPERATOR_PROBE: false` — planning only. Execution needs a later preflight + explicit approval for a **one-shot** Secrets arm ON, one POST, then immediate arm OFF. Cursor must not run that.

`DATA_WRITE_REACHABLE: false` applies **only** to the recommended packet under the listed preconditions. Other Save shapes are **rejected** as execution plans.

---

## 1. VERSION 47 handler order (operational Save)

Source: `supabase/functions/gosaki-discography-save-dry-run/handler.ts` · `handleOperationalDiscographySaveHttp` (approvalId `gosaki-discography-operational-save`).

Live VERSION 47 is this Slice A bundle. Order is **not** the user-suggested payload-then-arm sequence.

| Step | What | Fail reasonCode (typical) | `can_write_site` reached? | RPC reached? |
| --- | --- | --- | --- | --- |
| 0 | Router: `operation=save` + operational approval | other handlers if approval differs | no | no |
| 1 | **Arm** `GOSAKI_DISCOGRAPHY_SAVE_ARMED === "true"` (no trim) | `save_not_armed` 403 | **no** | no |
| 2 | Payload: no `service_role` string · allowed top-level keys · `operation=save` · approvalId · `siteSlug=gosaki-piano` | `service_role_forbidden` / `unexpected_payload_key` / `operation_mismatch` / `approval_id_mismatch` / `site_mismatch` | no | no |
| 3 | `legacyId` **format** `/^discography-\d{3}$/` | `legacy_id_mismatch` 400 | **no** | no |
| 4 | `expectedBeforeUpdatedAt` non-empty · `release` object · allowed release keys · field validation · `tracksText` string · track lines | `optimistic_lock_missing` / `release_required` / `field_validation_failed` / `tracks_*` | **no** | no |
| 5 | Bearer present · `createUserJwtSupabaseClient` (anon key + caller JWT · staging URL only) | `missing_authorization` / `production_ref_blocked` / `config_error` | no | no |
| 6 | `sites` singleton resolve · **`rpc('can_write_site', { p_site_id })`** | `invalid_jwt` / `site_resolve_*` / `can_write_site_denied` | **yes (this is the proof point)** | no |
| 7 | SELECT `discography` by `site_slug` + `legacy_id` | `release_read_failed` 403 | yes | **no** |
| 8 | lock / frozen / no_change / tracks SELECT | `optimistic_lock_conflict` / `frozen_field_change_forbidden` / `no_change` | yes | **no** |
| 9 | `client.rpc('gosaki_discography_operational_save', …)` | `rpc_error` / RPC `reason_code` | yes | **yes** |

`EDGE_PROCESS_ORDER: arm → payload_validation → JWT_client → can_write_site → SELECT_row → lock/frozen/no_change → operational_RPC`

G-20u43 label Save and G-20u36e track-title Save also arm-first then `can_write_site`, then **UPDATE an existing row**. Those paths are **not** approved probe plans (`DATA_WRITE_REACHABLE: true`).

`operation=dryRun` never calls `can_write_site`.

---

## 2. Fail-closed input after `can_write_site` (recommended)

**Yes — one shape exists on VERSION 47 without a new endpoint.**

Use operational Save with a **format-valid, pre-confirmed absent** `legacyId`.

| Field | Value |
| --- | --- |
| `operation` | `save` |
| `approvalId` | `gosaki-discography-operational-save` |
| `siteSlug` | `gosaki-piano` |
| `legacyId` | `discography-999` (must be **absent**; 001–004 only today) |
| `expectedBeforeUpdatedAt` | sentinel `1970-01-01T00:00:00.000Z` (must not match any real `updated_at`) |
| `release` | valid dummy **editable** fields only (no frozen keys) |
| `tracksText` | non-empty dummy line |
| Auth | **pure site-owner JWT** (not anon · not admin_users) |
| Arm | Edge `GOSAKI_DISCOGRAPHY_SAVE_ARMED=true` for one request only |

Expected stop: **step 7** `release_read_failed` (403).

That reasonCode is **after** step 6. It is live Edge proof that:

- arm was on
- payload validation passed
- JWT client was created
- `assertCanWriteSiteForSiteSlug` returned `ok: true`
- SELECT found no row
- **RPC was not called**

If owner `can_write_site` failed, the response would be `can_write_site_denied` / `invalid_jwt` / `site_resolve_*` — **not** `release_read_failed`. Do not treat those as PASS.

`SAFE_STOP_POINT: release_read_failed after can_write_site`

`RPC_REACHED: false` (expected)

`DATA_WRITE_REACHABLE: false` (RPC is after successful SELECT; 999 absent ⇒ no RPC)

Defense in depth if 999 were somehow present: sentinel lock ⇒ `optimistic_lock_conflict` before RPC; omitted frozen keys ⇒ `frozen_field_change_forbidden` before RPC. **Do not rely on that.** Pre-SELECT must show count **0** or **abort without POST**.

---

## 3. Arm ON is required

`ARM_ON_REQUIRED: true`

Step 1 returns `save_not_armed` before JWT / `can_write_site`. Post-deploy already proved that with arm OFF. There is **no** VERSION 47 authz-only operation.

| Layer | Env | Required for this curl probe? | Change type |
| --- | --- | --- | --- |
| Edge / Deno | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` exact `"true"` (no trim) | **yes** | **Secrets** (runtime) |
| Admin UI bake | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | **no** — must stay unset/false | do **not** bake / regen package |
| Other feature arms | Schedule / YouTube / About `*_SAVE_ARMED` | **no** — must stay off (mutex) | do not set |

- Secrets change **is** required for a future execution (temporary Edge arm).
- Edge **re-deploy is not** required (secret is read at request time).
- Client UI arm **must not** be turned on (avoids browser Save).
- This planning phase does **not** change Secrets.

Parser: Edge family B · `=== "true"` only (`true ` / `TRUE` / `1` stay disarmed).

---

## 4. `legacy_id` where it stops

| Input | Edge stop | `can_write_site`? | RPC? | Proves live Edge owner authz? |
| --- | --- | --- | --- | --- |
| `discography-foo` / `discography-99` / missing | step 3 `legacy_id_mismatch` | no | no | **no** |
| `discography-999` (absent, format OK) | step 7 `release_read_failed` | **yes** | **no** | **yes** (if owner JWT) |
| `discography-001` + wrong lock | step 8 `optimistic_lock_conflict` | yes | no | yes, but **WRITE reachable** if lock is copied correctly → **rejected plan** |
| `discography-001` + matching lock + field diff | step 9 RPC | yes | **yes** | real Save → **rejected** |
| Direct DB `rpc(gosaki_discography_operational_save)` with bad id | n/a (not Edge) | RPC-internal only | RPC entered, write stopped inside | **not** live Edge proof (already done) |

The DB owner probe (`legacy_id_mismatch` 400 inside DEFINER) is **not** a substitute for VERSION 47 Edge.

---

## 5. Rejected execution plans

| Plan | Why rejected |
| --- | --- |
| Arm OFF + owner JWT | Never reaches `can_write_site` |
| Anon Bearer + arm ON | May reach `can_write_site` but cannot prove **owner** pass |
| G-20u43 / G-20u36e Save | Writes existing rows after authz |
| Existing album + “wrong lock” | Write reachable if `updated_at` is correct |
| Existing album + `no_change` | Write reachable if any editable field differs |
| Call operational RPC from SQL/client | Not live Edge |
| Add owner to `admin_users` | Forbidden |
| New `authzProbe` operation | Needs code + deploy; not VERSION 47 |
| Any packet where step 9 is reachable | Forbidden |

---

## 6. Required config (future execution only — not this phase)

1. Confirm VERSION **47** still active on `kmjqppxjdnwwrtaeqjta`.
2. SELECT-only: albums **4** / tracks **34** / `legacy_id=discography-999` count **0**.
3. Obtain owner JWT without logging it (`is_admin=false` already known).
4. Set **only** `GOSAKI_DISCOGRAPHY_SAVE_ARMED=true` on staging Secrets.
5. **One** POST of the recommended packet.
6. Immediately set arm back to not exact-true (unset or `false`).
7. SELECT-only 4/34 and 999 still 0.

No production ref `vsbvndwuajjhnzpohghh`. No `service_role`. No UI arm. No package regen. No FTP.

---

## 7. Rollback / reset

| Event | Action |
| --- | --- |
| After the one POST (PASS or FAIL) | Reset Edge secret so `GOSAKI_DISCOGRAPHY_SAVE_ARMED` is **not** exact `"true"` |
| Timeout / non-JSON / unexpected reasonCode | **stop** · **do not retry** · reset arm · SELECT 4/34 · ask human |
| `ok: true` / `rpc` key present / 2xx Save | treat as possible write · **stop** · **do not retry** · SELECT 4/34 · ask human |
| 999 count ≠ 0 before POST | **abort** · do not POST · no arm ON if not yet set |

No DB rollback SQL (no write expected). Do not redeploy to reset arm.

---

## 8. Pre-probe baseline (execution preflight)

| Check | Expected |
| --- | --- |
| Function VERSION | **47** |
| Project | `kmjqppxjdnwwrtaeqjta` only |
| Arm | currently OFF (`save_not_armed` already proven) |
| albums / tracks | **4** / **34** |
| `discography-001`…`004` | present |
| `discography-999` | count **0** |
| Policy / grants / RPC fps | `fa62157c…` / `88986aa5…` / `f4d50563…` |
| Owner | `can_write_site=true` · `is_admin=false` (DB probe historical; re-check JWT at execution) |

---

## 9. Post-probe verification (SELECT-only)

| Check | Expected |
| --- | --- |
| HTTP | 403 |
| `reasonCode` | `release_read_failed` |
| `saveReadiness` | not `save_not_armed` |
| `rpc` key | **absent** |
| `didWrite` / `dbWrite` | **false** |
| albums / tracks | **4** / **34** |
| `discography-999` | still **0** |
| Arm | reset OFF |
| JWT / secrets | not logged |

Unexpected `reasonCode`, timeout, or 2xx → `LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED` stays **false** · no retry.

---

## 10. Risks

- Temporary Edge arm ON widens the Save accept surface until reset. Mitigate: no UI arm · one POST · immediate reset · no other feature arms.
- Race: 999 inserted between pre-SELECT and POST (extreme). Mitigate: abort unless count 0 immediately before POST; sentinel lock; no retry.
- Operator copies a real `legacyId` / real `updated_at` → write reachable. Mitigate: packet hard-codes `discography-999` + sentinel lock; do not use 001–004.
- Timeout after POST: write state unknown. Mitigate: stop · SELECT · human.

---

## 11. Blockers (execution, not this planning doc)

- Secrets arm ON not approved in this phase
- Owner JWT handling packet not executed
- `READY_FOR_OPERATOR_PROBE: false` until execution preflight + explicit one-shot approval

No code/deploy blocker on VERSION 47 for the recommended shape.

---

## 12. Timeout / ambiguous policy

```txt
stop immediately
do not retry
do not re-POST
do not re-arm
reset arm if it was turned on
SELECT-only 4/34
record incident
ask human
```

---

## 13. Explicit non-execution this phase

- arm ON / Secrets mutate
- owner JWT POST
- real Save / RPC
- Edge deploy
- owner → `admin_users`
- production
- commit / push

`LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false` remains until a later execution records `release_read_failed` after owner JWT.

`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-preflight`
