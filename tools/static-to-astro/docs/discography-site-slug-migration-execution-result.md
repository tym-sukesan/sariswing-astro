# G-20u24d — Discography site_slug migration execution record

**Phase:** `G-20u24d-discography-site-slug-migration-execution-record`  
**Base:** `fba8a65`  
**Project:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`)  
**Scope:** Execution record + after SQL fix — **no new SQL execution / DB write / FTP / deploy**

## Execution summary

| Step | Phase | Result |
| --- | --- | --- |
| Before verification | G-20u24a | **PASS** |
| Migration (DDL + backfill) | G-20u24b | **PASS** |
| After verification | G-20u24c | **1-row false STOP** (SQL aggregation bug — not data failure) |
| Corrected after SELECT | G-20u24c follow-up | **PASS** |
| Rollback | — | **not needed** |

**Operator:** manual Supabase SQL Editor on staging only.  
**Cursor / CI:** did not execute SQL.

## Post-migration state (verified)

| Check | Expected | Actual |
| --- | --- | --- |
| `discography.site_slug` column | exists (nullable) | **exists** |
| `discography_tracks.site_slug` column | exists (nullable) | **exists** |
| `discography` total | 4 | **4** |
| `discography` `site_slug='gosaki-piano'` | 4 | **4** |
| `discography` null `site_slug` | 0 | **0** |
| `discography_tracks` total | 34 | **34** |
| `discography_tracks` `site_slug='gosaki-piano'` | 34 | **34** |
| `discography_tracks` null `site_slug` | 0 | **0** |
| Filtered tracks (by `site_slug`) | 34 tracks / 4 album groups | **34 / 4** |
| Orphan tracks | 0 | **0** |
| Track / album `site_slug` mismatch | 0 | **0** |
| RLS | enabled | **enabled** |

## G-20u24c after SQL aggregation bug

**Symptom:** One after-verification row appeared false / STOP.

**Cause:** Using `count(*)` on a grouped subquery counts **album groups** (4 rows), not **tracks** (34 rows).

```sql
-- WRONG for track total (returns 4):
select count(*) as filtered_tracks
from (
  select discography_legacy_id, count(*) as track_count
  from public.discography_tracks
  where site_slug = 'gosaki-piano'
  group by discography_legacy_id
) grouped;

-- CORRECT (G-20u24d fix in after-verification SQL):
select
  count(*) as filtered_album_groups,
  coalesce(sum(track_count), 0) as filtered_tracks
from (
  select discography_legacy_id, count(*) as track_count
  from public.discography_tracks
  where site_slug = 'gosaki-piano'
  group by discography_legacy_id
) grouped;
-- EXPECT: filtered_album_groups 4 · filtered_tracks 34
```

**Follow-up corrected SELECT:** PASS — data was correct; only the verification query was wrong.

## Loader code gate (unchanged)

```txt
DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false
```

DB columns exist and are backfilled on staging, but the build-time loader flag remains **false** until a separate code-enablement phase flips it after loader/filter verification.

## SQL files

| File | Role |
| --- | --- |
| `gosaki-discography-g20u23-site-slug-before-verification.sql` | G-20u24a before (SELECT) |
| `gosaki-discography-g20u23-site-slug-migration.sql` | G-20u24b migration (WRITE — executed once) |
| `gosaki-discography-g20u23-site-slug-after-verification.sql` | G-20u24c after (SELECT — **corrected G-20u24d**) |
| `gosaki-discography-g20u23-site-slug-rollback.sql` | Not executed |

## Not executed in G-20u24d

- No new SQL execution · no DB write
- No rollback
- No FTP / deploy / package upload
- No `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true` change

## Gates

```txt
discographySiteSlugMigrationStagingComplete: true
discographySiteSlugMigrationExecutionRecorded: true
afterVerificationSqlAggregationFixComplete: true
rollbackNeeded: false
loaderColumnReadyFlagUnchanged: true
```

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u24d-discography-site-slug-migration-execution-record
npm run verify:current-active-regression
```
