# Gosaki preview review and next implementation planning (G-9d3)

**Phase:** `G-9d3-gosaki-preview-review-and-next-implementation-planning`  
**Date:** 2026-06-17  
**Prior:** G-9d2 execution result commit `467f226`  
**Type:** planning / review synthesis only — no implementation, no FTP, no DB writes

---

## 1. Preview URL

| Item | Value |
| --- | --- |
| **Live preview** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Host** | `yskcreate.weblike.jp` (Lolipop staging — not `gosaki-piano.com` production) |
| **Deploy path** | `/cms-kit-staging/gosaki-piano/` |
| **robots** | `Disallow: /` (staging block — OK) |

---

## 2. Preview で確認済みのこと (G-9d2 operator QA)

| Area | Status |
| --- | --- |
| Home + primary routes | HTTP 200, CSS/layout OK |
| `/schedule/` hub | 2026-03〜2026-07 links present |
| `/schedule/YYYY-MM/` canonical month pages | Display OK (incl. `/schedule/2026-07/`) |
| `/YYYY-MM/` legacy stubs | "Schedule page moved", link to canonical |
| robots.txt | Staging disallow-all |
| sitemap | Canonical schedule routes only; bare `/YYYY-MM/` excluded |
| FTP safety | No delete / mirror / sync-delete; scoped path only |

**Package note:** G-9d1 build used `scheduleDataSource=static-fallback` (fixture extractor). Supabase read is verified at convert time but **live HTML currently reflects static-fallback data**, which matches seeded DB content for Gosaki. A future convert with Supabase env would mark `scheduleDataSource=supabase` in HTML comments.

---

## 3. Schedule 周りで完了したこと (G-9a → G-9d2)

```txt
G-9b   Wix fixture → 60 schedule seed rows (extractor dry-run)
G-9c0a Canonical routes /schedule/YYYY-MM/
G-9c0b Legacy stubs /YYYY-MM/ (noindex, canonical redirect)
G-9c2c Staging DB: 60 rows site_slug=gosaki-piano, canonical source_route
G-9d   Supabase anon read + static fallback at convert/build
G-9d1  Package verify + manual-upload structure
G-9d2  Operator manual preview upload + live QA
```

**Technical stack in place:**

- `supabase-schedule-read.mjs` — anon read, normalize, fallback
- `gosaki-schedule-data-pages.mjs` — data-driven hub + month pages
- Legacy stub generation unchanged (G-9c0b)
- Sitemap / canonical policy unchanged (G-9c0a)

---

## 4. Gosaki 案件として残っている確認事項

| # | Item | Owner | Notes |
| --- | --- | --- | --- |
| 1 | **Client / operator 目視レビュー** | Operator + gosaki client | SP menu, discography, contact, overall parity vs Wix |
| 2 | **Month event counts on live** | Operator | Spot-check 13/10/12/11/14 on each month page (not only 2026-07) |
| 3 | **scheduleDataSource=supabase rebuild** | Operator (optional) | Convert with staging env → re-upload if HTML marker matters |
| 4 | **CMS edit loop** | Future phase | Staging shell only — not `/admin` |
| 5 | **Top YouTube embed** | G-9a item 2 | Not started |
| 6 | **Bands/Projects CMS** | Deferred (G-9a) | Static JSON continues |
| 7 | **Production cutover** | Deferred | Separate approval; FTP auto-deploy still disabled |

---

## 5. CMS Kit として次に一般化すべきこと

| Priority | Generalization | Why |
| --- | --- | --- |
| 1 | **`site_slug` parameter on schedule read** | Today: Gosaki-hardcoded paths + `GOSAKI_SITE_SLUG`. Next customer needs same pipeline without fork. |
| 2 | **Route profile per site** | Gosaki: `/schedule/YYYY-MM/`; Sariswing: `/schedule/YYYY-MM/` under different deployBase. Config-driven hub/month paths. |
| 3 | **Convert-time data source marker** | `scheduleDataSource` logging for operator/debug across sites. |
| 4 | **Manual-upload + scoped FTP checklist pattern** | Reuse G-9d2 checklist template for future pilots (post G-7f hardening). |
| 5 | **Staging shell write slices** | Reuse G-6-g* approval-ID pattern for per-field non-dry-run on `site_slug` rows. |

---

## 6. 次実装候補の比較

### 候補 A — Preview 目視レビュー・微調整

| | |
| --- | --- |
| **内容** | Client/operator visual QA; copy, spacing, responsive tweaks (G-8-style CSS in overrides) |
| **メリット** | Low risk; no DB/FTP policy change; improves client confidence before CMS |
| **リスク** | Scope creep into full redesign; each tweak needs manual re-upload |
| **依存** | None |
| **FTP** | Manual re-upload only (operator, scoped path) |

### 候補 B — Schedule CMS 管理UI (`site_slug=gosaki-piano`)

| | |
| --- | --- |
| **内容** | Bind staging shell (`/__admin-staging-shell/musician-basic/`) to read/edit Gosaki schedules |
| **メリット** | Direct path to "本人更新"; builds on G-6 schedule write hardening |
| **リスク** | RLS/write scope expansion; must not touch `/admin`; needs new approval IDs per slice |
| **依存** | Staging DB seeded (done); read path exists at convert time |
| **FTP** | None for UI; publish still separate |

### 候補 C — Supabase schedule read の `site_slug` 汎用化

| | |
| --- | --- |
| **内容** | Refactor `supabase-schedule-read.mjs` → kit-level `fetchSchedulesForSite(siteSlug, routeProfile)` |
| **メリット** | Second customer ready; reduces Gosaki-only branches in `astro-generator.mjs` |
| **リスク** | Regression on Gosaki fallback; needs verifier expansion |
| **依存** | G-9d stable (done) |
| **FTP** | None |

### 候補 D — 本番反映の安全計画

| | |
| --- | --- |
| **内容** | Document gosaki-piano.com cutover: DNS, FTP path, rollback, client sign-off |
| **メリット** | Required eventually; clarifies production vs preview |
| **リスク** | **High** if rushed — G-7f FTP incident; production touch; client expectation |
| **依存** | Preview accepted (A); CMS loop optional; `readyForAnyFtpApply` still false |
| **FTP** | Explicit operator approval only; no auto-apply |

### 候補 E — News / YouTube / Profile スコープ整理

| | |
| --- | --- |
| **内容** | Extend G-9a planning for non-schedule modules (YouTube embed priority 2) |
| **メリット** | Aligns with CMS MVP roadmap; YouTube is client-visible on home |
| **リスク** | Dilutes Schedule focus; new tables/migrations later |
| **依存** | G-9a baseline |
| **FTP** | None in planning |

---

## 7. 推奨 next step（安全順）

```txt
1. Preview review (候補 A) — client/operator sign-off on live URL
2. 軽微な表示調整があれば対応 (候補 A の一部) + manual re-upload
3. Schedule read の site_slug 汎用化 (候補 C) — G-9e 推奨
4. Staging shell Schedule CMS for gosaki-piano (候補 B) — read UI first, write slices later
5. YouTube embed planning/implementation (候補 E の一部)
6. 本番反映計画 (候補 D) — last, separate approval stack
```

**Immediate recommendation:** Start **G-9e** with **候補 C** (`site_slug` read generalization) after a short **候補 A** client preview window. Defer **候補 D** until preview accepted and CMS read path proven on second convert cycle.

---

## 8. 推奨フェーズ名（次）

| Phase | Focus |
| --- | --- |
| **G-9d3** (this) | Preview review + next implementation planning |
| **G-9e** | `site_slug` schedule read generalization (recommended next code) |
| **G-9f** | Gosaki staging shell schedule read binding (optional parallel after G-9e) |
| **G-9g** | Top YouTube embed (G-9a item 2) |
| **G-10*** | Production cutover planning (候補 D) — far future |

---

## 9. Not in this phase

- FTP connection / upload / delete
- DB write / Supabase SQL
- `workflow_dispatch`
- Production deploy
- `/admin` changes
- `service_role`

---

## 10. Gates

```txt
gosakiPreviewReviewPlanningComplete: true
gosakiPreviewLiveUrlRecorded: true
gosakiSchedulePreviewAccepted: true
gosakiNextImplementationOptionsDocumented: true
readyForG9eNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

**Note:** `gosakiSchedulePreviewAccepted: true` reflects operator G-9d2 technical QA pass. Formal **client** sign-off may still be collected in 候補 A without blocking G-9e planning.

---

## 11. References

- `gosaki-manual-preview-upload-execution-result.md`
- `gosaki-astro-supabase-schedule-read-with-static-fallback.md`
- `gosaki-cms-scope-and-schedule-youtube-planning.md`
- `ftp-deploy-root-delete-incident-and-safety-hardening.md`
