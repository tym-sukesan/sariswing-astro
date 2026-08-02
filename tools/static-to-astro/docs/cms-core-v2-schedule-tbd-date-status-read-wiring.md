# CMS Core v2 — Schedule TBD date_status read-wiring

- **Phase:** `cms-core-v2-schedule-tbd-date-status-read-wiring`
- **Date:** 2026-08-02
- **Scope:** read-only runtime wiring for SELECT / normalize / membership / display / sort
- **Verdict:** **COMPLETE / PASS**
- **Staging:** `kmjqppxjdnwwrtaeqjta` (schema already applied)
- **Production:** `vsbvndwuajjhnzpohghh` — **unchanged · TBD v1 SELECT forbidden**
- **Out of scope:** Admin UI · Save · Edge · Mio seed · DB/schema · package/FTP · commit/push

---

## 1. SELECT capability API

| Symbol | Role |
| --- | --- |
| `SCHEDULE_SELECT` / `SCHEDULE_SELECT_LEGACY` / `GOSAKI_SCHEDULE_SELECT` | confirmed-only columns · **no** `date_status` · production-safe default |
| `SCHEDULE_SELECT_TBD_V1` | includes `date_status` |
| `isSchemaSupportsTbdRead(value)` | **exact boolean `true` only** (`"true"` / unset / false → false) |
| `resolveSchemaSupportsTbdReadForSupabaseUrl(url)` | staging Kit ref → `true`; production / other → `false` |
| `resolveScheduleSelectClause({ schemaSupportsTbdRead, supabaseUrl })` | picks legacy vs tbd-v1 |

Rules:

- Unset / false / string `"true"` → **legacy**
- `schemaSupportsTbdRead === true` + staging Kit URL → **tbd-v1**
- `schemaSupportsTbdRead === true` + production → **STOP throw** (never silent legacy)
- TBD v1 Supabase errors are **not** auto-fallbacked to legacy SELECT

`loadScheduleRowsFromSupabase` / `loadScheduleDataForBuild` arm capability from staging Kit URL when not overridden.

---

## 2. Normalize output shape

`normalizeScheduleRecord` reuses `schedule-date-contract.mjs` (no duplicated rules).

| Field | Notes |
| --- | --- |
| `dateStatus` / `date_status` | `confirmed` \| `tbd` when contract applied |
| `date` | `string \| null` |
| `month` | `string \| null` (soft legacy null-date path may keep `""`) |
| `dateDisplay` / `date_display` | confirmed Kit format · TBD `日付未定` / `日程未定` |
| `monthMembership` | `{ kind: "month-page", month }` \| `{ kind: "hub-only" }` |
| `dateContract` | normalized contract object |

Legacy dated rows without `date_status` → confirmed. Explicit invalid combinations **fail-closed** (throw). Null date without status remains soft (no auto-TBD).

---

## 3. Membership / display / sort

- **Hub:** all published rows (confirmed + month-known TBD + month-unknown TBD)
- **Month page:** confirmed + month-known TBD for that month; hub-only TBD excluded
- **Sort:** `compareScheduleRecords` → `compareScheduleDateContract`
  1. known month ASC · unknown last
  2. confirmed before tbd
  3. confirmed: date → sortOrder → legacyId
  4. tbd: sortOrder → legacyId
- Gosaki month Astro filter/sort updated for TBD-safe membership; confirmed HTML fixture byte-identical

---

## 4. Staging anon SELECT-only

| Check | Result (2026-08-02) |
| --- | --- |
| Mode | **tbd-v1** |
| published | **74** |
| confirmed | **74** |
| tbd | **0** |
| null date | **0** |
| normalizeFail | **0** |
| RLS | PASS |
| production | unused |

Not registered in Safety Suite.

---

## 5. Verifier

- npm: `verify:cms-core-v2-schedule-tbd-date-status-read-wiring`
- Safety Suite: offline step `schedule-tbd-date-status-read-wiring`

---

## 6. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_STATUS_READ_WIRING_COMPLETE: true
DATE_STATUS_IN_DB_QUERY: true
RUNTIME_CHANGED: true
ADMIN_SAVE_CHANGED: false
EDGE_CHANGED: false
READY_FOR_MIO_SEED_APPLY: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-admin-ui-connect
```

---

## 7. Next Primary

Admin UI connect / Save dry-run planning execution (still gated). Mio seed regen remains after Admin/Save readiness or parallel track with new SQL for TBD null + `date_status`.
