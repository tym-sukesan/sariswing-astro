# G-20u43 — Gosaki Discography label controlled Save slice local implementation

**Phase:** `G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation`  
**Status:** **complete** — local source + non-write verify only · **not execution-ready**  
**Date:** 2026-07-17  
**HEAD at start:** `4c2e589` (= `origin/main`, working tree clean)  
**Prior:** G-20u42 controlled Save enablement preflight (`CONTROLLED_SAVE_PREFLIGHT_READY: false`)

| Check | Status |
| --- | --- |
| Edge allowlist G-20u43 label slice (local) | **yes** |
| UI Save approval → G-20u43 | **yes** |
| Label-only + two-way gate | **yes** |
| Track-title G-20u36e/f path preserved | **yes** |
| Edge deploy | **no** |
| Save / DB write / env / package / FTP | **no** |
| Operator runbook / 実行可能 | **no** |

---

## Gates

```txt
phase: G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation
LABEL_CONTROLLED_SAVE_SLICE_IMPLEMENTED: true
TARGET_RESTRICTED_TO_DISCOGRAPHY_004: true
LABEL_ONLY_CHANGE_ENFORCED: true
EXACT_TWO_WAY_TRANSITION_ENFORCED: true
NEW_APPROVAL_ID_ENFORCED: true
OPTIMISTIC_LOCK_REQUIRED: true
NESTED_PAYLOAD_ALLOWLIST_FAILS_CLOSED: true
RELEASE_UNKNOWN_KEYS_REJECTED: true
TRACK_POLICY_UNKNOWN_KEYS_REJECTED: true
CLIENT_DRY_RUN_UNKNOWN_KEYS_REJECTED: true
ATOMIC_LABEL_WHERE_VERIFIED: true
ZERO_ROW_UPDATE_TESTED: true
MULTI_ROW_UPDATE_TESTED: true
LOCAL_SHELL_ARM_FAILS_CLOSED: true
STAGING_PACKAGE_DEFAULT_DISARMED: true
EDGE_DEPLOY_EXECUTED: false
SAVE_REQUEST_EXECUTED: false
DB_WRITE_EXECUTED: false
ENV_CHANGED: false
PACKAGE_GENERATED: false
FTP_EXECUTED: false
CONTROLLED_SAVE_PREFLIGHT_READY: false
SERVICE_ROLE_USED: false
PRODUCTION_TOUCHED: false
```

**Not execution-ready:** Edge is **not deployed**. G-20u42 `CONTROLLED_SAVE_PREFLIGHT_READY` remains **false**.

---

## Allowlisted target

| Item | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| release identifier | `discography-004` |
| album | `Ja-Jaaaaan!` |
| field | `label` |
| exact original | `Mardi Gras JAPAN Records` |
| exact temporary | `[CMS Kit staging] G-20u42 label PoC` |

### Allowed transitions (only)

1. original → temporary  
2. temporary → original  

All other label values / releases / fields → fail-closed.

---

## Approval IDs

| Path | operation | approvalId |
| --- | --- | --- |
| Dry-run (unchanged) | `dryRun` | `G-20u31-gosaki-discography-save-dry-run-endpoint` |
| Save (new) | `save` | `G-20u43-gosaki-discography-label-controlled-save-slice` |
| Track-title Save (preserved Edge) | `save` | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` (+ G-20u36f restore ID) |

UI `G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID` now aliases **G-20u43** (does **not** reuse tracklist ID). Historical tracklist ID kept as `G20U36_DISCOGRAPHY_TRACKLIST_SAVE_APPROVAL_ID`.

---

## Edge files (local)

- `supabase/functions/gosaki-discography-save-dry-run/handler.ts`
- `supabase/functions/gosaki-discography-save-dry-run/index.ts` (comment only)

### Behavior

- Async router: `approvalId === G-20u43…` → `handleControlledG20u43LabelSaveHttp`; else existing `handleControlledG20u36eSaveHttp`.
- Requires: user JWT · `is_admin()` · site/legacy match · `expectedBeforeUpdatedAt` match · label-only diff · exact two-way transition · no unexpected top-level keys · no `service_role`.
- **Nested allowlist (G-20u43 only):** `validateG20u43NestedSavePayload` — own enumerable keys only · required keys + types for `release` / `trackPolicy` / `clientDryRun`.
- Tracks: if `tracksText` present, must match DB (tracklist change forbidden).
- UPDATE: `discography.label` only with `.eq(site_slug).eq(legacy_id).eq(label, before).eq(updated_at, lock)`.
- **Update row count:** `classifyG20u43LabelUpdateOutcome` — 0 rows → 409 · ≠1 → 500 · missing `updated_at` → 500.
- Success response includes `updated_at` + `updatedAt`.

### Nested allowlists (formal payload)

| Object | Allowed keys |
| --- | --- |
| `release` | `title`, `artist`, `release_date`, `label`, `catalog_number`, `published`, `cover_image_url`, `purchase_url`, `streaming_url`, `description` |
| `trackPolicy` | `oneLineOneTrack`, `blankLinesIgnored`, `allowDuplicateTitles`, `allowEmptyTrackList` |
| `clientDryRun` | `totalBefore`, `totalAfter`, `added`, `removed`, `reordered`, `wouldWrite` |

Unknown own keys → `nested_payload_invalid` (400). `clientDryRun.wouldWrite` must be `false`.

---

## UI / runtime files

- `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts`
- `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro`
- `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` (G-20u44a local shell wiring)
- `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro` (G-20u44a body datasets)
- `tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro` (`wireDiscographyOperationalRuntime`)

### Behavior

- Env arm: `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED === "true"` only; unset/false/other → disarmed.
- Local shell is **not** unconditionally armed.
- **G-20u44a:** local musician-basic Discography route mirrors `GosakiStagingReadOnlyAdminPage` body datasets + `getAccessToken` (staging session) + `saveArmed` from `data-gosaki-discography-save-armed`.
- Save gate requires G-20u43 approval match + `g20u43LabelSlice` eligibility (004 · label-only · two-way).
- Candidate approval from `data-g20u41-discography-save-approval-id`; expected from formal constant (separated).
- `saveInFlight` · no conflict auto-retry · dry-run re-lock on edit.

### G-20u44a local operator wiring (complete)

| Gate | Status |
| --- | --- |
| LOCAL_OPERATOR_SAVE_ARM_WIRED | **true** |
| LOCAL_OPERATOR_ENDPOINT_WIRED | **true** |
| LOCAL_OPERATOR_GET_ACCESS_TOKEN_WIRED | **true** |
| DRY_RUN_ENDPOINT_CONFIGURED_CORRECTLY | **true** (when staging env + providers match) |
| SAVE_APPROVAL_G20U43_WIRED | **true** |
| UNARMED_DEFAULT_FAILS_CLOSED | **true** |
| STAGING_PACKAGE_DEFAULT_DISARMED | **true** (unchanged) |
| CONTROLLED_SAVE_EXECUTION_READY | **true** (local shell + Edge v9 · operator Save still manual) |
| SAVE_REQUEST_EXECUTED | **false** |
| DB_WRITE_EXECUTED | **false** |

### G-20u44b / G-20u44c (403 diagnosis + permission prep)

| Gate | Status |
| --- | --- |
| ROOT_CAUSE_CLASS | **B** — no `UPDATE(label)` grant on `public.discography` |
| PERMISSION_APPLY_SQL_READY | **true** (doc prepared · **not executed**) |
| Policy (when applied) | `discography_g20u43_label_update_restrict` |
| SQL_EXECUTED | **false** |
| SAVE blocked until | operator applies §B SQL on staging after preflight PASS |

Doc: `gosaki-discography-label-permission-enablement-prep.md` · verifier: `verify:g20u44c-…`

---

## Gate lib (verifier fixtures)

- `tools/static-to-astro/scripts/lib/gosaki-discography-g20u43-label-controlled-save-gate.mjs`

Pure Node-runnable mirror of allowlist rules — **no fetch / no Save**.

---

## Recommended next

~~ChatGPT controlled Save operator procedure~~ **G-20u44c permission SQL prep complete** → operator apply → **G-20u44 round-trip complete** → permission rollback.

---

## G-20u44 controlled Save round-trip result (operator · read-only verification)

**Status:** complete · recorded in `gosaki-discography-controlled-save-enablement-preflight.md` (§ G-20u44)
**Staging:** `kmjqppxjdnwwrtaeqjta` · `discography-004.label` restored to `Mardi Gras JAPAN Records`
**Post-restore `updated_at`:** `2026-07-16T18:35:15.236693+00:00` · releases **4** · tracks **34**

```txt
CONTROLLED_SAVE_TEMPORARY_WRITE_PASSED: true
CONTROLLED_SAVE_RESTORE_PASSED: true
FINAL_LABEL_RESTORED: true
OTHER_DATA_UNCHANGED: true
LOCAL_ARM_TERMINATED: true
CONTROLLED_SAVE_ROUND_TRIP_COMPLETED: true
```

### G-20u44c permission rollback closure (operator)

§D rollback succeeded; corrected §E verification returned **PASS**. The
`authenticated` label UPDATE grant and G-20u43 RESTRICTIVE policy are removed;
table-wide authenticated UPDATE and anon UPDATE remain denied.

```txt
PERMISSION_ROLLBACK_COMPLETED: true
AUTHENTICATED_LABEL_UPDATE_REVOKED: true
RESTRICTIVE_POLICY_REMOVED: true
VERIFICATION_PERMISSION_CLOSED: true
FINAL_LABEL_RESTORED: true
FINAL_UPDATED_AT_VERIFIED: true
CONTROLLED_SAVE_ROUND_TRIP_COMPLETED: true
PRODUCTION_CHANGED: false
```

Final `updated_at`: `2026-07-16T18:35:15.236693+00:00`.

**Next:** Commit/Push → next CMS feature development.
