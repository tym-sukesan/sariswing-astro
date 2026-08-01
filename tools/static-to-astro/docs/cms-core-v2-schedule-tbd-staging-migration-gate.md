# CMS Core v2 — Schedule TBD staging migration gate

- **Phase:** `cms-core-v2-schedule-tbd-staging-migration-gate`
- **Follow-up:** `cms-core-v2-schedule-tbd-staging-migration-final-review` (**COMPLETE**)
- **Date:** 2026-08-01
- **Scope:** forward migration / preflight / post-check / rollback **design + static verify** only
- **Verdict:** **GATE COMPLETE** · final-review hardened locks/fingerprints · **packet READY for apply approval**
- **SQL template:** `scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql`
- **Final-review doc:** `cms-core-v2-schedule-tbd-staging-migration-final-review.md`
- **Verifier:** `npm run verify:cms-core-v2-schedule-tbd-staging-migration-gate` (offline)
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **STOP production:** `vsbvndwuajjhnzpohghh`
- **Next Primary:** `cms-core-v2-schedule-tbd-staging-migration-apply` (explicit one-shot approval)

---

## 1. Purpose

Prepare a **DO NOT EXECUTE** SQL packet so staging `public.schedules` can move to the TBD contract:

| Column | End state |
| --- | --- |
| `date` | `date` **NULL** allowed |
| `date_status` | `text NOT NULL DEFAULT 'confirmed'` |
| CHECK | `date_status ∈ ('confirmed','tbd')` |
| CHECK | confirmed → `date IS NOT NULL` · tbd → `date IS NULL` |

Existing rows keep their `date` values; backfill status to `confirmed` without content UPDATEs that would bump `updated_at`.

This phase does **not** apply SQL, change Admin/Save/read runtime, or regenerate Mio seed.

---

## 2. Live SELECT-only preflight (anon, staging)

Executed once in gate phase against staging anon API (no writes). Production ref not used.

| Check | Result |
| --- | --- |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` |
| Production ref used | **no** |
| `date_status` column | **absent** (PostgREST unknown column) |
| Published row count | **74** (anon only — **not** B SoT) |
| `gosaki-piano` published | **74** |
| `mio-kisaragi-jazz` rows | **0** |
| Published `date IS NULL` | **0** |
| Full table total (incl. unpublished) | **SQL Editor A only** → paste into B `PASTE_FROM_A` |

Schema inventory (from prior audits + A-block SQL for apply):

- `date`: `date NOT NULL` (pre-migration)
- Trigger: `schedules_set_updated_at` → `tg_schedules_set_updated_at` sets `updated_at = now()` on **any** row UPDATE
- Indexes: `schedules_date_idx`, month-related, `legacy_id` unique (audit docs)
- RLS: `schedules_public_select`, `schedules_admin_all` (unchanged by template)
- No CREATE TABLE in-repo; live/audit is SoT for column list

---

## 3. Forward migration order (block B)

1. `BEGIN`
2. `SET LOCAL lock_timeout` / `statement_timeout`
3. `LOCK TABLE public.schedules IN ACCESS EXCLUSIVE MODE NOWAIT`
4. Schema/data guards + compare to `PASTE_FROM_A` + capture fingerprints
5. `ADD COLUMN date_status text NOT NULL DEFAULT 'confirmed'` (**no UPDATE backfill**)
6. Assert all rows `date_status = 'confirmed'`
7. `ADD CONSTRAINT schedules_date_status_check … NOT VALID` → `VALIDATE`
8. `ADD CONSTRAINT schedules_date_status_date_consistency_check … NOT VALID` → `VALIDATE`
9. `ALTER COLUMN date DROP NOT NULL`
10. Final asserts (counts · data/catalog fingerprints · schema · trigger)
11. `COMMIT`

### Why no UPDATE backfill

`schedules_set_updated_at` fires on every UPDATE. PostgreSQL 11+ `ADD COLUMN … NOT NULL DEFAULT <constant>` fills existing rows without firing BEFORE UPDATE → row fingerprint (incl. `updated_at`) stays identical.

### A → B counts

Do **not** hardcode anon 74. Operator runs A in SQL Editor, pastes full-table scalars into B `PASTE_FROM_A`. Incomplete paste or drift under lock → STOP.

---

## 4. CHECK / constraint design

| Name | Definition |
| --- | --- |
| `schedules_date_status_check` | `date_status IN ('confirmed','tbd')` |
| `schedules_date_status_date_consistency_check` | `(confirmed AND date IS NOT NULL) OR (tbd AND date IS NULL)` |

Order: status CHECK → consistency CHECK → then DROP NOT NULL. Collision if names already exist → STOP.

---

## 5. Fingerprint / updated_at

`md5(string_agg(...))` over ordered `legacy_id|site_slug|date|month|published|sort_order|extract(epoch from updated_at)` plus site_slug / **definition** fingerprints (indexdef · triggerdef · RLS qual/with-check · relrowsecurity). Compared PASTE_FROM_A ↔ pre-DDL ↔ post-DDL. No UUID/PII in reports. Baseline temp: `CREATE TEMPORARY TABLE … ON COMMIT DROP` (no IF NOT EXISTS / no DELETE).

---

## 6. Post-check success (block C + B7)

- All existing rows `date_status = 'confirmed'`
- `date IS NULL = 0` immediately after forward (no TBD rows yet)
- Unknown status = 0 · contract violations = 0
- Total / published / site_slug / Gosaki published / Mio(=0) counts unchanged
- Data + catalog fingerprints unchanged
- Trigger `schedules_set_updated_at` still present
- RLS / indexes not altered by template

---

## 7. Rollback (block D) — separate, not auto-run

Same lock/timeout/NOWAIT policy as B.

Guards: tbd=0 · date null=0 · unknown=0 · contract violations=0 · `date_status` exists · date nullable.

Then: `date SET NOT NULL` → DROP CHECKs → `DROP COLUMN date_status`.

**If any TBD row exists, rollback is refused.**

---

## 8. SQL blocks A–E

Full text: `scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql`
(Also reproduced in final-review / apply chat reports.)

| Block | Purpose | Executed this phase |
| --- | --- | --- |
| A | SELECT-only preflight | **no** |
| B | Forward transaction | **no** |
| C | SELECT-only post-check | **no** |
| D | Guarded rollback | **no** |
| E | SELECT-only after rollback | **no** |

```txt
DO NOT EXECUTE
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
SQL_EXECUTED: false
DB_WRITE_EXECUTED: false
```

Not placed under `supabase/migrations/`.

---

## 9. Risks (accurate)

| Risk | Notes |
| --- | --- |
| Human pastes B on wrong project | Mandatory SQL Editor visual check; SQL cannot read project ref |
| Future TBD rows block rollback | By design |
| Wrong PASTE_FROM_A (anon 74 as total) | Sentinel -1 / md5 length checks + live equality under lock |
| Concurrent Admin Save | ACCESS EXCLUSIVE NOWAIT fails closed |
| Accidentally running UPDATE backfill | Template forbids; verifier checks |

---

## 10. Cursor apply judgment

```txt
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
CURSOR_JUDGMENT: READY FOR APPLY-PHASE APPROVAL — DO NOT EXECUTE WITHOUT ONE-SHOT APPROVAL
```

Packet is concurrency-hardened and fingerprint-guarded. Apply still requires explicit operator approval of full SQL text in `cms-core-v2-schedule-tbd-staging-migration-apply`.

---

## 11. Runtime / Mio / Admin

| Item | This phase |
| --- | --- |
| Admin / Save / Edge | **unchanged** |
| `date_status` in SELECT | **not added** |
| Mio seed SQL / apply | **unchanged** · still blocked |
| package / FTP / Edge deploy | **none** |
| production | **untouched** |

---

## 12. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_GATE_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_FINAL_REVIEW_COMPLETE: true
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
SQL_EXECUTED: false
DB_WRITE_EXECUTED: false
SCHEMA_CHANGED: false
DATE_STATUS_IN_DB: false
ADMIN_SAVE_CHANGED: false
RUNTIME_CHANGED: false
READY_FOR_MIO_SEED_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-staging-migration-apply
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 13. Limited git add (when operator requests commit)

See `cms-core-v2-schedule-tbd-staging-migration-final-review.md` §9.

---

## 14. Recommended commit message

See final-review doc §10.
