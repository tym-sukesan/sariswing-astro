# CMS Core v2 — Schedule TBD staging migration final review

- **Phase:** `cms-core-v2-schedule-tbd-staging-migration-final-review`
- **Date:** 2026-08-01
- **Prior:** `cms-core-v2-schedule-tbd-staging-migration-gate`
- **Scope:** SQL template / verifier / docs hardening only
- **Verdict:** **FINAL REVIEW COMPLETE** — packet ready for apply-phase approval
- **SQL template:** `scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql`
- **Verifier:** `npm run verify:cms-core-v2-schedule-tbd-staging-migration-gate` (offline)
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **STOP production:** `vsbvndwuajjhnzpohghh`
- **This phase:** no SQL execution · no DB write · no commit/push

---

## 1. Concurrency

Forward (B) and rollback (D) both start with:

1. `BEGIN`
2. `SET LOCAL lock_timeout = '5s'`
3. `SET LOCAL statement_timeout = '120s'`
4. `LOCK TABLE public.schedules IN ACCESS EXCLUSIVE MODE NOWAIT`
5. Then schema / data asserts · DDL

`NOWAIT` fails immediately if another session holds a conflicting lock (e.g. Admin Save). Migration does **not** queue behind writers. Concurrent Save is no longer an accepted residual risk for READY.

---

## 2. Schema / data guards

### Schema (under lock, before DDL)

- `public.schedules` exists
- `date` type = `date` and `NOT NULL`
- `date_status` column absent
- CHECK names `schedules_date_status_check` / `schedules_date_status_date_consistency_check` absent
- **Human visual:** SQL Editor Dashboard project = staging (not production). SQL cannot read project ref.

### Data (under lock, before DDL)

- full row count / published / site_slug fingerprint / gosaki published / mio=0
- `date IS NULL = 0`
- duplicate `legacy_id` groups = 0
- month/date misalignment = 0

### A → B expected counts

Anon published count (e.g. 74) is **not** SoT for `schedules_total`.

1. Run block A in SQL Editor (full table visibility).
2. Paste A5 / A5b / A10 / A12 scalars into B `PASTE_FROM_A` constants.
3. Sentinels (`expected_total := -1`, empty md5) → B refuses.
4. Under lock, live counts/fingerprints must equal pasted values (drift between A and B → STOP).
5. After DDL, in-tx baseline fingerprints must still match (row content unchanged).

---

## 3. Fingerprint

Deterministic `md5(string_agg(...))` over ordered rows:

`legacy_id|site_slug|date|month|published|sort_order|extract(epoch from updated_at)`
(`updated_at` is `timestamptz` → epoch is timezone-independent.)

Catalog fingerprints include **definitions**, not names only:

- index: `indexname` + `indexdef`
- trigger: `tgname` + `tgenabled` + `pg_get_triggerdef`
- RLS: table `relrowsecurity`/`relforcerowsecurity` + policy name/cmd/roles/qual/with-check

Same formulas in A / B baseline / B final / C.

No UUID / email / token columns in fingerprint or reports.

Compared: PASTE_FROM_A vs pre-DDL live · pre-DDL vs post-DDL.

### Baseline temp table (fail-closed)

```sql
CREATE TEMPORARY TABLE _cms_core_v2_tbd_mig_baseline (...) ON COMMIT DROP;
```

No `IF NOT EXISTS`. No `DELETE` from temp (or anywhere). Same-name temp already present → CREATE fails.

---

## 4. Migration order

1. Lock
2. Guards + fingerprint baseline
3. `ADD COLUMN date_status text NOT NULL DEFAULT 'confirmed'`
4. Assert all rows confirmed
5. status CHECK NOT VALID → VALIDATE
6. consistency CHECK NOT VALID → VALIDATE
7. `date DROP NOT NULL`
8. Assert counts / fingerprints / trigger / index / RLS unchanged
9. `COMMIT`

No backfill UPDATE. No `updated_at` assignment.

---

## 5. Rollback

Same lock policy. Before DDL, assert post-forward schema:

- `date_status` text NOT NULL DEFAULT confirmed · `date` nullable
- both CHECKs exist, `convalidated`, defs match contract

Only if also: tbd = 0 · date null = 0 · unknown = 0 · contract violations = 0

Then: `date SET NOT NULL` → `DROP CONSTRAINT` (**no IF EXISTS**) → `DROP COLUMN date_status`.

---

## 6. Success / rollback conditions

**Forward success:** schema end-state · all rows confirmed · null/tbd/unknown/violations 0 · counts + data/catalog fingerprints match baseline · trigger present · SQL_EXECUTED still false until apply phase records it.

**Rollback possible only when:** no TBD rows and no null dates (and unknown/violations 0). Any TBD → refuse rollback.

---

## 7. Risks (accurate)

| Risk | Mitigation |
| --- | --- |
| Wrong project in SQL Editor | Human visual gate (documented; SQL cannot auto-detect) |
| Operator pastes anon 74 as total | PASTE_FROM_A sentinel + length-32 md5 required |
| Concurrent Save during B/D | ACCESS EXCLUSIVE NOWAIT |
| Content mutation | data fingerprint pre/post |
| TBD after apply blocks rollback | by design |

---

## 8. Gates

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

Apply still requires explicit one-shot operator approval of full SQL text. This phase does **not** execute SQL.

---

## 9. Limited git add (when operator requests commit)

```txt
tools/static-to-astro/scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql
tools/static-to-astro/scripts/verify-cms-core-v2-schedule-tbd-staging-migration-gate.mjs
tools/static-to-astro/docs/cms-core-v2-schedule-tbd-staging-migration-gate.md
tools/static-to-astro/docs/cms-core-v2-schedule-tbd-staging-migration-final-review.md
tools/static-to-astro/docs/cms-core-v2-schedule-tbd-date-contract-planning.md
tools/static-to-astro/docs/cms-core-v2-schedule-tbd-date-admin-save-planning.md
tools/static-to-astro/docs/cms-core-v2-mio-supabase-live-select-only-seed-write-gate.md
tools/static-to-astro/docs/cms-core-v2-mio-supabase-live-select-only-seed-write-planning.md
tools/static-to-astro/docs/cms-core-v2-mio-read-only-proof-completion.md
tools/static-to-astro/docs/ai/00-current-state.md
tools/static-to-astro/docs/ai/03-next-actions.md
tools/static-to-astro/docs/ai/handoff-to-chatgpt.md
tools/static-to-astro/package.json
tools/static-to-astro/scripts/run-cms-core-v2-safety-suite.mjs
```

## 10. Recommended commit message

```txt
docs(cms-core-v2): final-review TBD staging migration SQL locks + fingerprints

Harden DO NOT EXECUTE template with ACCESS EXCLUSIVE NOWAIT, PASTE_FROM_A
full-table baselines, and md5 row fingerprints. No SQL apply or DB write.
```
