# CMS Core v2 — Schedule TBD date Save dry-run

- **Phase:** `cms-core-v2-schedule-tbd-date-save-dry-run`
- **Date:** 2026-08-03
- **Scope:** local TBD Save payload dry-run preview via `buildScheduleTbdSavePayload`
- **Verdict:** **COMPLETE / PASS**
- **Out of scope:** Edge send · DB write · real Save · deploy · Mio seed · commit/push

---

## 1. Dry-run capability

| Flag | Rule |
| --- | --- |
| `schemaSupportsTbd` | exact boolean `true` |
| `tbdAdminUiEnabled` | exact boolean `true` |
| `tbdDryRunEnabled` | exact boolean `true` |
| Visible / runnable | all three exact true **and** not production |
| `tbdWriteEnabled` | **always false** (not confused with dry-run) |
| Unset / false / `"true"` | dry-run disabled |
| Production Supabase ref | always STOP / off |

SSR staging Kit URL arms the three flags exact true; injects `tbdWriteEnabled: false`.

Payload SoT accepts `tbdDryRunEnabled: true` to generate tbd-v1 candidates **without** `tbdWriteEnabled`.

---

## 2. Connected UI

| Surface | Path |
| --- | --- |
| Operator page | `AdminGosakiStagingScheduleOperatorPage.astro` |
| Client | `gosaki-staging-schedule-operator-ui.ts` |
| Dry-run module | `schedule-tbd-save-dry-run.ts` |
| SoT | `scripts/lib/schedule-tbd-save-payload.mjs` |
| Route | `/__admin-staging-shell/musician-basic/admin/schedule/` |

- TBD 選択時のみ「Dry-run確認」表示
- 不完全 draft は button disabled
- 結果に「これは保存されません」を明示
- 通常 Save は TBD 時 disabled のまま

---

## 3. Payload examples (create)

### confirmed (legacy — verifier)

- mode `legacy-confirmed-only`
- date required · **no** `date_status`

### month-known TBD (tbd-v1 + dry-run)

```json
{
  "date_status": "tbd",
  "date": null,
  "month": "2026-09",
  "source_route": "/schedule/2026-09/",
  "source_file": "schedule-2026-09.html"
}
```

### month-unknown TBD

```json
{
  "date_status": "tbd",
  "date": null,
  "month": null,
  "source_route": null,
  "source_file": null
}
```

---

## 4. Update / optimistic lock

- `expectedBeforeUpdatedAt` required for update dry-run
- date change forbidden retained
- UI edit TBD update uses row `updated_at` when present; missing lock → fail-closed

---

## 5. Network / write non-connection

- No fetch / Edge / `updateScheduleWrite` / `insertScheduleWrite` from dry-run path
- No `buildScheduleLockedWriteRequest` wiring
- Edge handler unchanged

## 5b. Browser QA

- PC 1280 / SP 375 on staging shell Schedule Admin
- TBD month-known + month → Dry-run確認 enabled · Save blocked message visible
- Result shows「これは保存されません」+ `date_status:tbd` + `date:null` + month
- Config: `tbdDryRunEnabled:true` · `tbdWriteEnabled:false`

---

## 6. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_DRY_RUN_COMPLETE: true
TBD_DRY_RUN_WIRED: true
TBD_SAVE_WIRED: false
TBD_WRITE_ENABLED: false
EDGE_CHANGED: false
DB_WRITE_EXECUTED: false
READY_FOR_MIO_SEED_APPLY: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation
```

---

## 7. Next Primary

`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation` — implement CREATE-only oneshot after planning (`cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md`).
