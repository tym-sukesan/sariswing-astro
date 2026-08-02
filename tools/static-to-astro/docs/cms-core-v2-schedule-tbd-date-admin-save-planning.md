# CMS Core v2 — Schedule TBD date Admin / Save planning

- **Phase:** `cms-core-v2-schedule-tbd-date-admin-save-planning`
- **Date:** 2026-08-01
- **Status:** **COMPLETE (docs-only / read-only investigation)**
- **Prior:** helpers COMPLETE · Gosaki read compat COMPLETE · contract planning COMPLETE
- **Schema:** staging `schedules.date` still **NOT NULL** · **no** `date_status` column
- **This phase:** no Admin / Save / schema / DB / Edge / Mio seed / commit changes

Related:

- `cms-core-v2-schedule-tbd-date-contract-planning.md`
- `scripts/lib/schedule-date-contract.mjs`
- `scripts/lib/supabase-schedule-read.mjs` (confirmed normalize only)

---

## 1. Current Admin surfaces

| Surface | Path (examples) | Create | Edit Save | Notes |
| --- | --- | --- | --- | --- |
| Musician-basic `#schedule` list | `templates/admin-cms/modules/ScheduleAdminUi.astro` | **No** (Add event disabled) | **No** | SELECT-only scaffold |
| Staging shell PoC / slices | `AdminStagingScheduleGeneralEditSection.astro` · safe-fields / G-6-g* | N/A | Arm-gated field slices | title / times / venue… · date usually forbidden |
| Gosaki operator UI | `gosaki-staging-schedule-operator-ui.ts` | Dry-run preview **yes** · INSERT Save **gated** | Arm-gated | published / draft filters |
| Gosaki STG Edge operational UI | `gosaki-staging-schedule-operational-edit.ts` + Edge `gosaki-schedule-save-dry-run` | Create mode **yes** · Save **gated** | Edit mode · date **forbidden** | Primary operational Save stack |
| Legacy `/admin` | `src/scripts/admin/schedule.ts` | Historical | Out of Kit staging-shell scope | Do not extend for TBD MVP |

**Practical today:** confirmed create can be **previewed**; default runtime **cannot INSERT/UPDATE** without explicit arms. TBD UI/Save **does not exist**.

---

## 2. Current Admin input behavior

### 2.1 Date required locations

| Location | Behavior |
| --- | --- |
| `validateScheduleForm` (`schedule-dry-run-validation.ts`) | `"date is required"` · YYYY-MM-DD calendar check |
| G-22e new-event dry-run | empty date → warning; `ok` still requires non-empty date + title |
| Operational local dry-run create | `"date is required for create"` |
| Edge `gosaki-schedule-dry-run-edge-core` / handler create | `"date is required for create"` · `published` must be `false` on create |
| Edge / operational **edit** | **`date` forbidden** in payload |

### 2.2 Month / `source_route` generation (create)

- Month derived **only from calendar `date`** (`YYYY-MM-DD` → `YYYY-MM`).
- Helpers: `deriveYearMonthFromDate`, `deriveG22eSourceRoute` → `/schedule/${month}/`, `source_file` → `schedule-${month}.html`.
- Edge `buildCreateInsertRow` same pattern.
- **No path** to allocate month/source_route without a day (blocks TBD month-known create today).

### 2.3 Create vs edit

| Aspect | Create | Edit |
| --- | --- | --- |
| Date | required | forbidden (cannot change day) |
| Month / year / source_* | allocated from date on INSERT | not in UPDATE allowlist (forbidden mutation keys on many slices) |
| Published | forced `false` on create | safe field on operational edit |
| Lock | must **not** send `expectedBeforeUpdatedAt` | **required** when optimistic lock enabled |
| Write | INSERT | UPDATE |

### 2.4 Draft / pending / published

- Operator filter: `published` | `all` | `draft`.
- Create / duplicate drafts: `published=false` until publish/republish slices.
- Unpublish / republish: `{ published }` only (G-22f / G-22h).
- Public site reflection still requires package/FTP (separate from DB `published`).

### 2.5 Why null-date rows disappear from Admin lists

| Location | Filter |
| --- | --- |
| `staging-schedule-read.ts` | `.filter((r) => r.id && r.date)` |
| `gosaki-schedule-authenticated-admin-read.ts` | `r.id && r.date && canonical source_route && monthSet` |
| `mapRow` | `date: String(row.date ?? "")` → empty string fails truthy filter |

Even after schema allows NULL, **lists will hide TBD** until these filters change.

### 2.6 Past / future

- `splitSchedulesByDate`: `row.date >= today` → upcoming else past.
- Empty/`""` date sorts into **past** (wrong for TBD).
- Row picker time filters compare `row.date` lexicographically to today ISO.

### 2.7 Preview / validation display

- Dry-run adapters build preview groups `future` | `past` from date.
- G-6 general edit: Preview → gates → Save (arm + dry-run env).
- Edge: local dry-run then optional network dry-run POST before Save.

---

## 3. Current Save paths

### Path A — Edge operational (Gosaki STG package)

```txt
UI (edit|create)
  → local / network dry-run
  → POST functions/v1/gosaki-schedule-save-dry-run
  → validate → (save) server arm → UPDATE or INSERT
  → sanitize response / error UI
```

| Item | Value |
| --- | --- |
| Function | `gosaki-schedule-save-dry-run` |
| Client arm | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED === "true"` |
| Server arm | `GOSAKI_SCHEDULE_SAVE_ARMED === "true"` |
| Approval | `gosaki-schedule-operational-save` |
| Auth | user JWT + anon + `rpc('is_admin')` · **no** `service_role` |

### Path B — Staging-shell client adapters (G-6 / G-9 / G-22)

```txt
Preview → slice guard (assertG6G* / assertG22e…)
  → buildScheduleLockedWriteRequest / executeScheduleGeneralUpdateWrite
  → updateScheduleWrite (optimistic lock)  OR  insertScheduleWrite
```

| Item | Value |
| --- | --- |
| Lock | `expectedBeforeUpdatedAt` from beforeSnapshot `updated_at` |
| Default dry-run | `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |
| Slice arms | `PUBLIC_ADMIN_SCHEDULE_G6G1_*` · G6G2 · G-22e INSERT · G-9k existing Save · … (mutex) |

Optimistic lock is **date-independent** — keep for TBD.

### Payload allowlists (today)

- Edge edit safe: `title, venue, open_time, start_time, price, description, published` (+ id/legacyId + lock).
- Edge create: `date, title, venue, open_time, start_time, price, description, published` (published forced false).
- Client `ALLOWED_PAYLOAD_KEYS` includes `date` but many slices **forbid** date/year/month/source_*.
- G-22e INSERT keys include `legacy_id, site_slug, date, year, month, … source_route, sort_order`.

**Neither path accepts `date_status` or `date: null` today.**

---

## 4. Recommended UI contract

### 4.1 Recommended control (single pattern)

**日付状態** radio / select (default `confirmed`):

| Mode | Controls | Display preview |
| --- | --- | --- |
| **確定日 (confirmed)** | date `<input type="date">` required · month read-only derived from date (or hidden) | existing `YYYY.MM.DD (Dow)` |
| **日付未定・月既知 (tbd month-known)** | date disabled/cleared · month `<input type="month">` required | `日付未定` |
| **日程未定・月不明 (tbd month-unknown)** | date + month disabled/cleared · hub-only notice | `日程未定` |

Rules:

- Switching to confirmed restores date requirement; clears TBD-only state.
- Switching to TBD clears date (never leave a sentinel day).
- Month-unknown is a **secondary** opt-in (collapsed / “詳細”) so operators do not pick it by accident.
- Existing confirmed rows open with **確定日** preselected — **same feel as today**.
- TBD controls stay **hidden/disabled until schema readiness flag** (see §8).

### 4.2 List / filters (post-migration)

- Stop dropping falsy `date`; keep `id` + published/draft filters.
- Add time bucket: `upcoming` | `past` | `tbd` (TBD never auto-past).
- Display column uses contract display helper (`日付未定` / `日程未定` / confirmed format).

### 4.3 Edit transitions (new slices — not silent)

| Transition | Allowed when | Notes |
| --- | --- | --- |
| confirmed → tbd month-known | explicit status change + month | clears `date` |
| confirmed → tbd month-unknown | explicit + hub-only confirm | clears `date` + `month` / source_route policy |
| tbd → confirmed | require new `date` | derive month/source_route |
| confirmed date day change | **separate future slice** | today edit forbids date — keep until dedicated approval |

---

## 5. Recommended payload contract (future)

### 5.1 Fields

| Field | confirmed | tbd month-known | tbd month-unknown |
| --- | --- | --- | --- |
| `date_status` | `confirmed` | `tbd` | `tbd` |
| `date` | `YYYY-MM-DD` | `null` | `null` |
| `month` | derived / match date | `YYYY-MM` required | `null` |
| `year` | match | match month | `null` |
| `source_route` | `/schedule/YYYY-MM/` | `/schedule/YYYY-MM/` | hub-only policy (`null` or non-month) |
| `sort_order` | existing | existing | existing |
| `updated_at` / lock | edit only | edit only | edit only |
| content fields | unchanged | unchanged | unchanged |

Reuse `normalizeScheduleDateContract` / Save-side pure validator (new offline helper phase) before any network write.

### 5.2 Fail-closed (Save / dry-run / Edge)

Reject:

- unknown `date_status`
- confirmed + missing/invalid `date`
- confirmed + month mismatch
- tbd + non-null `date` (sentinel)
- tbd month-known + missing/malformed month
- tbd month-unknown + non-null month/date
- **schema migration前に `date_status` を送る**
- **schema migration前に `date: null` を保存する**
- old tabs sending TBD payload while feature flag off
- production project / unarmed Save

### 5.3 Dry-run vs non-dry-run

1. Offline / client validator (contract) → Preview
2. Network dry-run (Edge or shell) with same rules · **no write**
3. Non-dry-run only after: staging project gate · client+server arms · approval ID · schema readiness true

---

## 6. Backward compatibility

| Topic | Rule |
| --- | --- |
| Pre-migration | Admin remains **confirmed-only** · TBD UI hidden |
| Existing rows | Display/edit as confirmed (read compat already injects confirmed for dated rows) |
| Payload change timing | Introduce `date_status` **only after** staging migration apply + SELECT includes column |
| Old browser tabs | Server rejects unknown/null-date payloads until flag on; client version banner optional |
| Optimistic lock | Keep `expectedBeforeUpdatedAt` / `updated_at` trigger |
| Gosaki data | Migration backfill `confirmed` only · **never rewrite** existing `date` values |
| Public sort | Do not flip Gosaki lists to TBD comparator until explicit read-compat follow-up |

---

## 7. Migration boundary

### 7.1 What can precede schema

| Allowed (offline / disabled UI) | Forbidden before migration apply |
| --- | --- |
| Pure Admin state machine + validators (unit / offline) | Sending `date_status` or `date: null` to DB/Edge |
| Save payload helper offline verifiers | Enabling TBD radio in live Admin |
| Docs / feature-flag scaffolding (default off) | SELECT `date_status` before column exists |
| Confirmed-path refactors that keep byte-identical payloads | Mio seed apply |

### 7.2 Feature flag / disabled UI

Recommended gate (name illustrative):

```txt
PUBLIC_ADMIN_SCHEDULE_TBD_DATE_UI_ENABLED=true   # client — default false
(+ server/schema readiness probe or build-time SCHEMA_SCHEDULE_DATE_STATUS_READY)
```

- If flag false **or** schema probe fails → hide TBD modes · confirmed-only forms.
- On migration rollback → set flag false · Redeploy/restart Admin · reject TBD payloads server-side.

### 7.3 Schema detection policy

Do **not** show TBD operations until:

1. Staging migration apply COMPLETE
2. Column `date_status` present + CHECKs active + `date` nullable
3. Read SELECT updated (phase E)
4. Flag armed for staging shell only

---

## 8. Phase split (implementation order)

**Hard rule: never enable TBD Save before staging migration apply.**

| # | Phase | Goal | Depends on |
| --- | --- | --- | --- |
| A+B | `cms-core-v2-schedule-tbd-admin-state-save-payload-helpers` | **COMPLETE** — `schedule-admin-date-state.mjs` + `schedule-tbd-save-payload.mjs` (offline) · see §12 | this planning |
| C | `cms-core-v2-schedule-tbd-staging-migration-gate` | SQL templates + approval packet only | contract planning |
| D | `cms-core-v2-schedule-tbd-staging-migration-apply` | Human-approved staging migration **once** | C + explicit approval |
| E | `cms-core-v2-schedule-tbd-date-read-select-date-status` | Add `date_status` to SELECT · map status · keep Gosaki HTML gate | D |
| F | `cms-core-v2-schedule-tbd-date-admin-ui-connect` | Show TBD controls behind flag · fix null-date list drop · past/future bucket | A + D + E |
| G | `cms-core-v2-schedule-tbd-date-save-dry-run` | Edge + shell dry-run accept TBD contract · **no write** | B + D + F |
| H | `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging` | Staging Save once per approval · Edge +/or shell | G + dual arms + approval |
| I | `cms-core-v2-mio-seed-sql-regenerate-after-tbd` | Regen A–E seed · Option A 16/14 with TBD row | D |
| J | `cms-core-v2-mio-supabase-live-select-only-pilot` | Branch A live SELECT after seed apply | I + human seed apply |

**Next Primary after this planning:** prefer **C** (migration gate) in parallel with **A** (offline UI validator). Do **not** start F/G/H before D.

Optional rename alignment: admin-save implementation phases above supersede the single vague “admin-save” blob in older phase tables.

---

## 9. Risks and STOP conditions

| Risk | Mitigation |
| --- | --- |
| TBD Save before nullable schema | Hard gate · reject null date / date_status pre-migration |
| Sentinel date to “fake” TBD | Forbidden by contract + Save validator |
| Null rows invisible in Admin | Phase F filter fix required with UI connect |
| Empty date treated as past | TBD bucket · exclude from date compare |
| Create month allocation without day | TBD create must accept month (and optional hub-only) without `deriveYearMonthFromDate(date)` |
| Edit still forbids date | Status transitions need new allowlists · do not overload confirmed edit |
| Two Save stacks diverge | Shared payload helper (B) consumed by Edge core + shell adapters |
| Production / service_role | STOP · staging only |
| Gosaki confirmed regress | Keep confirmed default · HTML/read baselines |

**STOP this planning phase if:** Admin/Save code edited · schema/migration created · DB write · Edge deploy · Mio seed change · production touch.

---

## 10. Explicit non-goals (this phase)

- No Admin UI / Save / Edge code changes
- No `date_status` query addition
- No migration SQL authoring/execution (deferred to C/D)
- No Mio seed regenerate/apply
- No package / FTP / production
- No commit / push by this phase itself

---

## 11. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_ADMIN_SAVE_PLANNING_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_ADMIN_STATE_SAVE_PAYLOAD_HELPERS_COMPLETE: true
RECOMMENDED_UI: dateStatus radio + conditional date/month
RECOMMENDED_PAYLOAD: date_status + date + month + existing fields
FAIL_CLOSED_PRE_MIGRATION: reject date_status and date null saves
SCHEMA_CHANGED: false
ADMIN_SAVE_CHANGED: false
DATE_STATUS_IN_DB_QUERY: true
DB_WRITE_EXECUTED: false
MIGRATION_EXECUTED: true
EDGE_DEPLOYED: false
READY_FOR_MIO_SEED_APPLY: false
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_GATE_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_FINAL_REVIEW_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_STAGING_MIGRATION_APPLY_COMPLETION: true
CMS_CORE_V2_SCHEDULE_TBD_DATE_STATUS_READ_WIRING_COMPLETE: true
STAGING_SCHEMA_TBD_CONTRACT_APPLIED: true
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-dry-run
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 12. Offline helpers result (`cms-core-v2-schedule-tbd-admin-state-save-payload-helpers`)

**Status:** COMPLETE (offline only · 2026-08-01)

| Item | Value |
| --- | --- |
| Admin state | `scripts/lib/schedule-admin-date-state.mjs` · `resolveScheduleAdminDateState` |
| Save payload | `scripts/lib/schedule-tbd-save-payload.mjs` · `buildScheduleTbdSavePayload` |
| Modes | `legacy-confirmed-only` · `tbd-v1` |
| TBD write gate | `schemaSupportsTbd === true` **and** `tbdWriteEnabled === true` |
| Edit date | still forbidden (not relaxed) |
| Runtime wire | **none** (Admin / Edge / Save / SELECT unchanged) |
| Verifier | `verify:cms-core-v2-schedule-tbd-admin-state-save-payload-helpers` |

### Next

Superseded by migration gate (§13).

---

## 13. Staging migration gate / final review / apply completion

**Status:** Gate + final review COMPLETE · staging apply COMPLETE (2026-08-02) · `date` nullable · `date_status` in DB · runtime SELECT still omits `date_status`

Docs: gate · final-review · `cms-core-v2-schedule-tbd-staging-migration-apply-completion.md`

### Next

`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation` · Mio seed regen

Admin UI connect: `cms-core-v2-schedule-tbd-admin-ui-connect.md` **COMPLETE**
Save dry-run: `cms-core-v2-schedule-tbd-date-save-dry-run.md` **COMPLETE**
Non-dry-run planning: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md` **COMPLETE**
