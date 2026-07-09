# G-20r4a — Gosaki schedule August generation path enablement

**Phase:** `G-20r4a-schedule-august-generation-path-enablement`  
**Status:** **complete** — code gate only; **no build / regen / FTP / DB write**  
**Date:** 2026-07-09  
**Base commit:** `cdbf1cc`  
**Prior:** [gosaki-schedule-public-reflection-plan.md](./gosaki-schedule-public-reflection-plan.md) (G-20r4) · [gosaki-schedule-august-db-insert-execution-closure.md](./gosaki-schedule-august-db-insert-execution-closure.md) (G-20r3a)

| Check | Status |
| --- | --- |
| `expectedMonths` extended to 2026-08 | **yes** |
| Data-driven legacy `/2026-08/` stub path | **yes** |
| Hub / month / sitemap path documented | **yes** |
| Build / package regen | **not executed** |
| FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiScheduleAugustGenerationPathEnablementComplete: true
phase: G-20r4a-schedule-august-generation-path-enablement
baseCommit: cdbf1cc
priorPhase: G-20r4-schedule-public-reflection-plan
expectedMonthsEnd: 2026-08
expectedMonthsCount: 6
legacyStubDataDrivenPath: true
readyForG20r4bLocalRegenDryRun: true
packageRegenExecuted: false
buildExecuted: false
ftpUploadExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
```

**G-20r4a unblocks G-20r4b** local regen. Regen itself is **not** executed in this phase.

---

## 1. Problem

Gosaki schedule generation was capped at **2026-03 … 2026-07**:

| Layer | Before G-20r4a |
| --- | --- |
| `GOSAKI_SCHEDULE_SITE_CONFIG.expectedMonths` | 5 months · **no 2026-08** |
| Supabase anon read at build | August `published=true` rows **filtered out** |
| Data-driven legacy stubs | Fixture crawl months only · **no `/2026-08/`** without `2026-08.html` |
| Staging DB | 17 August rows live (G-20r3a) — **ahead of generator** |

---

## 2. Code changes

### 2.1 `expectedMonths` — `scripts/lib/supabase-schedule-read.mjs`

```javascript
expectedMonths: [
  "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
],
```

**Effect at build (G-20r4b+):**

- `loadGosakiScheduleDataForBuild()` includes August `published=true` rows (anon read)
- `deriveScheduleMonthsFromSchedules()` adds **2026-08** to hub month list
- `applyGosakiScheduleDataPages()` writes `schedule/2026-08/index.astro`
- `gosaki-schedules.json` gains **14** August published rows (not 17)

**Still excluded at build:** `published=false` (#007, #009, #013) · hold (#008, #018 not in DB) · test rows.

### 2.2 Legacy stub — `scripts/lib/astro-generator.mjs`

When `useGosakiScheduleData` and `gosakiScheduleBundle.months` is non-empty:

- Generate G-9c0b legacy stubs from **`bundle.months`** (not fixture `scheduleMonthPages` only)
- Emits `src/pages/2026-08/index.astro` → built `/2026-08/` stub
- Existing months 03–07 stubs still generated from same bundle list

When **not** using Supabase/static JSON data path, fixture crawl loop unchanged.

### 2.3 Verifier updates

| Script | Change |
| --- | --- |
| `verify-gosaki-schedule-seed-extractor.mjs` | expected month count **5 → 6** · assert `2026-08` |
| `verify-gosaki-schedule-public-reflection-plan.mjs` | assert `expectedMonths` **includes** `2026-08` |

---

## 3. August generation path (after G-20r4b regen)

```txt
Staging DB (kmjqppxjdnwwrtaeqjta)
  published=true · month=2026-08 · source_route=/schedule/2026-08/
    ↓ anon SELECT (loadScheduleRowsFromSupabase)
    ↓ filter expectedMonths includes 2026-08
gosaki-schedules.json (14 August rows)
    ↓ applyGosakiScheduleDataPages
/schedule/          hub · month link 2026-08
/schedule/2026-08/  14 event cards
/2026-08/           legacy stub · noindex · canonical → /schedule/2026-08/
sitemap-0.xml       includes /schedule/2026-08/ · excludes /2026-08/
```

### 3.1 Route expectations (G-20r4c QA)

| Route | Content |
| --- | --- |
| `/schedule/` | Hub lists **6** months (03–08) |
| `/schedule/2026-08/` | **14** published event cards |
| `/2026-08/` | Stub only — no event cards |
| `sitemap-0.xml` | `/schedule/2026-08/` yes · `/2026-08/` no |

### 3.2 Exclusions (unchanged)

| legacy_id | Reason |
| --- | --- |
| `schedule-2026-08-007`, `009`, `013` | `published=false` |
| `schedule-2026-08-008`, `018` | hold · not in DB |
| `schedule-2026-03-014`, `schedule-2026-09-001` | test rows · `published=false` |

---

## 4. Files touched (G-20r4a)

| File | Change |
| --- | --- |
| `scripts/lib/supabase-schedule-read.mjs` | `expectedMonths` + `2026-08` |
| `scripts/lib/astro-generator.mjs` | data-driven legacy stub from `bundle.months` |
| `scripts/verify-gosaki-schedule-seed-extractor.mjs` | month count 6 |
| `scripts/verify-gosaki-schedule-public-reflection-plan.mjs` | 2026-08 present assertion |
| `docs/gosaki-schedule-august-generation-path-enablement.md` | this doc |
| `scripts/verify-gosaki-schedule-august-generation-path-enablement.mjs` | verifier |

**Scope:** `tools/static-to-astro/**` only. No `src/`, `public/`, `supabase/functions/` changes.

---

## 5. Next phase

| Phase | Scope |
| --- | --- |
| **G-20r4b** | `build-gosaki-staging-admin-package.mjs` — local regen dry-run |
| **G-20r4c** | Public output review · August QA checklist |
| **G-20r4d** | Operator manual upload preflight |
| **G-20r4e** | Operator manual upload (FileZilla / Lolipop) |

---

## 6. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL / DB write / Save | **no** |
| build / package regen | **no** |
| FTP / deploy | **no** |
| network access | **no** |
| commit / push | **no** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-august-generation-path-enablement.mjs
```
