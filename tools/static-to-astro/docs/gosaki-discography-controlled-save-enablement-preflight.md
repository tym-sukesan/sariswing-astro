# G-20u42 — Gosaki Discography controlled Save enablement preflight

**Phase:** `G-20u42-gosaki-discography-controlled-save-enablement-preflight`  
**Status:** **complete** — read-only investigation + preflight record only  
**Date:** 2026-07-17  
**HEAD at start:** `761e2b3` (= `origin/main`, working tree clean)  
**Prior:** G-20u41 gated Save UI STG QA · G-20u36e/f allowlisted track-title controlled Save (closed)

| Check | Status |
| --- | --- |
| Read-only Save path fact fix | **yes** |
| Execution surface A vs B comparison | **yes** (recommend **local_shell**) |
| Filtered read of 4 releases | **yes** (staging anon SELECT) |
| Executable first controlled Save under current Edge + G-20u42 constraints | **no** — blocked |
| Env change / build / package / FTP / dry-run / Save / DB write | **no** |
| Operator runbook | **not in this doc** (ChatGPT later) |

---

## Gates

```txt
phase: G-20u42-gosaki-discography-controlled-save-enablement-preflight
CONTROLLED_SAVE_PREFLIGHT_READY: false
CONTROLLED_SAVE_TARGET_FIXED: false
EXACT_BEFORE_VALUE_CAPTURED: true
EXACT_RESTORE_VALUE_FIXED: true
OPTIMISTIC_LOCK_BASELINE_CAPTURED: true
EXECUTION_SURFACE_RECOMMENDED: local_shell
ARM_DISARM_PLAN_FIXED: true
RESTORE_PLAN_FIXED: true
DB_WRITE_EXECUTED: false
ENV_CHANGED: false
PACKAGE_GENERATED: false
FTP_EXECUTED: false
DRY_RUN_REQUEST_EXECUTED: false
SAVE_REQUEST_EXECUTED: false
SERVICE_ROLE_USED: false
PRODUCTION_TOUCHED: false
```

**STOP:** Do not treat this phase as permission to arm Save, click Save, open RLS grants, or deploy Edge.

**Follow-up (G-20u43 local · 2026-07-17):** Label controlled Save slice implemented **locally** (`G-20u43-gosaki-discography-label-controlled-save-slice`) for `discography-004.label` original↔temporary. **Edge not deployed.** UI Save approval now points at G-20u43 (tracklist ID retained as historical constant only).
**Commit-pre safety fix (same phase):** nested `release` / `trackPolicy` / `clientDryRun` own-key allowlist on Edge · UPDATE row-count classifier · verifier negative cases. **Still not execution-ready.**
**CONTROLLED_SAVE_PREFLIGHT_READY remains false** until Edge deploy preflight + execution readiness are separately recorded.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.

---

## Blockers (why PREFLIGHT_READY = false)

1. **Edge `operation=save` is allowlist-only** — not a general release Save. Current allowlist = G-20u36e forward + G-20u36f restore (track 1 **title** on `discography-002` only).
2. **G-20u42 first-slice rules forbid** title / artist / tracklist / cover / insert / delete / multi-field — so the only Edge-executable slice (tracklist title) is **out of scope**.
3. **Edge rejects release scalar changes** with `reasonCode: release_scalar_change_forbidden` when `request.release` differs from DB.
4. **G-20u41 UI Save payload** uses `approvalId=G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` but does **not** send `sliceId` / `targetRowId` / `trackNumber` / `beforeTitle` required by `resolveControlledSaveSlice` → would fail `controlled_slice_not_allowlisted` (or related mismatch).
5. **G-20u36f closed** authenticated track title UPDATE grant / restrictive policy — replaying G-20u36e requires a separate permission-open phase (not this preflight).
6. **Controlled Save success body has no `updatedAt` / `updated_at`** — UI path that expects those fields cannot refresh optimistic lock from Edge track-title success alone. `discography_tracks.updated_at` column **does not exist** on staging.

Preferred scalar candidate values are captured below for a **future** Edge+UI slice — not executable now → `CONTROLLED_SAVE_TARGET_FIXED: false`.

---

## 1. Current Save path (facts)

| Item | Value |
| --- | --- |
| Endpoint URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| Override env | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT` (optional; default = above) |
| Save operation | `save` (`G20U41_DISCOGRAPHY_SAVE_OPERATION`) |
| Save approval ID | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| Dry-run operation | `dryRun` |
| Dry-run approval ID | `G-20u31-gosaki-discography-save-dry-run-endpoint` |
| Dry-run / Save separation | Same URL; **operation + approvalId differ** |
| Env arm variable | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` |
| Env unset resolved | `saveArmed=false` — armed **only** if string exactly `"true"` (`isG20u41DiscographyOperationalSaveArmed`) |
| Auth required (UI gate) | yes — session access token Bearer; gate fails with 「ログインが必要です」 |
| Auth required (Edge Save) | yes — `Authorization: Bearer <user JWT>` + `public.is_admin() === true`; anon key as `apikey` header |
| `expectedBeforeUpdatedAt` (UI gate) | **required** non-empty for Save button enable |
| `expectedBeforeUpdatedAt` (Edge allowlisted Save) | **not used** on UPDATE — track match uses `id` + `title=beforeTitle` |
| Auto-retry | **none** — single `fetch`; `saveInFlight` guard blocks double click while in flight |

### UI Save request builder

`buildDiscographySaveEndpointRequest` = dry-run body with:

- `operation: "save"`
- `approvalId: "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice"`

Includes: `siteSlug`, `legacyId`, `expectedBeforeUpdatedAt`, `release{…}`, `tracksText`, `trackPolicy`, `clientDryRun`.  
Does **not** include: `sliceId`, `targetRowId`, `trackNumber`, `beforeTitle`, `afterTitle`.

### Edge Save behavior (handler)

- Async path only (`handleDiscographyEdgeDryRunHttpAsync` → `handleControlledG20u36eSaveHttp`).
- Allowlist match required (`CONTROLLED_SAVE_SLICE_ALLOWLIST`).
- UPDATE: `discography_tracks` **title only** for allowlisted row.
- Broad / unlisted Save: rejected (`controlled_slice_not_allowlisted` / related).
- `service_role`: not connected (`SUPABASE_SERVICE_ROLE_CONNECTED = false`).

### Success response shape (allowlisted Edge Save)

Documented fields include (among others):

- `ok: true`
- `operation: "save"`
- `controlledSave: true`
- `updatedRows: 1`
- `beforeTitle` / `afterTitle`
- `readBack{…}`
- `didWrite: true` / `dbWrite: true` / `networkWrite: true`
- `status: 200`
- **no** `updatedAt` / `updated_at`

### Conflict / failure response shape

`buildControlledSaveFailure`:

- `ok: false`
- `operation: "save"`
- `controlledSave: true`
- `reasonCode` (e.g. `update_zero_rows`, `missing_authorization`, `admin_required`, `controlled_slice_not_allowlisted`)
- `errors: [message]`
- `updatedRows: 0`
- `didWrite: false` / `dbWrite: false`
- HTTP status 400 / 401 / 403 / 409 / 500 as applicable

UI conflict detection (`isDiscographySaveConflictResponse`): matches `reasonCode` / `message` / `errors` against `/stale|conflict|optimistic|updated_at|0 rows|already changed/`.

### UI post-success `updated_at` update

On `display.ok === true`, client reads `data.updatedAt` or `data.updated_at` and writes:

- `form.dataset.expectedBeforeUpdatedAt`
- `form.dataset.originalSnapshot`
- album cache `updatedAt`

If Edge omits those fields, lock fingerprint is **not** refreshed from response.

---

## 2. Execution surface comparison (not executed)

| Criterion | A. Armed staging package + manual FTP | B. Local operator shell → staging Edge |
| --- | --- | --- |
| Source change | no (env at package build time) | no |
| Env arm | bake `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true` into STG admin package | N/A for curl/shell allowlisted Save; local Astro would need env for UI only |
| Package generation | **required** | **not required** |
| FTP / manual upload | **required** (apply suspended — manual only) | **not required** |
| Disarm after Save | rebuild **disarmed** package + manual FTP again | stop shell / leave STG package disarm default |
| Public / staging display | STG admin can show enabled Save while armed package live | no STG HTML change |
| Mistake blast radius | armed Save UI on shared STG admin until disarm FTP | limited to shell operator session |
| Runs without code change | only if Edge accepts UI payload (currently **no**) | yes for **allowlisted** curl body (historical G-20u36e/f); **not** for preferred scalar yet |

**Recommended:** `local_shell`  
Rationale: no FTP arm window, no leftover armed STG package, matches prior controlled Save execution style, smaller blast radius. G-20u41 UI arm path remains useful later **after** Edge supports a scalar allowlist + UI payload alignment — not for this first enablement under current handlers.

---

## 3. Filtered read snapshot (staging · read-only)

**Host:** `kmjqppxjdnwwrtaeqjta.supabase.co`  
**Filter:** `discography.site_slug = 'gosaki-piano'`  
**Count:** 4 releases  
**Loader note (G-20u25):** filtered read by `site_slug` is the default path.

| legacy_id | title | label | purchase_url | catalog_number | updated_at |
| --- | --- | --- | --- | --- | --- |
| discography-001 | Continuous | `null` | `https://gosakirikako.base.shop/` | GSRT-0002 | `2026-07-10T05:59:35.138671+00:00` |
| discography-002 | SKYLARK | `null` | `https://gosakirikako.base.shop/` | STU-001 | `2026-07-10T05:59:35.138671+00:00` |
| discography-003 | About Us!! | `null` | `null` | GSRT-0001 | `2026-07-10T05:59:35.138671+00:00` |
| discography-004 | Ja-Jaaaaan! | `Mardi Gras JAPAN Records` | `null` | OMP-001 | `2026-07-10T05:59:35.138671+00:00` |

**discography-002 track 1 (prior controlled Save row):**

| Item | Value |
| --- | --- |
| track id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| title | `On a Clear Day` (marker restored; G-20u36f closed) |
| track 7 | `Like a Lover` |
| tracks.updated_at | **column absent** |

Past controlled Save: track 1 title marker (G-20u36e) then restore (G-20u36f). **Out of scope** for G-20u42 first scalar enablement.

---

## 4. Preferred future scalar candidate (not executable now)

Selection rules applied: single scalar · not title/artist/tracklist/cover · non-null before value · exact restore · low client-facing risk · prior planning affinity (G-17 label on 004).

| Item | Value |
| --- | --- |
| release identifier | `discography-004` |
| album title | `Ja-Jaaaaan!` |
| target field | `label` |
| exact before value | `Mardi Gras JAPAN Records` |
| proposed temporary value | `[CMS Kit staging] G-20u42 label PoC` |
| exact restore value | `Mardi Gras JAPAN Records` |
| current updated_at | `2026-07-10T05:59:35.138671+00:00` |
| lock baseline source | anon filtered SELECT `discography.updated_at` where `site_slug=gosaki-piano` and `legacy_id=discography-004` |

**Rejected for first slice:**

- title / artist / tracks / cover (forbidden)
- null→string label on 001–003 (null vs `""` restore risk)
- re-open G-20u36e track title (forbidden tracklist; permission closed)

`CONTROLLED_SAVE_TARGET_FIXED: false` — candidate recorded only; no Edge/UI path can apply it today.

---

## 5. Restore plan (template · blocked until Save path exists)

Assumptions when a future scalar Save path exists and uses the same UI/Edge route:

1. **After temporary Save:** read-only filtered SELECT of target field + `updated_at`; confirm temporary value; confirm other releases unchanged.
2. **New lock:** prefer Save response `updatedAt`/`updated_at` if present; else immediate filtered SELECT of `updated_at` → use as `expectedBeforeUpdatedAt` for restore Save.
3. **Restore Save:** same surface / same approval gates; payload field = exact before value only.
4. **After restore:** filtered SELECT must equal exact before value (string equality); `updated_at` advanced; other releases/fields unchanged.
5. **Do not** build/FTP static package while temporary value is live — confirm on DB then restore immediately.
6. **STOP if restore fails:** do not retry blindly; do not package; record incident; ask human (rollback SQL only with separate explicit approval).

---

## 6. Arm / disarm (staging package surface — facts only)

Used if/when testing G-20u41 UI on STG (not recommended for first controlled Save under current Edge).

| Step | Fact |
| --- | --- |
| Arm | Build staging admin package with `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED=true` (exact string) |
| Confirm embedded | Inspect packaged admin HTML/JS for `saveArmed` / env resolve path showing armed; Save gate reason must not be env-disarmed |
| Production package | **must not** set this env; production profile excludes read-only admin (`manual-upload:package:gosaki:production`) |
| Disarm | Rebuild staging package **without** arm (env unset or not `"true"`) + manual FTP replace |
| Completion | STG admin Save remains disabled by default; no armed package left as “current” upload; routine work uses disarmed package |

**This phase:** no env change, no package, no FTP.

**Recommended surface `local_shell`:** package arm **not required**.

---

## 7. Success criteria (for a future execution phase)

Minimum:

- one release · one field only
- before value matches pre-recorded exact value
- dry-run success (operation/approval dry-run IDs)
- Save response `ok: true` with expected changed field only
- `updated_at` advances (release row) or documented lock alternative verified
- filtered read shows temporary value
- restore Save success
- filtered read exact before value
- other releases/fields unchanged
- no conflict
- no `service_role`
- no production touch

---

## 8. STOP criteria (for a future execution phase)

Minimum:

- current value ≠ pre-record
- `updated_at` already changed vs baseline without explanation
- cannot obtain `expectedBeforeUpdatedAt`
- dry-run unexpected
- payload changes multiple fields unexpectedly
- Save arm state unknown
- approval ID mismatch
- auth state unknown
- conflict response
- Save ok but filtered read cannot confirm
- restore not exact
- other release affected
- network outcome ambiguous
- possible double submit

**Additional STOP for G-20u42 enablement:** attempting Save via G-20u41 UI or scalar payload against current Edge allowlist without a new implemented/deployed slice.

---

## Recommended next (human / ChatGPT)

1. **Do not** write operator Save runbook as “ready to execute” against current Edge.
2. Plan next implementation slice (separate phase): Edge allowlist + approval ID for **one scalar field** (preferred: `discography-004.label`) **or** intentionally redefine first enablement as another allowlisted track slice (conflicts with G-20u42 forbid list).
3. Align G-20u41 Save request builder with Edge allowlist fields **or** keep shell-only for first scalar PoC.
4. Only after that: ChatGPT operator execution procedure · permission open/close · then controlled Save.

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u42-gosaki-discography-controlled-save-enablement-preflight
```

---

## G-20u44a follow-up (local operator wiring — complete)

G-20u44 identified local musician-basic Discography route wiring gaps. **G-20u44a** fixed by mirroring `GosakiStagingReadOnlyAdminPage` body datasets on `AdminGosakiStagingShellLayout` + `getAccessToken` / `saveArmed` on `AdminGosakiStagingDiscographyOperatorPage`.

| Item | Status |
| --- | --- |
| EXECUTION_SURFACE_RECOMMENDED | `local_shell` (unchanged) |
| LOCAL_OPERATOR_SAVE_ARM_WIRED | **true** |
| CONTROLLED_SAVE_EXECUTION_READY | **true** (local shell + Edge v9 · operator Save manual) |
| CONTROLLED_SAVE_PREFLIGHT_READY | **false** (historical preflight phase gate — unchanged) |
| STG package default disarmed | **true** (unchanged) |
| SAVE_REQUEST_EXECUTED | **false** |
| DB_WRITE_EXECUTED | **false** |

**Next:** ~~ChatGPT controlled Save operator procedure~~ **G-20u44b 403** → **G-20u44c permission SQL prep** (complete) → operator preflight SELECT.

---

## G-20u44c follow-up (label permission SQL prep — complete)

G-20u44b diagnosed controlled Save **403** as Class **B**: `authenticated` lacks `UPDATE(label)` on `public.discography` (G-20u36a revoke; G-20u36e reopened `discography_tracks.title` only).

| Item | Status |
| --- | --- |
| Doc | `gosaki-discography-label-permission-enablement-prep.md` |
| PERMISSION_PREFLIGHT_SQL_READY | **true** |
| PERMISSION_APPLY_SQL_READY | **true** |
| Policy | `discography_g20u43_label_update_restrict` |
| SQL_EXECUTED | **false** |
| DB_WRITE_EXECUTED | **false** |
| SAVE_REQUEST_EXECUTED | **false** |

**Next:** Commit/Push → operator runs §A preflight SELECT on staging `kmjqppxjdnwwrtaeqjta` only.
