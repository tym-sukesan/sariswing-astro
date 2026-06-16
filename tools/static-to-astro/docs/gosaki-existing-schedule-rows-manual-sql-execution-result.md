# Gosaki existing schedule rows manual SQL execution result (G-9c2c)

**Phase:** `G-9c2c-gosaki-existing-schedule-rows-operator-manual-sql-execution`  
**Date:** 2026-06-16  
**Prior:** G-9c2b checklist (`479347a`)  
**Project:** `static-to-astro-cms-staging` only

---

## 1. Execution summary

| Item | Value |
| --- | --- |
| **Who executed** | Operator — Supabase SQL Editor (manual) |
| **Cursor / AI / CI** | **Did not** execute SQL or connect to DB |
| **Approach** | Existing 60 rows UPDATE / correction (Option A) — **not** 60 INSERT |
| **Checklist** | `gosaki-existing-schedule-rows-manual-sql-execution-checklist.md` |
| **Rollback** | Step 8 SQL stored only — **not executed** |

---

## 2. Steps executed (0–8)

| Step | Action | Result |
| ---: | --- | --- |
| **0** | Supabase project confirmation | **PASS** — `static-to-astro-cms-staging` |
| **1** | Before SELECT + snapshot | **PASS** — 60 rows, 0 duplicates, legacy `source_route` |
| **2** | `site_slug` column + indexes migration | **PASS** |
| **3** | Column / index verification | **PASS** |
| **4** | `site_slug` backfill (`gosaki-piano`) | **PASS** — 60 rows |
| **5** | `source_route` canonical update | **PASS** — 60 rows |
| **6** | `schedule-2026-07-010` PoC row restore | **PASS** — 1 row |
| **7** | After verification SELECT | **PASS** (see §6; home flags corrected — §5) |
| **8** | Rollback SQL storage | Stored only — **not run** |

---

## 3. `site_slug` migration (Step 2–3)

- Column `public.schedules.site_slug` added (text, nullable).
- Indexes created: `schedules_site_slug_date_idx`, `schedules_site_slug_month_idx`.
- Verified present after migration.

---

## 4. `site_slug` backfill (Step 4)

| Check | Result |
| --- | --- |
| Rows updated | **60** |
| `site_slug` value | `gosaki-piano` on all 60 `schedule-2026-*` rows |
| Predicate | `legacy_id LIKE 'schedule-2026-%' AND site_slug IS NULL` |

---

## 5. `source_route` canonical update (Step 5)

| Check | Result |
| --- | --- |
| Rows updated | **60** |
| From | `/schedule-2026-XX/` (legacy) |
| To | `/schedule/YYYY-MM/` (canonical) |
| Legacy routes remaining | **0** (`legacy_source_route_remaining = 0`) |

### Final `source_route` distribution

| `source_route` | Count |
| --- | ---: |
| `/schedule/2026-03/` | 13 |
| `/schedule/2026-04/` | 10 |
| `/schedule/2026-05/` | 12 |
| `/schedule/2026-06/` | 11 |
| `/schedule/2026-07/` | 14 |

---

## 6. `schedule-2026-07-010` PoC restore (Step 6)

G-6 PoC-altered row restored to Gosaki seed values. **`legacy_id` not renamed.**

| Field | After restore |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |
| `title` | `<>` |
| `venue` | `NULL` |
| `open_time` | `NULL` |
| `start_time` | `NULL` |
| `price` | `NULL` |
| `description` | `出演：` |
| `source_route` | `/schedule/2026-07/` |
| `source_file` | `schedule-2026-07.html` |
| `published` | `true` |
| `show_on_home` | `false` |
| `home_order` | `NULL` |
| `sort_order` | `10` |

**Note:** `source_file` and `sort_order` differ from seed template reference (`2026-07.html`, `100`) — operator verified final row state as above. No further SQL required for G-9c2c completion.

---

## 7. `show_on_home` / `home_order` correction (operator)

During Step 7 verification, **3 rows** had `show_on_home = true` and/or non-null `home_order`. Operator applied additional correction:

| `legacy_id` | Correction |
| --- | --- |
| `schedule-2026-03-011` | `show_on_home = false`, `home_order = NULL` |
| `schedule-2026-03-012` | `show_on_home = false`, `home_order = NULL` |
| `schedule-2026-03-013` | `show_on_home = false`, `home_order = NULL` |

---

## 8. Final verification (Step 7 — after all corrections)

### Row counts

| Check | Result |
| --- | ---: |
| `site_slug = 'gosaki-piano'` | **60** |
| `legacy_source_route_remaining` | **0** |

### Month counts

| Month | Events |
| --- | ---: |
| 2026-03 | 13 |
| 2026-04 | 10 |
| 2026-05 | 12 |
| 2026-06 | 11 |
| 2026-07 | 14 |

### Flags

| Check | Result |
| --- | ---: |
| `published_true` | **60** |
| `show_on_home_false` | **60** |
| `show_on_home_true` | **0** |
| `home_order_not_null` | **0** |

### Nullable field baseline (extractor parity)

| Field | NULL / empty count |
| --- | ---: |
| `open_time_null` | 10 |
| `start_time_null` | 9 |
| `price_null` | 6 |
| `venue_empty` | 3 |

---

## 9. Rollback

- Rollback SQL from G-9c2b Step 8: **stored only**.
- **Not executed** — success path; no rollback needed (`rollbackNeeded: false`).

---

## 10. Out of scope (confirmed not done)

- Cursor / AI / CI SQL execution
- 60 INSERT (deprecated path)
- PoC `legacy_id` rename
- `schedule_months` writes
- FTP / workflow_dispatch / production deploy
- `/admin` changes

---

## 11. Gates

```txt
gosakiExistingRowsOperatorManualSqlExecutionComplete: true
gosakiScheduleRowsSiteSlugBackfilled: true
gosakiScheduleRowsSourceRouteCanonicalized: true
gosakiSchedulePocRowRestored: true
gosakiScheduleHomeFlagsNormalized: true
gosakiScheduleSeedRowsVerified: true
readyForG9dAstroSupabaseScheduleRead: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 12. Next phase

**G-9d:** Astro Supabase read + static fallback for Gosaki schedule pages (`site_slug = 'gosaki-piano'`, canonical `/schedule/YYYY-MM/` routes).
