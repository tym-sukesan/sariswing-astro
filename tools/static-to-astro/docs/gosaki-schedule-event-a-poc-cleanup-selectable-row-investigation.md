# G-13d1 — Gosaki Event A PoC cleanup selectable row investigation

**Phase:** `G-13d1-event-a-poc-cleanup-execution-blocked-selectable-row-investigation`  
**Status:** investigation complete — **no Save / DB write / code fix in this phase**  
**Base commit:** `149f3e4`  
**Prior:** G-13d1 final preflight; operator execution blocked on G-13c1 Preview

## Summary

Operator execution env で G-13c1 Preview を押すと `Event A row (f687ebf3…) not found in selectable rows.` でブロック。beforeSnapshot SELECT では行は存在。**原因は G-13c1 が SSR の `data-selectable-rows`（row picker の `selectableRows` のみ）に固定行を依存している設計欠陥**。過去日付フィルタは binding 段階では適用されない。

**Fix:** 次フェーズで G-13c1 の beforeSnapshot 取得を `loadScheduleRowForSiteSlugRead` 等の直接行読み取りに切り替える（local implementation）。

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 149f3e4
origin/main: 149f3e4
```

---

## 2. Error reproduction conditions

| Item | Value |
|------|-------|
| **Route** | `http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| **Panel** | G-13c1 — Event A PoC 文言クリーンアップ |
| **Action** | 「G-13c1 変更を確認（dry-run）」 |
| **Error** | `Event A row (f687ebf3-407c-49d0-9ab8-58040c499b8e) not found in selectable rows.` |
| **DB** | beforeSnapshot SELECT で行存在確認済み（operator） |

**Operator-reported beforeSnapshot (reference):**

```txt
id: f687ebf3-407c-49d0-9ab8-58040c499b8e
site_slug: gosaki-piano
legacy_id: schedule-2026-03-007
date: 2026-03-15
title: <Duo> [G-9k6 title UI保存テスト]
updated_at: 2026-06-22 15:01:47.671778+00
```

**G-13d2 contrast:** routine dev で同パネル dry-run Preview は **PASS**（6 `changedFields`）— 当時は `data-selectable-rows` に Event A が含まれていた。

---

## 3. G-13c1 target row resolution (code path)

```txt
gosaki-g13c1-event-a-poc-cleanup-preview-btn click
  → runG13c1Preview() [gosaki-schedule-event-a-poc-cleanup-ui.ts]
  → findTargetRowFromOperatorSection()
       document.getElementById("gosaki-schedule-operator")
       .getAttribute("data-selectable-rows")
       JSON.parse → rows.find(id === G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID)
  → null → error UI
```

**Does not consult:** `auditRows`, Supabase client fetch, operator table client filter, G-9k edit form selection.

---

## 4. Where `data-selectable-rows` is populated

```txt
GosakiStagingAdminSchedulePage.astro (SSR)
  → resolveGosakiScheduleSiteSlugRowPickerBinding()
       → loadSchedulesForSiteSlugRead({ site_slug, months, publishedFilter: "all", ... })
       → splitSelectableAndAuditRows(rows)
       → binding.selectableRows  (auditRows は別 — dev tools のみ)
  → AdminGosakiStagingScheduleOperatorPage.astro
       data-selectable-rows={JSON.stringify(binding.selectableRows)}
```

`auditRows` は `AdminStagingScheduleSiteSlugRowPickerSection`（`<details>開発者向け詳細</details>`）の `data-audit-rows` のみ。G-13c1 は参照しない。

---

## 5. Exclusion analysis for Event A

### 5.1 Past date / month picker — **not binding-level cause**

| Layer | Past-date filter? |
|-------|-------------------|
| `loadSchedulesForSiteSlugRead` | **No** date filter |
| `splitSelectableAndAuditRows` | **No** date filter |
| `data-selectable-rows` SSR | Full `selectableRows` |
| Client `rowMatchesFilters` (operator table) | Month/published/keyword — **does not affect G-13c1 lookup** |

Event A `2026-03-15` は過去日付だが、binding の `selectableRows` からは **日付では除外されない**。

### 5.2 `loadSchedulesForSiteSlugRead` post-filters — **possible cause if row fails**

Applied after Supabase SELECT (`staging-schedule-read.ts`):

| Filter | Event A expectation | Block if |
|--------|---------------------|----------|
| `site_slug = gosaki-piano` | ✓ operator confirmed | mismatch |
| `publishedFilter: "all"` | ✓ (picker binding) | N/A |
| `isCanonicalScheduleSourceRoute(source_route, "/schedule/")` | seed: `/schedule/2026-03/` | `source_route` is legacy `/2026-03/` etc. |
| `month ∈ GOSAKI_STAGING_EXPECTED_MONTHS` | `2026-03` included | month missing / wrong |

**Operator should verify** (read-only SELECT):

```sql
select id, legacy_id, site_slug, month, source_route, published
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e';
```

### 5.3 `splitSelectableAndAuditRows` / PoC audit — **unlikely for G-9k6 markers**

`isPocAuditScheduleRow` (`staging-schedule-site-slug-row-picker-utils.ts`):

1. `row.id === G9G1_TARGET_ROW_ID` (`aa440e29…` Event B) → audit — **not Event A**
2. Else `rowContainsPocAuditMarker` → any field contains `[CMS Kit staging]`

**G-9k6 markers** (`[G-9k6 …]`, `UI保存テスト`) do **not** match `[CMS Kit staging]`.

Static simulation (investigation verifier): Event A G-9k6 field set → `isPocAuditScheduleRow === false` → **would be selectableRows if loaded**.

Event B fields with `[CMS Kit staging]` → audit only (out of G-13c1 scope).

### 5.4 SSR env / empty binding — **likely execution trigger**

If dev server started **without** read gates, `resolveGosakiScheduleSiteSlugRowPickerBinding()` returns `selectableRows: []`:

| Required for non-empty binding | Execution stack (preflight doc) |
|-------------------------------|--------------------------------|
| `ENABLE_ADMIN_STAGING_SHELL=true` | documented |
| `ENABLE_ADMIN_STAGING_DATA_READ=true` | documented |
| `PUBLIC_ADMIN_DATA_PROVIDER=supabase` | documented |
| `PUBLIC_SUPABASE_URL` + anon key | documented |

**Symptom:** `data-selectable-rows="[]"` → same G-13c1 error. Operator table also empty / unavailable message.

**G-13d2 vs execution:** routine dev may have had `.env.local` data-read flags; execution inline env may have omitted `ENABLE_ADMIN_STAGING_DATA_READ` or `PUBLIC_ADMIN_DATA_PROVIDER=supabase`.

### 5.5 JSON parse failure — **same error message**

`findTargetRowFromOperatorSection` catch → `null` → identical error text. Less common; check DevTools `#gosaki-schedule-operator` attribute integrity if `selectableCount > 0` but G-13c1 still fails.

---

## 6. Root cause conclusion

| Finding | Detail |
|---------|--------|
| **Design defect (confirmed)** | G-13c1 fixed-row cleanup depends on row picker `selectableRows` embedded in DOM, not on direct target-row read |
| **Past date** | **Not** excluded at binding level |
| **PoC audit split** | Event A G-9k6 markers **should not** land in `auditRows` |
| **Most likely immediate trigger** | Empty `selectableRows` at SSR (env read gate) **or** row dropped by `source_route` / month load filter |
| **DB existence** | Confirmed by operator SELECT — **orthogonal** to G-13c1 DOM lookup |

---

## 7. Fix required?

**Yes — code fix recommended** even if env was misconfigured:

- G-13c1 target is **fixed** (`G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID` + legacy_id + site_slug).
- `loadScheduleRowForSiteSlugRead` already exists (`staging-schedule-read.ts`).
- Row picker `selectableRows` is for operator **selection UX**, not fixed cleanup bundles.

---

## 8. Next phase proposal

**Phase:** `G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix`

| Item | Proposal |
|------|----------|
| **Scope** | G-13c1 UI + optional SSR inject; Event A only |
| **Change** | `runG13c1Preview` / Save: resolve `beforeSnapshot` via `loadScheduleRowForSiteSlugRead` (client) or SSR `data-g13c1-target-row` fallback |
| **Remove dependency** | Do not require Event A ∈ `data-selectable-rows` |
| **Guards** | Keep `assertG13c1EventAPocCleanupWritableRow` unchanged |
| **Out of scope** | Event B; row picker audit policy change; Save execution |

**Operator interim workaround (not recommended for Save):** confirm execution env includes full data-read stack; verify `source_route`; check page source for `f687ebf3` in `data-selectable-rows` — **still fragile**.

---

## 9. Operator diagnostic checklist (read-only)

1. View source: `#gosaki-schedule-operator` → `data-read-source` = `supabase`?
2. `data-selectable-rows` contains `f687ebf3`?
3. 公演一覧 count > 0?
4. SQL: `source_route`, `month`, `site_slug` (section 5.2)
5. Dev server env: `ENABLE_ADMIN_STAGING_DATA_READ=true`, `PUBLIC_ADMIN_DATA_PROVIDER=supabase`

---

## 10. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupSelectableRowInvestigationComplete` | **true** |
| `readyForG13d1bTargetRowResolveFix` | **true** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `eventBTouched` | **false** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1-selectable-row-investigation-gosaki-schedule-event-a-poc-cleanup.mjs
```

---

## 12. References

- `src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts` — `findTargetRowFromOperatorSection`
- `src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts`
- `src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts` — `splitSelectableAndAuditRows`
- `src/lib/admin/staging-write/staging-schedule-read.ts` — `loadScheduleRowForSiteSlugRead`
- [gosaki-schedule-event-a-poc-cleanup-final-preflight.md](./gosaki-schedule-event-a-poc-cleanup-final-preflight.md)
