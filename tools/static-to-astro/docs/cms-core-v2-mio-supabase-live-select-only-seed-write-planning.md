# CMS Core v2 — Mio live SELECT-only seed write planning

- **Phase:** `cms-core-v2-mio-supabase-live-select-only-seed-write-planning`
- **Date:** 2026-08-01
- **Prior:** `cms-core-v2-mio-supabase-live-select-only-preflight` (Branch B · Mio counts 0)
- **Status:** **planning only** — **SQL NOT EXECUTED** · **DB write NOT APPROVED**
- **Follow-up gate:** `cms-core-v2-mio-supabase-live-select-only-seed-write-gate` → **NOT READY TO APPLY** (TBD `date=null` vs `schedules.date` NOT NULL)
- **Contract resolution:** `cms-core-v2-schedule-tbd-date-contract-planning` — nullable `date` + `date_status` · **sentinel rejected**
- **Target project:** staging `kmjqppxjdnwwrtaeqjta` only
- **STOP production:** `vsbvndwuajjhnzpohghh`

This document prepared the write gate. Full A–E SQL + collision/transaction guards are in the gate phase artifact. It does **not** authorize INSERT/DELETE.

---

## 1. Why seed is required

Anon SELECT on staging found **0** rows for `site_slug = 'mio-kisaragi-jazz'` on:

| Table | Current | Required for full live pilot |
| --- | ---: | ---: |
| `sites` | unknown / assume missing until SELECT confirms | **1** (`site_slug = mio-kisaragi-jazz`) |
| `schedules` | 0 | ≥1 published (fixture: 16 / 14 pub) |
| `discography` | 0 | ≥1 published (fixture: 5 / 4 pub) |
| `discography_tracks` | 0 | matching tracks with `site_slug` (fixture: 14) |
| `site_embeds` | 0 | ≥1 youtube published (fixture: 6 items) |
| `site_page_fields` | 0 | **1** about / `profile.lede` published |

Partial section seed → live pilot must be recorded as **PARTIAL**, not COMPLETE.

---

## 2. Minimal seed design (from fixture JSON)

**Source of truth (read-only):** `fixtures/mio-kisaragi-jazz-data/`

| Step | Action | Mapping rules |
| --- | --- | --- |
| 0 | Ensure `public.sites` row | `site_slug='mio-kisaragi-jazz'`, display_name e.g. `Mio Kisaragi Jazz`, `status='active'` · **plain INSERT only** (gate: no upsert overwrite; collision if sites already exists) |
| 1 | `schedules` | Core columns only · **omit** fixture fake `id` (use DB default UUID) · keep `legacy_id` · `site_slug` fixed · drop `extensions` · preserve `published` / `sort_order` / `source_route` `/schedule/YYYY-MM/` |
| 2 | `discography` | Core release columns + **`site_slug`** · omit non-DB extension fields |
| 3 | `discography_tracks` | `discography_legacy_id`, `track_number`, `title`, `sort_order`, **`site_slug='mio-kisaragi-jazz'`** (fixture tracks lack site_slug) · omit fake string `id` if not UUID |
| 4 | `site_embeds` | Map videos items → youtube rows · `legacy_item_id` = fixture `id` · normalize `source_url` / `embed_url` via Kit YouTube helpers · `site_id` from sites · include unpublished / shorts / invalid only if fail-closed tests desired |
| 5 | `site_page_fields` | Single row: `page_key='about'`, `field_key='profile.lede'`, `value_text` from fixture `pageFieldsCoreCompatible[0]` · `published=true` · `site_id`/`site_slug` from sites · **no** collaborators / jaLong / en in this minimal Core seed |

### Recommended MVP counts (Option A — full fixture mirror)

| Table | Insert count | Published expected after seed |
| --- | ---: | ---: |
| `sites` | 1 | active |
| `schedules` | 16 | 14 |
| `discography` | 5 | 4 |
| `discography_tracks` | 14 | all rows seeded; **13** belong to published releases · **1** on unpublished `mio-disco-live-01` |
| `site_embeds` | 6 | 5 published flag (≤3 renderable public) |
| `site_page_fields` | 1 | 1 |

### Option B — absolute minimum smoke (not full pilot COMPLETE)

| Table | Insert | Allows |
| --- | ---: | --- |
| sites + 1 schedule pub + 1 disco pub + ≥1 track + 1 embed pub + 1 lede | smoke SELECT only | **PARTIAL** live pilot at best |

**Recommendation:** Option A after explicit write approval, so Branch A live pilot can target COMPLETE rather than PARTIAL.

---

## 3. Human-executed SQL candidates (DO NOT RUN here)

Template file (also marked DO NOT EXECUTE):

`scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql`

Sketch (illustrative — operator must regenerate from fixture before apply):

See gate artifact blocks A–E (regenerated from fixtures):

`scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql`

**Hard rules for apply phase:**

- Operator SQL Editor / approved role only · no privileged keys in repo
- No production project
- No Gosaki `site_slug` mutation
- Plain INSERT only · collision guard · no upsert overwrite
- Resolve TBD `mio-sched-2026-09-01` date=null vs `schedules.date` NOT NULL before apply
- Exact approval form required (G-7f1 destructive bar applies to DB write)

---

## 4. Rollback DELETE conditions

Order (child → parent). **Scope always `site_slug = 'mio-kisaragi-jazz'`.**

```sql
-- SELECT-only pre-check counts first (see §5)

delete from public.discography_tracks
where site_slug = 'mio-kisaragi-jazz';

delete from public.discography
where site_slug = 'mio-kisaragi-jazz';

delete from public.site_embeds
where site_slug = 'mio-kisaragi-jazz';

delete from public.site_page_fields
where site_slug = 'mio-kisaragi-jazz';

delete from public.schedules
where site_slug = 'mio-kisaragi-jazz';

-- sites row: only if no remaining FKs and operator confirms
-- delete from public.sites where site_slug = 'mio-kisaragi-jazz';
```

Do **not** use unqualified DELETE · do **not** touch `gosaki-piano`.

---

## 5. SELECT-only before / after checks

### Before seed (must match preflight)

```sql
select 'schedules' as t, count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz'
union all select 'discography', count(*) from public.discography where site_slug = 'mio-kisaragi-jazz'
union all select 'discography_tracks', count(*) from public.discography_tracks where site_slug = 'mio-kisaragi-jazz'
union all select 'site_embeds', count(*) from public.site_embeds where site_slug = 'mio-kisaragi-jazz'
union all select 'site_page_fields', count(*) from public.site_page_fields where site_slug = 'mio-kisaragi-jazz'
union all select 'sites', count(*) from public.sites where site_slug = 'mio-kisaragi-jazz';
```

Expect content tables **0** (sites may already be 0 or 1).

### After seed (Option A targets)

| Query focus | Expect |
| --- | ---: |
| schedules all / published | 16 / 14 |
| discography all / published | 5 / 4 |
| discography_tracks | 14 |
| site_embeds youtube | 6 (published flag per fixture) |
| site_page_fields about lede published | 1 |
| gosaki-piano schedule published | unchanged (e.g. 74) |

Report **counts only** — no UUID / email / token dumps.

### Anon re-check

Repeat head counts with staging anon key after seed (same preflight script pattern). RLS must still allow published SELECT.

---

## 6. Risk / success / failure

| Risk | Mitigation |
| --- | --- |
| Wrong project (production) | Host/ref gate · STOP on `vsbvndwuajjhnzpohghh` |
| Overwrite Gosaki | All DML scoped to `mio-kisaragi-jazz` |
| Partial seed claimed COMPLETE | PARTIAL until all four surfaces present |
| Fake YouTube IDs break browser | Accept embed errors for fictional IDs · or substitute allowlisted demo IDs in write gate |
| Fixture `extensions` leak into INSERT | Strip extensions · Core columns only |
| Track `site_slug` missing | Always set on insert |
| Upsert clobber | Prefer insert-if-absent for content rows |

| Outcome | Condition |
| --- | --- |
| Seed SUCCESS | After counts match targets · Gosaki counts unchanged · anon published SELECT works |
| Seed FAILURE | Any error / wrong slug / production · **stop · no retry · no cleanup** without human (G-7f1) |
| Live pilot unlock | Seed SUCCESS → re-enter `cms-core-v2-mio-supabase-live-select-only-pilot` as Branch A |

---

## 7. Approval gate (next phase — not this doc)

Required before any apply:

```txt
承認します。この操作を1回だけ実行してください。
approval ID: <new-id e.g. cms-core-v2-mio-supabase-live-select-seed-apply>
project: kmjqppxjdnwwrtaeqjta
site_slug: mio-kisaragi-jazz
tables: sites, schedules, discography, discography_tracks, site_embeds, site_page_fields
```

Vague OK is insufficient.

---

## 8. Gates

```txt
CMS_CORE_V2_MIO_SUPABASE_LIVE_SELECT_ONLY_SEED_WRITE_PLANNING_COMPLETE: true
MIO_SEED_SQL_EXECUTED: false
DB_WRITE_EXECUTED: false
READY_FOR_MIO_SEED_APPLY: false
SEED_WRITE_GATE: cms-core-v2-mio-supabase-live-select-only-seed-write-gate
NEXT_AFTER_SEED: cms-core-v2-mio-supabase-live-select-only-pilot (Branch A)
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```
