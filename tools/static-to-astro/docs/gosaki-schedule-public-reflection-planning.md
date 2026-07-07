# G-22i2 — Gosaki Schedule public reflection planning

**Phase:** `G-22i2-gosaki-schedule-public-reflection-planning`  
**Status:** **complete** — planning / documentation only; **no package regen / public output write / FTP / Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `f093e97` (G-22i1 release readiness review committed)  
**Prior:** [gosaki-schedule-p0-release-readiness-review.md](./gosaki-schedule-p0-release-readiness-review.md) (G-22i1)  
**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c)

| Check | Status |
| --- | --- |
| Public reflection definition documented | **yes** |
| Include / exclude rows documented | **yes** |
| Expected output diff documented | **yes** |
| Package / diff dry-run policy (G-22i3) | **yes** |
| FTP planning policy (G-22i5+) | **yes** |
| Root delete / `--delete` prevention gates | **yes** |
| Package regen / FTP / deploy | **not executed** |
| Cursor Save / DB write / SQL mutation | **no** |

---

## Gates

```txt
gosakiSchedulePublicReflectionPlanningComplete: true
phase: G-22i2-gosaki-schedule-public-reflection-planning
readyForG22i3PackageDiffDryRun: true
readyForG22i4PublicOutputReview: false
readyForG22i5FtpDeployPlanning: false
readyForG22i6ActualPublicReflectionUpload: false
publicReflectionExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
productionDeployExecuted: false
physicalDeleteImplemented: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-22i2 = planning only.** No package generation, no public output write, no FTP, no Save, no DB write, no SQL mutation.

---

## 1. Purpose (G-22i2)

Plan how to reflect the current **staging DB** Gosaki Schedule state into **static public output** safely, before entering high-risk phases (package regen, diff review, FTP upload).

**Prerequisite (closed):**

- G-22i1 P0 release readiness review — complete
- G-22h republish UPDATE chain — complete (`schedule-2026-07-008` `published=true`)
- G-22d / G-22e test rows remain `published=false`

**This phase does not execute reflection.** It defines scope, paths, safety gates, and the next phases G-22i3–G-22i6.

---

## 2. Public reflection — definition

**Public reflection** means:

> Read `published=true` schedule rows from staging Supabase (anon key) and regenerate static HTML so the **local package** matches the DB.

| Property | Value |
| --- | --- |
| DB write? | **no** — read-only SELECT at build time |
| FTP / deploy? | **no** — separate high-risk phase |
| Same as package generation? | **related but distinct** — regen **produces** the package; reflection **planning** is the decision of *what* should change and *how* to verify |
| Live site changes without FTP? | **no** — Lolipop staging URL stays stale until operator manual upload |

**Three layers:**

```txt
Layer A — Staging DB (SoT for CMS writes)
  kmjqppxjdnwwrtaeqjta · schedules.site_slug = gosaki-piano

Layer B — Local static package (reflection output)
  tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/

Layer C — Live staging host (FTP target — not auto-applied)
  https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
```

Reflection closes the gap **A → B**. FTP closes **B → C**. Production cutover is a **separate** future track (`build-gosaki-production-package.mjs` — **not** in G-22i scope).

---

## 3. Reflection targets — include / exclude

### 3.1 Row policy

| Row | id | published | Public eligible? | Static output |
| --- | --- | --- | --- | --- |
| **`schedule-2026-07-008`** | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **`true`** | **yes** | **include** on `/schedule/2026-07/` |
| **`schedule-2026-03-014`** | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | **`false`** | **no** | **exclude** (duplicate test row) |
| **`schedule-2026-09-001`** | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | **`false`** | **no** | **exclude** (new event test row) |
| Other `gosaki-piano` rows | — | per DB `published` | `published=true` only | existing generator rules |

### 3.2 Primary row — `schedule-2026-07-008`

| Field | Value |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-07-17` |
| `title` | `<>` |
| `published` | **`true`** (G-22h6b republish) |
| `updated_at` | `2026-07-07T02:30:32.260326+00:00` |
| `source_route` | `/schedule/2026-07/` |
| `source_file` | `schedule-2026-07.html` (per prior unpublish/republish docs) |

### 3.3 Anon read filter (build pipeline)

`tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs`:

- `.eq("site_slug", siteSlug)`
- `.eq("published", true)` — RLS `schedules_public_select` aligns
- `isCanonicalScheduleSourceRoute(source_route)` — must match `/schedule/YYYY-MM/`
- Gosaki `expectedMonths`: `2026-03` … `2026-07` (September `001` excluded by month scope even if published)

**Admin authenticated read** sees unpublished rows; **public build** does not.

### 3.4 Test rows — must stay excluded

| Row | Why excluded |
| --- | --- |
| `schedule-2026-03-014` | `published=false` · G-22d duplicate INSERT test — do not reflect |
| `schedule-2026-09-001` | `published=false` · G-22e new event INSERT test — do not reflect |

**G-22i3 verification:** after local regen, grep `gosaki-schedules.json` / month HTML — `014` and `001` must be **absent**; `008` must be **present** on July page.

---

## 4. Expected output diff (planning — not executed)

### 4.1 Affected routes

| Route | Role | Expected change |
| --- | --- | --- |
| `/schedule/2026-07/` | **Canonical month page** | Event card for `008` **present** (republish) |
| `/schedule/` | Hub | Month link list — verify count unchanged if July already listed |
| `/2026-07/` | Legacy stub | Canonical pointer only — **no** event cards (G-9c0b policy) |
| `/schedule/2026-03/` | March month | **no** `014` card (published=false) |
| `/schedule/2026-09/` | — | Not in `expectedMonths` — N/A for current Gosaki pilot |

### 4.2 Staleness note (G-22f / G-22h without reflection)

| Event | DB | Live staging (pre-G-22i6) |
| --- | --- | --- |
| G-22f unpublish | `008` `published=false` | **not reflected** — live may still show 008 |
| G-22h6b republish | `008` `published=true` | **not reflected** — live may match DB by accident if unpublish was never reflected |

**G-22i3 must diff local regen vs live staging** — do not assume live is correct. Compare:

- `output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html` (post-regen)
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-07/` (live)

### 4.3 Intermediate artifacts (G-22i3 inspect only)

| Path | Purpose |
| --- | --- |
| `output/gosaki-piano-astro/src/data/gosaki-schedules.json` | Normalized schedule JSON from Supabase |
| `output/static-public/gosaki-piano/public-dist/` | Verified static-public artifact |
| `output/manual-upload/gosaki-piano/public-dist/` | Operator upload package |
| `output/manual-upload/gosaki-piano/MANIFEST.json` | File manifest |
| `output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` | `safeForStaticFtp` gate |

### 4.4 Content markers to verify (G-22i4)

- `scheduleDataSource=supabase` in target month HTML
- `legacy_id` / date `2026-07-17` / title `<>` for `008` (if rendered in HTML)
- No PoC / test markers from G-9g / G-13c chains on in-scope pages
- `deployBase=/cms-kit-staging/gosaki-piano/` · staging `noindex`

---

## 5. Existing scripts / output paths (read-only inventory)

### 5.1 Staging package build entry

```bash
# G-22i3+ only — NOT executed in G-22i2
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Pipeline (automatic when executed):**

```txt
1. convert-static-to-astro.mjs
     fixtures/gosaki-piano → output/gosaki-piano-astro
     schedule read: loadGosakiScheduleDataForBuild → supabase-schedule-read.mjs (anon)
2. verify-static-public-artifact.mjs → STATIC_PUBLIC_ARTIFACT_REPORT.md
3. npm run manual-upload:package
     → output/manual-upload/gosaki-piano/
4. npm run verify:manual-upload
```

**Env:** reads repo `.env` / `.env.local` — staging `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` only. **No `service_role`.**

### 5.2 Package paths

| Path | Role |
| --- | --- |
| `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` | **Operator upload source** (gitignored) |
| `tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json` | Package manifest |
| `tools/static-to-astro/output/static-public/gosaki-piano/public-dist/` | Pre-package verified artifact |

### 5.3 Route / canonical policy

Doc: `gosaki-schedule-legacy-month-route-stub.md` (G-9c0b)

| Route | Indexable | Event cards |
| --- | --- | --- |
| `/schedule/YYYY-MM/` | yes (staging: global noindex) | **yes** |
| `/YYYY-MM/` | no (`noindex,follow`) | **no** — stub + canonical link only |

`source_route` in DB remains `/schedule/YYYY-MM/` — not legacy `/YYYY-MM/`.

### 5.4 Production path — out of scope

| Script | Target | G-22i2 |
| --- | --- | --- |
| `build-gosaki-production-package.mjs` | `www.gosaki-piano.com` / deployBase `/` | **do not run** |
| `manual-upload:package:gosaki-production` | `output/manual-upload/gosaki-piano-production/` | **do not run** |

**Sariswing production** (`vsbvndwuajjhnzpohghh`) — **never**.

---

## 6. Safety gate chain

| Order | Phase | Scope | Risk | Executed? |
| --- | --- | --- | --- | --- |
| 1 | **G-22i1** | P0 readiness review | none | **yes** |
| 2 | **G-22i2** | Public reflection **planning** (this doc) | none | **yes** |
| 3 | **G-22i3** | Package / diff **dry-run** (local regen + diff only) | medium | **no** |
| 4 | **G-22i4** | Public output **review** (local + optional live compare) | medium | **no** |
| 5 | **G-22i5** | FTP / deploy **planning** (preflight doc) | high | **no** |
| 6 | **G-22i6** | Actual reflection upload (operator manual ×1) | **high** | **no** |

**Carry-forward rules:**

- No Save re-execution on closed slices (G-22d / G-22e / G-22f / G-22h)
- `schedule_months` — read-only derived; **no write**
- `readyForAnyFutureFtpApply: false` until G-7f1 preflight + explicit operator approval
- Cursor does not click Save / FTP / workflow_dispatch

---

## 7. G-22i3 — package / diff dry-run policy

**Goal:** Local output + diff confirmation only. **No FTP. No deploy.**

### 7.1 Pre-regen read-only checks

| # | Check |
| --- | --- |
| 1 | Supabase host = `kmjqppxjdnwwrtaeqjta` — **STOP** if `vsbvndwuajjhnzpohghh` |
| 2 | `schedule-2026-07-008` `published=true` · `updated_at=2026-07-07T02:30:32.260326+00:00` |
| 3 | `014` / `001` remain `published=false` |
| 4 | No open write-armed dev server required |

### 7.2 Regen (G-22i3 execution phase)

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

### 7.3 Post-regen diff checks

| # | Assertion |
| --- | --- |
| 1 | Build exits `G-11c4b package build: PASS` |
| 2 | `safeForStaticFtp: true` in artifact report |
| 3 | `verify:manual-upload` **PASS** |
| 4 | `gosaki-schedules.json` contains `schedule-2026-07-008` |
| 5 | `gosaki-schedules.json` does **not** contain `schedule-2026-03-014` or `schedule-2026-09-001` |
| 6 | `schedule/2026-07/index.html` — `008` event present |
| 7 | `schedule/2026-03/index.html` — no `014` card |
| 8 | `scheduleDataSource=supabase` on target month page |
| 9 | CSS `_astro/*.css` hash vs live — decide minimal vs `_astro` upload in G-22i5 |
| 10 | Unrelated month pages — no unexpected diff (scope creep scan) |

### 7.4 Explicit non-goals (G-22i3)

- FTP upload
- `deploy-public-dist-ftp.mjs --apply`
- GitHub `workflow_dispatch`
- Production package build
- DB write / Save / rollback SQL

---

## 8. G-22i5+ — FTP / deploy planning policy

**Actual FTP/upload is deferred** to G-22i5 planning and G-22i6 execution.

### 8.1 Destination (staging only)

| Item | Value |
| --- | --- |
| Host | Lolipop (operator credentials — not in repo) |
| Remote base | `/cms-kit-staging/gosaki-piano/` |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |

### 8.2 Upload method

**Preferred:** operator manual overwrite via FileZilla / Lolipop GUI (G-7g pattern).

**Not preferred:** `deploy-public-dist-ftp.mjs --apply` — suspended after G-7f root delete incident.

### 8.3 Root delete / `--delete` accident prevention (mandatory)

Reference: `ftp-deploy-root-delete-incident-and-safety-hardening.md` (G-7f / G-7f1)

| Gate | Rule |
| --- | --- |
| FTP auto `--apply` | **suspended** — `readyForAnyFutureFtpApply: false` |
| `mirror --delete` | **forbidden** without explicit operator approval + preflight |
| Remote path | Must be `/cms-kit-staging/gosaki-piano/` — **never** `/`, `.`, empty |
| `cd` failure | Must **abort** — no continue-on-fail |
| Approval phrase | `承認します。この手動アップロードを1回だけ実行してください。` |
| Preflight doc | Local path · remote path · file list · rollback note · blocked paths |
| Sariswing / 妻サイト本番 | **never touch** |
| Production Supabase | **never** `vsbvndwuajjhnzpohghh` |

### 8.4 Expected minimal upload (planning estimate — confirm in G-22i3)

Prior Gosaki schedule reflections (G-13e / G-13c2e / G-14b1e) used **1-file minimal upload** when CSS hash unchanged:

```txt
Local:  output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html
Remote: /cms-kit-staging/gosaki-piano/schedule/2026-07/index.html
```

Add `schedule/index.html` if hub month counts/links change. Add `_astro/` only if CSS hash changes.

### 8.5 Post-upload (G-22i6)

- HTTP verify `schedule/2026-07/` → **200**
- Content spot-check: `008` visible · `014`/`001` absent
- Result doc + closure
- **No blind retry** on failure — stop and investigate

---

## 9. Deferred / out of scope

| Item | Status |
| --- | --- |
| Physical DELETE | **not implemented** — separate future phase |
| Production deploy / `gosaki-piano-production` package | **not in G-22i chain** |
| `schedule_months` write | **forbidden** |
| RLS / GRANT / REVOKE changes | **none** |
| UX polish (Save gate copy) | optional — does not block G-22i3 |

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-22i3** | Package / diff dry-run — local regen + diff verify |
| **G-22i4** | Public output review — operator inspect local + live compare |
| **G-22i5** | FTP / deploy planning — preflight doc, file list, safety checklist |
| **G-22i6** | Actual public reflection upload — operator manual ×1 + HTTP verify |

---

## 11. Safety (G-22i2 phase)

| Item | Status |
| --- | --- |
| package generation | **no** |
| public output write | **no** |
| FTP / upload / deploy | **no** |
| production build | **no** |
| Save / Save re-execution | **no** |
| DB write / SQL mutation | **no** |
| rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| dev server | **not started** |
| commit / push (G-22i2) | per operator instruction |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22i2-gosaki-schedule-public-reflection-planning.mjs
```
