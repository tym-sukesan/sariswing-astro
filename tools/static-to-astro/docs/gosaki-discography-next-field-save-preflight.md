# G-15d — Gosaki Discography next-field Save preflight (artist / discography-003)

Last updated: 2026-06-28  
Phase: `G-15d-gosaki-discography-existing-release-artist-non-dry-run`  
Status: **Save preflight complete — Save NOT executed**

## Gate

```txt
gosakiDiscographyNextFieldSavePreflightComplete: true
readyForG15dDiscographyArtistSaveExecution: true
saveExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
```

**Do not click Save in this phase.** Operator Save once in execution phase only (`G-15d-execution`).

## Why artist (not streaming_url)

| Candidate | Decision |
| --- | --- |
| `streaming_url` | Rejected — 001/002/004 are null (would invent URLs); 003 already has correct TuneCore URL |
| **`artist`** | **Selected** — safe typo/branding fix on 003; dry-run diff clear; no external URL invention |
| `title` | Deferred — higher public visibility than artist casing |
| `year` / `release_date` | Deferred — date semantics need extra validation |

## Target row

| Item | Value |
| --- | --- |
| `legacy_id` | `discography-003` |
| `id` | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| `title` | `About Us!!` |
| **field** | `artist` |
| **before** | `ごさきりかこtrio` |
| **after** | `ごさきりかこTrio` |
| `expectedBeforeUpdatedAt` | `2026-06-05T17:39:44.201802+00:00` |
| dry-run `approvalId` | `G-15d-gosaki-discography-artist-dry-run-slice` |
| Save `approvalId` | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| `changedFields` | `["artist"]` only |
| `rowsAffected` | must be `1` |
| optimistic lock | `expectedBeforeUpdatedAt` required; UPDATE `.eq("updated_at", …)` |

## Single-arm policy

- G-15d arm: `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED=true`
- G-15b arm **must be off** when G-15d armed (`PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED` off)
- **Do not re-Save `discography-002`** (`purchase_url` chain closed in G-15c-f)

## updated_at trigger live proof (post-Save expectation)

Trigger `discography_set_updated_at` is active on staging since G-15b-f8.

On successful G-15d Save (execution phase only):

```txt
beforeSnapshot.updated_at = 2026-06-05T17:39:44.201802+00:00
afterSnapshot.updated_at  > beforeSnapshot.updated_at (new timestamp)
artist                    = ごさきりかこTrio
purchase_url / streaming_url / title / other fields unchanged
```

G-15b Save did not advance `updated_at` (trigger applied after that Save). G-15d is the first intended live proof.

## Public reflection

| Item | Value |
| --- | --- |
| Required after Save? | **Yes (later phase)** — artist appears in Wix Discography h2 |
| Hook today | `supabase-discography-read.mjs` patches `purchase_url` only |
| This phase | No regen / no upload |

## Rollback

```sql
-- staging only — run only if operator requests rollback after G-15d execution
UPDATE public.discography
SET artist = 'ごさきりかこtrio'
WHERE legacy_id = 'discography-003'
  AND id = 'd17653b4-f83d-4548-9936-d3fcc218906e';
```

`rollbackNeeded` after successful Save: **no** (cosmetic casing; easy revert if desired).

## beforeSnapshot (staging — read-only verified)

```txt
legacy_id: discography-003
title: About Us!!
artist: ごさきりかこtrio
purchase_url: null
streaming_url: https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja
updated_at: 2026-06-05T17:39:44.201802+00:00
```

## afterVerification (execution phase — SELECT only)

```sql
SELECT legacy_id, title, artist, purchase_url, streaming_url, updated_at
FROM public.discography
WHERE legacy_id = 'discography-003';
```

Expected:

```txt
artist = ごさきりかこTrio
updated_at > 2026-06-05T17:39:44.201802+00:00
purchase_url unchanged (null)
streaming_url unchanged (TuneCore URL)
```

## Dry-run Preview expectation

Operator UI: `/__admin-staging-shell/musician-basic/` → Discography → select **About Us!!** → set artist to `ごさきりかこTrio` → **変更を確認**

```txt
dryRun: true
actualWrite: false
wouldWrite: true
changedFields: ["artist"]
payload: { "artist": "ごさきりかこTrio" }
saveReadiness: ready_but_save_disabled (default dev)
saveAllowed: false
optimisticLockStale: false (when row unchanged)
```

## Save preflight (default — Save disabled)

```txt
saveEnabled: false (G15D_DISCOGRAPHY_SAVE_ENABLED unset / false)
armFailureReason: includes PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED=true; PUBLIC_ADMIN_WRITE_DRY_RUN=false; …
Save button: disabled
executeG15dDiscographyArtistSave: returns save_disabled without DB write
```

## Dev arm stack (execution phase only — operator)

```bash
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=discography \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-15d-gosaki-discography-existing-release-artist-non-dry-run \
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED=true \
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true \
G15D_DISCOGRAPHY_SAVE_ENABLED=true \
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
npm run dev
```

Procedure: Preview → gates pass → Save **once** → verify `updated_at` advanced.

## Implementation files

| Path | Role |
| --- | --- |
| `gosaki-discography-next-field-types.ts` | G-15d constants |
| `gosaki-discography-artist-dry-run-guards.ts` | dry-run guards |
| `gosaki-discography-existing-release-artist-dry-run.ts` | dry-run executor |
| `gosaki-discography-artist-save-config.ts` | Save arm / gates |
| `gosaki-discography-artist-save-page-config.ts` | server DOM bridge |
| `gosaki-discography-existing-release-artist-save.ts` | Save executor (gated) |
| `discography-write-types.ts` | G-15d approval + `artist` payload |
| `discography-write-guards.ts` | G-15d write guards |
| `discography-write-adapter.ts` | slice-aware adapter |
| `gosaki-staging-discography-admin-ui.ts` | row routing 002/003 |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | G-15d page config |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g15d-gosaki-discography-next-field-save-preflight.mjs
```

## Closure commit baseline

G-15 `purchase_url` MVP closed at `c2870e0`. G-15d builds on that baseline.

## Not in this phase

- Save execution
- DB write / SQL mutation
- FTP / public upload / reflection
- `src/pages/admin` changes
- `service_role`
