# G-20u36e — Gosaki Discography First controlled Save preflight

**Phase:** `G-20u36e-controlled-save-preflight`  
**Status:** **complete** — preflight only · **Save not executed** · **SQL not executed** · **operation=save not sent**  
**Date:** 2026-07-13  
**Base commit:** `df580a7`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-plan.md](./gosaki-discography-g20u36e-controlled-save-plan.md) · [gosaki-discography-g20u36d-readback-live-verify-retry-3.md](./gosaki-discography-g20u36d-readback-live-verify-retry-3.md) — **PASS**

| Check | Status |
| --- | --- |
| Controlled Save plan | **complete** (G-20u36e planning) |
| retry-3 readBack live verify | **PASS** — trackCount=8 |
| Preflight doc | **yes** (this file) |
| Snapshot SELECT SQL documented | **yes** — **not executed** |
| Rollback SQL documented | **yes** — **not executed** |
| dryRun payload locked | **yes** — **not sent** |
| Save enabled | **no** |
| operation=save sent | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePreflightReady: true
phase: G-20u36e-controlled-save-preflight
preflightOnly: true
saveEnabled: false
executableSaveAllowed: false
operationSaveSent: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
rollbackSqlExecuted: false
dryRunPayloadSent: false
readyForG20u36eControlledSaveSnapshotSelectExecution: true
readyForG20u36eControlledSaveEdgeSavePathPlanning: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

**Cursor must NOT:** execute SQL · send dryRun HTTP · send operation=save · enable Save · deploy Edge · change admin UI · FTP upload.

---

## 1. Target slice (locked)

| Item | Value |
| --- | --- |
| **sliceId** | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| **siteSlug** | `gosaki-piano` (fixed) |
| **legacyId** | `discography-002` (fixed) |
| **release title** | **SKYLARK** |
| **approvalId** | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| **table / operation** | `public.discography_tracks` — single-row `title` UPDATE |
| **track pin** | `track_number = 1` |
| **before title** | `On a Clear Day` |
| **after title** | `On a Clear Day [CMS Kit staging G-20u36e]` |
| **track count** | **8 → 8** (no INSERT / DELETE) |
| **release scalar fields** | **unchanged** |
| **track 7** | **must not change** — `Like a Lover（テスト）` (G-18g2 closed chain) |
| **no-op Save** | **forbidden** — dryRun must show `wouldWrite=true` |

**Endpoint (dryRun verify only — future phases):**

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run
```

---

## 2. Save前 snapshot — SELECT-only SQL (NOT EXECUTED in preflight phase)

**Classification:** SELECT-only.  
**Forbidden in this block:** INSERT · UPDATE · DELETE · ALTER · CREATE · DROP · GRANT · REVOKE · RPC.

**Operator:** copy entire block into Supabase SQL Editor on staging **`kmjqppxjdnwwrtaeqjta`** only in **`G-20u36e-controlled-save-snapshot-select-execution`** phase.  
**Do NOT run on production ref `vsbvndwuajjhnzpohghh`.**

**Output shape:** single row · single JSON column `g20u36e_before_snapshot`.

```sql
-- G-20u36e — Gosaki Discography First controlled Save before snapshot (SELECT-ONLY)
-- Phase: G-20u36e-controlled-save-preflight (documented · NOT EXECUTED in preflight phase)
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Cursor does NOT execute this block.
-- Allowed: SELECT only. Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE RPC

WITH params AS (
  SELECT
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id
),
release_row AS (
  SELECT
    d.id,
    d.legacy_id,
    d.site_slug,
    d.title,
    d.published,
    d.updated_at,
    d.release_date,
    d.catalog_number
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug
    AND d.legacy_id = p.target_legacy_id
  LIMIT 1
),
track_rows AS (
  SELECT
    t.id,
    t.discography_legacy_id,
    t.site_slug,
    t.track_number,
    t.title,
    t.sort_order
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
checks AS (
  SELECT
    (SELECT count(*) FROM release_row) AS release_row_count,
    (SELECT count(*) FROM track_rows) AS track_count,
    (SELECT title FROM track_rows WHERE track_number = 1 LIMIT 1) AS track_1_title,
    (SELECT title FROM track_rows WHERE track_number = 7 LIMIT 1) AS track_7_title,
    (SELECT count(*) FROM track_rows WHERE discography_legacy_id <> 'discography-002') AS wrong_legacy_id_rows,
    (SELECT count(*) FROM track_rows WHERE site_slug <> 'gosaki-piano') AS wrong_site_slug_rows,
    (SELECT string_agg(title, '|' ORDER BY sort_order ASC, track_number ASC) FROM track_rows) AS tracks_title_fingerprint
)
SELECT jsonb_build_object(
  'phase', 'G-20u36e-controlled-save-snapshot-select-execution',
  'project_ref', 'kmjqppxjdnwwrtaeqjta',
  'production_ref_stop', 'vsbvndwuajjhnzpohghh',
  'slice_id', 'G-20u36e1-discography-002-track-1-title-staging-marker',
  'release', (SELECT to_jsonb(r) FROM release_row r),
  'tracks', COALESCE(
    (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.sort_order ASC, t.track_number ASC) FROM track_rows t),
    '[]'::jsonb
  ),
  'checks', (SELECT to_jsonb(c) FROM checks c)
) AS g20u36e_before_snapshot;
```

### 2.1 Expected snapshot values (STOP if mismatch)

| Check | Expected |
| --- | --- |
| `release_row_count` | **1** |
| `release.legacy_id` | `discography-002` |
| `release.site_slug` | `gosaki-piano` |
| `release.title` | `SKYLARK` |
| `track_count` | **8** |
| `track_1_title` | `On a Clear Day` |
| `track_7_title` | `Like a Lover（テスト）` |
| `wrong_legacy_id_rows` | **0** |
| `wrong_site_slug_rows` | **0** |
| All tracks `discography_legacy_id` | `discography-002` only |
| All tracks `site_slug` | `gosaki-piano` only |

**Ordered tracks (before Save — expected fingerprint):**

| track_number | title |
| --- | --- |
| 1 | On a Clear Day |
| 2 | My Blue Heaven |
| 3 | How Deep Is The Ocean |
| 4 | Skylark |
| 5 | Set Sail |
| 6 | What a Wonderful World |
| 7 | Like a Lover（テスト） |
| 8 | The Water Is Wide |

**Release scalar fields in snapshot:** record `published`, `updated_at`, `release_date`, `catalog_number` from SQL result for rollback / optimistic-lock baseline. **Do not mutate release scalars in First Save.**

**Note:** `discography_tracks` has **no `updated_at`** column. Release row may have `updated_at` (trigger `discography_set_updated_at` on parent table).

---

## 3. Rollback SQL (documented only — NOT EXECUTED in preflight phase)

**Policy:** revert track 1 title only · scoped WHERE · **operator manual only** · separate explicit approval required.

**Prerequisite:** run §2 snapshot SELECT first · confirm track 1 title is `On a Clear Day [CMS Kit staging G-20u36e]` before rollback.

### 3.1 Rollback pre-check SELECT (SELECT-only)

```sql
-- G-20u36e rollback pre-check (SELECT-ONLY · NOT EXECUTED in preflight phase)
SELECT id, discography_legacy_id, site_slug, track_number, title
FROM public.discography_tracks
WHERE site_slug = 'gosaki-piano'
  AND discography_legacy_id = 'discography-002'
  AND track_number = 1;
-- expect: title = 'On a Clear Day [CMS Kit staging G-20u36e]' before rollback UPDATE
```

### 3.2 Rollback UPDATE template (emergency — NOT EXECUTED in preflight phase)

```sql
-- G-20u36e rollback — track 1 title revert (UPDATE · NOT EXECUTED in preflight phase)
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh
-- Run ONLY after §3.1 pre-check confirms target row
-- Requires separate operator approval — not part of preflight execution

UPDATE public.discography_tracks
SET title = 'On a Clear Day'
WHERE site_slug = 'gosaki-piano'
  AND discography_legacy_id = 'discography-002'
  AND track_number = 1
  AND title = 'On a Clear Day [CMS Kit staging G-20u36e]';
-- expect: 1 row affected
```

**Rollback SQL execution in preflight phase:** **forbidden**.  
**service_role:** **not used** — authenticated operator path only (future execution phase).

---

## 4. dryRun payload (locked — NOT SENT in preflight phase)

Auth for live dryRun (future phases): public anon key + `apikey` header — values **not logged**.

### 4.1 Step A — matching dryRun (baseline · wouldWrite=false)

Run **after** §2 snapshot confirms expectedBefore. **Not sent in preflight phase.**

```json
{
  "operation": "dryRun",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
  "release": {
    "title": "SKYLARK",
    "artist": "<from snapshot — must match DB>",
    "release_date": "<from snapshot>",
    "label": "<from snapshot>",
    "catalog_number": "<from snapshot>",
    "published": "<from snapshot>",
    "cover_image_url": "<from snapshot>",
    "purchase_url": "<from snapshot>",
    "streaming_url": "<from snapshot>",
    "description": "<from snapshot>"
  },
  "tracksText": "On a Clear Day\nMy Blue Heaven\nHow Deep Is The Ocean\nSkylark\nSet Sail\nWhat a Wonderful World\nLike a Lover（テスト）\nThe Water Is Wide",
  "trackPolicy": {
    "oneLineOneTrack": true,
    "blankLinesIgnored": true,
    "allowDuplicateTitles": true,
    "allowEmptyTrackList": false
  },
  "clientDryRun": {
    "wouldWrite": false,
    "totalBefore": 8,
    "totalAfter": 8,
    "added": [],
    "removed": [],
    "reordered": false
  }
}
```

**Expected response (retry-3 baseline):**

| Field | Expected |
| --- | --- |
| HTTP status | **200** |
| readBack.enabled | **true** |
| readBack.source | **supabase-select** |
| readBack.releaseFound | **true** |
| readBack.trackCount | **8** |
| wouldWrite | **false** |
| tracksAdded | **0** |
| tracksRemoved | **0** |
| tracksReordered | **false** |
| didWrite / dbWrite / networkWrite / saveEnabled | **false** |

**Rule:** `release` object must match §2 snapshot scalars exactly — replace `<from snapshot>` placeholders with live values before HTTP POST.

### 4.2 Step B — G-20u36e1 slice dryRun (wouldWrite=true)

**Not sent in preflight phase.** Send only after Step A PASS.

```json
{
  "operation": "dryRun",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "approvalId": "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
  "release": {
    "title": "SKYLARK",
    "artist": "<from snapshot — unchanged>",
    "release_date": "<from snapshot — unchanged>",
    "label": "<from snapshot — unchanged>",
    "catalog_number": "<from snapshot — unchanged>",
    "published": "<from snapshot — unchanged>",
    "cover_image_url": "<from snapshot — unchanged>",
    "purchase_url": "<from snapshot — unchanged>",
    "streaming_url": "<from snapshot — unchanged>",
    "description": "<from snapshot — unchanged>"
  },
  "tracksText": "On a Clear Day [CMS Kit staging G-20u36e]\nMy Blue Heaven\nHow Deep Is The Ocean\nSkylark\nSet Sail\nWhat a Wonderful World\nLike a Lover（テスト）\nThe Water Is Wide",
  "trackPolicy": {
    "oneLineOneTrack": true,
    "blankLinesIgnored": true,
    "allowDuplicateTitles": true,
    "allowEmptyTrackList": false
  },
  "clientDryRun": {
    "wouldWrite": true,
    "totalBefore": 8,
    "totalAfter": 8,
    "added": [],
    "removed": [],
    "reordered": false
  }
}
```

**Expected response:**

| Field | Expected |
| --- | --- |
| HTTP status | **200** |
| wouldWrite | **true** |
| tracksAdded | **0** |
| tracksRemoved | **0** |
| tracksReordered | **false** |
| changed scope | **track 1 title only** |
| track count | **8** |
| didWrite / dbWrite / networkWrite / saveEnabled | **false** |

**STOP** if any release scalar diff detected · track 7 would change · tracksAdded/tracksRemoved > 0 · wouldWrite=false.

### 4.3 operation=save

**Not sent in preflight phase.** Live Edge still rejects `operation=save` with **400** (retry-3 verified). Save path enablement is a **separate phase** (`G-20u36e-controlled-save-edge-save-path-planning` + implementation + deploy).

---

## 5. Save execution conditions (future phases — not now)

All must pass before **one** operator `operation=save`:

1. §2 snapshot SELECT executed · values match §2.1 expectedBefore.
2. Step A matching dryRun → readBack trackCount=**8** · wouldWrite=**false**.
3. Step B slice dryRun → wouldWrite=**true** · tracksAdded=**0** · tracksRemoved=**0** · track 1 title change only.
4. Staging ref confirmed: `kmjqppxjdnwwrtaeqjta` — production ref absent.
5. Edge Save path implemented · deployed · guards armed ( **not in preflight** ).
6. Operator explicit approval (destructive-op form) for **one** Save.
7. **No** admin UI Save button unless direct endpoint Save proven first (per plan).

**Not in preflight:**

- Save path implementation / Edge deploy
- operation=save HTTP POST
- operator one-shot execution

---

## 6. STOP conditions

Stop and ask operator if:

- track count ≠ **8**
- track 1 title ≠ `On a Clear Day` at snapshot time
- track 7 title ≠ `Like a Lover（テスト）` or would change in dryRun diff
- release scalar field would change
- tracksAdded > 0 or tracksRemoved > 0 or tracksReordered = true
- siteSlug ≠ `gosaki-piano` or legacyId ≠ `discography-002`
- production ref `vsbvndwuajjhnzpohghh` appears in target / URL / config
- **service_role** becomes necessary
- rollback target ambiguous (multiple rows match WHERE)
- dryRun result ≠ expected diff (§4.1 / §4.2)
- readBack unstable (trackCount ≠ 8 on matching payload)
- operation=save must be sent during **preflight** phase
- SQL execution or DB write required during **preflight** phase
- Save scope expands beyond discography-002
- no-op Save attempted (wouldWrite=false at Save time)

---

## 7. Phase sequence (forward)

| Phase | Scope |
| --- | --- |
| G-20u36e-controlled-save-planning | **complete** |
| **G-20u36e-controlled-save-preflight** | **this doc — complete** |
| **G-20u36e-controlled-save-snapshot-select-execution** | operator runs §2 SQL · records result |
| **G-20u36e-controlled-save-edge-save-path-planning** | Edge Save gate design · no deploy yet |
| Later | root placement · deploy · dryRun live · operator one-shot Save |

**Next recommended (either order after snapshot):**

- `G-20u36e-controlled-save-snapshot-select-execution` — operator SELECT-only
- `G-20u36e-controlled-save-edge-save-path-planning` — Save path design

---

## 8. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| Preflight only | **yes** |
| Save executed | **no** |
| operation=save sent | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Admin UI changed | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| rollback SQL executed | **no** |
| dryRun HTTP sent | **no** |
| `supabase/functions/**` edited | **no** |
