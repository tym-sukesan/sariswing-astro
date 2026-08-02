# CMS Core v2 — Schedule TBD date contract planning

- **Phase:** `cms-core-v2-schedule-tbd-date-contract-planning`
- **Date:** 2026-08-01
- **Scope:** read-only investigation + docs only
- **Verdict:** **COMPLETE (planning)** — recommended contract locked; **no schema / runtime / migration / DB write**
- **Unblocks (later):** Mio seed write gate blocker → seed apply → live SELECT-only pilot
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **STOP production:** `vsbvndwuajjhnzpohghh`

---

## 1. Purpose

Design a **site-neutral** Schedule data contract so 「日付未定（TBD）」can be stored and displayed **without fictional calendar days**, while preserving Gosaki confirmed-date read / Admin / Save / build / sort behavior.

This phase does **not** change schema or code. It chooses the contract and the phase split for later gates.

---

## 2. Current state (evidence)

### 2.1 Staging `schedules.date`

From `schedule-schema-read-audit-result.md` (staging read audit):

| Item | Value |
| --- | --- |
| Type | `date` |
| NULL | **NOT NULL** |
| Default | none documented |
| Index | `schedules_date_idx` on `date` |
| Unique | **not** on `date` · UNIQUE is `legacy_id` global |

Related (nullable today): `year` integer · `month` text · `sort_order` integer default 0 · `published` boolean · `source_route` text.

### 2.2 Mio fixture TBD (meaning preserved)

Source: `fixtures/mio-kisaragi-jazz-data/schedules.json` · `legacy_id = mio-sched-2026-09-01`

| Known | Unknown |
| --- | --- |
| `month = 2026-09` · `year = 2026` | calendar **day** (`date = null`) |
| `source_route = /schedule/2026-09/` | open/start times |
| `published = true` · `sort_order = 5` | venue finalized |
| title embeds 【日付未定】 · `extensions.dateStatus = tbd` | |

`schema-notes.json`: `date=null + month retained + extensions.dateStatus=tbd represents 日付未定.`

### 2.3 Seed write gate blocker

`cms-core-v2-mio-supabase-live-select-only-seed-write-gate.md`: Option A needs schedules **16 / 14**, but NOT NULL `date` cannot accept the TBD row → generated SQL inserts 15 dated rows then **B8 RAISE / ROLLBACK**. `READY_FOR_MIO_SEED_APPLY: false`.

### 2.4 Date-dependent code (summary)

| Area | Path (examples) | Null-date behavior today |
| --- | --- | --- |
| Normalize / display | `supabase-schedule-read.mjs` `normalizeScheduleRecord` / `formatScheduleDateDisplay` | null → `date_display ""` · no throw |
| Sort (legacy runtime today) | `compareScheduleRecords` · Gosaki month sort | `date \|\| ""` → TBD sorts **before** dated rows · **not** Kit helper contract (§4.4) |
| Month discovery | `deriveScheduleMonthsFromSchedules` · `resolveScheduleMonthsForBuild` | uses **`month`**, not day |
| Mio public cards | `mio-schedule-data-pages.mjs` | already shows **日付未定** when `date==null` or `dateStatus==tbd` |
| Gosaki public cards | `gosaki-schedule-data-pages.mjs` | blank date string · **no** TBD label |
| Admin list filters | `staging-schedule-read.ts` | truthy `date` required → **drops** null-date rows |
| Past/future split | `splitSchedulesByDate` | empty date → treated as **past** (wrong for TBD) |
| Dry-run / create Save | `schedule-dry-run-validation.ts` · G-22e / Edge | **`date is required`** |
| Optimistic lock | `updated_at` / `expectedBeforeUpdatedAt` | **independent of date** |
| Home fallback | `home-schedule-sync.mjs` | filters falsy `date` → TBD excluded |
| Gosaki seed | `gosaki-schedules-seed.template.sql` | **60** rows all concrete dates |

---

## 3. Options compared

| Option | Idea | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| **A** | Make `date` nullable | Matches Mio fixture; no fictional day | Alone: no explicit status; Admin/Save ambiguity; sort/past bugs remain | **Necessary but not sufficient** |
| **B** | Add `date_status` (`confirmed` / `tbd`) | Explicit state; fail-closed CHECKs; Admin clear | Needs A (or still forces day) | **Required with A** |
| **C** | Add `date_text` / `date_label` | Custom display copy | Does not fix storage/sort/month; optional later | **Optional Phase 2+** |
| **D** | Split `sort_date` vs display | Sort without showing day | Soft-sentinel risk if `sort_date` is a fake day; extra column | **Defer** — use `month` + `sort_order` first |
| **E** | Sentinel date (e.g. `2026-09-01` meaning TBD) | Avoids schema change short-term | Mis-display · mis-sort · wrong past/future · month accidents · pollutes analytics | **Rejected** |

### Rejected detail — E (sentinel)

Using a real `date` value as “TBD marker” risks:

- Public card showing that calendar day
- Past/future split classifying wrong
- Month page correct by luck only if sentinel month matches
- Operators editing “the date” thinking it is real
- Irreversible ambiguity in exports

Do **not** use E for Mio seed or Kit contract.

### Combination shortlist

- **A+B (recommended):** nullable `date` + `date_status` + CHECK rules + month membership via existing `month` / `source_route` + TBD sort via `sort_order`
- **A+B+C later:** add optional `date_label` when sites need non-default 「日付未定」copy
- **A+B+D later:** only if TBD-vs-confirmed interleaving needs a dedicated anchor without relying on `sort_order`

---

## 4. Recommended contract (site-neutral)

### 4.1 Columns

| Column | Type | Rule |
| --- | --- | --- |
| `date` | `date` **NULL allowed** | Calendar day when confirmed; **NULL when TBD** |
| `date_status` | `text NOT NULL` | CHECK `IN ('confirmed','tbd')` · default `'confirmed'` |
| `month` | `text` (existing) | `YYYY-MM` when month membership known |
| `year` | `integer` (existing) | Keep aligned with `month` / `date` |
| `sort_order` | `integer` (existing) | Within-month order · **primary TBD ordering key** |
| `source_route` | `text` (existing) | Canonical month route when month known |

Optional later (not required to unblock Mio seed):

- `date_label text null` — override public label when `date_status='tbd'`

Do **not** add `sort_date` in the first migration.

### 4.2 CHECK constraints (logical)

1. `date_status = 'confirmed'` ⇒ `date IS NOT NULL`
2. `date_status = 'tbd'` ⇒ `date IS NULL` (no fictional day)
3. Prefer: if `date IS NOT NULL` then `date_status = 'confirmed'`

App + Edge must enforce the same fail-closed rules before DB.

### 4.3 Month membership

| Case | `date_status` | `date` | `month` | Public placement |
| --- | --- | --- | --- | --- |
| Confirmed | `confirmed` | YYYY-MM-DD | derived / stored `YYYY-MM` | Month page + hub as today |
| TBD · month known | `tbd` | NULL | required `YYYY-MM` · `source_route` `/schedule/YYYY-MM/` | That month page + hub |
| TBD · month unknown | `tbd` | NULL | NULL · `source_route` null or hub-only policy | Hub **「日付未定」** section only · **not** any month page |

**Mio fixture** is **TBD · month known** (`2026-09`).

### 4.4 Sort rules (locked — helper `compareScheduleDateContract`)

**Locked Kit contract** (helpers phase; Gosaki runtime still uses legacy `date || ""` until read-compat):

```txt
1. month既知を month 昇順
2. 同月では confirmed を先、tbd を後
3. confirmed: date → sortOrder → legacyId
4. tbd: sortOrder → legacyId
5. month不明 tbd は最後
```

Notes:

- Confirmed existing data keeps **calendar date order** within a month (`date` before `sortOrder`).
- Mio TBD `mio-sched-2026-09-01` (`sort_order=5`) sorts **after all confirmed 2026-09 peers**, not ahead of them. Among TBD peers, `sortOrder=5` is decisive (then `legacyId`).
- Do **not** use `date ASC NULLS LAST/FIRST` or `month → sort_order → date` as the Kit helper contract.
- Sentinel dates remain forbidden; null `date` is never coerced to `""` for leading placement in this helper.

### 4.5 Past / future / home

| Rule | Behavior |
| --- | --- |
| Past/future split | `date_status='tbd'` ⇒ **neither past nor archived-by-date** · bucket `tbd` or “upcoming undated” |
| Home auto-pick | Exclude `date_status='tbd'` unless `show_on_home=true` explicitly |
| Archive | TBD never auto-archived by `date < today` |

### 4.6 Display

| Status | Public label |
| --- | --- |
| confirmed | existing `date_display` from `date` |
| tbd | default `日付未定` · optional future `date_label` |

Gosaki cards must gain the same fail-closed label when status is tbd (implementation phase — not this docs phase).

### 4.7 Admin / Save (fail-closed)

| Action | Rules |
| --- | --- |
| Create confirmed | require `date` · set `date_status='confirmed'` · derive year/month |
| Create TBD month-known | forbid `date` · require `month` · set `date_status='tbd'` |
| Create TBD month-unknown | forbid `date` · `month` null · hub-only |
| Patch confirmed→tbd | clear `date` · set status tbd · require month policy choice |
| Patch tbd→confirmed | require `date` · set status confirmed |
| Reject | confirmed+null date · tbd+non-null date · sentinel “magic” dates |

Optimistic lock remains on `updated_at` only.

### 4.8 Mapping from Mio companion JSON

| Fixture / extension | DB column |
| --- | --- |
| `date: null` | `date` NULL |
| `extensions.dateStatus: "tbd"` | `date_status = 'tbd'` |
| `month` / `year` / `sort_order` / `source_route` | unchanged |
| No `extensions` column required for MVP | extensions stay companion-only |

---

## 5. Mio fixture application (`mio-sched-2026-09-01`)

| Topic | Value |
| --- | --- |
| Known | September 2026 membership · published announcement · sort_order 5 |
| Unknown | calendar day · times |
| Month page | **`/schedule/2026-09/`** because `month` + `source_route` already say so (not because of a fake day) |
| Recommended stored row | `date_status='tbd'` · `date=NULL` · `month='2026-09'` · `year=2026` · `sort_order=5` · `published=true` · `source_route='/schedule/2026-09/'` |
| Display | `日付未定` (title may keep 【日付未定】 prefix) |
| Sort position | After all confirmed 2026-09 peers (rule 2); among TBD peers, `sort_order=5` is decisive |
| Seed SQL change (later regenerate only) | INSERT TBD row with null `date` + `date_status`; Option A assert **16/14** can pass **after** staging migration; until then keep apply disarmed |

Fixture **meaning** unchanged: published September TBD rehearsal notice.

---

## 6. Gosaki compatibility

| Concern | Plan |
| --- | --- |
| Existing rows | Backfill `date_status='confirmed'` · leave `date` untouched |
| Public sort | Compatibility verifier against current Gosaki HTML/order fixtures before flipping comparator |
| Admin | Default path remains date-required create; TBD is opt-in control |
| Save slices that lock `date` | Unchanged for confirmed operational edits |
| No auto data destruction | No UPDATE of Gosaki `date` values in migration |
| Nullable `date` | Safe for Gosaki while CHECK keeps confirmed rows non-null |

---

## 7. Staging migration plan (NOT EXECUTED)

**Target:** staging only · production = **separate gate**.

### 7.1 Forward (conceptual)

```sql
-- DO NOT EXECUTE in this phase
-- 1) add column nullable with default for backfill
alter table public.schedules
  add column if not exists date_status text not null default 'confirmed';

-- 2) backfill (all existing rows, including gosaki-piano)
update public.schedules
   set date_status = 'confirmed'
 where date_status is distinct from 'confirmed';
-- expect: 0 rows needing tbd

-- 3) tighten CHECK
alter table public.schedules
  add constraint schedules_date_status_check
  check (date_status in ('confirmed', 'tbd'));

alter table public.schedules
  add constraint schedules_date_status_date_consistency_check
  check (
    (date_status = 'confirmed' and date is not null)
    or (date_status = 'tbd' and date is null)
  );

-- 4) drop NOT NULL on date (order: after backfill + before inserting tbd rows)
alter table public.schedules
  alter column date drop not null;

-- 5) indexes: keep schedules_date_idx (NULLs allowed in btree)
```

Constraint add order: column+default → backfill → status CHECK → consistency CHECK → drop NOT NULL.

### 7.2 Rollback (conceptual)

```sql
-- DO NOT EXECUTE in this phase
-- Refuse rollback if any tbd rows exist
-- delete/block: select count(*) from schedules where date_status = 'tbd' or date is null;
-- then: alter date set not null; drop checks; drop column date_status;
```

### 7.3 SELECT-only pre / post

**Pre:**

- count null `date` (expect 0)
- count by `site_slug`
- confirm `date` attnotnull = true

**Post:**

- `date_status='confirmed'` count = pre total
- `date_status='tbd'` count = 0 (until Mio seed)
- null `date` count = 0 until Mio seed
- Gosaki published count unchanged

### 7.4 Success / failure

| Success | Failure |
| --- | --- |
| Column present · CHECKs active · date nullable · Gosaki counts unchanged · confirmed backfill complete | Any null date before Mio seed · CHECK violation · production project · partial apply |

---

## 8. Phase split (next engineering)

| # | Phase | Goal | Risk | STOP if |
| --- | --- | --- | --- | --- |
| 1 | `cms-core-v2-schedule-tbd-date-contract-helpers` | **COMPLETE** — Offline helpers + verifier (see §12) | Low | Behavior differs from this doc |
| 2 | `cms-core-v2-schedule-tbd-date-gosaki-read-compat` | **COMPLETE** — confirmed-only normalize wire · legacy sort kept · HTML byte-eq (see §13) | Medium | Gosaki public order/visual regress without approval |
| 3 | `cms-core-v2-schedule-tbd-date-admin-save-planning` | **COMPLETE (docs)** — see `cms-core-v2-schedule-tbd-date-admin-save-planning.md` | High | Write path can store sentinel or confirmed+null |
| 4 | `cms-core-v2-schedule-tbd-staging-migration-gate` | SQL templates + approval packet only | High | Production ref / unclear rollback |
| 5 | `cms-core-v2-schedule-tbd-staging-migration-apply` | Human-approved staging migration once | High | Pre counts fail · STOP no retry |
| 6 | `cms-core-v2-schedule-tbd-admin-state-save-payload-helpers` | **COMPLETE** — offline Admin date-state + Save payload helpers | Low | legacy payload drift |
| 7 | UI connect / dry-run / staging Save | See admin-save planning §8 F–H (after migration) | High | TBD Save before migration |
| 8 | `cms-core-v2-mio-seed-sql-regenerate-after-tbd` | Regen A–E SQL · Option A includes TBD row · still no apply until approval | Medium | Fixture meaning drift |
| 9 | `cms-core-v2-mio-supabase-live-select-only-pilot` | Branch A live SELECT after seed apply | Medium | Seed incomplete · RLS · Gosaki leakage |

**Ops parallel:** Gosaki client staging share unchanged.

---

## 9. Risks and STOP conditions

| Risk | Mitigation |
| --- | --- |
| Comparator change reshuffles Gosaki | Phase 2 fixtures / explicit waiver |
| Admin creates TBD with accidental date | CHECK + validation reject |
| Month-unknown TBD lands on wrong month page | Membership rules · hub-only |
| Migration on production | Hard STOP · separate gate |
| Seed apply before migration | Keep `READY_FOR_MIO_SEED_APPLY: false` |
| Using sentinel to “just ship Mio” | Forbidden by this contract |

**STOP this planning phase if:** production touch · schema change attempted · DB write · fixture meaning change · runtime edit.

---

## 10. Explicit non-goals (this phase)

- No `ALTER TABLE` / migration files execution
- No Mio seed apply
- No SQL template regenerate (wait for phase 6)
- No Gosaki / Admin / Save runtime edits
- No package / FTP / production

---

## 11. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_CONTRACT_PLANNING_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_CONTRACT_HELPERS_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_GOSAKI_READ_COMPAT_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_ADMIN_SAVE_PLANNING_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_ADMIN_STATE_SAVE_PAYLOAD_HELPERS_COMPLETE: true
RECOMMENDED_CONTRACT: nullable_date_plus_date_status
SENTINEL_DATE_REJECTED: true
READY_FOR_MIO_SEED_APPLY: false
SCHEMA_CHANGED: false
DATE_STATUS_IN_DB_QUERY: false
ADMIN_SAVE_CHANGED: false
DB_WRITE_EXECUTED: false
MIGRATION_EXECUTED: false
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_GATE_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_FINAL_REVIEW_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_APPLY_COMPLETION: true
STAGING_SCHEMA_TBD_CONTRACT_APPLIED: true
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-status-read-wiring
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 12. Helpers phase result (`cms-core-v2-schedule-tbd-date-contract-helpers`)

**Status:** COMPLETE (helper + offline verifier only · 2026-08-01)

| Item | Value |
| --- | --- |
| Module | `scripts/lib/schedule-date-contract.mjs` |
| Verifier | `verify:cms-core-v2-schedule-tbd-date-contract-helpers` (+ Safety Suite) |
| Runtime wire (helpers phase) | **none** initially · confirmed normalize wire landed in §13 |
| Schema / migration / seed SQL | **unchanged** |
| Mio fixture proof | `mio-sched-2026-09-01` → `tbd` · `date=null` · `month=2026-09` · display `日付未定` · `sortOrder=5` · September month-page |
| Sentinel | rejected (`tbd` + date → fail) |
| Unknown fields | rejected |
| Input mutation | forbidden / verified |

### API

- `normalizeScheduleDateContract(input)` / `validateScheduleDateContract(input)` → `{ok,value}` / `{ok:false,errors,codes}`
- `getScheduleDateDisplay(contract, options?)`
- `getScheduleMonthMembership(contract)`
- `compareScheduleDateContract(a, b)` (deterministic; not wired into Gosaki sort this phase)
- `scheduleRowToDateContractInput(row)` (reads `extensions.dateStatus`; no mutation)
- `formatConfirmedScheduleDateDisplay(iso)` (Kit `YYYY.MM.DD (Dow)` shape)

### Sort (helper-only; Gosaki not connected)

1. month既知を month 昇順
2. 同月では confirmed を先、tbd を後
3. confirmed: date → sortOrder → legacyId
4. tbd: sortOrder → legacyId
5. month不明 tbd は最後

### Next

Superseded by §13 (`cms-core-v2-schedule-tbd-date-gosaki-read-compat`).

---

## 13. Gosaki read compat result (`cms-core-v2-schedule-tbd-date-gosaki-read-compat`)

**Status:** COMPLETE (2026-08-01)

| Item | Value |
| --- | --- |
| Connection | `normalizeScheduleRecord` → `validateLegacyConfirmedScheduleDateContract` → `normalizeScheduleDateContract` (`dateStatus: "confirmed"` injected) |
| SELECT | `SCHEDULE_SELECT` **unchanged** · **no** `date_status` column |
| Sort | **unchanged** — `compareScheduleRecords` / month-page `date \|\| ""` sort · **not** `compareScheduleDateContract` |
| TBD rows | null/empty `date` skips contract (no auto-TBD) |
| Fail-closed | invalid date / month mismatch → throw in normalize |
| HTML | hub/month Astro **byte-for-byte** vs HTML baseline fixtures |
| Admin / Save / schema / Mio seed | **unchanged** |
| Verifier | `verify:cms-core-v2-schedule-tbd-date-gosaki-read-compat` (+ Safety Suite) |

### Next

Superseded by admin-save planning + offline helpers COMPLETE → Next Primary `cms-core-v2-schedule-tbd-staging-migration-gate`.

---

## 14. Admin / Save planning result (`cms-core-v2-schedule-tbd-date-admin-save-planning`)

**Status:** COMPLETE (docs-only · 2026-08-01)

Doc: `cms-core-v2-schedule-tbd-date-admin-save-planning.md`

| Item | Value |
| --- | --- |
| Date required today | create/dry-run/Edge · edit forbids date |
| Null-date Admin drop | `r.id && r.date` filters |
| Recommended UI | dateStatus radio + conditional date/month |
| Pre-migration | TBD UI hidden · reject `date_status` / `date:null` saves |
| Next | superseded by §15 migration gate |

---

## 15. Staging migration gate result (`cms-core-v2-schedule-tbd-staging-migration-gate`)

**Status:** COMPLETE (2026-08-01) · hardened by §16 final review

Doc: `cms-core-v2-schedule-tbd-staging-migration-gate.md`
SQL: `scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql` (DO NOT EXECUTE)

| Item | Value |
| --- | --- |
| Forward | ADD `date_status NOT NULL DEFAULT 'confirmed'` · CHECKs · `date` DROP NOT NULL |
| Backfill | via ADD COLUMN DEFAULT only — **no** UPDATE (preserves `updated_at`) |
| Rollback | refused if any `tbd` or null `date` |
| Live anon preflight | published 74 · gosaki 74 · mio 0 · `date_status` absent · null date 0 |
| Apply packet | READY true after final review · SQL not executed |
| Verifier | `verify:cms-core-v2-schedule-tbd-staging-migration-gate` |

### Next

Superseded by §16.

---

## 16. Staging migration final review (`cms-core-v2-schedule-tbd-staging-migration-final-review`)

**Status:** COMPLETE (2026-08-01)

Doc: `cms-core-v2-schedule-tbd-staging-migration-final-review.md`

| Item | Value |
| --- | --- |
| Lock | ACCESS EXCLUSIVE NOWAIT + timeouts (B+D) |
| Baselines | `PASTE_FROM_A` from SQL Editor A (anon ≠ SoT) |
| Fingerprint | md5 string_agg row + catalog pre/post |
| READY | `READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true` |
| SQL executed | **false** |

### Next (superseded)

Apply completed 2026-08-02 → see §17 · next Primary `cms-core-v2-schedule-tbd-date-status-read-wiring`.

---

## 17. Staging migration apply completion (`cms-core-v2-schedule-tbd-staging-migration-apply-completion`)

**Status:** COMPLETE / PASS (2026-08-02)

Doc: `cms-core-v2-schedule-tbd-staging-migration-apply-completion.md`

| Item | Value |
| --- | --- |
| Staging schema | `date` nullable · `date_status` confirmed default · CHECKs validated |
| Counts | total 79 · published 74 · mio 0 · tbd 0 · fingerprints unchanged |
| Anon read | Gosaki published 74 · SCHEDULE_SELECT OK · normalize OK |
| Runtime wire | **none** yet |
| Next | `cms-core-v2-schedule-tbd-date-status-read-wiring` |
