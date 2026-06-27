# G-14b1e-upload — Gosaki Schedule CMS routine edit public reflection upload result and HTTP verify

**Phase:** `G-14b1e-upload-gosaki-schedule-routine-edit-public-reflection-result`  
**Status:** **complete** — operator manual overwrite upload **succeeded**; HTTP verification **PASS**  
**Date:** 2026-06-28  
**Operator:** 戸山（manual upload once）  
**Base commit:** `a549870`  
**Prior:** [gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md](./gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (April) | **PASS** |
| Routine edit price on public staging | **PASS** |
| Old price absent (Trio card) | **PASS** |
| PoC / audit markers absent | **PASS** |
| Event A / Event B / March / July touched | **no** |
| `_astro/` re-upload | **no** |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiScheduleRoutineEditPublicReflectionUploadSuccess: true
gosakiScheduleRoutineEditPublicReflectionHttpVerifyComplete: true
phase: G-14b1e-upload-gosaki-schedule-routine-edit-public-reflection-result
readyForG14b1fRoutineEditReflectionClosure: true
readyForG14b1AprilReUpload: false
readyForG14b1RoutineEditReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
eventATouched: false
eventBTouched: false
marchReuploadTriggered: false
julyReuploadTriggered: false
rollbackNeeded: false
```

**Do not re-upload** `schedule/2026-04/index.html` without a new approval ID and documented reason.

---

## 1. Upload summary (operator)

| Item | Value |
| --- | --- |
| **Executor** | Operator (戸山) — manual |
| **Method** | FileZilla / Lolipop FTP GUI — **overwrite** |
| **Files uploaded** | **1** |
| **Delete / mirror / sync** | **no** |

### Local source

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-04/index.html
```

### Remote destination

```txt
/cms-kit-staging/gosaki-piano/schedule/2026-04/index.html
```

### Public URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/
```

### Not uploaded (confirmed)

| Path | Status |
| --- | --- |
| `_astro/*` | **not uploaded** |
| `schedule/2026-03/index.html` | **not uploaded** |
| `schedule/2026-07/index.html` | **not uploaded** |
| Full `public-dist/` (27 files) | **not uploaded** |
| Account FTP root `/` | **not touched** |
| Production / Sariswing | **not touched** |

---

## 2. Target row (reference)

| Field | Value |
| --- | --- |
| **id** | `14230329-dde5-40d6-b9b3-75aefe140daf` |
| **legacy_id** | `schedule-2026-04-005` |
| **date** | `2026-04-12` |
| **title** | `<Trio>` |
| **venue** | `吉祥寺 Strings` |
| **price (DB + public)** | `3,300円（税込）` |

---

## 3. HTTP verify (read-only GET — Cursor)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/`  
**Method:** `curl` GET (read-only)  
**Date:** 2026-06-28

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| `scheduleDataSource=supabase` | **present** |
| `2026.04.12 (Sun)` | **present** |
| `<Trio>` (HTML: `&lt;Trio&gt;`) | **present** |
| `吉祥寺 Strings` | **present** |
| `開場 12:00 / 開演 13:00` | **present** |
| `料金：3,300円（税込）` | **present** |
| `出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b` | **present** |
| `jazz-strings.com` | **present** |

### Trio card excerpt (live staging)

```html
2026.04.12 (Sun) </h1> <div class="gosaki-schedule-event-body wixui-rich-text"> <p>&lt;Trio&gt;</p> <p>会場：吉祥寺 Strings</p> <p>時間：開場 12:00 / 開演 13:00</p> <p>料金：3,300円（税込）</p> <p>出演：宮崎幸子vo 後藤沙紀pf 寺尾陽介b</p><p>会場website: https://www.jazz-strings.com/</p>
```

---

## 4. Old price absence (Trio card)

| Check | Result |
| --- | --- |
| `3,300円(tax in)` on Trio card (`2026.04.12`) | **absent** |
| Pre-upload stale state | was `料金：3,300円(tax in)` — **resolved** |

**Note:** Other April cards may contain unrelated price strings (e.g. `MC 3,300円 + TC 550円` on 2026.04.27) — out of scope.

---

## 5. Audit marker scan (live page)

| Marker | Result |
| --- | --- |
| `[CMS Kit staging]` | **absent** |
| `[G-14b1 routine PoC]` | **absent** |
| `G-9g PoC` / G-9g2–G-9g3d PoC strings | **absent** |
| `3,300円(tax in)` (Trio card) | **absent** |

**Verdict:** **PASS** — no audit markers on April page.

---

## 6. Verification judgment

| Criterion | Pass |
| --- | --- |
| HTTP 200 | **yes** |
| Expected Trio card content | **yes** |
| New price reflected | **yes** |
| Old price removed (Trio) | **yes** |
| `scheduleDataSource=supabase` | **yes** |
| Minimal upload scope respected | **yes** |

**Verdict:** **G-14b1 routine edit public reflection — PASS**

---

## 7. Chain status (G-14b1)

| Phase | Status |
| --- | --- |
| G-14b1 planning | **complete** |
| G-14b1a Save enablement | **complete** |
| G-14b1b Preview preflight + result | **complete** |
| G-14b1c final preflight | **complete** |
| G-14b1d Save execution | **complete** |
| G-14b1e regen + upload preflight | **complete** |
| **G-14b1e-upload** (this doc) | **complete** |
| G-14b1f reflection closure | **next** |

---

## 8. Prohibited operations — not performed (this phase)

| Operation | Executed |
| --- | --- |
| Cursor FTP / upload | **no** |
| Package regen | **no** |
| DB write / Save | **no** |
| rollback SQL | **no** |
| commit / push | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g14b1e-gosaki-schedule-routine-edit-public-reflection-result.mjs
```

---

## 10. Reference index

| Topic | Doc |
| --- | --- |
| G-14b1e preflight | `gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md` |
| G-14b1d Save result | `gosaki-schedule-routine-edit-save-execution-result.md` |
| G-14c playbook | `gosaki-public-reflection-operation-standardization.md` |
| G-13c2e template | `gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.md` |
