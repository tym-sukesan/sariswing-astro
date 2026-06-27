# G-13c2 — Gosaki Event B PoC cleanup preflight

**Phase:** `G-13c2-gosaki-schedule-event-b-poc-cleanup-preflight`  
**Status:** **complete** — read-only preflight; expected values **confirmed**; cleanup execution **ready for implementation phase**  
**Date:** 2026-06-27  
**Base commit:** `0074efa`  
**Operator read:** staging anon SELECT + live HTTP (read-only)  
**Prior:** G-13e Event A chain closed; G-14c public reflection standardization

| Check | Status |
| --- | --- |
| Event B current DB read | **yes** (anon SELECT) |
| Live staging July page read | **yes** (HTTP 200) |
| Expected values from seed/Wix | **confirmed** (3 sources agree) |
| Event A / March untouched | **yes** |
| Save / upload / regen executed | **no** |

---

## Gates

```txt
gosakiScheduleEventBPocCleanupPreflightComplete: true
phase: G-13c2-gosaki-schedule-event-b-poc-cleanup-preflight
readyForG13c2d1EventBPocCleanupLocalImplementation: true
readyForG13c2EventBPocCleanupSaveExecution: false
readyForG13c2EventBPocCleanupReflection: false
eventATouched: false
marchReUploadNeeded: false
rollbackNeeded: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
cursorFtpExecuted: false
```

**Do not execute Save / regen / upload in this phase.**

---

## 1. Purpose

July Event B (`aa440e29…`) に残る G-9g / `CMS Kit staging` PoC 文言を、Event A（G-13c1→G-13e）と同様の **専用 cleanup slice** で除去する前の事前確認。

本フェーズの最重要成果: **cleanup 後の expected values を Wix seed 根拠で確定**（推測なし）。

---

## 2. Target row

| Item | Value |
| --- | --- |
| **id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **site_slug** | `gosaki-piano` |
| **date** | `2026-07-19` |
| **month** | `2026-07` |
| **source_route** | `/schedule/2026-07/` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` |
| **Card index** | 10 of 14 (G-13b) |
| **PoC origin** | G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g |

**Out of scope:** Event A (`f687ebf3…`), other July rows, March re-upload.

---

## 3. Current DB values (read-only — ~2026-06-27)

**Method:** staging anon SELECT on `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`).

| Field | Current value |
| --- | --- |
| **title** | `[CMS Kit staging] G-9g2 title PoC` |
| **venue** | `[CMS Kit staging] G-9g3b venue PoC` |
| **open_time** | `[CMS Kit staging] G-9g3c open PoC` |
| **start_time** | `[CMS Kit staging] G-9g3c start PoC` |
| **price** | `[CMS Kit staging] G-9g3d general edit price PoC` |
| **description** | `出演： [G-9g3b venue+description PoC]` |
| **updated_at** | `2026-06-18T01:04:51.312817+00:00` |

**Assessment:** All six safe text fields carry PoC markers. DB matches live staging HTML.

---

## 4. Live public staging (read-only HTTP)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| `scheduleDataSource=supabase` | **yes** |
| Event `2026.07.19 (Sun)` | **present** |

**Event B card (live, abridged):**

```txt
[CMS Kit staging] G-9g2 title PoC
会場：[CMS Kit staging] G-9g3b venue PoC
時間：開場 [CMS Kit staging] G-9g3c open PoC / 開演 [CMS Kit staging] G-9g3c start PoC
料金：[CMS Kit staging] G-9g3d general edit price PoC
出演： [G-9g3b venue+description PoC]
```

**PoC markers:** `CMS Kit staging`, `G-9g2`, `G-9g3b`, `G-9g3c`, `G-9g3d` — **present** (cleanup required).

### Event A / March spot-check (unchanged)

| URL | PoC markers |
| --- | --- |
| `/schedule/2026-03/` | **absent** (`G-9k6` / `G-9k4` count **0**) |
| Event A DB `title` | `<Duo>`; `updated_at` `2026-06-27T05:10:58.008982+00:00` |

**March re-upload:** **not required**.

---

## 5. Expected values — sources and conclusion

### 5.1 Independent sources (all agree)

| Source | Path |
| --- | --- |
| **A** | `scripts/supabase/gosaki-schedules-seed.template.sql` (`schedule-2026-07-010` INSERT) |
| **B** | `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql` |
| **C** | Wix fixture extractor — `extractAllGosakiScheduleSeeds('fixtures/gosaki-piano')` |

### 5.2 Confirmed expected values (post-cleanup)

| Field | Expected value | Status | Notes |
| --- | --- | --- | --- |
| **title** | `<>` | **confirmed** | Wix placeholder title; non-empty required |
| **venue** | `null` | **confirmed** | No venue in Wix seed |
| **open_time** | `null` | **confirmed** | No time in Wix seed |
| **start_time** | `null` | **confirmed** | No time in Wix seed |
| **price** | `null` | **confirmed** | No price in Wix seed |
| **description** | `出演：` | **confirmed** | Minimal Wix body; PoC suffix removed |

**changedFields (cleanup bundle):** `title`, `venue`, `open_time`, `start_time`, `price`, `description` (6 fields)

### 5.3 Wix fixture extractor output (reference)

```json
{
  "legacy_id": "schedule-2026-07-010",
  "date": "2026-07-19",
  "title": "<>",
  "venue": "",
  "open_time": null,
  "start_time": null,
  "price": null,
  "description": "出演：",
  "source_file": "2026-07.html",
  "source_route": "/schedule/2026-07/"
}
```

### 5.4 Operator note — minimal public card is intentional

July 17–18 adjacent cards on staging also use `<>` with sparse meta (G-13b). Event B cleanup restores **Wix seed baseline**, not a hypothetical “full concert” listing. **No client override required** unless operator later supplies real venue/times via separate edit slice.

### 5.5 Unconfirmed / deferred

| Item | Status |
| --- | --- |
| Real venue/times/price for 2026-07-19 | **not in Wix data** — do not invent |
| `date` / `month` change | **out of scope** |
| Other July rows with `<>` only | **out of scope** (not PoC markers) |

---

## 6. Cleanup approach — dedicated slice (same as Event A)

| Question | Answer |
| --- | --- |
| Use G-9k picker / routine edit path? | **No** — `assertOperationalNotPocAuditRow` blocks `aa440e29…` |
| Use G-13c1 panel? | **No** — fixed to Event A id only |
| Recommended | **G-13c2 dedicated cleanup slice** — mirror G-13c1 pattern |

### Proposed registration (implementation phase — not registered yet)

| Item | Proposed value |
| --- | --- |
| **approval_id** | `G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run` |
| **operation_id** | `gosaki-schedule-event-b-poc-cleanup` |
| **env arm** | `PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_ARMED` |
| **compile gate** | `PUBLIC_ADMIN_G13C2_EVENT_B_POC_AUDIT_CLEANUP_SAVE_ENABLED` |
| **target row** | `aa440e29-5be8-402e-9190-0d81c48434c0` only |
| **single-arm** | G-13c1 and G-13c2 arms **mutually exclusive** |

### Non-dry-run approval phrase

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

---

## 7. Cleanup execution readiness

| Criterion | Status |
| --- | --- |
| Expected values confirmed | **yes** |
| Current DB + live HTML aligned | **yes** |
| Event A protected | **yes** |
| G-14c reflection playbook | **yes** |
| G-13c1 implementation template | **yes** |
| Blocker | **none** |

**Verdict:** **Ready for `G-13c2d1-gosaki-schedule-event-b-poc-cleanup-local-implementation`** (code registration). Save execution remains **separate phased approvals**.

---

## 8. Public reflection plan (G-14c — not executed)

After successful G-13c2 Save + afterVerification:

| Step | Action |
| --- | --- |
| 1 | Regen preflight — anon SELECT confirms 6 fields match §5.2 |
| 2 | `node scripts/build-gosaki-staging-admin-package.mjs` |
| 3 | Post-regen — `schedule/2026-07/index.html` clean; March unchanged in package |
| 4 | **Upload scope:** **minimal** — 1 file (G-13e / G-14c §12.3) |
| 5 | Local path | `output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html` |
| 6 | Remote path | `/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html` |
| 7 | HTTP verify | `/schedule/2026-07/` Event B card — PoC absent; `scheduleDataSource=supabase` |
| 8 | Optional spot-check | `/schedule/2026-03/` still clean |

**Upload approval phrase:**

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

**CSS:** G-13e precedent — if `_astro` hash unchanged vs live, **do not** upload `_astro/`.

---

## 9. Expected public card after full chain

```txt
2026.07.19 (Sun)
<>
出演：
```

(No venue/time/price lines — matches Wix seed rendering.)

---

## 10. Rollback policy (doc only)

| Item | Policy |
| --- | --- |
| Pre-Save rollback SQL | Document in G-13c2 final preflight — **not executed** in preflight |
| SQL fallback reference | `gosaki-schedule-2026-07-010-restore.template.sql` (inverse direction for PoC→seed) |
| Post-verify success | `rollbackNeeded: false` (G-13e pattern) |
| Automatic rollback | **forbidden** |

**beforeSnapshot reference (current DB §3)** — operator saves at final preflight.

---

## 11. Stop conditions (preflight / future execution)

**Do not proceed to Save** if:

- Supabase project ≠ `kmjqppxjdnwwrtaeqjta`
- Target id / legacy_id mismatch
- Expected values drift from §5.2 without doc update
- G-13c1 arm simultaneously on
- Event A row values changed unexpectedly

**Do not proceed to upload** if:

- Regen verify FAIL
- March HTML in package regressed
- `scheduleDataSource=static-fallback`
- CSS hash changed but `_astro/` not in upload plan

---

## 12. Next phases (proposed)

| Order | Phase | Type |
| --- | --- | --- |
| **1** | `G-13c2d1-gosaki-schedule-event-b-poc-cleanup-local-implementation` | Code — mirror G-13c1 for Event B |
| **2** | `G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight` | Doc — beforeSnapshot / rollback SQL |
| **3** | `G-13c2-gosaki-schedule-event-b-poc-cleanup-execution` | Operator Save once |
| **4** | `G-13c2e-*` reflection chain | Regen → upload preflight → upload → HTTP verify → closure |

---

## 13. Prohibited operations — not performed (this phase)

| Operation | Executed |
| --- | --- |
| Save / DB write / SQL | **no** |
| FTP / upload | **no** |
| package regen | **no** |
| deploy / workflow_dispatch | **no** |
| Event A / March modification | **no** |
| commit / push | **no** |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2-gosaki-schedule-event-b-poc-cleanup-preflight.mjs
```

---

## 15. Reference index

| Topic | Doc / file |
| --- | --- |
| G-14c reflection | `gosaki-public-reflection-operation-standardization.md` §12.3 |
| G-13c prep | `gosaki-schedule-poc-visible-text-cleanup-implementation-prep.md` |
| G-13b scan | `gosaki-schedule-poc-visible-text-cleanup-preflight.md` |
| Event A closure | `gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md` |
| Seed SQL | `scripts/supabase/gosaki-schedules-seed.template.sql` |
| Restore SQL | `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql` |
| G-13c1 template | `gosaki-schedule-event-a-poc-cleanup-local-implementation.md` |
