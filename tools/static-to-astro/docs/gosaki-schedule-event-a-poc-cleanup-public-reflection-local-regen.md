# G-13e — Gosaki Event A PoC cleanup public reflection local regen

**Phase:** `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen`  
**Status:** **complete** — local convert + build + manual-upload package regen **succeeded**; March Event A cleanup verified in generated HTML  
**Date:** 2026-06-27  
**Base commit:** `de234bf`  
**Prior:** [gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md](./gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md)

| Check | Status |
| --- | --- |
| Pre-regen DB read (Event A) | **yes** — read-only anon SELECT |
| Local package regen | **yes** — `build-gosaki-staging-admin-package.mjs` PASS |
| March HTML Event A cleanup | **PASS** |
| PoC markers absent in package | **PASS** (`G-9k6` / `G-9k4` / `管理画面保存テスト`) |
| `scheduleDataSource=supabase` | **PASS** |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiScheduleEventAPocCleanupPublicReflectionLocalRegenComplete: true
phase: G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen
readyForG13ePublicReflectionUploadPreflight: true
packageRegenExecuted: true
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
eventBTouched: false
```

**Live staging still stale** until operator manual upload (separate phase).

---

## 1. Pre-regen DB read (read-only)

**Method:** `resolveSupabaseAnonReadEnv()` + `loadScheduleRowsFromSupabase()` — staging anon only, no `service_role`.

| Item | Value |
| --- | --- |
| **Supabase host** | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| **site_slug** | `gosaki-piano` |
| **legacy_id** | `schedule-2026-03-007` |
| **March row count** | **13** |
| **title** | `<Duo>` |
| **venue** | `川崎 ぴあにしも` |
| **open_time / start_time** | `15:00` / `15:30` |
| **price** | `3,000円` |
| **description** | `出演：長谷川薫vo 後藤沙紀pf` + `会場website: http://pubhpp.com/` |
| **G-9k6 in title** | **false** |
| **G-9k4 in description** | **false** |

DB state matches G-13d1 execution result — safe to regen.

---

## 2. Local regen command

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Env source:** existing repo `.env.local` / `.env` (read-only — not modified).

**Pipeline executed:**

```txt
1. convert-static-to-astro.mjs  fixtures/gosaki-piano → output/gosaki-piano-astro
2. verify-static-public-artifact.mjs  → PASS (safeForStaticFtp: true)
3. npm run manual-upload:package
4. npm run verify:manual-upload  → PASS
```

**Overall:** `G-11c4b package build: PASS`

---

## 3. Generation output

| Artifact | Path |
| --- | --- |
| Astro project | `tools/static-to-astro/output/gosaki-piano-astro/` |
| Schedule JSON (intermediate) | `output/gosaki-piano-astro/src/data/gosaki-schedules.json` |
| Static public report | `output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` |
| Manual upload package | `output/manual-upload/gosaki-piano/` |
| Public dist (upload source) | `output/manual-upload/gosaki-piano/public-dist/` |
| Zip (optional) | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

| Metric | Value |
| --- | --- |
| **File count** | **27** |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **stagingUrl** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **safeForStaticFtp** | **true** |
| **static-public verify** | **PASS** |
| **manual-upload verify** | **PASS** |

**`_astro` CSS hash:** `index.YcHrHZH4.css` — **unchanged** vs live staging (2026-06-27 check).

---

## 4. March HTML — Event A reflection

**File:** `output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html`

| Check | Result |
| --- | --- |
| `scheduleDataSource=supabase` | **PASS** |
| Event card `2026.03.15 (Sun)` | **present** |
| Title | `<Duo>` (no G-9k6 suffix) |
| Venue | `川崎 ぴあにしも` |
| Times | `開場 15:00 / 開演 15:30` (not 18:00/19:00) |
| Price | `3,000円` |
| Description | Wix seed lines only |

**Event A card excerpt (generated):**

```html
2026.03.15 (Sun)
<Duo>
会場：川崎 ぴあにしも
時間：開場 15:00 / 開演 15:30
料金：3,000円
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

---

## 5. PoC marker removal (package scan)

| Marker | `schedule/2026-03/index.html` | Entire `public-dist/` |
| --- | --- | --- |
| `G-9k6` | **absent** | **absent** |
| `G-9k4` | **absent** | **absent** |
| `管理画面保存テスト` | **absent** | **absent** |
| `UI保存テスト` | **absent** | **absent** |

**Note:** `schedule/2026-07/index.html` still contains Event B G-9g PoC text — **expected** (Event B out of scope).

---

## 6. Upload target candidates (next phase — not executed)

| Priority | Local path | Remote path |
| --- | --- | --- |
| **Minimal (recommended)** | `public-dist/schedule/2026-03/index.html` | `/cms-kit-staging/gosaki-piano/schedule/2026-03/index.html` |
| Full package | `public-dist/**` (27 files) | `/cms-kit-staging/gosaki-piano/` |

**Minimal upload rationale:** `_astro/index.YcHrHZH4.css` unchanged on live staging — HTML-only upload sufficient for Event A text fix.

**Rules:** G-7g manual overwrite only; no `--delete`; separate operator approval; `readyForAnyFutureFtpApply: false` until G-7f1 re-approval.

---

## 7. Live vs local gap (expected)

| Surface | State |
| --- | --- |
| **Local package** | Event A clean |
| **Live staging** | Still shows G-9k6 on `/schedule/2026-03/` until upload |

---

## 8. Safety gates (this phase)

| Gate | Value |
| --- | --- |
| `cursorPackageRegenExecuted` | **true** (local only) |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `eventBTouched` | **false** |
| `commitInPhase` | **false** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.mjs
```

---

## 10. Next phase

**`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight`** — operator FTP manual upload preflight (G-7g approval phrase); minimal path `schedule/2026-03/index.html` first.
