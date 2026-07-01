# G-20a — Gosaki production release readiness inventory

**Phase:** `G-20a-gosaki-production-release-readiness-inventory`  
**Status:** **complete** — read-only inventory / planning only; **no implementation, no deploy**  
**Date:** 2026-07-01  
**Base commit:** `85021b0`  
**Prior:** G-19e Discography tracklist Save / reflection chain **closed**

| Check | Status |
| --- | --- |
| CMS feature inventory | **yes** |
| Blocker classification | **yes** |
| Test / PoC text scan (staging DB + live HTTP) | **yes** |
| Production config inventory | **yes** |
| Operator capability matrix | **yes** |
| Generalization backlog | **yes** |
| Save / DB write / FTP / package regen | **no** |

---

## Gates

```txt
gosakiProductionReleaseReadinessInventoryComplete: true
phase: G-20a-gosaki-production-release-readiness-inventory
readyForG20bTestTextCleanupPlanning: true
readyForG20cProductionCutoverPreflight: false
readyForProductionFtpDeploy: false
readyForAnyFutureFtpApply: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase staging:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only in this inventory. **STOP** if host is `vsbvndwuajjhnzpohghh` (Sariswing production).

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `85021b0` |
| `origin/main` | `85021b0` |
| Working tree | clean at inventory start |

---

## 2. Current environment snapshot

| Item | Staging (today) | Production (target) |
| --- | --- | --- |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | `https://www.gosaki-piano.com/` (Wix live today) |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | `/` (on client domain — **not configured in repo yet**) |
| **robots / SEO** | `noindex` + disallow — **intentional** | Must flip to indexable + production sitemap |
| **canonical** | staging origin + deployBase | Must point to `www.gosaki-piano.com` |
| **Supabase** | `kmjqppxjdnwwrtaeqjta` (Kit staging) | **Undecided** — separate prod project vs staging promotion |
| **Admin URL** | `/__admin-staging-shell/musician-basic/` — **local dev only** (`DEV` + `ENABLE_ADMIN_STAGING_SHELL`) | **Not deployed** — needs hosted admin plan |
| **FTP / deploy** | Manual upload only; **G-7f1 auto-apply suspended** | High-risk — separate approval per G-7f1 |
| **SSL / domain** | Operator Lolipop subpath | Client domain cutover TBD |

---

## 3. CMS feature inventory

### 3.1 Schedule

| Aspect | State |
| --- | --- |
| **Public data** | `scheduleDataSource=supabase` on month pages (G-12b verified); hub + `/schedule/YYYY-MM/` |
| **DB** | 60 rows `site_slug=gosaki-piano` on staging |
| **Admin UI** | Staging shell Schedule page — row picker + field slices |
| **Proven Save chains** | G-13e Event A cleanup; G-13c2e Event B cleanup; G-14b1f routine `price` edit (`schedule-2026-04-005`) |
| **Public reflection** | Per-month HTML upload pattern (G-14c standard) |
| **Gaps** | INSERT new events; image upload; home featured; routine multi-field edit without per-slice arms; production admin hosting |
| **Operator today** | Edit **existing** rows via gated slices — **not** self-serve for all fields |

### 3.2 YouTube (home embed)

| Aspect | State |
| --- | --- |
| **Public** | Home embed from `gosaki-piano-youtube-embed.json` → `applyGosakiHomeYouTubeEmbed` |
| **Proven path** | G-10c static JSON Save + G-11c workflow dispatch chain closed (`I-eY9YMq9GI` on staging) |
| **Admin UI** | Staging shell YouTube page |
| **Gaps** | Production workflow secrets / allowlist; reflection after URL change still operator-driven regen + upload |
| **Operator today** | URL change possible via proven workflow — **requires operator** for GitHub dispatch + upload |

### 3.3 About

| Aspect | State |
| --- | --- |
| **Public** | Wix HTML + G-8a band cards + G-10h static JSON blocks (`gosaki-piano-about-content.json`) |
| **Proven Save** | G-10h profile HTML + bands HTML static JSON write (staging shell API) |
| **Admin UI** | About HTML page in staging shell |
| **Gaps** | `gosaki-piano-about-content.json` may be partial vs full About CMS vision; image Storage deferred |
| **Operator today** | Text/HTML block edit via staging admin — **dev environment** |

### 3.4 Discography

| Aspect | State |
| --- | --- |
| **Public** | `discographyDataSource=supabase` — scalars + track titles patched (G-18h hook) |
| **Proven scalar chains** | `purchase_url` (002), `artist` (001, 003), `label` (004) — all closed with upload |
| **Proven tracklist chains** | G-18g2 track 7 (002); G-19b1 track 1 (004) — **both contain test titles** |
| **Dry-run** | G-19a generic textarea diff all 4 albums |
| **Admin UI** | Discography page — per-slice / per-album arms |
| **Gaps** | Bulk tracklist Save UX; personnel/price; cover images; INSERT/DELETE albums; preview refresh (G-19f) |
| **Operator today** | Single-field / single-title slices only — **high ceremony** |

### 3.5 Contact

| Aspect | State |
| --- | --- |
| **Public** | Static Wix-derived contact page; HubSpot config in `gosaki-piano-contact-hubspot.json` |
| **Live staging** | `/contact/` includes HubSpot embed script (**present**) |
| **CMS** | **None** — form IDs in static JSON config |
| **Gaps** | End-to-end form submit QA on staging; production HubSpot domain allowlist |
| **Operator today** | Config edit in repo — not self-serve |

### 3.6 Images

| Aspect | State |
| --- | --- |
| **Public** | Wix CDN URLs in HTML; band images static `public/images/bands/` |
| **CMS** | **Deferred** — no Supabase Storage upload UI for Gosaki |
| **Gaps** | Schedule flyers, discography covers, about photos — all manual / Wix CDN |

### 3.7 Admin auth

| Aspect | State |
| --- | --- |
| **Path** | `/__admin-staging-shell/musician-basic/` (+ auth forgot/reset pages) |
| **Gate** | `import.meta.env.DEV` **and** `ENABLE_ADMIN_STAGING_SHELL=true` |
| **Auth** | Supabase staging auth (`staging-auth-config.ts`) — G-5y-d |
| **Production `/admin`** | **Explicitly not connected** (AGENTS.md safety) |
| **Gaps** | Hosted admin on client server; production Supabase auth users; session on non-dev build |

### 3.8 Public reflection

| Aspect | State |
| --- | --- |
| **Standard** | G-14c playbook + G-16b–G-19e per-module closures |
| **Flow** | DB/JSON Save → `build-gosaki-staging-admin-package.mjs` → local verify → **operator manual FTP** (1-file minimal when CSS unchanged) |
| **FTP safety** | G-7f incident — `readyForAnyFutureFtpApply: false` until explicit re-approval |
| **Gaps** | No one-click Publish; no admin “本番反映” (UI shows **未開放**) |

### 3.9 Publish / upload flow

| Aspect | State |
| --- | --- |
| **Package** | `output/manual-upload/gosaki-piano/public-dist/` (gitignored) |
| **Verify** | `verify:manual-upload`, `verify-static-public-artifact` |
| **Auto FTP** | **Suspended** (G-7f1) |
| **GitHub deploy workflow** | Exists for Sariswing pattern — **not** Gosaki production cutover |
| **Operator home copy** | Still says「保存は準備中です」— **misleading** vs proven Save slices |

---

## 4. Blocker classification

### 4.1 Must before public (blocking)

| # | Item | Rationale |
| --- | --- | --- |
| M1 | **Test title cleanup** — `Like a Lover（テスト）`, `Mary Ann（テスト）` | DB + live `/discography/` — client-visible |
| M2 | **Production deployBase / canonical / OGP** | Staging URLs must not ship to `gosaki-piano.com` |
| M3 | **robots / noindex flip** | Staging is noindex; production must allow index |
| M4 | **Production cutover preflight** | Domain, server path, SSL, rollback — **separate G-20c+** with G-7f1 FTP approval |
| M5 | **Client content sign-off** | Schedule accuracy, visuals vs Wix (G-12c checklist) |
| M6 | **Supabase production strategy** | Staging project must not become accidental production SoT without decision |

### 4.2 Should before public (strongly recommended)

| # | Item | Rationale |
| --- | --- | --- |
| S1 | **Hosted admin for 本人** | Today admin is local-dev only — cannot operate CMS on own server |
| S2 | **Contact form E2E verify** | HubSpot on staging — submit + notification path |
| S3 | **Admin UI copy / Save readiness** | Remove「保存は準備中」; document what 本人 can actually Save |
| S4 | **Preview refresh after Save (G-19f)** | Observed stale preview card after G-19b1 Save |
| S5 | **sitemap.xml production** | Astro sitemap — verify production host + routes |
| S6 | **Full package regen + visual QA** | One clean production package before first upload |

### 4.3 Can defer after public

| # | Item |
| --- | --- |
| D1 | Schedule INSERT / new event creation UI |
| D2 | Image upload CMS (Storage) |
| D3 | Discography personnel / price fields |
| D4 | Bands/Projects full CMS (keep static JSON) |
| D5 | News / Link page CMS |
| D6 | FTP auto-deploy from admin |
| D7 | Multi-YouTube embeds |
| D8 | Tracklist bulk Save (G-19g+) |
| D9 | Sariswing `/admin` merge |

### 4.4 Generalization backlog (Kit — not Gosaki launch blockers)

| # | Item |
| --- | --- |
| G1 | Unified `site-config` (`gosaki-piano` vs example `gosaki` slug drift) |
| G2 | Module registry for Save slices + reflection metadata |
| G3 | Public reflection pipeline as reusable CLI step |
| G4 | Upload preflight verifier template (G-14c + per-module) |
| G5 | Schema / seed templates per `site_slug` |
| G6 | Hosted admin template deploy (not `__admin-staging-shell` dev gate) |

---

## 5. Test text / PoC trace inventory (read-only scan)

**Scan date:** 2026-07-01  
**Methods:** staging Supabase REST (anon); live HTTP GET on key routes

### 5.1 Discography test titles (DB + live public)

| legacy_id | track | title | DB | live `/discography/` |
| --- | --- | --- | --- | --- |
| discography-002 | 7 | `Like a Lover（テスト）` | **yes** | **yes** |
| discography-004 | 1 | `Mary Ann（テスト）` | **yes** | **yes** |

**Cleanup required before public:** revert or replace both titles → production values, then reflection upload.

### 5.2 Schedule test / PoC markers

| Scan | Result |
| --- | --- |
| DB `schedules` with `（テスト）` / `PoC` / `[CMS` | **0 rows** (`site_slug=gosaki-piano`) |
| Live `/schedule/`, `/schedule/2026-07/`, `/schedule/2026-03/` | **no** `（テスト）`, PoC, G-9g markers |

### 5.3 Other live routes

| Route | `（テスト）` | PoC / CMS markers |
| --- | --- | --- |
| `/` | absent | absent |
| `/about/` | absent | absent |
| `/contact/` | absent | absent |

### 5.4 Codebase constants (not public until saved)

Test strings exist in **verifier / guard / type constants** (G-18g2, G-19b1) — expected; not live until DB reflects them. Already live for both discography rows above.

---

## 6. Production configuration checklist

| Setting | Staging (current) | Production (needed) |
| --- | --- | --- |
| **PUBLIC URL** | `yskcreate.weblike.jp/.../gosaki-piano/` | `https://www.gosaki-piano.com/` |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | `/` |
| **canonical / og:url** | staging origin | production origin per route |
| **robots** | noindex, disallow | allow + production `robots.txt` |
| **sitemap** | staging URLs in generated artifact | regenerate with production base |
| **OGP** | staging | production images + URLs |
| **Admin URL** | local dev shell only | TBD — subdomain or `/admin` on client host |
| **Supabase** | `kmjqppxjdnwwrtaeqjta` | new project or promoted env — **decision required** |
| **Server path** | `/cms-kit-staging/gosaki-piano/` on Lolipop | client document root or subpath |
| **SSL** | shared staging host | `gosaki-piano.com` certificate |
| **FTP** | manual, G-7f1 gated | same — **never auto mirror --delete** |

Reference: `tools/static-to-astro/config/sites/gosaki.site-config.example.json` (`production.enabled: false` today).

---

## 7. Operator capability matrix

### 7.1 本人が公開時点でできること（staging dev 環境前提 — 現状）

| Action | Possible? | Notes |
| --- | --- | --- |
| View staging preview URL | **yes** | read-only browser |
| Schedule edit (all fields freely) | **no** | slice-gated; arms required |
| Schedule edit (proven slices) | **no** without operator | needs dev stack + env arms |
| YouTube URL change | **no** alone | workflow + operator |
| Discography edit | **no** alone | slice-gated PoC |
| About HTML edit | **no** alone | staging shell dev only |
| Publish to web | **no** |「本番反映 未開放」 |

### 7.2 戸山（operator）が代行すること（today）

| Action | Status |
| --- | --- |
| Local dev admin + Save arms | **routine** |
| afterVerification SELECT | **routine** |
| Package regen | **routine** |
| Manual FTP upload (1-file or full) | **with G-7f1 approval** |
| HTTP verify | **routine** |
| GitHub workflow dispatch (YouTube) | **proven** |
| Supabase migrations / GRANT | **gated phases** |

### 7.3 公開後に実装すべきこと（product）

| Priority | Item |
| --- | --- |
| P1 | Hosted admin + production auth |
| P2 | Test text cleanup + production cutover |
| P3 | Routine Schedule edit without per-slice env arms |
| P4 | One-click or guided Publish (still manual FTP acceptable if documented) |
| P5 | G-19f preview refresh; G-19g next tracklist slice |

---

## 8. Closed chains reference (do not re-Save / re-upload without new approval)

| Row / field | Chain |
| --- | --- |
| discography-002 track 7 | G-18g2 + G-18h |
| discography-004 track 1 | G-19b1 + G-19c + G-19d + G-19e |
| discography-001 artist | G-16b-f |
| discography-002 purchase_url | G-15c-f |
| discography-003 artist | G-15e-f |
| discography-004 label | G-17e-f |
| schedule-2026-04-005 price | G-14b1f |

Test cleanup (G-20b) will require **new** approval IDs — not reuse of closed chains.

---

## 9. Recommended next phases

| Phase | Scope |
| --- | --- |
| **G-20b** | Test text cleanup planning + Save + reflection (discography-002 track 7, discography-004 track 1) |
| **G-20c** | Production cutover preflight (URL, deployBase, robots, package, FTP plan) |
| **G-20d** | Hosted admin / production auth planning |
| **G-19f** | Tracklist Save UX — stale preview refresh (can parallel) |
| **G-19g** | Next tracklist Save slice planning (post-cleanup) |

---

## 10. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Save / DB write | **no** |
| package regen | **no** |
| FTP / upload / deploy | **no** |
| production / Sariswing | **no** |
| commit / push | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20a-gosaki-production-release-readiness-inventory.mjs
```
