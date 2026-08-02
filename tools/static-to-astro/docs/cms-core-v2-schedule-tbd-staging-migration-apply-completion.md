# CMS Core v2 — Schedule TBD staging migration apply completion

- **Phase:** `cms-core-v2-schedule-tbd-staging-migration-apply-completion`
- **Execution date:** 2026-08-02
- **Scope:** record applied staging migration + read-only anon SELECT / regression
- **Verdict:** **COMPLETE / PASS**
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **unchanged · not used**
- **This phase:** no additional DB write · no schema change · no runtime wire · no package/FTP · no commit/push by Cursor

---

## 1. Completion judgment

| Item | Result |
| --- | --- |
| Block B forward migration | **Success. No rows returned** (committed) |
| Block C post-check | `postcheck_pass=true` · `stop_reasons=[]` |
| Rollback (D/E) | **not executed · not needed** |
| Fingerprints vs Block A | **unchanged** |
| Production | **unchanged** |
| Application runtime / Admin / Save | **read-wiring COMPLETE** (`cms-core-v2-schedule-tbd-date-status-read-wiring`) · Admin/Save still unwired |

**Migration completion: PASS** on staging only.

---

## 2. Schema before → after (staging)

| Item | Before (preflight A) | After (post-check C) |
| --- | --- | --- |
| `date` | `date` NOT NULL | `date` **nullable YES** |
| `date_status` | absent | `text NOT NULL DEFAULT 'confirmed'` |
| `schedules_date_status_check` | absent | present · **validated** |
| `schedules_date_status_date_consistency_check` | absent | present · **validated** |
| `schedules_set_updated_at` | present | present |

---

## 3. Counts / fingerprints (invariant)

| Metric | Value |
| --- | ---: |
| schedules total | **79** |
| published | **74** |
| gosaki published | **74** |
| mio rows | **0** |
| confirmed | **79** |
| tbd | **0** |
| unknown status | **0** |
| date null | **0** |
| contract violation | **0** |
| updated_at nonnull | **79** |

| Fingerprint | Value (unchanged vs A) |
| --- | --- |
| site_slug | `a4ff22feb81e19789732525937f4be7e` |
| data | `1910b4faa5b17344d63968dc25f89cd6` |
| index | `cbaada6b44ae2cd07f4a0516f9d0f9b3` |
| trigger | `2e9899f09421456307b3c96402574106` |
| RLS | `e7344ff0de1d5e2862965ffc0e4e72cf` |

---

## 4. Block A / B / C summary

| Block | Role | Outcome |
| --- | --- | --- |
| A | SELECT-only preflight (SQL Editor full table) | baselines captured · PASTE_FROM_A filled |
| B | Forward txn (lock + ADD COLUMN DEFAULT + CHECKs + DROP NOT NULL) | Success |
| C | SELECT-only post-check | `postcheck_pass=true` |
| D/E | Guarded rollback | **not run** |

---

## 5. Anon SELECT-only verification (2026-08-02)

Tooling: ephemeral Node smoke using `resolveSupabaseAnonReadEnv` + `@supabase/supabase-js` anon · **no** `service_role` · staging URL gate · **no** writes.

| Check | Result |
| --- | --- |
| Staging host | `kmjqppxjdnwwrtaeqjta` |
| Production used | **false** |
| `SCHEDULE_SELECT` includes `date_status` | **false** (runtime still unwired) |
| Gosaki published via `SCHEDULE_SELECT` | **74** · RLS OK |
| `normalizeScheduleRecord` on those 74 | **74 OK / 0 fail** · null date **0** |
| All published via `SCHEDULE_SELECT` | **74** · normalize **74 OK** |
| Optional probe `date_status` on published | confirmed **74** · tbd **0** · null date **0** |
| Mio rows | **0** |
| RLS errors | **none** |

Note: anon RLS sees **published only** (74). Full-table **79** was confirmed in SQL Editor Block C (includes unpublished).

---

## 6. Regression (offline)

| Suite | Result |
| --- | --- |
| `verify:cms-core-v2-schedule-tbd-date-gosaki-read-compat` | PASS |
| `verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline` | PASS · **≥81** |
| `verify:cms-core-v2-mio-data-fixtures` | PASS |
| `verify:cms-core-v2-safety-suite` | **ALL PASS** (reconfirmed after doc updates) |
| `git diff --check` | clean |

---

## 7. Runtime unwired (explicit)

| Surface | Status |
| --- | --- |
| `SCHEDULE_SELECT` | no `date_status` |
| Gosaki public sort | legacy comparator (unchanged) |
| Admin / Save / Edge | unchanged · TBD write still gated offline |
| Mio seed SQL / apply | still **not ready** (needs regen for TBD row + `date_status`) |
| package / FTP | not regenerated / not deployed |

---

## 8. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_APPLY_COMPLETION: true
STAGING_SCHEMA_TBD_CONTRACT_APPLIED: true
SQL_EXECUTED: true
DB_WRITE_EXECUTED: true
ROLLBACK_EXECUTED: false
DATE_STATUS_IN_DB: true
DATE_STATUS_IN_DB_QUERY: true
RUNTIME_CHANGED: true
ADMIN_SAVE_CHANGED: false
READY_FOR_MIO_SEED_APPLY: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight
```

---

## 9. Next Primary

`cms-core-v2-schedule-tbd-admin-ui-connect` (Save dry-run still gated). Mio seed remains later.

Read-wiring recorded in `cms-core-v2-schedule-tbd-date-status-read-wiring.md`.

---

## 10. Limited git add (when operator requests commit)

```txt
tools/static-to-astro/docs/cms-core-v2-schedule-tbd-staging-migration-apply-completion.md
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
```

## 11. Recommended commit message

```txt
docs(cms-core-v2): record TBD staging migration apply completion

Document staging nullable date + date_status apply results, anon
read-compat smoke, and next date_status read-wiring phase. No runtime wire.
```
