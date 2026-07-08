# G-20p — Gosaki production package staleness review

**Phase:** `G-20p-gosaki-production-package-staleness-review`  
**Status:** **complete** — read-only / local artifact + doc review only  
**Date:** 2026-07-08  
**Base commit:** `ba4faa2`  
**Prior:** [gosaki-production-cutover-gap-refresh.md](./gosaki-production-cutover-gap-refresh.md) · [gosaki-production-package-admin-exclusion-result.md](./gosaki-production-package-admin-exclusion-result.md) (G-20i3) · [gosaki-schedule-p0-overall-closure.md](./gosaki-schedule-p0-overall-closure.md) (G-22j1)

| Check | Status |
| --- | --- |
| Production package artifact read | **yes** |
| MANIFEST.json read | **yes** |
| Staging package (G-22i3) cross-check | **yes** (read-only compare) |
| Schedule JSON / HTML compared | **yes** |
| Upload verdict recorded | **yes** |
| Build / package regen / FTP | **not executed** |

---

## Gates

```txt
gosakiProductionPackageStalenessReviewComplete: true
phase: G-20p-gosaki-production-package-staleness-review
baseCommit: ba4faa2
productionPackagePath: tools/static-to-astro/output/manual-upload/gosaki-piano-production/
manifestGeneratedAt: 2026-07-01T17:16:34.661Z
publicDistFileCount: 26
adminExcluded: true
scheduleContentStaleVsG22j: false
staticConverterChangedSinceG20i3: false
uploadVerdictContent: GO
uploadVerdictExecution: HOLD
packageRegenRequired: false
readyForG20jUploadPreflightRefresh: true
readyForG20qPackageRegenPlanning: false
dbWriteExecuted: false
saveExecuted: false
packageRegenExecuted: false
buildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
productionChangeExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. G-20p の目的

Gap refresh (`gosaki-production-cutover-gap-refresh.md`) は G-20i3 production package が G-22j Schedule CMS P0 より古い**可能性**を P0 gap として記録した。本フェーズはその仮説を **read-only / local** で検証し、G-20j 前に package regen が必須かどうかを判断する。

**今回やらないこと:** build · package regen · DB write · Save · FTP · deploy · production 変更。

---

## 2. 確認した artifact / docs

### Docs (read-only)

| Doc | Role |
| --- | --- |
| `gosaki-production-cutover-gap-refresh.md` | Prior gap hypothesis |
| `gosaki-production-package-build-result.md` | G-20h2 SEO verify baseline |
| `gosaki-production-package-admin-exclusion-result.md` | G-20i3 26-file package |
| `gosaki-production-upload-preflight.md` | G-20i 27→26 file manifest |
| `gosaki-production-upload-finalization-admin-and-remote-path.md` | G-20i2 STOP gates |
| `gosaki-schedule-cms-p0-release-note.md` | P0 operator summary |
| `gosaki-schedule-p0-overall-closure.md` | G-22j closure map |
| `gosaki-schedule-package-diff-dry-run-result.md` | G-22i3 staging regen reference |
| `gosaki-schedule-public-output-review-result.md` | G-22i4 byte-identical conclusion |
| `gosaki-completion-audit.md` | Prior inventory |

### Local artifacts (read-only)

| Path | Role |
| --- | --- |
| `output/manual-upload/gosaki-piano-production/` | **Production upload package** (G-20i3) |
| `output/manual-upload/gosaki-piano-production/MANIFEST.json` | Package manifest |
| `output/manual-upload/gosaki-piano-production/public-dist/` | 26 upload files |
| `output/manual-upload/gosaki-piano/` | Staging package (G-22i3, 2026-07-07) — compare baseline |
| `output/gosaki-piano-astro-production/src/data/gosaki-schedules.json` | Production convert intermediate |
| `output/gosaki-piano-astro/src/data/gosaki-schedules.json` | Staging convert intermediate |

---

## 3. 既存 package の所在

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| public-dist dir | `.../gosaki-piano-production/public-dist/` |
| MANIFEST.json | **present** |
| README-UPLOAD.md | present |
| CHECKLIST.md | present (⚠ staging-oriented copy — see §10) |
| Zip | `gosaki-piano-manual-upload.zip` (653108 bytes) |
| Git tracked | **no** (`output/` gitignored) |
| On-disk mtime | `2026-07-02 02:16` (local FS) |

---

## 4. Package 作成時点

| Item | Value |
| --- | --- |
| Phase | **G-20i3** — admin exclusion rebuild |
| Prior | G-20h2 initial production build |
| Base commit (G-20i3 doc) | `d34646d` |
| MANIFEST `generatedAt` | **`2026-07-01T17:16:34.661Z`** |
| MANIFEST `phase` | `G-8c-wix-static-export-responsive-baseline-generalization` |
| `deployBase` | `/` |
| `stagingUrl` (canonical host) | `https://www.gosaki-piano.com/` |
| `fileCount` | **26** |
| `includeGosakiReadOnlyAdmin` | `false` |
| `adminExcludedFromPackage` | `true` |
| `safeForStaticFtp` | `true` |
| `ftpAutoDeployUsed` | `false` |

### 4.1 Upload 対象ファイル一覧（26 files — verified on disk）

```txt
index.html
robots.txt
sitemap-index.xml
sitemap-0.xml
2026-03/index.html
2026-04/index.html
2026-05/index.html
2026-06/index.html
2026-07/index.html
_astro/index.YcHrHZH4.css
_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js
about/index.html
assets/about/bands/careless_hornets.jpg
assets/about/bands/caribbean_function.jpg
assets/about/bands/gosakirikako_trio.jpg
assets/about/bands/kikioto.jpg
assets/about/bands/onomatopoeia.jpg
contact/index.html
discography/index.html
link/index.html
schedule/index.html
schedule/2026-03/index.html
schedule/2026-04/index.html
schedule/2026-05/index.html
schedule/2026-06/index.html
schedule/2026-07/index.html
```

**`admin/`:** **absent** (verified).  
**`/profile/`:** Gosaki に該当ルートなし — プロフィールは **`/about/`**。

---

## 5. 現在状態との差分

### 5.1 Timeline

| Milestone | Date | Note |
| --- | --- | --- |
| G-20i3 production package build | 2026-07-01 | 26 files, admin excluded |
| G-22d–G-22h Schedule P0 Saves | 2026-07-02 – 07-07 | dup / new / unpublish / republish |
| G-22i3 staging package regen | 2026-07-07 | Local staging `gosaki-piano` package refreshed |
| G-22i4 review | 2026-07-07 | Local vs live staging **byte-identical** — no upload |
| G-22j1/j2 P0 closure | 2026-07-07 | Chain closed |
| G-20p review | 2026-07-08 | This doc |

### 5.2 Schedule data (published rows)

| Check | Production package | G-22i3 staging package | Match |
| --- | --- | --- | --- |
| `gosaki-schedules.json` MD5 | `f66f51f8e3c164072fdf21cbd33d1bb9` | same | **yes** |
| `schedule-2026-07-008` in JSON | present · `published=true` · `2026-07-17` | same | **yes** |
| `schedule-2026-03-014` in JSON | **absent** | **absent** | **yes** |
| `schedule-2026-09-001` in JSON | **absent** | **absent** | **yes** |
| Published count Mar–Jul | 13 / 10 / 12 / 11 / **14** | same | **yes** |
| July event cards in HTML | **14** | **14** | **yes** |
| `2026.07.17` in July HTML | **yes** | **yes** | **yes** |
| PoC / `（テスト）` / `[CMS Kit staging]` | **absent** | **absent** | **yes** |

### 5.3 HTML body (deploy-profile-normalized compare)

Normalization: strip `noindex` meta · rewrite staging deployBase paths to production host.

| Route | Normalized body match (prod vs staging) |
| --- | --- |
| `/schedule/` hub | **MATCH** |
| `/schedule/2026-03/` … `/schedule/2026-07/` | **MATCH** (all 5) |
| `/2026-03/` … `/2026-07/` legacy stubs | **MATCH** (all 5) |
| `/` `/about/` `/contact/` `/discography/` `/link/` | DIFF — **expected** (canonical host `www.gosaki-piano.com` vs `yskcreate.weblike.jp` in staging) |

**Interpretation:** Production package schedule + legacy stub **body content** matches current published DB state. Primary route diffs are **deploy profile**, not stale content.

### 5.4 Source code since G-20i3

`git log d34646d..ba4faa2` on static production build paths:

| Changed since G-20i3 | Effect on production HTML |
| --- | --- |
| `4a91061` admin exclusion (G-20i3 itself) | Already reflected in package |
| `convert-static-to-astro.mjs` / gosaki overrides / schedule-pages | **no commits** |
| G-22 admin shell commits | **admin UI only** — not in production package |

**Conclusion:** No static converter change since G-20i3 that would invalidate production HTML.

### 5.5 Assets

| Asset | Production | Staging (G-22i3) | Match |
| --- | --- | --- | --- |
| `_astro/index.YcHrHZH4.css` MD5 | `d60916df96bae1fc2b4eefeb1f91f572` | same | **yes** |

---

## 6. Route / canonical / SEO staleness

| Route | Production package state | Stale? |
| --- | --- | --- |
| `/` | canonical + og:url = `https://www.gosaki-piano.com/` · **no noindex** | **no** |
| `/about/` (profile equivalent) | production host · indexable | **no** |
| `/schedule/` | hub generated · prod paths | **no** |
| `/schedule/YYYY-MM/` | canonical `/schedule/YYYY-MM/` · 14/13/10/12/11 cards | **no** |
| `/YYYY-MM/` legacy stub | `noindex,follow` · canonical → `/schedule/YYYY-MM/` on **www** | **no** |
| `/discography/` | `discographyDataSource=supabase` · no test titles | **no** |
| `/contact/` | HubSpot embed page present | **no** (E2E on prod domain = post-deploy) |
| `/link/` | present | **no** |
| `robots.txt` | `Allow: /` + sitemap line to `www.gosaki-piano.com` | **no** |
| `sitemap-index.xml` | production host | **no** |
| `sitemap-0.xml` | production URLs | **no** |
| OGP | `og:url` on prod host for primary routes | **no** |
| noindex → index | Primary routes **indexable** in package | **correct for cutover** |

---

## 7. Schedule CMS P0 後の影響

| G-22j change | Impact on G-20i3 production package |
| --- | --- |
| Duplicate INSERT (`014`) | Unpublished — **excluded** in both packages ✓ |
| New event INSERT (`001` Sep) | Unpublished — **excluded** ✓ |
| Unpublish / republish (`008`) | Republish changed DB metadata; **public HTML for July already includes `008` with 14 cards** |
| G-22i4 staging byte-identical | Confirms **no public HTML delta** from republish slice |
| G-22i3 staging regen | Refreshed **staging** package only — production package already had equivalent published content |
| Future schedule DB edits | Require **G-22i3 workflow on production profile** before upload — not applicable today |

**Revised gap refresh hypothesis:** G-20i3 package is **older by timestamp** but **not stale** for published schedule content relative to G-22j closure state.

---

## 8. Upload 可否判断

### 8.1 Verdict matrix

| Dimension | Verdict | Rationale |
| --- | --- | --- |
| **Package content (schedule/CMS public)** | **GO** | JSON + schedule HTML match G-22i3 / G-22j published state |
| **Package SEO (prod profile)** | **GO** | `www.gosaki-piano.com` canonicals · indexable primary routes · robots/sitemap correct |
| **G-20j full upload execution** | **HOLD** | DNS / SSL / MX / remote path / client sign-off still **TBD** (G-20i2 §6 STOP unchanged) |
| **Mandatory package regen before upload** | **NO-GO** | Not required for G-22j P0 |

### 8.2 Combined operator decision

```txt
CONTENT:  GO  — existing G-20i3 26-file package is acceptable for first full production upload
EXECUTION: HOLD — G-20j remains STOP until external infra + sign-off gates lift
REGEN:    NOT REQUIRED — unless future schedule/discography DB changes occur
```

---

## 9. Package regen 要否

| Question | Answer |
| --- | --- |
| Regen required for G-22j? | **No** |
| Why gap refresh assumed stale? | Conservative timestamp gap (Jul 1 package vs Jul 7 P0 closure); republish did not change public HTML |
| When regen would be needed | Future `published=true` schedule/discography DB changes · static converter changes · production profile config change |
| Proposed phase (if needed later) | `G-20q-gosaki-production-package-regen-planning` → approved `build:gosaki-production-package` |
| Build this phase? | **No** |

### 9.1 Minor non-HTML staleness (P1 doc hygiene)

| Item | Issue | Blocks upload? |
| --- | --- | --- |
| `CHECKLIST.md` in package | Still lists **staging** post-upload checks (noindex, staging host) | **no** — fix in G-20j preflight refresh |
| `README-UPLOAD.md` | Mentions optional `/admin/` | **no** — G-20i3 excludes admin; clarify in preflight refresh |
| MANIFEST `phase` label | Still `G-8c-...` not `G-20i3` | **no** — cosmetic |

---

## 10. Deploy 前 checklist への影響

### 10.1 G-20j 26-file upload

| Item | Impact |
| --- | --- |
| Use existing package as-is? | **yes** — content GO |
| File list reconfirm? | **yes** — operator should verify 26 files on disk before upload (§4.1) |
| Remote path reconfirm? | **yes** — still **TBD**; mandatory before upload |
| `_astro/` included? | **yes** — CSS + JS in package |
| `admin/` excluded? | **yes** — verify absent |
| Discography on live prod | G-20d/e uploaded **1 file** earlier — full upload will overwrite with same-clean content |

### 10.2 robots / index

| Item | Production package |
| --- | --- |
| Primary routes | **no** `noindex` — indexable at cutover ✓ |
| Legacy stubs | `noindex,follow` ✓ |
| `robots.txt` | `Allow: /` ✓ |
| Post-upload verify | Confirm no accidental staging `noindex` leak |

### 10.3 Post-upload HTTP verify (G-20k preview)

| Check | Expected |
| --- | --- |
| All §4.1 routes HTTP 200 | yes |
| `/admin/` | 404 or absent |
| canonical / og:url | `https://www.gosaki-piano.com/...` |
| July schedule cards | 14 |
| Discography | 8+8 tracks, no `（テスト）` |
| Contact HubSpot | form renders + test submit |
| SSL valid | after DNS cutover |

---

## 11. P0 / P1 / 保留への反映

| Priority | Update after G-20p |
| --- | --- |
| **P0** | Remove “package stale vs G-22j” as blocker · retain DNS/SSL/MX/sign-off/mobile/Contact E2E |
| **P1** | Refresh package CHECKLIST/README for production wording |
| **P2** | Optional regen only on future DB/content changes |
| **保留** | G-20j execution HOLD · G-23o · FTP auto-apply |

---

## 12. 次に進むべき最小タスク

### Recommended: `G-20j-gosaki-production-upload-preflight-refresh`

| Attribute | Value |
| --- | --- |
| Type | **read-only / local docs** |
| Scope | Refresh G-20i preflight with G-20p findings: content GO · 26-file list confirmed · CHECKLIST production wording · G-20i2 STOP gates unchanged |
| Build | **none** |
| Blocks on | DNS/SSL/MX/client sign-off (operator) |

**Not next:** `G-20q package regen planning` — regen **not required** at this time.

---

## 13–18. Safety confirmation (this phase)

| Rule | Status |
| --- | --- |
| build | **no** |
| package regen | **no** |
| Astro build | **no** |
| DB write / SQL mutation | **no** |
| Supabase Save | **no** |
| FTP / upload / deploy / workflow_dispatch | **no** |
| production change | **no** |
| secrets / env change | **no** |
| `service_role` | **no** |
| rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| Sariswing production ref `vsbvndwuajjhnzpohghh` | **not used** |
| commit / push | **no** (per operator instruction) |

---

## 19. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-production-package-staleness-review.mjs
```
