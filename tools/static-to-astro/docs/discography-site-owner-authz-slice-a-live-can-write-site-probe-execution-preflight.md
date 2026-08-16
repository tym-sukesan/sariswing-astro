# Discography site-owner authz Slice A — live Edge `can_write_site` probe execution preflight

- **Phase:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (packet locked · not executed)**
- **HEAD:** `7d0434b5ffba905a70136870dbedb7ea77da5dd9`
- **CLI:** Supabase CLI **2.102.0** (`supabase secrets set|unset --help` confirmed locally)
- **Prior:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-planning`
- **This phase:** lock the one-shot operator packet · **no** Secrets mutate · **no** POST · **no** DB write · **no** deploy · **no** commit/push

Cursor must **not** run Secret ON/OFF or the owner POST. Operator execution needs a separate explicit one-shot approval.

**Operator packet SoT (2026-08-16):** `discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening.md` — same payload / `discography-999` / unset OFF, plus owner fixture recheck **before** Secret ON and arm-OFF curl `-w '\nHTTP_STATUS=%{http_code}\n'`. Historical curl packet below is retained.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight
EXECUTION_PREFLIGHT_PASS: true
STAGING_REF_HARD_FIXED: true
VERSION_47_CONFIRMED: true
TARGET_999_ABSENT: true
PRE_BASELINE_PASS: true
SECRET_ON_COMMAND: supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta
SECRET_OFF_COMMAND: supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
SECRET_OFF_METHOD: unset
SECRET_OFF_VERIFICATION: POST operation=save with anon Bearer → 403 save_not_armed (no secret values printed)
OWNER_PROBE_PACKET_READY: true
EXPECTED_SAFE_STOP: release_read_failed
RPC_REACHED_EXPECTED: false
DATA_WRITE_REACHABLE: false
NO_RETRY_RULE_FIXED: true
POST_BASELINE_PACKET_READY: true
READY_FOR_OPERATOR_PROBE: true
PROBE_EXECUTED: false
SECRETS_CHANGED: false
ARM_CHANGED: false
REAL_SAVE_EXECUTED: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false
STOP_REASONS: none
PRODUCTION_UNCHANGED: true
OWNER_ADDED_TO_ADMIN_USERS: false
UI_CLIENT_WRITE_ARM_OFF: true
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-execution
```

`READY_FOR_OPERATOR_PROBE: true` means the packet is locked. It does **not** authorize Cursor or an unattended run.

---

## 1. CLI facts (2.102.0 · not guessed)

`supabase secrets set --help`:

- Usage: `supabase secrets set [flags] <NAME=VALUE...>`
- Flag: `--project-ref string`
- Help text says “linked project”; **`--project-ref` is mandatory** because `supabase/.temp/linked-project.json` is production `vsbvndwuajjhnzpohghh`

`supabase secrets unset --help`:

- Usage: `supabase secrets unset [flags] <NAME...>`
- Flag: `--project-ref string`
- Example: `supabase secrets unset MY_SECRET`

Handler arm: `Deno.env.get("GOSAKI_DISCOGRAPHY_SAVE_ARMED") === "true"` (no trim).

| OFF method | Result vs `=== "true"` | Chosen? |
| --- | --- | --- |
| `secrets unset NAME` | env missing → not `"true"` | **yes** — dedicated reset; value cannot be `"true"` |
| `secrets set NAME=false` | `"false"` → not `"true"` | also disarms, but leaves the name present |

`SECRET_OFF_METHOD: unset`

Secret **values** are never printed. Do **not** run `secrets list` in this packet (avoid value/digest dump). OFF is verified by Edge behavior (`save_not_armed`).

Secret change does **not** require Edge redeploy (runtime env).

---

## 2. Hard-fixed staging ref

Every mutating CLI line includes `--project-ref kmjqppxjdnwwrtaeqjta`.

Forbidden:

- omitting `--project-ref` (would target linked production)
- `--project-ref vsbvndwuajjhnzpohghh`
- any URL host other than `kmjqppxjdnwwrtaeqjta.supabase.co`

`STAGING_REF_HARD_FIXED: true`

---

## 3. Pre-probe SELECT-only (this preflight · 2026-08-16)

Anon REST · staging only · no JWT logged.

| Check | Result |
| --- | --- |
| Function | `gosaki-discography-save-dry-run` ACTIVE · VERSION **47** · updated `2026-08-15 14:12:36` UTC |
| albums `site_slug=gosaki-piano` | **4** |
| tracks `site_slug=gosaki-piano` | **34** |
| `legacy_id` present | `discography-001` … `004` only |
| `discography-999` | **0** |

`VERSION_47_CONFIRMED: true`

`TARGET_999_ABSENT: true`

`PRE_BASELINE_PASS: true`

Operator must **repeat** the 999 count immediately before Secret ON. If count ≠ 0 → **abort** (no Secret ON, no POST).

---

## 4. Secret ON / OFF (operator · not executed now)

From `~/sariswing-astro`:

```bash
# ON — once, staging only
supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta

# OFF — immediately after the one POST, PASS or FAIL or timeout
supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

Treat OFF as **RESET**, not DB rollback. No SQL. No redeploy.

UI/client `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` stays unset/false. Do not bake a package. Do not arm other features.

---

## 5. Owner probe packet (exactly one POST · not executed now)

Endpoint: `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`

Auth: `Authorization: Bearer $OWNER_ACCESS_TOKEN` (pure site owner · `is_admin=false`) plus gateway `apikey: $PUBLIC_SUPABASE_ANON_KEY`.

Do **not** echo `$OWNER_ACCESS_TOKEN` or the anon key. Do **not** use anon as the Bearer token. Do **not** add owner to `admin_users`.

`legacyId` is **hard-coded** `discography-999`. Real ids `discography-001`…`004` are forbidden in this body.

```bash
set -euo pipefail
STG=kmjqppxjdnwwrtaeqjta
URL="https://${STG}.supabase.co/functions/v1/gosaki-discography-save-dry-run"
: "${OWNER_ACCESS_TOKEN:?owner JWT required}"
: "${PUBLIC_SUPABASE_ANON_KEY:?anon key required}"

# Abort if 999 exists (SELECT-only). Do not print secrets.
# Then Secret ON (section 4). Then exactly one POST:

curl -sS --max-time 30 -X POST "$URL" \
  -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${OWNER_ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "operation": "save",
    "approvalId": "gosaki-discography-operational-save",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-999",
    "expectedBeforeUpdatedAt": "1970-01-01T00:00:00.000Z",
    "release": {
      "title": "Slice A live authz probe",
      "artist": "probe",
      "release_date": null,
      "label": null,
      "purchase_url": null,
      "description": null
    },
    "tracksText": "Slice A live authz probe track"
  }'

# Immediately Secret OFF (section 4), even if curl failed/timed out.
```

Dummy release uses **editable** keys only (no frozen fields, no real album copy).

Expected:

| Field | Value |
| --- | --- |
| HTTP | **403** |
| `reasonCode` | `release_read_failed` |
| `save_not_armed` | **absent** (would mean arm never ON) |
| `rpc` key | **absent** |
| `didWrite` / `dbWrite` | **false** |
| `ok` | **false** |

`EXPECTED_SAFE_STOP: release_read_failed`

`RPC_REACHED_EXPECTED: false`

`DATA_WRITE_REACHABLE: false`

`can_write_site_denied` / `invalid_jwt` / `site_resolve_*` / `save_not_armed` / 2xx / `rpc` present → **not PASS** · no retry.

---

## 6. No-retry rule (fixed)

```txt
exactly one POST
timeout / non-JSON / 5xx / unexpected reasonCode / 2xx
→ stop immediately
→ do not retry
→ do not re-POST
→ still run SECRET_OFF
→ SELECT-only 4/34 and 999=0
→ ask human
```

`NO_RETRY_RULE_FIXED: true`

---

## 7. Post-baseline packet (after Secret OFF)

1. POST `operation=save` + operational approval + **anon** Bearer (no owner JWT) → **403** `save_not_armed` with explicit HTTP status
2. Anon SELECT: albums **4** · tracks **34** · `discography-999` **0**

Do not print keys. Staging host only.

```bash
STG=kmjqppxjdnwwrtaeqjta
URL="https://${STG}.supabase.co/functions/v1/gosaki-discography-save-dry-run"

curl -sS --max-time 30 -w '\nHTTP_STATUS=%{http_code}\n' -X POST "$URL" \
  -H "apikey: ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "save",
    "approvalId": "gosaki-discography-operational-save",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-999",
    "expectedBeforeUpdatedAt": "1970-01-01T00:00:00.000Z",
    "release": {
      "title": "Slice A live authz probe",
      "artist": "probe",
      "release_date": null,
      "label": null,
      "purchase_url": null,
      "description": null
    },
    "tracksText": "Slice A live authz probe track"
  }'
```

PASS: `HTTP_STATUS=403` · `reasonCode=save_not_armed` · `rpc` key absent.

`POST_BASELINE_PACKET_READY: true`

---

## 8. Operator sequence (future execution · not now)

Operator SoT: `discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening.md`.

1. Repeat SELECT: 4 / 34 / 999=0. Abort if 999 ≠ 0.
2. Owner fixture recheck (browser session, read-only): staging host · `gosaki-piano` singleton · status `active` · `can_write_site=true` · `is_admin=false`. Fail → **no Secret ON**, no owner POST, no retry, STOP.
3. Secret ON (staging `--project-ref` only) — only if fixture recheck PASS.
4. Exactly one owner POST (`discography-999` only).
5. Secret OFF immediately (unset), regardless of outcome.
6. Post-baseline: `HTTP_STATUS=403` `save_not_armed` + 4/34 + 999=0.
7. Record sanitized reasonCode only. Never log JWT/secret values.

---

## 9. Explicit non-execution this phase

- `supabase secrets set` / `unset`
- owner POST
- Edge deploy
- UI arm ON
- owner → `admin_users`
- production
- commit / push

`LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: false` until execution records `release_read_failed`.

`RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-a-live-can-write-site-probe-execution`
