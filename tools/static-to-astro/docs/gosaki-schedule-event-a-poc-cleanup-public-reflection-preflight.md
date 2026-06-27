# G-13e — Gosaki Event A PoC cleanup public reflection preflight

**Phase:** `G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight`  
**Status:** preflight complete — **no package regen / FTP / deploy in this phase**  
**Date:** 2026-06-27  
**Base commit:** `2fb0ceb`  
**Prior:** G-13d1 Event A cleanup Save succeeded (`gosaki-schedule-event-a-poc-cleanup-execution-result.md`)  
**Scope:** Event A public HTML reflection only — Event B **out of scope**

## Summary

G-13d1 cleaned Event A row in staging Supabase. **Public staging HTML still serves pre-cleanup PoC text** on the canonical month page until convert + build + manual upload. This doc plans package regeneration, diff checks, and operator upload paths.

**No package regen / FTP / deploy / DB write / Save in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 2fb0ceb
origin/main: 2fb0ceb
branch: main...origin/main
```

---

## 2. DB cleanup後 Event A — read-only confirmation

### 2a. Authoritative source (G-13d1 execution)

Operator afterVerification SELECT + UI Save success documented in [gosaki-schedule-event-a-poc-cleanup-execution-result.md](./gosaki-schedule-event-a-poc-cleanup-execution-result.md).

| Field | Post-cleanup value |
| --- | --- |
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| **legacy_id** | `schedule-2026-03-007` |
| **site_slug** | `gosaki-piano` |
| **date** | `2026-03-15` |
| **title** | `<Duo>` |
| **venue** | `川崎 ぴあにしも` |
| **open_time** | `15:00` |
| **start_time** | `15:30` |
| **price** | `3,000円` |
| **description** | `出演：長谷川薫vo 後藤沙紀pf` + `会場website: http://pubhpp.com/` |
| **updated_at** | `2026-06-27T05:10:58.008982+00:00` |
| **before baseline** | `2026-06-22T15:01:47.671778+00:00` |

**PoC markers removed from DB:** `G-9k6`, `G-9k4`, `管理画面保存テスト` suffixes — **confirmed** in G-13d1.

### 2b. Operator reconfirm SELECT (staging only — read-only)

Run before package regen if any doubt:

```sql
-- G-13e preflight — SELECT only; staging project static-to-astro-cms-staging only
select
  id,
  legacy_id,
  site_slug,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  updated_at
from public.schedules
where id = 'f687ebf3-407c-49d0-9ab8-58040c499b8e'
  and legacy_id = 'schedule-2026-03-007'
  and site_slug = 'gosaki-piano';
```

Expect section 2a values. **Abort regen** if row count ≠ 1 or PoC markers reappear.

### 2c. Build-time Supabase read path

Convert reads schedules at build time via:

| Module | Role |
| --- | --- |
| `scripts/lib/supabase-schedule-read.mjs` | `loadGosakiScheduleDataForBuild()` → `scheduleDataSource=supabase` |
| `scripts/convert-static-to-astro.mjs` | Passes bundle to astro generator |
| `scripts/lib/gosaki-schedule-data-pages.mjs` | Writes `src/data/gosaki-schedules.json` + month Astro pages |
| `scripts/lib/astro-generator.mjs` | `applyGosakiScheduleDataPages()` |

**Requires** repo `.env.local` (or inline env) with:

```txt
PUBLIC_SUPABASE_URL=https://kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<staging anon — not committed>
```

If env missing → `scheduleDataSource=static-fallback` or `wix-html` → **wrong HTML** (old fixture text). **Abort** if marker is not `scheduleDataSource=supabase`.

---

## 3. Public gap — live staging still shows PoC text (read-only HTTP)

**Verified (UTC ~2026-06-27):** canonical month page still has pre-cleanup markers.

| URL | HTTP | Event A card (`2026.03.15`) |
| --- | --- | --- |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/` | 200 | **Still shows** `G-9k6` / `G-9k4` / `18:00` / `19:00` |
| `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/2026-03/` | 200 | Legacy stub only — canonical → `/schedule/2026-03/` (no event cards) |

**Live excerpt (pre-reflection):**

```txt
<Duo> [G-9k6 title UI保存テスト]
会場：川崎 ぴあにしも [G-9k6 venue UI保存テスト]
時間：開場 18:00 / 開演 19:00
料金：3,000円（G-9k6 price UI保存テスト）
（管理画面保存テスト / G-9k4 UI保存テスト）
```

**Marker on page:** `CMS_TARGET: SCHEDULE_MONTH_LIST scheduleDataSource=supabase` — data path is correct; **deployed HTML is stale** relative to DB.

---

## 4. Public reflection 手順（次フェーズ — operator / Cursor 実装時）

### Prerequisites

```txt
- Supabase project: static-to-astro-cms-staging / kmjqppxjdnwwrtaeqjta
- fixtures/gosaki-piano/ present (Wix crawl fixture)
- .env.local PUBLIC_SUPABASE_* set (do not commit)
- G-13d1 Save complete — do not re-Save
```

### Recommended one-shot (G-11c4b script)

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

This runs:

```txt
1. convert-static-to-astro.mjs  (fixtures/gosaki-piano → output/gosaki-piano-astro)
   └─ loadGosakiScheduleDataForBuild() with Supabase env
2. verify-static-public-artifact.mjs
3. npm run manual-upload:package
4. npm run verify:manual-upload
```

**Output package:**

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/
  public-dist/          ← operator upload source
  MANUAL_UPLOAD_INSTRUCTIONS.md
```

### Manual step breakdown (if not using one-shot)

```bash
cd tools/static-to-astro

# 1. Convert (Supabase env required)
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano \
  output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

# 2. Static-public verify
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

# 3. Manual upload package
npm run manual-upload:package
npm run verify:manual-upload
```

**Not in this phase:** operator FTP upload (separate approval per G-7g).

---

## 5. 反映対象ページ

### Must change (Event A cleanup)

| Route | Built HTML path | Why |
| --- | --- | --- |
| `/schedule/2026-03/` | `public-dist/schedule/2026-03/index.html` | Event A card 7 (`2026.03.15`) — **primary target** |

### Should not change (Event A scope)

| Route | Notes |
| --- | --- |
| `/schedule/` hub | Month links only — no per-event text |
| `/schedule/2026-04/` … `2026-06/` | No Event A rows |
| `/schedule/2026-07/` | Event B PoC markers **remain in DB** — still shows G-9g text (out of scope) |
| `/2026-03/` legacy stub | Redirect stub — no event body |
| `/admin/` | Read-only admin — unrelated |
| `/`, `/about/`, `/discography/`, YouTube home | Unrelated to schedule row |

### Expected post-regen HTML (Event A card)

```txt
<Duo>
会場：川崎 ぴあにしも
時間：開場 15:00 / 開演 15:30
料金：3,000円
出演：長谷川薫vo 後藤沙紀pf
会場website: http://pubhpp.com/
```

**Must NOT contain:** `G-9k6`, `G-9k4`, `管理画面保存テスト`, `UI保存テスト`.

---

## 6. Package 再生成時の確認項目

### Convert / build gates

| Check | Pass criteria |
| --- | --- |
| `scheduleDataSource` | `supabase` in built month HTML comment |
| Event count March | **13** cards (G-12b baseline) |
| Intermediate JSON | `output/gosaki-piano-astro/src/data/gosaki-schedules.json` — row `f687ebf3…` matches section 2a |
| `verify-static-public-artifact` | PASS |
| `verify:manual-upload` | PASS |

### Diff focus (Event A)

| Artifact | Expected diff |
| --- | --- |
| `schedule/2026-03/index.html` | Event A card text updated; times `15:00`/`15:30`; no PoC markers |
| `gosaki-schedules.json` (intermediate) | `f687ebf3…` field values only |
| `schedule/2026-07/index.html` | **May be unchanged** vs prior package (Event B still PoC in DB) |
| `schedule/index.html` | Likely unchanged (hub links) |
| `_astro/*.css` | Hash **may** change — upload if referenced paths change |
| `index.html`, `about/`, etc. | Should be unchanged if only schedule row differed |

### Post-regen local grep (before upload)

```bash
# In output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html
# PASS: contains "開場 15:00" and "<Duo>" without "G-9k6"
# FAIL: contains "G-9k6" or "18:00 / 開演 19:00" on 2026.03.15 card
```

### Post-upload HTTP verify (operator — separate phase)

| URL | Check |
| --- | --- |
| `/schedule/2026-03/` | Event A card clean (section 5) |
| `/schedule/2026-07/` | Event B PoC **may still show** — expected until future cleanup |
| `/schedule/` | 200 + `scheduleDataSource=supabase` |

---

## 7. 手動 upload 対象（次フェーズ — operator approval required）

| Local source | Remote target |
| --- | --- |
| `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** | `/cms-kit-staging/gosaki-piano/` |

### Minimal upload (recommended first)

```txt
schedule/2026-03/index.html
```

Upload only if `_astro` CSS hash unchanged between old and new package (compare `index.html` link href).

### Full upload (if CSS hash changed or unsure)

```txt
public-dist/**   (entire package contents — overwrite only)
```

**Rules (G-7g):**

```txt
- Manual FTP overwrite only — no mirror --delete
- Separate explicit approval phrase
- readyForAnyFutureFtpApply: false until operator re-approves per G-7f1
- Production / sari-site: never
```

**Not required:** `admin/` (G-13c1 not in read-only admin).

---

## 8. 旧 PoC 文言が消えるべき対象

| Surface | Event | PoC strings to remove | G-13e in scope? |
| --- | --- | --- | --- |
| Public `/schedule/2026-03/` | Event A | `G-9k6`, `G-9k4`, `管理画面保存テスト`, wrong times | **Yes** |
| Staging Supabase row | Event A | (already removed G-13d1) | Done |
| Public `/schedule/2026-07/` | Event B | `CMS Kit staging`, `G-9g*` | **No** — defer G-13c2 / separate phase |
| Local admin shell | Event A | N/A — operator UI | Already verified G-13d2 |

---

## 9. Safety gates (this phase)

| Gate | Value |
| --- | --- |
| `gosakiScheduleEventAPocCleanupPublicReflectionPreflightComplete` | **true** |
| `packageRegenExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorPackageRegenExecuted` | **false** |
| `eventBTouched` | **false** |
| `commitInPhase` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.mjs
```

---

## 11. Next phases (proposed)

| Order | Phase | Purpose |
| --- | --- | --- |
| 1 | **`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen`** | Operator/Cursor: `build-gosaki-staging-admin-package.mjs` + local diff verify (no upload) |
| 2 | **`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight`** | FTP manual upload preflight (G-7g approval phrase) |
| 3 | **`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-execution`** | Operator manual upload + HTTP verify |
| 4 | **`G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-result`** | Document upload + HTTP outcome |

**Deferred:** Event B public cleanup (`G-13c2` / July card) — separate approval chain.

---

## 12. References

- [gosaki-schedule-event-a-poc-cleanup-execution-result.md](./gosaki-schedule-event-a-poc-cleanup-execution-result.md) (G-13d1)
- [gosaki-schedule-poc-visible-text-cleanup-preflight.md](./gosaki-schedule-poc-visible-text-cleanup-preflight.md) (G-13b — original public scan)
- [gosaki-public-schedule-read-verification.md](./gosaki-public-schedule-read-verification.md) (G-12b — scheduleDataSource=supabase)
- [gosaki-manual-staging-upload-package.md](./gosaki-manual-staging-upload-package.md) (G-7g)
- [gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.md](./gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.md) (G-11c4b env)
