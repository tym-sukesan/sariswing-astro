# G-20r4 — Gosaki schedule August public reflection plan

**Phase:** `G-20r4-schedule-public-reflection-plan`  
**Status:** **complete** — planning / documentation only; **no regen / build / FTP / Save / DB write**  
**Date:** 2026-07-09  
**Base commit:** `a4d4e6d`  
**Prior:** [gosaki-schedule-august-db-insert-execution-closure.md](./gosaki-schedule-august-db-insert-execution-closure.md) (G-20r3a) · [gosaki-schedule-product-quality-policy.md](./gosaki-schedule-product-quality-policy.md) (G-20r2b)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c) · [gosaki-schedule-public-reflection-planning.md](./gosaki-schedule-public-reflection-planning.md) (G-22i2)

| Check | Status |
| --- | --- |
| Stale state inventoried | **yes** |
| DB → JSON reflection path documented | **yes** |
| Build / package / diff / QA sequence planned | **yes** |
| August route QA checklist | **yes** |
| published=false exclusion policy | **yes** |
| hold 008/018 exclusion policy | **yes** |
| FTP manual-only policy | **yes** |
| Code prerequisite (expectedMonths) identified | **yes** |
| Package regen / build / FTP | **not executed** |

---

## Gates

```txt
gosakiScheduleAugustPublicReflectionPlanComplete: true
phase: G-20r4-schedule-public-reflection-plan
baseCommit: a4d4e6d
priorPhase: G-20r3a-gosaki-schedule-august-db-insert-execution-closure
targetProject: kmjqppxjdnwwrtaeqjta
forbiddenProject: vsbvndwuajjhnzpohghh
dbTotalRowsAfter: 79
publishedRowsAfter: 74
mutationAffectedRows: 77
augustRowsAfter: 17
augustPublishedTrue: 14
augustPublishedFalse: 3
holdNotInserted: schedule-2026-08-008,schedule-2026-08-018
stagingDbAugustReflected: true
localPackageStale: true
g20r3SqlReExecution: forbidden
readyForG20r4aExpectedMonthsCodeGate: true
readyForG20r4bLocalRegenDryRun: false
readyForG20r4cPublicOutputReview: false
readyForG20r4dUploadPreflight: false
readyForG20r4eOperatorManualUpload: false
packageRegenExecuted: false
buildExecuted: false
ftpUploadExecuted: false
ftpAutoApply: forbidden
ftpUploadOperatorManualOnly: true
cursorFtpExecuted: false
ftpAiApprovalPhraseRequired: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
readyForAnyFutureFtpApply: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-20r3 / G-20r3a SQL re-execution:** **forbidden.**

**G-20r4 = planning only.** No package generation, no public output write, no FTP, no Save, no DB write, no SQL.

---

## 1. Purpose

G-20r3a で staging DB に投入済みの **2026-08 schedule 17件**（published true 14 / false 3）を、静的サイトパッケージへ安全に反映する手順を計画する。

**Reflection closes:** Staging DB (Layer A) → local `gosaki-schedules.json` + Astro `public-dist` (Layer B).  
**FTP closes:** Layer B → live host (Layer C) — **operator manual only**, separate gated phase.

---

## 2. DB state (post G-20r3a — SoT)

| Metric | Value |
| --- | --- |
| DB total `gosaki-piano` rows | **79** (= existing 62 + inserted 17) |
| Published rows | **74** (= existing published 60 + August published true 14) |
| Mutation affected rows | **77** (= shifted published 60 + inserted 17) — **not** DB total |
| Retained unpublished test rows | **2** unchanged |
| August rows in DB | **17** |
| August `published=true` / `false` | **14** / **3** |
| Hold not in DB | `schedule-2026-08-008`, `schedule-2026-08-018` |

**August `published=false` (must NOT appear in public build):**

| legacy_id | date | title |
| --- | --- | --- |
| `schedule-2026-08-007` | 2026-08-10 | `<Duo>` |
| `schedule-2026-08-009` | 2026-08-15 | `<Duo>` |
| `schedule-2026-08-013` | 2026-08-21 | `<原田茅子Quartet>` |

---

## 3. Current stale state (local artifacts — pre-G-20r4b)

Measured at planning time (`a4d4e6d`). **DB is ahead; local package is behind.**

### 3.1 Intermediate JSON

| Path | Rows | Months | 2026-08 |
| --- | --- | --- | --- |
| `output/gosaki-piano-astro-production/src/data/gosaki-schedules.json` | **60** | 03–07 | **0** |
| `output/gosaki-piano-astro/src/data/gosaki-schedules.json` | **60** (same era) | 03–07 | **0** |

### 3.2 public-dist (production profile package)

| Path / check | State |
| --- | --- |
| `output/manual-upload/gosaki-piano-production/public-dist/schedule/` | **2026-03 … 2026-07** only · **no `2026-08/`** |
| Legacy root dirs `/2026-03/` … `/2026-07/` | present |
| Legacy `/2026-08/` | **absent** |
| `sitemap-0.xml` `2026-08` entries | **0** |

### 3.3 Staging profile package

| Path | State |
| --- | --- |
| `output/manual-upload/gosaki-piano/public-dist/` | Same era — **no August** (verify in G-20r4b) |

### 3.4 Gap summary

```txt
Staging DB:     17 August rows live (14 anon-visible)
Local JSON:     0 August rows
public-dist:    no /schedule/2026-08/ · no /2026-08/ legacy stub · sitemap missing August
Live staging:   stale until operator manual upload (G-20r4e)
Production cutover: separate track · G-20j HOLD unchanged
```

---

## 4. Public reflection — definition

Per G-14c / G-22i2:

| Property | Value |
| --- | --- |
| DB write? | **no** — read-only SELECT at build (anon key) |
| Filter | `.eq("published", true)` + canonical `source_route` |
| `schedule_months` | **read-only derived** — do not write |
| FTP auto-apply? | **forbidden** (`readyForAnyFutureFtpApply: false`) |
| Production DNS cutover? | **out of scope** — G-20j HOLD |

**Three layers:**

```txt
Layer A — Staging DB (SoT for CMS writes)
  kmjqppxjdnwwrtaeqjta · schedules.site_slug = gosaki-piano

Layer B — Local static package (reflection output)
  staging:    output/manual-upload/gosaki-piano/public-dist/
  production: output/manual-upload/gosaki-piano-production/public-dist/

Layer C — Live host (FTP target — operator manual only)
  staging:    https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
  production: https://www.gosaki-piano.com/ (cutover HOLD)
```

---

## 5. Code prerequisite — expectedMonths gate (G-20r4a)

**Blocker:** `scripts/lib/supabase-schedule-read.mjs` currently filters:

```javascript
expectedMonths: ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07"],
```

August `published=true` rows in DB are **excluded** until `2026-08` is added.

| Gate | Action | Phase |
| --- | --- | --- |
| **G-20r4a** | Add `"2026-08"` to `GOSAKI_SCHEDULE_SITE_CONFIG.expectedMonths` | code change · no regen |
| **G-20r4a** | Legacy stub `/2026-08/` — fixture has no `2026-08.html`; extend data-driven path to emit G-9c0b stub from `bundle.months` (or add minimal fixture) | code change |
| **G-20r4a** | Unit / verifier update for expectedMonths | verify only |

**Do not run regen (G-20r4b) until G-20r4a is merged.**

---

## 6. DB → `gosaki-schedules.json` reflection path

### 6.1 Read path (no new export script)

Build-time read only — **no separate SQL export step**:

```txt
convert-static-to-astro.mjs
  → loadGosakiScheduleDataForBuild()
  → loadScheduleRowsFromSupabase()  [anon · published=true only]
  → filter by expectedMonths + canonical source_route
  → applyGosakiScheduleDataPages()
  → writes output/.../src/data/gosaki-schedules.json
```

**Env (repo `.env` / `.env.local`):**

- `PUBLIC_SUPABASE_URL` → `kmjqppxjdnwwrtaeqjta`
- `PUBLIC_SUPABASE_ANON_KEY` — staging anon only
- **No `service_role`**

### 6.2 Expected JSON after regen (G-20r4b target)

| Check | Expected |
| --- | --- |
| Total rows in `gosaki-schedules.json` | **74** (published only) |
| August rows | **14** (not 17) |
| August `published=false` legacy_ids | **absent** — `007`, `009`, `013` |
| Hold legacy_ids | **absent** — `008`, `018` |
| Pre-existing test rows | `schedule-2026-03-014`, `schedule-2026-09-001` **absent** |
| `scheduleDataSource` marker | `supabase` in generated HTML |
| Month list in hub | includes **2026-08** link |

### 6.3 Pre-regen read-only verification (operator / G-20r4b preflight)

Staging SQL Editor **SELECT only** (optional sanity — not required for G-20r4 plan):

```sql
-- Anon-visible August count
SELECT count(*) FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-08' AND published = true;
-- Expected: 14
```

**Cursor / G-20r4:** do not execute SQL.

---

## 7. Build / package / diff / QA / upload sequence

### 7.1 Phase chain

| Order | Phase | Scope | Risk | G-20r4 |
| --- | --- | --- | --- | --- |
| 1 | **G-20r4** | Reflection **plan** (this doc) | none | **yes** |
| 2 | **G-20r4a** | `expectedMonths` + legacy stub code gate | low | **next** |
| 3 | **G-20r4b** | Local regen dry-run (staging profile first) | medium | no |
| 4 | **G-20r4c** | Public output review + August QA checklist | medium | no |
| 5 | **G-20r4d** | Upload preflight doc (file list · remote path) | high | no |
| 6 | **G-20r4e** | Operator manual upload ×1 + HTTP verify | **high** | no |
| 7 | **G-20r4f** (optional) | Production profile regen + diff (no production deploy) | medium | no |

### 7.2 Recommended regen command (G-20r4b — NOT executed in G-20r4)

**Staging profile first** (lower risk · matches G-22i pattern):

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline (automatic when executed):**

```txt
1. convert-static-to-astro.mjs
     fixtures/gosaki-piano → output/gosaki-piano-astro
     schedule: loadGosakiScheduleDataForBuild → supabase (anon)
2. astro build
3. verify-static-public-artifact.mjs → safeForStaticFtp gate
4. npm run manual-upload:package
     → output/manual-upload/gosaki-piano/
5. npm run verify:manual-upload
```

**Production profile** (client-preview package — separate phase G-20r4f):

```bash
node scripts/build-gosaki-production-package.mjs
# → output/manual-upload/gosaki-piano-production/
```

**G-20j production upload / DNS cutover:** remains **HOLD** — regen ≠ deploy.

### 7.3 Diff review (G-20r4b / G-20r4c)

Compare post-regen vs stale baseline:

| Artifact | Diff focus |
| --- | --- |
| `gosaki-schedules.json` | 60 → **74** rows · +14 August published |
| `schedule/index.html` | hub lists **2026-08** month link |
| `schedule/2026-08/index.html` | **new** · 14 event cards |
| `2026-08/index.html` | **new** legacy stub · canonical → `/schedule/2026-08/` |
| `sitemap-0.xml` | +`/schedule/2026-08/` · **no** `/2026-08/` (G-9c0b) |
| Other months 03–07 | content unchanged (sort_order display order may shift) |
| `_astro/*.css` | hash may change — **full upload** if CSS changes |

### 7.4 Post-regen local verify

```bash
npm run verify:manual-upload
node scripts/verify-static-public-artifact.mjs  # safeForStaticFtp: true
```

---

## 8. QA checklist — August routes (G-20r4c)

### 8.1 Canonical routes

| Route | Expected after reflection |
| --- | --- |
| `/schedule/` | Hub includes **2026-08** month link · `scheduleDataSource=supabase` |
| `/schedule/2026-08/` | **14** event cards · sorted by date / sort_order |
| `/schedule/2026-03/` … `/2026-07/` | Unchanged event counts (14 July etc.) unless sort display order shifted |

### 8.2 Legacy route

| Route | Expected |
| --- | --- |
| `/2026-08/` | G-9c0b stub · `noindex,follow` · canonical → `/schedule/2026-08/` · **no event cards** |
| `/2026-03/` … `/2026-07/` | Existing stubs unchanged |

### 8.3 Sitemap

| Check | Expected |
| --- | --- |
| `sitemap-0.xml` contains `/schedule/2026-08/` | **yes** (staging: global noindex still applies) |
| `sitemap-0.xml` contains `/2026-08/` legacy | **no** |
| August hold routes | **absent** |

### 8.4 Exclusion checks (must PASS)

| Item | Must be absent from public HTML / JSON |
| --- | --- |
| `schedule-2026-08-007` | yes (`published=false`) |
| `schedule-2026-08-009` | yes |
| `schedule-2026-08-013` | yes |
| `schedule-2026-08-008` | yes (hold · not in DB) |
| `schedule-2026-08-018` | yes (hold · not in DB) |
| `schedule-2026-03-014` | yes (test row) |
| `schedule-2026-09-001` | yes (test row) |

### 8.5 Content spot-checks (published August)

| legacy_id | date | title | visible? |
| --- | --- | --- | --- |
| `schedule-2026-08-001` | 2026-08-01 | `<地ビールフェスト2026>` | **yes** |
| `schedule-2026-08-014` | 2026-08-23 | `<子どもと一緒にジャズライブ>` | **yes** (dual-session description) |
| `schedule-2026-08-019` | 2026-08-30 | `<KHACHA BAND>` | **yes** |

### 8.6 HTTP verify (G-20r4e — live staging after upload)

```txt
GET .../schedule/2026-08/           → 200 · 14 cards
GET .../schedule/                   → 200 · August link present
GET .../2026-08/                      → 200 · stub only
GET .../schedule/2026-08/ (grep 007)  → absent
```

---

## 9. FTP / upload policy

FTP upload は **戸山さん（operator）が人間として手動実行**する運用。**AI / Cursor は FTP upload を実行しない。** AI 向け承認文言は不要 — 手動実行前チェックリストで代替する。

### 9.1 Rules

| Rule | Value |
| --- | --- |
| Upload executor | **operator / manual only** — 戸山さん |
| AI / Cursor FTP | **never** — 実行しない |
| Upload tool | **FileZilla / Lolipop GUI** の手動アップロードのみ |
| Command-line FTP | **forbidden** |
| `mirror --delete` / sync delete | **forbidden** |
| `workflow_dispatch` | **forbidden** |
| `readyForAnyFutureFtpApply` | **false** (G-7f1) |
| AI approval phrase | **not required** — 本運用では不要 |

### 9.2 Operator manual upload checklist (G-20r4d / G-20r4e)

G-20r4d preflight doc に以下を記載し、**operator が手動実行前に確認**する:

| # | Checklist item | Example / note |
| --- | --- | --- |
| 1 | **Target package** | `output/manual-upload/gosaki-piano/public-dist/`（staging 初回） |
| 2 | **Remote path** | `/cms-kit-staging/gosaki-piano/` — **not** `/` · **not** `.` |
| 3 | **Upload scope** | August 反映時は `schedule/2026-08/` · `2026-08/` · `schedule/index.html` · `sitemap-0.xml` · `_astro/`（CSS hash 変更時は **full public-dist** 推奨） |
| 4 | **No delete / no mirror** | リモート削除・`--delete`・mirror sync delete **禁止** |
| 5 | **Blocked paths** | root `/` · `.` · `./` · empty remote path — **STOP** |
| 6 | **Production path** | **TBD** · G-20j HOLD (DNS/SSL/MX) — staging 完了まで production 触らない |
| 7 | **Success criteria** | HTTP 200 on `/schedule/2026-08/` · 14 cards · August link on hub · `007`/`009`/`013` absent |
| 8 | **Failure criteria** | 404 on new routes · wrong card count · test/hold legacy_ids visible · layout/CSS broken → **stop · no blind retry** |
| 9 | **Rollback note** | 直前の `public-dist` バックアップまたは前回 MANIFEST を参照して差し戻し方針を記録 |

**G-20r4d preflight must document:** local path, remote path, file list, upload scope, blocked paths, `--delete: no`, success/failure criteria, rollback note.

---

## 10. Execution gates (before G-20r4b)

| # | Gate | Status |
| --- | --- | --- |
| 1 | G-20r3a DB INSERT closed · SQL re-run forbidden | **met** |
| 2 | Staging DB has 17 August rows · 14 published | **met** |
| 3 | G-20r4 plan complete (this doc) | **met** |
| 4 | `expectedMonths` includes `2026-08` | **not met** → G-20r4a |
| 5 | Legacy `/2026-08/` stub generation path | **not met** → G-20r4a |
| 6 | `.env` staging anon key present | operator verify at G-20r4b |
| 7 | G-20r4d operator manual upload checklist complete | required before G-20r4e only |

---

## 11. Protected / out of scope

| Item | Rule |
| --- | --- |
| G-20r3 SQL re-execution | **forbidden** |
| `schedule_months` table | **no write** |
| Sariswing production Supabase | **never** `vsbvndwuajjhnzpohghh` |
| `/admin` routes | **do not modify** |
| hold #8 / #18 DB INSERT | deferred — separate future slice |
| August `published=false` 3件 | remain false until client confirms (G-20r2c optional) |
| Production DNS cutover | G-20j HOLD |

---

## 12. 今回（G-20r4 plan phase）実行していないこと

| Operation | Executed |
| --- | --- |
| SQL execution | **no** |
| DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy | **no** |
| network access | **no** |
| commit / push | **no** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-public-reflection-plan.mjs
```
