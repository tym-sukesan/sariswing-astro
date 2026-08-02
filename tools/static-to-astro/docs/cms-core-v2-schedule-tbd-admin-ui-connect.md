# CMS Core v2 — Schedule TBD Admin UI connect

- **Phase:** `cms-core-v2-schedule-tbd-admin-ui-connect`
- **Date:** 2026-08-02
- **Scope:** connect `schedule-admin-date-state.mjs` to Gosaki staging Schedule operator Admin UI
- **Verdict:** **COMPLETE / PASS**
- **Out of scope:** TBD Save · Edge · DB write · Mio seed · package/FTP · commit/push

---

## 1. Connected Admin UI

| Surface | Path |
| --- | --- |
| Operator page | `AdminGosakiStagingScheduleOperatorPage.astro` |
| Client UI | `gosaki-staging-schedule-operator-ui.ts` |
| Capability module | `src/lib/admin/staging-data/schedule-tbd-admin-ui.ts` |
| Route | `/__admin-staging-shell/musician-basic/admin/schedule/` |

SoT: `tools/static-to-astro/scripts/lib/schedule-admin-date-state.mjs` (no duplicated date contract in UI).

---

## 2. Capability gate

| Flag | Rule |
| --- | --- |
| `schemaSupportsTbd` | exact boolean `true` only |
| `tbdAdminUiEnabled` | exact boolean `true` only |
| Visible | both exact true **and** not production ref |
| Unset / false / `"true"` | confirmed-only UI |
| Staging Kit SSR | both exact true when `PUBLIC_SUPABASE_URL` is staging Kit |
| Production URL | never visible |

Config injected as JSON (`#gosaki-schedule-tbd-admin-ui-config`) with boolean values (not env strings).

---

## 3. UI states

| Mode | Behavior |
| --- | --- |
| confirmed | date input · month derived · existing Save path |
| month-known TBD | date disabled · month required · display 日付未定 |
| month-unknown TBD | explicit secondary radio · date/month null · display 日程未定 |
| invalid | fail-closed · edit blocked message |

---

## 4. Save boundary

- TBD selection → Save disabled · message「TBD保存はまだ有効化されていません」
- `tbdWriteEnabled` stays **false**
- `schedule-tbd-save-payload` **not** called from operator UI
- Edge / Save arm / optimistic lock unchanged
- confirmed existing Save contract unchanged

---

## 5. Verifier

- npm: `verify:cms-core-v2-schedule-tbd-admin-ui-connect` (45 passed after draft-state asserts)
- Safety Suite offline step registered · **ALL PASS**
- Gosaki HTML baseline ≥81 (Admin-only change)
- `git diff --check` clean

## 5b. Browser QA (local)

- Route: `/__admin-staging-shell/musician-basic/admin/schedule/`
- Auth gate disabled locally → protected section force-shown for layout/state check only
- Viewports: **1280×800** and **375×812**
- Config: `schemaSupportsTbd`+`tbdAdminUiEnabled` exact true (staging Kit)
- confirmed draft: date enabled+required · TBD panels hidden · Save block hidden
- month-known TBD: date disabled · month required · display「日付未定」· Save blocked message
- month-unknown TBD: month field hidden · display「日程未定」· Save blocked message
- Screenshots: `/tmp/tbd-admin-ui-qa/pc-1280.png`, `sp-375.png` (not committed)

---

## 6. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_ADMIN_UI_CONNECT_COMPLETE: true
TBD_ADMIN_UI_WIRED: true
TBD_SAVE_WIRED: false
EDGE_CHANGED: false
DB_WRITE_EXECUTED: false
READY_FOR_MIO_SEED_APPLY: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging
```

---

## 7. Next Primary

`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging` — staging TBD Save（別承認） after dry-run.
