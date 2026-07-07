# G-22i3 — Gosaki Schedule package / diff dry-run result

**Phase:** `G-22i3-gosaki-schedule-package-diff-dry-run-result`  
**Status:** **complete** — local package generation + diff review only; **no FTP / deploy / Save / DB write**  
**Date:** 2026-07-07  
**Executed at (UTC):** `2026-07-07T07:39:58Z` (MANIFEST `generatedAt`)  
**Base commit:** `442f8db` (G-22i2 public reflection planning committed)  
**Prior:** [gosaki-schedule-public-reflection-planning.md](./gosaki-schedule-public-reflection-planning.md) (G-22i2)

| Check | Status |
| --- | --- |
| Local package generation | **PASS** |
| `schedule-2026-07-008` include | **PASS** |
| `schedule-2026-03-014` exclude | **PASS** |
| `schedule-2026-09-001` exclude | **PASS** |
| `scheduleDataSource=supabase` | **PASS** |
| `safeForStaticFtp` | **true** |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / DB write / SQL mutation | **no** |

---

## Gates

```txt
gosakiSchedulePackageDiffDryRunComplete: true
phase: G-22i3-gosaki-schedule-package-diff-dry-run-result
readyForG22i4PublicOutputReview: true
readyForG22i5FtpDeployPlanning: false
readyForG22i6ActualPublicReflectionUpload: false
packageRegenExecuted: true
packageRegenScope: local-only
publicReflectionExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
productionDeployExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**G-22i3 = local package generation + diff review only.** No FTP, no Lolipop connection, no deploy.

---

## 1. Purpose (G-22i3)

Reflect staging DB `published=true` schedule state into the **local** Gosaki static package, verify include/exclude rows, and review diff scope before G-22i4 public output review.

**First local package generation** in the G-22i public reflection chain (G-22i1–G-22i2 were planning-only).

---

## 2. Preflight

| Check | Result |
| --- | --- |
| `HEAD` | `442f8db` |
| `origin/main` | `442f8db` |
| Working tree (pre-run) | **clean** |
| Port 4321 LISTEN | **none** |
| Dev server | **not started** |
| FTP / lftp / rsync / mirror / `--delete` | **not executed** |
| Pre-build package | existed — `schedule/2026-07/index.html` mtime `2026-07-02` (stale) |

---

## 3. Script inventory (read-only — confirmed before run)

| Script | Confirmed |
| --- | --- |
| `build-gosaki-staging-admin-package.mjs` | convert → verify-static-public-artifact → `manual-upload:package` → `verify:manual-upload`; **no FTP** |
| `supabase-schedule-read.mjs` | `.eq("published", true)` · anon read only · **no DB write** |
| `gosaki-staging-admin-public-env.mjs` | staging ref `kmjqppxjdnwwrtaeqjta` · blocks production ref |
| Output target | `output/manual-upload/gosaki-piano/public-dist/` (Gosaki staging local) |

---

## 4. Command executed (once)

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
```

**Result:** `G-11c4b package build: PASS` (exit 0, ~103s)

**Pipeline summary:**

```txt
convert-static-to-astro.mjs  fixtures/gosaki-piano → output/gosaki-piano-astro
  scheduleDataSource=supabase (60 events)
verify-static-public-artifact.mjs  → safeForStaticFtp: true
npm run manual-upload:package  → 27 files
npm run verify:manual-upload  → PASS
```

**Env:** read from repo `.env` / `.env.local` (not modified). `PUBLIC_SUPABASE_URL` SET · `PUBLIC_SUPABASE_ANON_KEY` SET.

---

## 5. Output paths

| Path | Role |
| --- | --- |
| `output/manual-upload/gosaki-piano/public-dist/` | **Operator upload source** (27 files) |
| `output/manual-upload/gosaki-piano/MANIFEST.json` | Package manifest · `generatedAt=2026-07-07T07:39:58.094Z` |
| `output/gosaki-piano-astro/src/data/gosaki-schedules.json` | Intermediate schedule JSON |
| `output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` | Artifact verify report |

**Package summary:** `fileCount=27` · `deployBase=/cms-kit-staging/gosaki-piano/` · `ftpAutoDeployUsed=false`

---

## 6. Include / exclude verification

### 6.1 `gosaki-schedules.json`

| Row | Result |
| --- | --- |
| `schedule-2026-07-008` | **FOUND** — `id=3e572f02-4f35-460e-80a1-3a7d15ca3fd9` · `date=2026-07-17` · `title=<>` · `published=true` · `sort_order=8` |
| `schedule-2026-03-014` | **ABSENT** |
| `schedule-2026-09-001` | **ABSENT** |

**Month counts (published in JSON):** July **14** · March **13**

### 6.2 `schedule/2026-07/index.html`

| Check | Result |
| --- | --- |
| `scheduleDataSource=supabase` | **yes** (CMS_TARGET comment) |
| `2026.07.17` date for `008` | **yes** |
| Event cards | **14** |
| File size | **14721** bytes |

### 6.3 `schedule/2026-03/index.html`

| Check | Result |
| --- | --- |
| `schedule-2026-03-014` | **absent** |
| Event cards | **13** |

### 6.4 `schedule/2026-09/index.html`

| Check | Result |
| --- | --- |
| Page exists | **no** (not in Gosaki `expectedMonths` pilot scope) |
| `schedule-2026-09-001` in JSON | **absent** |

### 6.5 Legacy stub `/2026-07/index.html` (G-9c0b)

| Check | Result |
| --- | --- |
| Event cards | **0** |
| Stub text | `Schedule page moved` + canonical link to `/schedule/2026-07/` |

---

## 7. Diff / stat review

### 7.1 Git tracked files

```txt
git status --short  → clean (output/ is gitignored)
git diff --stat     → no tracked diff from package generation
```

Package output changes are **local gitignored artifacts only** — not committed.

### 7.2 Package vs pre-build baseline

| Item | Pre-build (stale) | Post-build (G-22i3) |
| --- | --- | --- |
| `schedule/2026-07/index.html` mtime | `2026-07-02` | `2026-07-07` |
| `schedule/2026-07/index.html` size | 14721 bytes | **14721 bytes** (unchanged) |
| File count | 27 | **27** |
| CSS | prior hash unknown locally | `_astro/index.YcHrHZH4.css` |

**Note:** July HTML byte size unchanged — prior local package (Jul 2) likely already contained `008` because G-22f unpublish was **never reflected** to package. G-22i4 should compare **live staging HTTP** vs new local output to confirm sync.

### 7.3 Scope creep scan

| Area | Result |
| --- | --- |
| Unrelated month pages mass change | **not observed** — full regen refreshed all 27 files (expected) |
| `014` / `001` leaked into output | **no** |
| Production package | **not built** |
| CSS hash change vs live | **deferred to G-22i4** — compare `_astro/index.YcHrHZH4.css` to live staging |

---

## 8. Upload candidates (planning only — **not uploaded**)

Per G-14c minimal-upload pattern (confirm in G-22i4 / G-22i5):

| Priority | Local path | Remote path (G-22i6) |
| --- | --- | --- |
| **1 (primary)** | `output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html` | `/cms-kit-staging/gosaki-piano/schedule/2026-07/index.html` |
| 2 (if hub changed) | `…/schedule/index.html` | `/cms-kit-staging/gosaki-piano/schedule/index.html` |
| 3 (if CSS hash differs from live) | `…/_astro/index.YcHrHZH4.css` | `/cms-kit-staging/gosaki-piano/_astro/index.YcHrHZH4.css` |

**FTP / upload / deploy:** **not executed in G-22i3.** Actual upload requires G-22i5 planning + G-22i6 operator approval.

---

## 9. Safety (G-22i3 phase)

| Item | Status |
| --- | --- |
| package generation | **yes** — local only |
| public output write | **yes** — gitignored local paths only |
| FTP / Lolipop / FileZilla / lftp | **no** |
| deploy / workflow_dispatch | **no** |
| production build | **no** |
| Save / DB write / SQL mutation | **no** |
| rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| dev server | **not started** |
| commit / push (G-22i3) | per operator instruction |

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-22i4** | Public output review — local inspect + live staging HTTP compare |
| **G-22i5** | FTP / deploy planning — preflight doc, file list, safety checklist |
| **G-22i6** | Actual upload — operator manual ×1 + HTTP verify |

**Do not FTP until G-22i5+** with explicit operator approval.

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22i3-gosaki-schedule-package-diff-dry-run-result.mjs
```
