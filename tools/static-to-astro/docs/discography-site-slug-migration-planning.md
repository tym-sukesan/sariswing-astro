# G-20u23 — Discography site_slug migration planning

**Phase:** `G-20u23-discography-site-slug-migration-planning`  
**Base:** `668780d` (G-20u22 complete)  
**Scope:** SQL design + docs + verifier — **no SQL execution / DB write / FTP / deploy**

## Purpose

G-20u22 organized the discography loader for multi-site readiness (`DISCOGRAPHY_SITE_SLUG_COLUMN_READY=false`). This phase prepares the **database migration design** to add `site_slug` to `public.discography` and `public.discography_tracks`, enabling filtered reads for future non-Gosaki sites.

## Current inventory (staging — pre-migration)

| Item | Value |
| --- | --- |
| `public.discography` rows | **4** (all `published=true`) |
| `public.discography_tracks` rows | **34** |
| `site_slug` column | **absent** on both tables |
| Album key | `discography.legacy_id` (e.g. `discography-001` … `discography-004`) |
| Track → album link | `discography_tracks.discography_legacy_id` → `discography.legacy_id` |
| Loader gate | `DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false` (unchanged in G-20u23) |
| Registry slug | `gosaki-piano` (`supabaseSiteSlug`) |

### Known legacy_ids (Gosaki)

| legacy_id | Notes |
| --- | --- |
| `discography-001` | Album 1 |
| `discography-002` | SKYLARK — 8 tracks |
| `discography-003` | Artist CMS field (G-15e) |
| `discography-004` | Label CMS field (G-17e) · track 1 `Mary Ann` |

## Migration strategy (phase 1 — recommended)

**First candidate:** nullable column + backfill + SELECT verification only.

| Step | Action | Constraints |
| --- | --- | --- |
| 1 | `ALTER TABLE … ADD COLUMN site_slug text` | **Nullable** — no NOT NULL |
| 2 | `UPDATE` backfill `site_slug = 'gosaki-piano'` | All existing rows |
| 3 | After SELECT verification | Counts 4 / 34 unchanged |
| 4 | Code gate (future phase) | Set `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true` |

**Deferred to later phases:**

- `NOT NULL` constraint
- `UNIQUE` / composite unique constraints
- RLS policy changes
- `GRANT` / `REVOKE`
- Optional indexes (commented in migration SQL)

### Why `site_slug` on both tables?

- **`discography`:** primary filtered read for build (`loadDiscographyRowsFromSupabase`)
- **`discography_tracks`:** denormalized filter avoids join on every track read; kept consistent with parent album via post-migration check

Alternative (join-only tracks): tracks could inherit site via `discography_legacy_id` join — rejected for phase 1 because loader already reads tracks table directly.

## SQL files (operator manual — Supabase SQL Editor)

Run **one file at a time**. Cursor / CI must **not** execute.

| File | Classification | Purpose |
| --- | --- | --- |
| `scripts/supabase/gosaki-discography-g20u23-site-slug-before-verification.sql` | **READ-ONLY** | Pre-migration inventory · column absent · 4/34 baseline |
| `scripts/supabase/gosaki-discography-g20u23-site-slug-migration.sql` | **WRITE** | `ADD COLUMN` + `UPDATE` backfill |
| `scripts/supabase/gosaki-discography-g20u23-site-slug-after-verification.sql` | **READ-ONLY** | Post-migration counts · backfill complete · filter preview |
| `scripts/supabase/gosaki-discography-g20u23-site-slug-rollback.sql` | **WRITE** (template) | Option A: clear values · Option B: drop columns |

### Operator procedure (execution phase — not G-20u23)

1. Confirm project = **static-to-astro-cms-staging** (not production)
2. Run **before** SELECT file → verify 4 releases · 34 tracks · no `site_slug` column
3. Obtain explicit approval (separate phase ID — not this planning phase)
4. Run **migration** WRITE file once
5. Run **after** SELECT file → verify backfill · filtered counts
6. **Do not** set `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true` until execution phase + loader verification complete

## Safety rules

- Existing Gosaki rows → `site_slug = 'gosaki-piano'`
- No `DELETE` / `TRUNCATE` / `DROP TABLE`
- No `GRANT` / `REVOKE` / `service_role`
- Production Supabase: **STOP**
- Rollback documented but **not executed** in G-20u23

## Impact on Gosaki data

| Concern | Mitigation |
| --- | --- |
| 4 releases / 34 tracks | Backfill only — no row deletion |
| Admin Save paths | Future phases must scope UPDATE by `site_slug` |
| Public reflection build | Loader unchanged until code gate flipped |
| Track/album relation | After-check verifies `discography_legacy_id` join intact |

## Requirements for non-Gosaki site (post-migration)

1. Registry: `supabaseFeatures.discography: true`
2. DB rows with `site_slug = '{supabaseSiteSlug}'`
3. Code: `DISCOGRAPHY_SITE_SLUG_COLUMN_READY = true`
4. Convert hooks for Wix HTML patch (site-specific)

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u23-discography-site-slug-migration-planning
npm run verify:current-active-regression
```

## Not executed (G-20u23 planning phase)

- No SQL execution · no DB write · no migration apply
- No FTP / deploy · no package regen
- `DISCOGRAPHY_SITE_SLUG_COLUMN_READY` remains **false**

**Staging execution record:** `discography-site-slug-migration-execution-result.md` (G-20u24a/b/c/d).

## Gates

```txt
discographySiteSlugMigrationPlanningComplete: true
sqlBeforeAfterSelectOnly: true
migrationSqlScopedToDiscographyTables: true
loaderColumnReadyFlagUnchanged: true
```
