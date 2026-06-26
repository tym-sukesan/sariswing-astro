# G-13b — Gosaki schedule PoC visible text cleanup preflight

**Phase:** `G-13b-gosaki-schedule-poc-visible-text-cleanup-preflight`  
**Status:** preflight complete — **no DB write / Save in this phase**  
**Base commit:** `099ee5d`  
**Prior:** G-13a dry-run verified; G-12b public schedule read  
**Verified at (UTC):** `2026-06-26` (read-only HTTP fetch of staging schedule months)

## Summary

Scanned Gosaki staging public schedule pages (`2026-03` … `2026-07`). **2 events** contain visible PoC / CMS test markers on the public site. Documented target rows, field cleanup candidates, Wix-seed expected values, and approval gates for a future non-dry-run slice.

**No DB write / Save / FTP in this phase.**

---

## 1. Scanned URLs

| URL | HTTP | PoC markers |
|-----|------|-------------|
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` | 200 | **1 event** |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/` | 200 | none |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-05/` | 200 | none |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-06/` | 200 | none |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` | 200 | **1 event** |

Hub: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/` — 200

**Not scanned for cleanup:** Sariswing production, gosaki-piano.com production.

---

## 2. Findings — visible PoC / test text

### Event A — G-9k6 UI save test markers (March)

| Item | Value |
|------|-------|
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` |
| **Display date** | `2026.03.15 (Sun)` |
| **Card index** | 7 of 13 |
| **DB id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **PoC origin** | G-9k4b / G-9k6b–G-9k6f field slice Saves |

**Current public text (abridged):**

```txt
<Duo> [G-9k6 title UI保存テスト]
会場：川崎 ぴあにしも [G-9k6 venue UI保存テスト]
時間：開場 18:00 / 開演 19:00
料金：3,000円（G-9k6 price UI保存テスト）
出演：… （管理画面保存テスト / G-9k4 UI保存テスト）
```

**Wix fixture reference** (`fixtures/gosaki-piano/2026-03.html`):

```txt
title: <Duo>
venue: 川崎 ぴあにしも
open_time: 15:00
start_time: 15:30
price: 3,000円
description: 出演：長谷川薫vo 後藤沙紀pf + 会場website http://pubhpp.com/
```

---

### Event B — G-9g site_slug PoC markers (July)

| Item | Value |
|------|-------|
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` |
| **Display date** | `2026.07.19 (Sun)` |
| **Card index** | 10 of 14 |
| **DB id** | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| **legacy_id** | `schedule-2026-07-010` |
| **site_slug** | `gosaki-piano` |
| **PoC origin** | G-9g2 / G-9g3b / G-9g3c / G-9g3d / G-9g3g operational Saves |

**Current public text:**

```txt
[CMS Kit staging] G-9g2 title PoC
会場：[CMS Kit staging] G-9g3b venue PoC
時間：開場 [CMS Kit staging] G-9g3c open PoC / 開演 [CMS Kit staging] G-9g3c start PoC
料金：[CMS Kit staging] G-9g3d general edit price PoC
出演： [G-9g3b venue+description PoC]
```

**Seed template baseline** (`gosaki-schedules-seed.template.sql`):

```txt
title: <>
venue: null
open_time: null
start_time: null
price: null
description: 出演：
```

**Note:** July 17–18 cards show `<>` with minimal meta — Wix seed placeholders, **not** G-9g PoC strings; **out of G-13b scope** unless client flags separately.

---

## 3. Cleanup field candidates

### Event A (`f687ebf3…`)

| Field | Cleanup action | Target value (proposed) |
|-------|----------------|-------------------------|
| `title` | Remove G-9k6 suffix | `<Duo>` |
| `venue` | Remove G-9k6 suffix | `川崎 ぴあにしも` |
| `open_time` | Restore Wix time | `15:00` |
| `start_time` | Restore Wix time | `15:30` |
| `price` | Remove test paren | `3,000円` |
| `description` | Remove test footer line | `出演：長谷川薫vo 後藤沙紀pf` (+ website line per Wix) |

### Event B (`aa440e29…`)

| Field | Cleanup action | Target value (proposed) |
|-------|----------------|-------------------------|
| `title` | Remove PoC markers | `<>` (seed) or client-provided title |
| `venue` | Clear PoC string | `null` or real venue if client supplies |
| `open_time` | Clear PoC string | `null` |
| `start_time` | Clear PoC string | `null` |
| `price` | Clear PoC string | `null` |
| `description` | Clear PoC marker | `出演：` (seed) or client text |

**Client confirmation:** G-12c-result may override targets for Event B (pilot row is sparse in Wix seed).

---

## 4. Cleanup policy (proposed)

| Principle | Detail |
|-----------|--------|
| **Scope** | Staging DB `site_slug=gosaki-piano` only — 2 rows |
| **Method** | Staging shell CMS UPDATE via existing write paths — **not** raw SQL by Cursor |
| **Slices** | Prefer **one row per approval session**; multi-field bundle per row with **new** approval ID |
| **Do not reuse** | G-9k6 / G-9g3 / G-9g4a1 / G-9g4a2a frozen approval IDs |
| **Public reflection** | After DB fix: convert + `manual-upload:package` + operator manual FTP (separate upload approval) |
| **PoC row picker** | Event B is excluded from picker by policy — cleanup may need operator SQL **or** dedicated cleanup slice path (implementation phase) |

### Recommended execution order (future)

```txt
1. G-13b-implementation — register approval ID + guards
2. G-13b-preflight-final — beforeSnapshot per row + rollback SQL
3. G-13b-execution — operator Save (Event A first — real Gosaki row)
4. G-13b-execution — Event B (pilot row) OR defer until client confirms target text
5. G-13b-public — rebuild + staging upload + HTTP verify (G-12b pattern)
```

---

## 5. Approval gates (write execution — not this phase)

### Non-dry-run Save (per cleanup session)

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

| Item | Proposed value |
|------|----------------|
| **approval_id** | `G-13b-gosaki-schedule-poc-visible-text-cleanup` |
| **operation_id** | `gosaki-schedule-poc-visible-text-cleanup` |
| **Env** | Dedicated arm TBD in implementation — **not** G-9k6 / G-9g arms |
| **Route** | `/__admin-staging-shell/musician-basic/#schedule` only |
| **Dry-run** | Preview required before Save (`PUBLIC_ADMIN_WRITE_DRY_RUN=true` until armed) |

### Manual upload (after public rebuild)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

---

## 6. Rollback (documented — not executed)

Operator-only rollback SQL templates in implementation phase. **G-13b preflight:** record current public text as beforeSnapshot reference only.

---

## 7. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiSchedulePocVisibleTextCleanupPreflightComplete` | **true** |
| `cursorDbWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `ftpUploadExecuted` | **false** |
| `productionTouched` | **false** |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13b-gosaki-schedule-poc-visible-text-cleanup-preflight.mjs
```

---

## 9. Next

`G-13b-gosaki-schedule-poc-visible-text-cleanup-implementation` — approval ID registration + write path selection (existing-event multi-field vs operational bundle).

---

## 10. References

- [gosaki-schedule-existing-event-field-slice-closure.md](./gosaki-schedule-existing-event-field-slice-closure.md) (Event A)
- [staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-general-edit-non-dry-run-execution-result.md) (Event B)
- [gosaki-schedule-cms-phase-boundary-planning.md](./gosaki-schedule-cms-phase-boundary-planning.md) (G-12d W1)
