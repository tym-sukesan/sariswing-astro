# Gosaki production-cutover gap refresh

**Phase:** `gosaki-production-cutover-gap-refresh`  
**Status:** **complete** — read-only / local docs / checklist refresh only  
**Date:** 2026-07-08  
**Base commit:** `1729378`  
**Prior:** [gosaki-completion-audit.md](./gosaki-completion-audit.md) · [gosaki-production-release-readiness-inventory.md](./gosaki-production-release-readiness-inventory.md) (G-20a) · [gosaki-schedule-p0-overall-closure.md](./gosaki-schedule-p0-overall-closure.md) (G-22j1) · [gosaki-schedule-cms-p0-release-note.md](./gosaki-schedule-cms-p0-release-note.md) (G-22j2)

| Check | Status |
| --- | --- |
| G-23 pause / Gosaki priority documented | **yes** |
| G-20j STOP handling documented | **yes** |
| G-22j Schedule P0 post-state reflected | **yes** |
| Pre-launch gap inventory refreshed | **yes** |
| Route / SEO / deploy checklists | **yes** |
| P0 / P1 / P2 / 保留 reclassified | **yes** |
| High-risk work separated | **yes** |
| DB write / Save / FTP / deploy / production change | **not executed** |

---

## Gates

```txt
gosakiProductionCutoverGapRefreshComplete: true
phase: gosaki-production-cutover-gap-refresh
baseCommit: 1729378
g23OnboardingPausedAt: d7a7250
g23oLiveCrawlDeferred: true
seiichijazzDeferred: true
scheduleCmsP0Closed: true
g20jFullProductionUpload: STOP
g20jStopReason: DNS_SSL_MX_remote_path_pending
productionPackageLastBuild: G-20i3
productionPackageStaleVsG22j: true
readyForG20pProductionPackageStalenessReview: true
dbWriteExecuted: false
saveExecuted: false
ftpUploadExecuted: false
deployExecuted: false
productionChangeExecuted: false
packageBuildExecuted: false
astroBuildExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. G-23 保留・Gosaki 優先への切替

| Item | State |
| --- | --- |
| G-23 onboarding chain | **paused** at `d7a7250` |
| G-23o live crawl-dry-run | **ON HOLD** |
| seiichijazz.com | **deferred** |
| **Current priority** | **Gosaki-piano production cutover** |
| Completion audit | **complete** (`gosaki-completion-audit.md`) |
| This phase | Gap refresh only — no G-23 resume |

G-23a–G-23n artifacts remain valid for future new-site onboarding. They do **not** block Gosaki cutover.

---

## 2. 現在の本番準備状況

### 2.1 完了済み（カットオーバー準備）

| Area | Status | Reference |
| --- | --- | --- |
| Staging static preview (PC/SP) | **complete** | G-7/8, G-7j |
| Client preview readiness | **complete** | G-7j |
| Schedule CMS P0 (dup / new / unpublish / republish) | **closed** | G-22d–G-22j2 |
| Canonical `/schedule/YYYY-MM/` + legacy `/YYYY-MM/` stub | **complete** | G-9c0a/b |
| Staging DB 60 schedule rows (`site_slug= gosaki-piano`) | **complete** | G-9c2c |
| YouTube / About / Discography / Contact CMS slices (staging) | **proven** | G-10–G-19 |
| Production config (`deployBase=/`, `www.gosaki-piano.com`) | **complete** | G-20h1 |
| Local production package build | **complete** (G-20i3: **26 files**, admin excluded) | G-20h2, G-20i3 |
| Upload preflight + admin exclusion policy | **complete** | G-20i, G-20i2, G-20i3 |
| Discography test-title cleanup on live prod | **complete** (1-file partial upload) | G-20d/e |
| Operator admin UI polish (JP copy) | **complete** | G-20ui1–3 |
| Sariswing parity gap inventory | **complete** | G-22a |

### 2.2 途中・部分状態

| Layer | State |
| --- | --- |
| **Production public site** | **Hybrid** — Wix still serves most routes; **only** `/discography/` confirmed Astro on `www.gosaki-piano.com` (G-20d/e) |
| **Production package on disk** | Exists at `output/manual-upload/gosaki-piano-production/` from **G-20i3 (2026-07-01)** — **stale vs G-22j** schedule DB state |
| **Hosted admin on prod** | **Not deployed** — Option B (exclude `admin/`) |
| **DNS / SSL / MX** | **TBD** — operator checklist unresolved |
| **Remote Lolipop path** | **TBD** |
| **Client formal sign-off** | **pending** |
| **Mobile spot-check** | **optional / pending** (G-7j noted MENU spot-check optional) |

### 2.3 どこで止まっているか

```txt
G-20j full production upload → STOP (not started)
```

Lift requires **all** G-20i2 §6 conditions (see §3). No Cursor FTP, no DNS change, no SSL change in any phase to date.

---

## 3. G-20j STOP の扱い

### 3.1 STOP 理由（G-20i2 §6 — unchanged）

| Gate | Status | Effect |
| --- | --- | --- |
| Remote document root confirmed (R3 + R4 screenshot) | **TBD** | **STOP** |
| Upload scope locked (26 files, admin excluded) | **locked in docs** | OK when path known |
| Client sign-off on staging preview | **pending** | **STOP** |
| SSL plan (Let's Encrypt on Lolipop) | **TBD** | **STOP** |
| DNS / MX impact reviewed | **TBD** | **STOP** |
| G-7f1 FTP auto-apply | **suspended** | manual operator FTP only |

**Primary blockers:** DNS cutover from Wix → Lolipop, SSL enablement, MX preservation, remote path confirmation, client approval.

### 3.2 STOP 中に完了した作業（再実行不要）

| Work | Note |
| --- | --- |
| G-20d/e discography 1-file prod upload | **Do not re-upload** (`discographyCleanupDoNotReUpload`) |
| G-22j Schedule P0 Saves | **Closed** — do not re-Save closed slices |
| G-20i3 admin exclusion package | Valid artifact — but schedule content may be stale (§4) |

### 3.3 STOP 解除後の最初の高リスクフェーズ

| Phase | Scope | Approval |
| --- | --- | --- |
| **G-20j-gosaki-production-full-upload-execution** | Operator manual FTP — 26 files, contents of `public-dist/` | Explicit operator approval + G-7f1 preflight |
| **G-20k-gosaki-production-upload-http-verify** | Post-upload HTTP checks | After G-20j only |
| **DNS / SSL cutover** | Separate operator phase — not bundled with FTP | Client + registrar/Lolipop |

---

## 4. G-22j Schedule CMS P0 完了後の更新点

Schedule CMS P0 closed at G-22j1/j2 (`904a248`, `5fa7fdb`). Relative to G-20a/G-20j baseline:

| Topic | Before G-22j | After G-22j |
| --- | --- | --- |
| Operator schedule CRUD | Staging shell + PoC slices | **P0 closed** — dup, new, unpublish, republish on staging admin |
| Authenticated admin read | Partial | **Complete** — unpublished visible to operator |
| Public reflection workflow | Ad hoc | **Documented** — G-22i3 local regen → G-22i4 upload preflight when diff exists |
| P0 closure upload | N/A | **G-22i5skip** — staging byte-identical; **no upload at closure** |
| Production schedule HTML | G-20h2 package snapshot | **Not on prod** except Wix; local package **predates** G-22j DB mutations |
| Test rows `014` / `001` | N/A | Unpublished on staging — **optional cleanup later**, not P0 |
| Physical DELETE | N/A | **Deferred** — separate approval phase |
| Re-Save closed slices | — | **Forbidden** |

### 4.1 Cutover implication (critical)

The **G-20i3 production package** was built **2026-07-01**. G-22j P0 work ran **2026-07-07**. Therefore:

1. **Do not assume** the on-disk production package reflects current Supabase staging schedule state.
2. **Before G-20j full upload**, run **G-22i3 → G-22i4** (local regen + upload preflight) — requires **package regen** (separate approved phase, not this doc).
3. Staging URL remains SoT for schedule operator workflow until production hosted admin exists.

---

## 5. 本番前 gap 一覧

| # | Gap | Category | Priority |
| --- | --- | --- | --- |
| G1 | Production package stale vs G-22j schedule DB | package | **P0** |
| G2 | Full 26-file upload not executed (G-20j STOP) | deploy | **P0** |
| G3 | DNS Wix → Lolipop not cut over | infra | **P0** |
| G4 | SSL (Let's Encrypt) not confirmed on Lolipop | infra | **P0** |
| G5 | MX / email records not verified before DNS | infra | **P0** |
| G6 | Remote Lolipop document root **TBD** | infra | **P0** |
| G7 | Client formal sign-off on staging | process | **P0** |
| G8 | robots/noindex → production indexable flip at cutover | SEO | **P0** |
| G9 | Canonical / og:url prod verification on all routes | SEO | **P0** |
| G10 | Contact / HubSpot form E2E on production domain | functional | **P0** |
| G11 | Mobile spot-check (MENU, schedule, footer SNS) | QA | **P0** |
| G12 | Hosted admin / client self-service plan | ops | **P0** (plan only; deploy P1+) |
| G13 | Supabase production strategy (stay on staging ref vs migrate) | ops | **P1** |
| G14 | Operator reflection runbook for post-launch CMS updates | ops | **P1** |
| G15 | Discography UX polish | product | **P1** |
| G16 | Schedule test row cleanup (`014`/`001`) | data | **P2** / optional |
| G17 | News CMS / image upload / G-23 resume | Kit | **P2** / 保留 |
| G18 | FTP auto-apply (G-7f1 suspended) | Kit | **保留** |
| G19 | Physical schedule DELETE | CMS | **保留** |
| G20 | seiichijazz.com / G-23o live crawl | other site | **保留** |

---

## 6. Route / canonical / SEO / robots / sitemap checklist

**Source of truth (read-only this phase):** G-20h2 build result · G-20i upload preflight §3.3 · G-9c canonical docs. **No package regen.**

### 6.1 Expected production route manifest (26 files, admin excluded)

| Route / path | Role | Verify |
| --- | --- | --- |
| `/` (`index.html`) | Home + YouTube embed | HTTP 200 · canonical `https://www.gosaki-piano.com/` · no staging leak |
| `/about/` | About + band profiles | same |
| `/discography/` | Supabase discography | **partial live today** — re-verify after full upload |
| `/contact/` | HubSpot embed | form submit E2E post-cutover |
| `/link/` | External links | nav link works |
| `/schedule/` | Schedule hub | month links use `/schedule/YYYY-MM/` |
| `/schedule/2026-03/` … `/schedule/2026-07/` | Canonical month pages | `scheduleDataSource=supabase` · no PoC text |
| `/2026-03/` … `/2026-07/` | Legacy stubs | `noindex,follow` · redirect/link to `/schedule/YYYY-MM/` |
| `/robots.txt` | Production robots | `Allow: /` · sitemap line present |
| `/sitemap-index.xml` | Sitemap index | loc = `www.gosaki-piano.com` |
| `/sitemap-0.xml` | URL list | no staging URLs · includes primary + schedule routes |
| `/_astro/index.*.css` | Layout CSS | HTTP 200 on prod |
| `/_astro/index.astro_astro_type_script_index_0_lang.*.js` | Client JS | HTTP 200 on prod |
| `/assets/about/bands/*.jpg` (×5) | Band images | HTTP 200 |
| `/admin/` | — | **must NOT exist** on prod (G-20i3 exclusion) |

### 6.2 Canonical / legacy route verification

| Check | Expected |
| --- | --- |
| Primary routes canonical host | `https://www.gosaki-piano.com` |
| Month canonical path | `/schedule/YYYY-MM/` (not `/YYYY-MM/` as canonical) |
| Legacy `/YYYY-MM/` | Stub only — `noindex` · points to canonical |
| Staging URL leak (`yskcreate`, `/cms-kit-staging/gosaki-piano`) | **absent** on all primary HTML |
| `deployBase` in built HTML | `/` (root) |
| Sariswing routes (`/schedule/YYYY-MM/` on sariswing domain) | N/A — Gosaki uses `/schedule/YYYY-MM/` at root |

### 6.3 SEO / OGP / robots / sitemap

| Check | Pre-cutover (staging) | At cutover (production) |
| --- | --- | --- |
| `<meta name="robots">` on primary pages | `noindex` (intentional) | **must be absent** or `index,follow` |
| `robots.txt` | `Disallow: /` on staging | `Allow: /` + Sitemap line |
| `canonical` link | staging host | `www.gosaki-piano.com` |
| `og:url` | staging host | `www.gosaki-piano.com` |
| sitemap URLs | staging host | production host only |
| Legacy stub pages | `noindex,follow` | unchanged |

---

## 7. Contact / HubSpot checklist

| # | Item | Who | When |
| --- | --- | --- | --- |
| C1 | HubSpot embed renders on `/contact/` (staging) | Operator | Before client sign-off |
| C2 | Form fields match client expectation (JP labels) | Client | Sign-off |
| C3 | Test submission from **production domain** after DNS cutover | Operator | Post-deploy |
| C4 | HubSpot notification / inbox receives submission | Client | Post-deploy |
| C5 | Privacy / consent copy acceptable | Client | Sign-off |
| C6 | Wix contact form decommission plan | Operator | Pre-DNS |
| C7 | No staging HubSpot portal misconfiguration on prod | Operator | Deploy verify |

**Note:** G-8f hid Wix contact success UI; HubSpot is the production contact path in static package.

---

## 8. Mobile spot-check checklist

| # | Item | Route / area | Status |
| --- | --- | --- | --- |
| M1 | MENU toggle opens/closes nav | All pages | G-8g2 fixed — **spot-check pending** |
| M2 | Logo link to home | Header | G-8e — verify on device |
| M3 | Schedule hub month links | `/schedule/` | G-8g3 |
| M4 | Month page event cards visible | `/schedule/YYYY-MM/` | G-8g4 |
| M5 | Discography SP layout (image-first) | `/discography/` | G-8d |
| M6 | Footer SNS links (FB / X / IG) | Footer | G-8g6 |
| M7 | Footer copyright centered | Footer | G-8g7 |
| M8 | About band cards stack | `/about/` | G-8a |
| M9 | Contact form usable on narrow viewport | `/contact/` | **pending** |
| M10 | No horizontal overflow | All primary routes | G-8b baseline |
| M11 | KV / hero not covered by footer overlay | Home | G-7i2 |

**Environment:** Staging first (`/cms-kit-staging/gosaki-piano/`); repeat on `www.gosaki-piano.com` after full upload.

---

## 9. Client sign-off checklist

| # | Item | Required |
| --- | --- | --- |
| S1 | Staging URL shared with 後藤沙紀さん | **yes** |
| S2 | PC layout approval (Home, About, Discography, Schedule, Contact, Link) | **yes** |
| S3 | Mobile layout approval (or delegated spot-check) | **yes** |
| S4 | Schedule content accuracy (dates, venues, copy) | **yes** |
| S5 | Discography track lists (post test-cleanup) | **yes** |
| S6 | YouTube embed (home) | **yes** |
| S7 | About / Bands section | **yes** |
| S8 | Contact form behavior understood (HubSpot) | **yes** |
| S9 | DNS cutover window agreed (downtime tolerance) | **yes** |
| S10 | Written OK to proceed to production upload + DNS | **yes** — blocks G-20j |

---

## 10. Deploy 前 checklist

### Operator 目視

- [ ] G-20i3 package exists locally (26 files) — **or** fresh regen after G-22i3 if schedule changed
- [ ] `MANIFEST.json` `safeForStaticFtp: true`, `deployBase: /`
- [ ] No `admin/` in upload set
- [ ] `_astro/` CSS + JS included
- [ ] Band images (5) included
- [ ] Discography HTML has no `（テスト）` strings
- [ ] Schedule pages have no `[CMS Kit staging]` / PoC strings
- [ ] Remote path confirmed (not account root `/` with unrelated sites)
- [ ] Upload rule: **contents** of `public-dist/`, not the folder itself
- [ ] G-7f1 preflight documented (exact paths, no `--delete`)
- [ ] Wix fallback plan documented (DNS revert + TTL)
- [ ] MX records copied / verified
- [ ] SSL plan ready
- [ ] Client sign-off recorded

### Deploy 直前（高リスク — 別フェーズ）

- [ ] TTL lowered (if registrar DNS) 24–48h prior
- [ ] FTP credentials ready (operator-held, not in repo)
- [ ] Backup: export current Wix state / note current DNS records

---

## 11. Deploy 後 checklist

| # | Check | Expected |
| --- | --- | --- |
| P1 | `/` HTTP 200 + CSS | Astro layout |
| P2 | All primary routes HTTP 200 | §6.1 list |
| P3 | `/admin/` | **404** or absent |
| P4 | `robots.txt` | `Allow: /` |
| P5 | `sitemap-index.xml` | production URLs |
| P6 | canonical / og:url | `www.gosaki-piano.com` |
| P7 | No `noindex` on primary pages | indexable |
| P8 | Legacy `/2026-XX/` stubs | `noindex` + canonical month link |
| P9 | `/discography/` | 8+8 tracks, no test titles |
| P10 | Schedule months | Supabase data visible |
| P11 | Contact form submit | HubSpot receives |
| P12 | SSL certificate valid | HTTPS |
| P13 | Apex → www redirect (if applicable) | per DNS plan |
| P14 | Email still works | send/receive test |
| P15 | Mobile spot-check §8 | PASS |
| P16 | Google Search Console (optional P1) | sitemap submit |

---

## 12. P0 / P1 / P2 / 保留

### P0 — 本番公開前に必須

| Item | Notes |
| --- | --- |
| Client staging sign-off | Blocks G-20j |
| DNS / SSL / MX resolution | Blocks G-20j |
| Remote Lolipop path confirmation | Blocks G-20j |
| Production package freshness vs G-22j | Regen + G-22i3/4 before upload |
| G-20j full 26-file manual upload | Operator + explicit approval |
| G-20k post-upload HTTP verify | After G-20j |
| robots / noindex / canonical / sitemap prod verify | §6 |
| Contact HubSpot E2E on prod domain | §7 |
| Mobile spot-check | §8 |
| Hosted admin **plan** (not deploy) | Operator-assisted workflow doc |

### P1 — 公開直後

| Item | Notes |
| --- | --- |
| Operator CMS update runbook (local regen → manual upload) | Until hosted admin |
| Supabase production ref strategy | Staging ref interim OK short-term |
| Discography UX polish | Non-blocking |
| Search Console / analytics | Optional |
| Reflection runbook for schedule/discography edits | G-22i pattern |
| Admin UI copy residual (G-22h6b) | Low risk |

### P2 — 一般化 / Kit 側

| Item | Notes |
| --- | --- |
| G-23 30-minute onboarding resume | After Gosaki launch |
| News CMS slice | Not in Gosaki MVP |
| Image upload module | Kit generalization |
| FTP safety re-enable | G-7f1 hardening complete; operator policy |
| Sariswing parity items from G-22a | Kit backlog |

### 保留 — 今回触らない

| Item | Notes |
| --- | --- |
| G-23o live crawl / seiichijazz.com | Explicitly deferred |
| FTP auto-apply `--apply` | G-7f1 suspended |
| G-22j closed P0 Saves | Do not re-execute |
| Physical schedule DELETE | Separate approval |
| `/admin` on production | G-20i2 Option B |
| Sariswing production `vsbvndwuajjhnzpohghh` | Forbidden |
| Schedule test rows `014`/`001` cleanup | Optional later |

---

## 13. 高リスク作業一覧（必ず別フェーズ）

| Work | Proposed phase | Gate |
| --- | --- | --- |
| DNS change (Wix → Lolipop) | `G-20dns-gosaki-dns-cutover` | Client sign-off + MX plan |
| SSL setup (Let's Encrypt) | `G-20ssl-gosaki-lolipop-ssl` | With or immediately after DNS |
| MX verification | Included in DNS preflight | Record before change |
| FTP upload (26 files) | `G-20j-gosaki-production-full-upload-execution` | G-7f1 preflight + explicit approval |
| `workflow_dispatch` | N/A for static cutover | Not used |
| Production deploy (any) | Subsumed by G-20j | Operator manual |
| robots/index flip | Part of G-20j package (built indexable) | Verify post-upload |
| Hosted admin on prod | `G-20admin-host-*` (future) | Separate security review |
| Supabase production project | Strategic phase | Not required for static launch |
| DB write / Save | Per-slice approval IDs | Never bundled with upload |
| Package regen / Astro build | `G-22i3` / `build:gosaki-production-package` | Before G-20j if schedule stale |
| Rollback SQL | Only with explicit approval | Staging only to date |

---

## 14. 次に進むべき最小タスク

### Recommended: `G-20p-gosaki-production-package-staleness-review`

| Attribute | Value |
| --- | --- |
| Type | **read-only / local** |
| Scope | Compare G-20i3 `MANIFEST.json` + doc route list vs G-22j staging schedule closure state |
| Builds | **none** — read existing artifacts + docs only |
| Output | Staleness report doc + go/no-go for regen before G-20j |
| Blocks | Informs whether `build:gosaki-production-package` needed before upload |

### Alternative (also read-only): `gosaki-mobile-spot-check-planning`

Planning doc for §8 checklist — operator device matrix, no HTTP automation.

### Not next (require approval gates)

- G-20j FTP upload
- DNS / SSL / MX changes
- Package regen (`build:gosaki-production-package`)
- Any Save / DB write

---

## 15–18. Safety confirmation (this phase)

| Rule | Status |
| --- | --- |
| DB write | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| Supabase Save | **no** |
| FTP / upload / deploy / workflow_dispatch | **no** |
| Production change | **no** |
| Package build / Astro build | **no** |
| secrets / env change | **no** |
| `service_role` | **no** |
| rollback SQL executed | **no** |
| GRANT / REVOKE / RLS change | **no** |
| Sariswing production ref `vsbvndwuajjhnzpohghh` as active target | **no** |
| commit / push | **no** (per operator instruction) |

---

## 19. Reference docs (read this phase)

| Doc | Role |
| --- | --- |
| `gosaki-completion-audit.md` | Prior inventory |
| `gosaki-production-release-readiness-inventory.md` | G-20a baseline |
| `gosaki-production-upload-preflight.md` | G-20i manifest |
| `gosaki-production-upload-finalization-admin-and-remote-path.md` | G-20i2 STOP |
| `gosaki-production-package-admin-exclusion-result.md` | G-20i3 26-file package |
| `gosaki-production-package-build-result.md` | G-20h2 SEO verify |
| `gosaki-schedule-cms-p0-release-note.md` | Operator-facing P0 summary |
| `gosaki-schedule-p0-overall-closure.md` | G-22j closure |
| `gosaki-sariswing-parity-gap-inventory.md` | G-22a Kit gaps |
| `gosaki-staging-browser-qa-and-client-preview-readiness.md` | G-7j staging QA |
| `gosaki-production-test-text-cleanup-closure.md` | G-20e discography prod |

---

## 20. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-production-cutover-gap-refresh.mjs
```
