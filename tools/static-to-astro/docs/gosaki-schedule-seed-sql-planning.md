# Gosaki schedule seed SQL planning (G-9c / G-9c0c)

**Phase:** `G-9c0c-gosaki-route-aware-schedule-seed-sql-regeneration`  
**Date:** 2026-06-16  
**Prior:** G-9c0a canonical routes (`c385a7f`), G-9c0b legacy stubs (`36e8c54`), G-9b extractor (`e97a047`)  
**Status:** route-aware SQL templates regenerated — **no DB write, no SQL execution**

---

## 1. Purpose

Produce operator-ready SQL templates to seed **60 Gosaki schedule events** into `static-to-astro-cms-staging` with `site_slug = 'gosaki-piano'`.

**This phase:** generate + document only.  
**Next phase (G-9c2):** operator runs SQL manually per `gosaki-schedule-seed-operator-manual-sql-execution-preflight.md` after explicit approval.

---

## 2. Dry-run reconfirmation (G-9c0c)

```bash
cd tools/static-to-astro
npm run verify:gosaki-schedule-seed
npm run extract:gosaki-schedule-seed
npm run generate:gosaki-schedule-seed-sql
```

| Check | Result |
| --- | --- |
| Events | **60** |
| Months | **5** (`2026-03` … `2026-07`) |
| `site_slug` | `gosaki-piano` on all rows |
| `source_route` | `/schedule/2026-03/` … `/schedule/2026-07/` (**canonical**) |
| Legacy `/YYYY-MM/` in `source_route` | **0** (legacy stubs are site routes only) |
| `source_file` | `2026-XX.html` (Wix provenance) |
| `legacy_id` pattern | `schedule-YYYY-MM-NNN` |
| Date parse failures | **0** |
| Warnings | **0** |

### Per-month counts (extractor)

| Month | Events | Source file |
| --- | ---: | --- |
| 2026-03 | 13 | `2026-03.html` |
| 2026-04 | 10 | `2026-04.html` |
| 2026-05 | 12 | `2026-05.html` |
| 2026-06 | 11 | `2026-06.html` |
| 2026-07 | 14 | `2026-07.html` |

### Field coverage

| Field | Populated |
| --- | ---: |
| date | 60 |
| title | 60 |
| venue | 57 |
| open_time | 50 |
| start_time | 51 |
| price | 54 |
| image_url | 0 (expected — Wix crawl has no flyer images) |

---

## 3. Artifact files

| File | Role |
| --- | --- |
| `scripts/supabase/gosaki-site-slug-migration.template.sql` | Add `site_slug` column + indexes |
| `scripts/supabase/gosaki-schedules-seed.template.sql` | **60× plain INSERT** (generated from fixtures) |
| `scripts/supabase/gosaki-schedules-seed-preflight.template.sql` | Before / after SELECT + rollback template |
| `scripts/lib/gosaki-schedules-seed-sql.mjs` | SQL builder (no DB) |
| `scripts/generate-gosaki-schedules-seed-sql.mjs` | Regenerate seed template from fixtures |

Regenerate seed SQL after fixture/extractor changes:

```bash
node scripts/generate-gosaki-schedules-seed-sql.mjs \
  --out scripts/supabase/gosaki-schedules-seed.template.sql
```

---

## 4. `site_slug` migration policy

### SQL template

See `scripts/supabase/gosaki-site-slug-migration.template.sql`:

```sql
alter table public.schedules add column if not exists site_slug text;
create index if not exists schedules_site_slug_date_idx on public.schedules (site_slug, date);
create index if not exists schedules_site_slug_month_idx on public.schedules (site_slug, month);
```

### Existing G-6 PoC row handling

| Option | Policy | G-9c recommendation |
| --- | --- | --- |
| **A** | Leave PoC rows `site_slug NULL` | **Recommended** — no UPDATE in planning/seed phase |
| **B** | Tag PoC as `site_slug = 'sariswing-kit-test'` | Defer — optional in execution phase only |
| **C** | Do not touch PoC if no `legacy_id` collision | **Partial** — see §8 collision |

**Recommended:** **Option A + C**. Gosaki seed rows use `site_slug = 'gosaki-piano'`. Existing G-6 PoC row remains `site_slug NULL` unless operator explicitly tags it in a separate approved step. **No UPDATE executed in G-9c.**

---

## 5. INSERT approach

| Option | Assessment |
| --- | --- |
| **A. Plain INSERT** | **Recommended** for first staging seed — fails loudly on `legacy_id` UNIQUE violation |
| **B. INSERT … ON CONFLICT** | Defer — `DO NOTHING` would silently skip colliding Gosaki event `schedule-2026-07-010` |

### `id`, `created_at`, `updated_at`

Omit from INSERT — use DB defaults (`gen_random_uuid()`, `now()`, trigger `schedules_set_updated_at` on UPDATE).

### Columns included in seed template

`legacy_id`, `site_slug`, `date`, `year`, `month`, `title`, `venue`, `open_time`, `start_time`, `price`, `description`, `image_url`, `source_file`, `source_route`, `show_on_home`, `home_order`, `published`, `sort_order`

| Column | Gosaki seed value |
| --- | --- |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `published` | `true` |
| `sort_order` | `10, 20, …` per month file order |

**Not seeded:** `home_image_url`, `schedule_months` (derived / read-only per G-9a).

### `legacy_id` uniqueness

Keep existing **global `UNIQUE (legacy_id)`** for G-9c execution. Do **not** migrate to `(site_slug, legacy_id)` in this phase.

App reads **must** filter `site_slug = 'gosaki-piano'` even when RLS is broad.

---

## 6. Before / after / rollback SQL

Full templates: `scripts/supabase/gosaki-schedules-seed-preflight.template.sql`

### Before seed

```sql
select count(*) from public.schedules where site_slug = 'gosaki-piano';

select legacy_id, date, title, venue
from public.schedules
where legacy_id like 'schedule-2026-%'
order by date, legacy_id;
```

Expect `gosaki-piano` count **0** before first seed.

### After verification

```sql
select site_slug, count(*) from public.schedules
where site_slug = 'gosaki-piano' group by site_slug;

select month, count(*) from public.schedules
where site_slug = 'gosaki-piano' group by month order by month;

select legacy_id, date, title, venue, open_time, start_time, price, published
from public.schedules where site_slug = 'gosaki-piano'
order by date, sort_order;
```

Expect **60** rows; month counts **13 / 10 / 12 / 11 / 14**.

### Rollback (destructive)

```sql
delete from public.schedules where site_slug = 'gosaki-piano';
```

**Execution conditions:**

1. Project = `static-to-astro-cms-staging` only (NOT production)
2. Approval: `承認します。この操作を1回だけ実行してください。`
3. Run before-count SELECT; save results
4. Confirm DELETE `WHERE site_slug = 'gosaki-piano'` only — **must not** delete G-6 PoC row (`site_slug` NULL)
5. Post-rollback: gosaki count = 0; PoC `schedule-2026-07-010` unchanged

---

## 7. Manual review checklist

Operator review before execution:

- [ ] **60** INSERT statements in `gosaki-schedules-seed.template.sql`
- [ ] Month counts match extractor: 13 / 10 / 12 / 11 / 14
- [ ] Months are **2026-03 … 2026-07** only
- [ ] **0** date parse failures in extractor dry-run
- [ ] No empty `title` (60/60 have title)
- [ ] **3** events with empty `venue` — acceptable (outdoor / TBD listings)
- [ ] Missing `open_time` / `start_time` — non-standard `時間：` lines stored in `description` (expected)
- [ ] Missing `price` — acceptable for free/TBD events
- [ ] `image_url` null for all 60 — expected (no Wix flyer images in crawl)
- [ ] `source_route` format `/schedule/2026-XX/`
- [ ] `published = true` acceptable for staging preview seed
- [ ] `sort_order` stable per month (10-step index)
- [ ] **G-6 PoC collision** resolved for `schedule-2026-07-010` (§8)
- [ ] `site_slug` migration applied if column missing
- [ ] No `service_role` in tooling path

---

## 8. G-6 PoC `legacy_id` collision

### Finding

**Collision exists:** Gosaki extractor event #10 in July uses `legacy_id = schedule-2026-07-010`, which **matches** the existing G-6 staging write PoC row.

| Row | `legacy_id` | `date` | Notes |
| --- | --- | --- | --- |
| G-6 PoC | `schedule-2026-07-010` | (staging test) | `id = aa440e29-5be8-402e-9190-0d81c48434c0` |
| Gosaki seed | `schedule-2026-07-010` | `2026-07-19` | Wix event; title `<>`, minimal meta |

Other July IDs (`001`–`009`, `011`–`014`) do **not** collide with known PoC rows.

### Execution-phase resolution (pick one — operator approval required)

1. **Rename PoC `legacy_id` first** (recommended if PoC row must remain):
   ```sql
   -- Separate approval — NOT part of G-9c0c
   update public.schedules
   set legacy_id = 'schedule-2026-07-010-poc'
   where legacy_id = 'schedule-2026-07-010'
     and site_slug is null;
   ```
   Then run all 60 plain INSERTs.

2. **Skip Gosaki `010` INSERT** — seed 59 rows; manually reconcile July event on `2026-07-19` later.

3. **Do not use** `ON CONFLICT DO NOTHING` for full batch — would silently drop the Gosaki event.

The seed template includes a **COLLISION WARNING** comment above the `schedule-2026-07-010` INSERT.

---

## 9. Execution order (operator — next phase)

1. Confirm Supabase project: `static-to-astro-cms-staging`
2. Run **before** SELECTs (`gosaki-schedules-seed-preflight.template.sql`)
3. Apply **site_slug migration** if column missing
4. Resolve **§8 collision** if PoC row exists
5. Run **60 INSERTs** (`gosaki-schedules-seed.template.sql`) in a transaction
6. Run **after** verification SELECTs
7. Restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` — no CMS Save in seed phase

---

## 10. Gates

```txt
gosakiRouteAwareSeedSqlRegenerationComplete: true
gosakiScheduleSeedSqlTemplateUsesCanonicalSourceRoute: true
gosakiScheduleSeedSqlTemplateInsertCount: 60
gosakiScheduleSeedSqlTemplatePlainInsertOnly: true
gosakiScheduleSeedSqlTemplateNoOnConflict: true
gosakiSeedLegacyIdCollisionWarningPresent: true
gosakiSiteSlugMigrationTemplateReady: true
readyForG9cRouteAwareSeedSqlCommit: true
readyForG9c1OperatorManualSqlExecutionPreflight: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 11. Out of scope (G-9c0c)

- SQL execution / DB writes
- RLS / GRANT / REVOKE changes
- `(site_slug, legacy_id)` unique constraint migration
- `schedule_months` writes
- `/admin` changes
- FTP / workflow_dispatch
