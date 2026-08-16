# Discography site-owner authz Slice A — live Edge `can_write_site` probe result

- **Phase:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-result`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (operator one-shot recorded · no further Secret/POST)**
- **HEAD (recording baseline):** `c7841fb001a560322e409ac831aabd2406423efd`
- **Prior packet SoT:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening.md`
- **This phase:** record operator one-shot live Edge probe · **no** Secrets mutate · **no** owner POST · **no** DB write · **no** Edge deploy · **no** production · **no** commit/push by Cursor

Cursor did **not** run Secret ON/OFF, owner POST, or UI Save. Operator executed the locked packet once.

Do **not** re-arm `GOSAKI_DISCOGRAPHY_SAVE_ARMED`. Do **not** re-POST. Do **not** re-click UI Save / Dry-run.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-a-live-can-write-site-probe-result
SLICE_A_RESULT_RECORDED: true
PROBE_EXECUTED: true
PROBE_RERUN_FORBIDDEN: true
LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: true
RPC_REACHED: false
RPC_REACHED_EXPECTED: false
DATA_WRITE: false
DISCOGRAPHY_DATA_WRITE_EXECUTED: false
REAL_SAVE_EXECUTED: false
SECRET_RESET: true
POST_ARM_OFF_CONFIRMED: true
DATA_UNCHANGED: true
ALBUMS_CURRENT: 4
TRACKS_CURRENT: 34
DISCOGRAPHY_999_COUNT: 0
TARGET_999_LOCKED: true
REAL_LEGACY_ID_USED: false
NO_RETRY: true
SECRET_OFF_METHOD: unset
STAGING_REF_HARD_FIXED: true
LIVE_STAGING_FUNCTION_VERSION: 47
EXPECTED_SAFE_STOP: release_read_failed
OWNER_FIXTURE_RECHECK_PASS: true
OWNER_JWT_PROBE_PASS: true
OWNER_CAN_WRITE_SITE: true
OWNER_IS_ADMIN: false
PRODUCTION_UNCHANGED: true
PRODUCTION_SECRETS_CHANGED: false
OWNER_ADDED_TO_ADMIN_USERS: false
UI_SAVE_CLICKED: false
UI_READ_WIRING_FINDING_RECORDED: true
UI_READ_WIRING_FIXED: false
PAT_VALUE_RECORDED: false
JWT_LOGGED: false
SECRETS_VALUES_LOGGED: false
COMMIT_READY: true
STOP_REASONS: none
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-planning
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED: true` means the owner JWT passed live VERSION **47** Edge `can_write_site`, then fail-closed on absent `discography-999` (`release_read_failed`) **before** operational RPC. It does **not** mean Discography data write succeeded.

---

## 1. Edge inventory (operator)

| Item | Value |
| --- | --- |
| Staging ref | `kmjqppxjdnwwrtaeqjta` |
| Production ref | `vsbvndwuajjhnzpohghh` **untouched** |
| Function | `gosaki-discography-save-dry-run` |
| VERSION | **47** |
| Linked CLI project | production (omit `--project-ref` **forbidden**) |

---

## 2. Pre baseline (SELECT-only)

| Check | Result |
| --- | --- |
| albums | **4** |
| tracks | **34** |
| `discography-999` | **0** |

---

## 3. Owner fixture recheck (Secret OFF · before ON)

Working path: Vite `getStagingAuthConfig()` + `getStagingSupabaseClient()` (not DOM dataset).

| Field | Value |
| --- | --- |
| `sessionPresent` | **true** |
| `stagingHostOk` | **true** |
| `siteSingletonOk` | **true** |
| `siteSlug` | `gosaki-piano` |
| `siteStatus` | `active` |
| `can_write_site` | **true** |
| `is_admin` | **false** |
| `ownerJwtProbePass` | **true** |
| `stopReason` | **null** |

This recheck is **not** live Edge proof by itself. It only gated Secret ON.

---

## 4. One-shot owner Edge POST

Exactly **one** POST. Target `legacyId=discography-999` only. Sentinel lock `1970-01-01T00:00:00.000Z`. No retry. Real ids `discography-001`…`004` were not in the POST body. JWT / token / anon / secret values were not logged.

| Field | Value |
| --- | --- |
| HTTP | **403** |
| `reasonCode` | `release_read_failed` |
| `ok` | **false** |
| `didWrite` | **false** |
| `dbWrite` | **false** |
| `rpcKeyPresent` | **false** |

### Interpretation

Pure site owner JWT reached live VERSION **47** Edge `can_write_site` (otherwise the stop would have been `admin_required` / host / arm / payload — not `release_read_failed`). After authz, SELECT of absent `discography-999` fail-closed. Operational RPC was **not** reached. Discography data write **none**.

`save_not_armed` was **absent** on this POST (arm was ON for the one-shot).

---

## 5. Secret (staging only · already reset)

| Step | Result |
| --- | --- |
| ON | `GOSAKI_DISCOGRAPHY_SAVE_ARMED=true` on staging `kmjqppxjdnwwrtaeqjta` only · temporary |
| OFF | `secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta` **succeeded** immediately after owner POST |
| Production secrets | **unchanged** |

`SECRET_RESET: true`. Do **not** set the secret again without a new explicit approval.

### CLI operational note (no secret values)

Installed CLI **2.102.0** failed credential fetch for `secrets` on this run. Operator used an existing **LEGACY PAT** as **process-scoped** `SUPABASE_ACCESS_TOKEN` (not written to `.env.local`, value **not** recorded). Staging secrets then succeeded via `npx supabase@2.114.0` with `--project-ref kmjqppxjdnwwrtaeqjta`.

`supabase/.temp/linked-project.json` remains production `vsbvndwuajjhnzpohghh`. Future CLI must keep `--project-ref kmjqppxjdnwwrtaeqjta`. Omit is **forbidden**.

Do **not** record PAT / token / JWT / anon key values. Do **not** run `secrets list` in follow-up.

---

## 6. Arm-OFF verification (after unset)

| Field | Value |
| --- | --- |
| HTTP | **403** |
| `reasonCode` | `save_not_armed` |
| `rpcKeyPresent` | **false** |

`POST_ARM_OFF_CONFIRMED: true`

This is arm-off proof only. Do **not** treat it as a second owner `can_write_site` probe. Do **not** re-POST the owner snippet.

---

## 7. Post baseline (SELECT-only)

| Check | Result |
| --- | --- |
| albums | **4** |
| tracks | **34** |
| `discography-999` | **0** |
| pass | **true** |

`DATA_UNCHANGED: true`

---

## 8. Deferred finding — musician-basic Discography UI live-read (not Slice A)

After owner login, Discography UI showed:

「最新データの取得に失敗しました。編集はできません。」

4 releases / 34 tracks still rendered (SSR anon published SELECT). Edit buttons disabled.

**Not** Slice A authz/RLS. **Not** a live Edge probe blocker (`LIVE_EDGE_PROBE_BLOCKER` was **false** before execution).

Cause: `AdminGosakiStagingDiscographyOperatorPage.astro` calls `initGosakiDiscographyOperationalEdit` without `supabaseUrl` / `anonKey` / `siteSlug`. `fetchLive` short-circuits before `GET /rest/v1/discography` and `GET /rest/v1/discography_tracks`. Package page `GosakiStagingReadOnlyAdminPage.astro` already passes those deps.

`UI_READ_WIRING_FINDING_RECORDED: true` · `UI_READ_WIRING_FIXED: false`

Do **not** fix in this recording phase. Deferred slice: `discography-musician-basic-live-read-wiring-fix`.

---

## 9. Explicit non-actions this recording phase

- No `secrets set` / `unset`
- No owner POST
- No UI Save / Dry-run
- No Edge deploy
- No DB INSERT/UPDATE/DELETE
- No `service_role`
- No owner → `admin_users`
- No production
- No commit / push by Cursor
- No PAT / JWT / anon values in this file

---

## 10. Next

**Primary:** `discography-site-owner-authz-slice-b-planning` (UPDATE grants / site-writer UPDATE RLS — separate approval).

**Deferred:** `discography-musician-basic-live-read-wiring-fix` (pass live-read deps; prefer `getStagingAuthConfig` over DOM dataset).

Slice A live Edge `can_write_site` proof is **closed**. Do not reuse this probe packet.
