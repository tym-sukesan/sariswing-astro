# Gosaki-piano completion audit

**Phase:** `gosaki-completion-audit`  
**Status:** **complete** — read-only / local inventory; **no DB write / Save / deploy / FTP**  
**Date:** 2026-07-08  
**Base commit:** `d7a7250`  
**Context:** G-23 onboarding chain paused at `d7a7250`; priority returns to Gosaki-piano site completion.

| Check | Status |
| --- | --- |
| Remaining tasks inventoried | **yes** |
| P0 / P1 / P2 / 保留 classified | **yes** |
| Risk classification | **yes** |
| Next minimal task identified | **yes** |
| DB / Save / deploy / FTP | **not executed** |

---

## Gates

```txt
gosakiCompletionAuditComplete: true
phase: gosaki-completion-audit
g23OnboardingPausedAt: d7a7250
g23oLiveCrawlDeferred: true
seiichijazzDeferred: true
scheduleCmsP0Closed: true
readyForGosakiProductionCutoverGapRefresh: true
liveCrawlExecuted: false
dnsLookupAttempted: false
networkAccess: false
dbWriteExecuted: false
sqlMutationExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

---

## 1. Purpose

After G-23 series (30-minute onboarding / crawl planning) was safely closed at `d7a7250`, re-prioritize **Gosaki-piano individual site completion**. This audit inventories what remains before the client can operate and launch on production — using existing docs, config, and local artifacts only.

**Not in this audit:** live HTTP checks, DB queries, package regen, FTP, Save.

---

## 2. Environment snapshot (from docs)

| Layer | Staging | Production (target) |
| --- | --- | --- |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | `https://www.gosaki-piano.com/` (Wix + partial Astro) |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | `/` on client domain |
| **robots / SEO** | `noindex` + `Disallow: /` — intentional | Must be indexable at cutover |
| **canonical** | staging host + deployBase | `www.gosaki-piano.com` (G-20h package built) |
| **Supabase** | `kmjqppxjdnwwrtaeqjta` (Kit staging) | Strategy TBD — staging SoT today |
| **Admin** | `/__admin-staging-shell/musician-basic/` — **local dev only** | **Not hosted** |
| **FTP** | Manual upload only; G-7f1 auto-apply **suspended** | G-20j full upload **STOP** (DNS/SSL/MX pending) |

---

## 3. Already complete (by area)

### 3.1 Static staging preview (G-7 / G-8)

| Item | Status | Reference |
| --- | --- | --- |
| URL crawl → convert → static-public → manual package | **complete** | G-7d–G-7e |
| PC/SP visual polish (header, footer, discography, schedule) | **complete** | G-8d–G-8g8 |
| Schedule hub `/schedule/` + month links | **complete** | G-8g3 |
| Month page Wix repeater visibility | **complete** | G-8g4 |
| About Bands/Projects static injection | **complete** | G-8a |
| Client preview ready | **complete** | G-7j |
| Font / Wix asset safety | **complete** | G-9b1 |

### 3.2 Schedule CMS (G-9 / G-22)

| Item | Status | Reference |
| --- | --- | --- |
| Wix repeater seed design (60 events) | **complete** | G-9b |
| Canonical route `/schedule/YYYY-MM/` | **complete** | G-9c0a |
| Legacy stub `/YYYY-MM/` → canonical | **complete** | G-9c0b |
| Staging DB 60 rows + `site_slug` | **complete** | G-9c2c |
| Public schedule read from Supabase | **complete** | G-9d2+ / G-12b |
| **Schedule CMS P0 CRUD** (dup / new / unpublish / republish) | **complete** | G-22d–G-22h |
| Authenticated admin read (incl. unpublished) | **complete** | G-22g1f3 |
| P0 UX (legacy_id, procedure hints, save preview) | **complete** | G-22g1a–G-22g2b |
| Public reflection review (upload not needed for P0 closure) | **complete** | G-22i1–G-22i5skip |
| P0 release note | **complete** | G-22j2 |

### 3.3 Other CMS modules (G-10–G-19)

| Module | Status | Reference |
| --- | --- | --- |
| **YouTube** (home embed) | Save + workflow chain closed on staging | G-10c, G-11c |
| **About** (profile + bands HTML) | Static JSON Save proven | G-10h |
| **Discography** | Scalar + tracklist per-slice Save proven; test titles cleaned on prod | G-15–G-19, G-20e |
| **Contact** | HubSpot embed in static package | G-10g |

### 3.4 Production prep (G-20)

| Item | Status | Reference |
| --- | --- | --- |
| Production readiness inventory | **complete** | G-20a |
| Discography test text cleanup (prod) | **complete** | G-20b–G-20e |
| Production config + local package build | **complete** | G-20h2 |
| Admin excluded from production package | **complete** | G-20i3 |
| Upload preflight | **complete** | G-20i |
| **Full production upload** | **STOP** — operator pending | G-20j |

### 3.5 Admin UI polish

| Item | Status | Reference |
| --- | --- | --- |
| Japanese operator copy, dev panel collapse | **complete** | G-20ui1–G-20ui3 |
| Sariswing parity gap inventory | **complete** | G-22a |

### 3.6 G-23 (paused — not Gosaki-blocking)

| Item | Status |
| --- | --- |
| Onboarding orchestrator, report output, allowlist config | **complete** through G-23n |
| G-23o live crawl | **deferred** at `d7a7250` |

---

## 4. Remaining tasks by area

### 4.1 Page structure

| Route | Staging | Production package | Gap |
| --- | --- | --- | --- |
| `/` (home) | ✅ | ✅ (G-20h2) | YouTube embed refresh workflow on prod |
| `/about/` | ✅ | ✅ | Bands/images static; partial About CMS |
| `/discography/` | ✅ Supabase | ✅ partial live | Full album CMS UX; cover images |
| `/contact/` | ✅ HubSpot | ⚠️ verify E2E | Form submit QA on prod domain |
| `/link/` | ✅ static | ✅ | No CMS — OK for launch |
| `/schedule/` hub | ✅ | ✅ | — |
| `/schedule/YYYY-MM/` | ✅ Supabase | ⚠️ cutover | Prod must use canonical routes |
| `/YYYY-MM/` legacy | ✅ stub | ⚠️ | Legacy stubs in prod package |
| **News** | ❌ no page | ❌ | **Out of MVP** (G-9a) |
| **Videos** | ❌ no dedicated page | ❌ | YouTube on home only |

### 4.2 Schedule

| Task | Notes |
| --- | --- |
| Routine field UPDATE without per-slice env arms | G-9k proven but high ceremony — operator friction |
| Schedule image upload (flyers) | Deferred — Wix CDN / manual |
| Home featured schedule | Deferred |
| Physical DELETE | Explicitly deferred (P0 uses unpublish) |
| Post-edit public reflection playbook | Documented (G-14c) but manual regen + FTP |

### 4.3 Discography

| Task | Notes |
| --- | --- |
| Bulk tracklist Save UX | Per-title slices only (G-19) |
| Personnel / price fields | Deferred |
| Album INSERT/DELETE | Disabled |
| Preview refresh after Save (G-19f) | Stale card observed — verify |
| Cover image CMS | Deferred |

### 4.4 Profile / About

| Task | Notes |
| --- | --- |
| Full About CMS vs static JSON blocks | G-10h partial |
| Band image Storage | Static placeholders |

### 4.5 Contact

| Task | Notes |
| --- | --- |
| HubSpot form E2E on staging | Not fully closed |
| Production domain allowlist in HubSpot | Pre-cutover |
| Wix form fully replaced | G-10g — verify on prod |

### 4.6 News / Videos

| Task | Notes |
| --- | --- |
| News page + CMS | **Out of MVP** — defer |
| Dedicated Videos page | **Out of MVP** — home embed only |

### 4.7 SEO / OGP / sitemap / robots

| Task | Notes |
| --- | --- |
| Staging noindex | ✅ intentional |
| Production indexable robots + sitemap | In G-20h package — **not deployed** full site |
| canonical / og:url → `www.gosaki-piano.com` | G-20h built — **verify at cutover** |
| Legacy `/YYYY-MM/` noindex + canonical | G-9c0b — include in prod package |

### 4.8 Mobile

| Task | Notes |
| --- | --- |
| G-8d–G-8e SP layout polish | **complete** on staging |
| Operator narrow-viewport spot-check | **PENDING** since G-7j |
| MENU toggle real-device QA | Recommended before client demo |

### 4.9 CMS admin

| Task | Notes |
| --- | --- |
| Local staging shell (Schedule P0) | **complete** |
| Hosted admin on client server | **Not done** — blocker for 本人 solo ops |
| Production `/admin` | **Explicitly forbidden** (AGENTS.md) |
| Misleading「保存は準備中」copy on some pages | G-20a S3 — some slices proven but UI inconsistent |
| Publish / 本番反映 button | **未開放** — manual FTP only |

### 4.10 Public reflection / deploy

| Task | Notes |
| --- | --- |
| Staging manual upload workflow | Proven (G-7g+) |
| Full production package upload | G-20j **STOP** |
| FTP auto-apply | G-7f1 **suspended** |
| DNS / SSL / MX for `gosaki-piano.com` | Operator pending (G-20i) |
| Client content sign-off | G-20a M5 |

---

## 5. Priority classification

### P0 — required before Gosaki “完成” / production cutover

| ID | Task | Risk if skipped |
| --- | --- | --- |
| **P0-1** | **Production cutover gap refresh** — reconcile G-20a + G-22j state into operator checklist | Wrong launch scope |
| **P0-2** | **Full production package verify** (local `verify-gosaki-production-package` / route manifest) | SEO/canonical errors |
| **P0-3** | **Client content sign-off** (schedule accuracy, discography, about) | Client-visible errors |
| **P0-4** | **DNS / SSL / hosting contract** for `www.gosaki-piano.com` | Cannot deploy |
| **P0-5** | **Production robots/noindex/canonical flip** verification plan | SEO disaster |
| **P0-6** | **Contact form E2E** (HubSpot on target domain) | Broken lead capture |
| **P0-7** | **Mobile spot-check** (real device, MENU + schedule month) | Client demo failure |
| **P0-8** | **Hosted admin plan** OR explicit “operator-assisted CMS” launch model | 本人 cannot self-serve without local dev |

### P1 — complete soon after launch

| ID | Task |
| --- | --- |
| **P1-1** | Discography routine edit UX (reduce per-slice ceremony) |
| **P1-2** | YouTube URL change → reflection runbook on production |
| **P1-3** | Schedule post-Save reflection operator checklist (regen + upload) |
| **P1-4** | Admin UI copy alignment (remove false「準備中」where Save proven) |
| **P1-5** | Preview refresh after Save (G-19f follow-up) |
| **P1-6** | Supabase production project decision (staging promotion vs new) |

### P2 — Kit generalization / post-launch

| ID | Task |
| --- | --- |
| **P2-1** | G-23 onboarding resume (G-23o+ crawl) — **not Gosaki-blocking** |
| **P2-2** | News CMS |
| **P2-3** | Image upload CMS (Storage) |
| **P2-4** | FTP auto-deploy (after G-7f1 re-approval) |
| **P2-5** | Bands/Projects full CMS |
| **P2-6** | seiichijazz.com pilot |
| **P2-7** | Physical DELETE schedule rows |

### 保留 — do not touch now

| Item | Reason |
| --- | --- |
| G-23o live crawl-dry-run | Paused at `d7a7250` |
| seiichijazz.com | User-deferred |
| Sariswing production ref `vsbvndwuajjhnzpohghh` | Forbidden |
| FTP `--apply` / mirror --delete | G-7f1 suspended |
| Closed Schedule P0 Save slices re-execution | G-22j1 forbidden |
| `/admin` production connection | AGENTS.md safety |
| `schedule_months` write | Derived read-only |

---

## 6. Risk classification

| Task bucket | Risk type |
| --- | --- |
| This audit, gap refresh doc, local package verify | **read-only / local** |
| Mobile spot-check planning, operator checklist | **read-only / local** |
| Routine Schedule/Discography UPDATE (armed slices) | **DB write** (staging) + **deploy** for public |
| Production full FTP upload | **deploy** + **production impact** |
| DNS / SSL / MX changes | **production impact** |
| Hosted admin deployment | **deploy** + **secrets/env** |
| HubSpot production domain config | **secrets/env** (portal settings) |
| G-23o live crawl | **network** — deferred |
| Supabase production migration | **DB write** + **production impact** |

---

## 7. G-23 pause note

```txt
G-23 onboarding: validate-only / fixture-dry-run / full-dry-run / report output / allowlist config — complete through G-23n
G-23o first approved crawl-dry-run: ON HOLD (d7a7250)
Gosaki does NOT require G-23o for current completion path — staging fixture + manual convert proven
```

---

## 8. Recommended next single task

**Gosaki production-cutover gap refresh (read-only / local)**

| Property | Value |
| --- | --- |
| Scope | Update G-20a inventory with G-22j Schedule P0 closure; enumerate prod package routes vs staging; operator pre-launch checklist |
| Risk | **read-only / local** |
| DB / Save / FTP | **none** |
| Deliverable | `gosaki-production-cutover-gap-refresh.md` + AI context update |
| Blocks | Nothing — unblocks P0-4/P0-5 planning |

**Do not** start G-20j full FTP upload or DNS changes in the same phase.

---

## 9. Operations NOT executed (this audit)

| Operation | Status |
| --- | --- |
| Live crawl | **not executed** |
| DNS lookup | **not executed** |
| Network / HTTP | **not executed** |
| DB connection / write | **not executed** |
| SQL mutation | **not executed** |
| Save | **not executed** |
| Package regen | **not executed** |
| FTP / deploy | **not executed** |
| GRANT / REVOKE / RLS | **not executed** |
| service_role | **not used** |

---

## 10. Key reference docs

| Doc | Topic |
| --- | --- |
| `gosaki-cms-scope-and-schedule-youtube-planning.md` | G-9a MVP scope |
| `gosaki-schedule-cms-p0-release-note.md` | G-22j2 P0 complete |
| `gosaki-schedule-p0-overall-closure.md` | G-22j1 chain |
| `gosaki-production-release-readiness-inventory.md` | G-20a blockers |
| `gosaki-sariswing-parity-gap-inventory.md` | G-22a gaps |
| `gosaki-staging-browser-qa-and-client-preview-readiness.md` | G-7j staging QA |
| `gosaki-schedule-canonical-route-implementation.md` | G-9c0a |
| `gosaki-schedule-legacy-month-route-stub.md` | G-9c0b |
