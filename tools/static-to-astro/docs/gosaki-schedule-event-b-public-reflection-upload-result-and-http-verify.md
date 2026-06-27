# G-13c2e — Gosaki Event B PoC cleanup public reflection upload result and HTTP verify

**Phase:** `G-13c2e-gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify`  
**Status:** **complete** — operator manual overwrite upload **succeeded**; HTTP verification **PASS**  
**Date:** 2026-06-28  
**Operator:** 戸山（manual upload once）  
**Base commit:** `74ece00`  
**Prior:** [gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md](./gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md)

| Check | Status |
| --- | --- |
| Operator manual upload executed | **yes** (1 file overwrite) |
| Cursor / AI FTP / upload | **no** |
| HTTP verification (July) | **PASS** |
| Event B cleanup on public staging | **PASS** |
| PoC markers removed (July Event B) | **PASS** |
| Event A / March touched | **no** |
| `_astro/` re-upload | **no** |
| `mirror` / `sync` / `--delete` | **no** |
| DB write / Save | **no** |
| Package regen | **no** |

---

## Gates

```txt
gosakiScheduleEventBPocCleanupPublicReflectionUploadSuccess: true
gosakiScheduleEventBPocCleanupPublicReflectionHttpVerifyComplete: true
phase: G-13c2e-gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify
readyForG13c2eEventBClosure: true
readyForG13c2eJulyReUpload: false
readyForG13c2EventBPocCleanupReExecution: false
ftpUploadExecutedByCursor: false
cursorDbWriteExecuted: false
eventATouched: false
marchReuploadTriggered: false
rollbackNeeded: false
```

**Do not re-upload** `schedule/2026-07/index.html` without a new approval ID and documented reason.

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
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html
```

### Remote destination

```txt
/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html
```

### Public URL

```txt
https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/
```

### Not uploaded (confirmed)

| Path | Status |
| --- | --- |
| `_astro/*` | **not uploaded** |
| `schedule/2026-03/index.html` | **not uploaded** |
| Full `public-dist/` (27 files) | **not uploaded** |
| Account FTP root `/` | **not touched** |
| Production / Sariswing | **not touched** |

---

## 2. HTTP verification (read-only — Cursor + operator browser)

**Verified (UTC ~2026-06-28):**

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| `scheduleDataSource=supabase` | **PASS** |
| Event B card `2026.07.19 (Sun)` | **present** |
| `G-9g2` on page | **absent** |
| `G-9g3b` on page | **absent** |
| `G-9g3c` on page | **absent** |
| `G-9g3d` on page | **absent** |
| `[G-9g3b venue+description PoC]` | **absent** |

Operator browser confirmation aligns with HTTP fetch.

### curl reference

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/"

curl -sS "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/" \
  | rg "G-9g2|G-9g3b|G-9g3c|G-9g3d|2026\.07\.19|&lt;&gt;"
```

---

## 3. Event B public display (after upload)

**Target row:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `2026-07-19`

```txt
2026.07.19 (Sun)
<>
出演：
```

- Venue / open / start / price lines: **not rendered** (DB null → omitted in HTML)
- Matches G-13c2 DB cleanup + G-13c2e local regen expected values.

### Live Event B card (HTTP excerpt)

```html
2026.07.19 (Sun) </h1> <div class="gosaki-schedule-event-body wixui-rich-text"> <p>&lt;&gt;</p>    <p>出演：</p> </div> </article>
```

---

## 4. Before → after (public July Event B)

| Field | Before upload (stale) | After upload |
| --- | --- | --- |
| title | `[CMS Kit staging] G-9g2 title PoC` | `<>` |
| venue | `[CMS Kit staging] G-9g3b venue PoC` | **line absent** |
| open_time | `[CMS Kit staging] G-9g3c open PoC` | **line absent** |
| start_time | `[CMS Kit staging] G-9g3c start PoC` | **line absent** |
| price | `[CMS Kit staging] G-9g3d general edit price PoC` | **line absent** |
| description | `出演： [G-9g3b venue+description PoC]` | `出演：` |

---

## 5. CSS / JS asset references (live July page)

| Asset | Reference on live page | Changed? |
| --- | --- | --- |
| CSS | `_astro/index.YcHrHZH4.css` | **no** — same hash as pre-upload |
| JS | *(none referenced on month page)* | **no change** — month page does not load `_astro/*.js` |

Minimal 1-file upload was sufficient; `_astro/` re-upload **not required**.

---

## 6. Event A / March — not touched

| Item | Result |
| --- | --- |
| Upload scope | July `schedule/2026-07/index.html` **only** |
| `/schedule/2026-03/` | **unchanged** — Event A still clean (G-13e) |
| Event A row `f687ebf3…` | **not modified** |

**March spot-check (HTTP 200):** Event A `2026.03.15` — `<Duo>`, `15:00` / `15:30`, no `G-9k6`.

---

## 7. G-13c2 chain status (Event B)

| Phase | Outcome |
| --- | --- |
| G-13c2 | DB cleanup Save — **success** |
| G-13c2e local regen | Package — **success** |
| G-13c2e upload | Public reflection — **success** |
| G-13c2e HTTP verify | **PASS** |

**Event B PoC visible text cleanup:** **complete** on staging DB + public HTML.

**Closure doc:** separate phase (`G-13c2e-gosaki-schedule-event-b-public-reflection-closure`) — ready to author.

---

## 8. Prohibited operations — not performed (Cursor)

| Operation | Executed |
| --- | --- |
| FTP / upload (Cursor) | **no** |
| Additional upload / package regen | **no** |
| `mirror --delete` / sync-delete | **no** |
| deploy / workflow_dispatch | **no** |
| Save / DB write / SQL | **no** |
| production / Sariswing | **no** |
| March re-upload | **no** |

---

## 9. Safety gates (this phase)

| Gate | Value |
| --- | --- |
| `cursorFtpExecuted` | **false** |
| `ftpUploadExecutedByOperator` | **true** (operator once) |
| `rollbackSqlExecuted` | **false** |
| `commitInPhase` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2e-gosaki-schedule-event-b-public-reflection-upload-result-and-http-verify.mjs
```

---

## 11. Next phase

**`G-13c2e-gosaki-schedule-event-b-public-reflection-closure`** — documentation / verification only; chain closure for Event B (G-13c2 → G-13c2e).

---

## 12. References

- [gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md](./gosaki-schedule-event-b-public-reflection-local-regen-and-upload-preflight.md)
- [gosaki-schedule-event-b-poc-cleanup-execution-result.md](./gosaki-schedule-event-b-poc-cleanup-execution-result.md)
- [gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md](./gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution-result.md) (G-13e template)
- [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md)
