# G-20u37a — Gosaki public-readiness static inspection result

**Phase:** `G-20u37a-gosaki-public-readiness-static-inspection`  
**Status:** **complete** — read-only static inspection executed · result record only  
**Date:** 2026-07-15  
**Inspection HEAD:** `771dd346e4b0dbbb241bbe4ed648d7852b1a6b0a`  
**Artifact sourceCommit:** `e3616a3ab0fbda280d75278b0a6275205ae74763` (MANIFEST.json)  
**Artifact generatedAt:** `2026-07-15T03:32:33.596Z`  
**Prior:** [G-20u37 planning](./gosaki-public-readiness-qa-planning.md)

| Check | Status |
| --- | --- |
| Static inspection executed | **yes** (read-only grep / file list) |
| Implementation changes | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role used | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiPublicReadinessStaticInspectionCompleted: true
phase: G-20u37a-gosaki-public-readiness-static-inspection
inspectionOnly: true
artifactSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
artifactFileCount: 31
inspectionHead: 771dd346e4b0dbbb241bbe4ed648d7852b1a6b0a
p0Blockers: false
publicReady: false
stagingQaReady: true
stagingBrowserQaReady: true
implementationExecuted: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u37b-gosaki-public-readiness-manual-browser-qa
```

**Artifact root inspected:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/`  
**STG deployed package:** `e3616a3` already on STG — valid QA target.  
**Re-upload rule:** any future upload requires package regen at current HEAD.

---

## 1. File list

| Item | Result |
| --- | --- |
| Total files | **31** (matches MANIFEST.json) |
| `index.html` | **present** |
| `about/index.html` | **present** |
| `contact/index.html` | **present** |
| `discography/index.html` | **present** |
| `link/index.html` | **present** |
| `schedule/index.html` | **present** |
| `admin/index.html` | **present** |
| `schedule/2026-03/` … `schedule/2026-08/` | **present** (6 months) |
| Legacy flat `2026-03/` … `2026-08/` | **present** (6 months) |
| `sitemap-0.xml` | **present** |
| `sitemap-index.xml` | **present** |
| `robots.txt` | **present** |
| `_astro/` assets | **4 files** (2 CSS + 2 JS) |
| `assets/about/bands/` | **5 images** |

**Judgment:** **PASS** — expected primary routes and schedule months present.

---

## 2. Marker confirmation

**Target string:** `On a Clear Day [CMS Kit staging G-20u36e]`  
**Scope:** entire `public-dist/`

| Check | Result |
| --- | --- |
| Marker grep | **0 hits** |

**Judgment:** **PASS** — marker absent from static package.

---

## 3. Discography restore confirmation

| File | On a Clear Day | Like a Lover | Marker |
| --- | --- | --- | --- |
| `admin/index.html` | **present** (SKYLARK track list) | **present** | **absent** |
| `discography/index.html` | **present** (SKYLARK Track List first track) | **present** | **absent** |

**Judgment:** **PASS** — restored title in static artifacts; marker not present.

---

## 4. Secrets / keys / token leak check

| Pattern | Hits | Classification |
| --- | --- | --- |
| `service_role` / `SUPABASE_SERVICE_ROLE` | 1 file (`_astro/...BA9SPEq7.js`) | **false positive** — forbidden-content regex `/service_role/i` in guard code, not a credential |
| `access_token` / `refresh_token` / `Authorization: Bearer` | admin HTML + JS only | **code reference** — session handling reads `session.access_token` at runtime; **no token value embedded** |
| `JWT` literal | admin HTML copy only | **documentation text** — "JWT / access_token / user_id / email not shown" |
| `eyJ…` JWT-shaped string | **admin/index.html only** (`data-gosaki-supabase-anon-key`) | **intentional staging anon key** — admin-only · noindex · not on public HTML pages |
| `sk_` | **0 hits** | **PASS** |
| `service_role` credential / key value | **0 hits** | **PASS** |

**Public HTML pages (`eyJ` outside admin):** **0 hits**

**Judgment:** **PASS for static P0 secrets** — no service_role leak; staging anon key admin-only by design. Public launch must exclude `/admin/` from production package (already documented in admin safety copy).

---

## 5. Project ref check

| Ref | Hits | Classification |
| --- | --- | --- |
| `vsbvndwuajjhnzpohghh` (production STOP) | 1 file (`_astro/...BA9SPEq7.js`) | **false positive** — STOP ref in production-ref guard (`production_ref_blocked`), not active Supabase URL |
| `kmjqppxjdnwwrtaeqjta` (staging) | admin HTML + JS + storage URLs | **expected** — staging Supabase URL / Edge endpoints / public storage |

**Judgment:** **PASS** — no active production ref wiring in static artifacts.

---

## 6. Base path check

| Check | Result |
| --- | --- |
| `/cms-kit-staging/gosaki-piano/` in HTML | **present** on all primary routes |
| Wrong root `href="/gosaki-piano/` | **0 hits** |
| `sariswing` reference | **0 hits** |
| `gosaki-piano.com` in public-dist | **0 hits** |

**Judgment:** **PASS** — STG deploy base consistent; no obvious path collapse.

---

## 7. sitemap / robots

### robots.txt

```txt
User-agent: *
Disallow: /
```

**Judgment:** **PASS for STG** — blocks crawl.

### sitemap-0.xml

| Check | Result |
| --- | --- |
| Base URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Routes listed | home · about · contact · discography · link · schedule hub · schedule/2026-03 … 2026-08 |
| `/admin/` in sitemap | **absent** |
| `gosaki-piano.com` | **absent** |

**Judgment:** **PASS for STG** — sitemap URLs use staging base; admin excluded.

---

## 8. Admin Save path check (static)

| Item | Finding | Priority |
| --- | --- | --- |
| Page title / badges | `staging · 読み取り専用` · `READ-ONLY` · `Save disabled` | **OK** |
| `data-g11c6-save-enabled` | `false` | **OK** |
| Discography Save buttons | **disabled** with explicit tooltip | **OK** |
| Discography dry-run buttons | **enabled** — local + endpoint dry-run (`operation=dryRun`) | **P1** — staging-only by design; verify no accidental save path in browser QA |
| Endpoint dry-run JS | POST to staging Edge with anon bearer · blocks production ref | **P1** — intentional prototype wiring |
| YouTube Save button | **disabled** | **OK** |
| Admin safety copy | prod package excludes `/admin/` · G-20j STOP | **OK** |

**Public launch policy (static recommendation):**

- STG: hosted read-only admin at `/admin/` is acceptable for operator QA (noindex).
- Production cutover: **exclude `/admin/`** from production package; sitemap already excludes admin.
- Before PUBLIC_READY: confirm Save remains disabled or admin is unreachable on production host.

**Judgment:** **PASS for STG static** · **P1 carryover** for public-launch Save exposure policy (browser QA + prod package policy).

---

## 9. Contact / HubSpot static check

| Item | Finding |
| --- | --- |
| Form container | `#gosaki-contact-hubspot-embed` **present** |
| HubSpot script | `https://js.hsforms.net/forms/embed/21392032.js` |
| Form frame | `data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459"` · `data-portal-id="21392032"` |
| Legacy Wix form action | **none** (HubSpot replacement active) |
| CONVERSION_REPORT contact form | `action=(none) method=GET` on source fixture — replaced in built contact page |

**Judgment:** **static PASS (embed present)** · **P0 browser carryover** — submit / success message not verifiable from static HTML alone. Re-verify on current STG package in G-20u37b (prior G-20s2b PASS may be stale vs `e3616a3`).

---

## 10. External JS / warnings (CONVERSION_REPORT.md)

| Category | Finding | Priority |
| --- | --- | --- |
| External JS (parastorage / Wix Thunderbolt) | Listed for source fixtures · **not copied** to built public-dist | **P2** — known Wix crawl artifact; monitor if month pages break without JS |
| Contact external JS warnings | parastorage + sentry in source contact.html | **P2** — built contact uses HubSpot embed instead |
| Inline scripts not migrated | Many Wix inline scripts in source fixtures | **P2** — static export does not rely on Thunderbolt runtime |

**Judgment:** **note only** — no static P0 blocker; month schedule pages contain baked event cards in HTML.

---

## 11. Schedule static spot-check

Sample: `schedule/2026-03/index.html` contains `gosaki-schedule-event-card` articles with venue/time/出演 text and `scheduleDataSource=supabase` marker.

**Judgment:** **PASS for static** — month pages not title-only blank in artifact.

---

## 12. Findings summary

### P0 findings (static inspection)

| ID | Area | Static result | Blocker? |
| --- | --- | --- | --- |
| P0-DIS1 | Discography marker | **absent** | **no** |
| P0-SEC1 | service_role leak | **none** | **no** |
| P0-ENV1 | production ref active | **none** (guard only) | **no** |
| P0-URL1 | STG base path | **consistent** | **no** |
| P0-SEO1 | sitemap / robots STG | **OK** | **no** |
| P0-SCH1 | schedule month artifacts | **present with cards** | **no** (static) |
| P0-ADM1 | Admin Save exposure | Save **disabled** · dry-run only | **no** (static STG) — **browser/policy carryover** |
| P0-CON1 | Contact HubSpot | embed **present** | **no** (static) — **browser carryover** |
| P0-MOB1 | Mobile layout | not testable statically | **browser carryover** |

```txt
P0_BLOCKERS: false
```

No static-only P0 blocker found. Remaining P0 items require manual browser QA (G-20u37b).

### P1 findings

| ID | Finding |
| --- | --- |
| P1-ADM1 | Admin hosts staging anon key + dry-run endpoint wiring (admin-only · noindex) |
| P1-ADM2 | Discography endpoint dry-run POST enabled — confirm `didWrite=false` in browser QA |
| P1-ROUTE1 | Dual schedule routes: `/schedule/2026-XX/` and legacy `/2026-XX/` both packaged — verify hub links in browser QA |
| P1-SEO1 | All public pages carry `noindex` — correct for STG; production cutover must flip robots/canonical strategy |
| P1-CON1 | HubSpot submit must be re-verified on `e3616a3` STG |

### P2 findings

| ID | Finding |
| --- | --- |
| P2-EXT1 | CONVERSION_REPORT external-js warnings on Wix source fixtures (not in built bundle) |
| P2-EXT2 | Inline Wix scripts not migrated — acceptable for static export |

### Manual browser QA carryovers (G-20u37b)

| Item | Why static insufficient |
| --- | --- |
| Contact HubSpot submit + success | runtime form behavior |
| Mobile header / nav / footer / schedule / discography | viewport rendering |
| YouTube embed playable | iframe runtime |
| Admin login + dry-run endpoint smoke | auth session required |
| Schedule hub → month navigation (both route styles) | link resolution on live STG |
| Footer SNS visibility | visual check |

---

## 13. Verdict

| Verdict | Value | Rationale |
| --- | --- | --- |
| **P0_BLOCKERS** | **false** | No marker · no service_role · no active production ref · STG sitemap/robots OK · discography restored |
| **PUBLIC_READY** | **NO** | Cross-cutting P0 not cleared — Contact · mobile · Admin public policy · browser QA pending |
| **STAGING_QA_READY** | **YES** | Static artifacts healthy for STG QA target `e3616a3` |
| **STAGING_BROWSER_QA_READY** | **YES** | Proceed to G-20u37b manual browser checklist |

---

## 14. What was NOT done this phase

| Item | Status |
| --- | --- |
| Implementation / code fixes | **no** |
| Save / operation=save | **no** |
| SQL / DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Live HTTP / browser QA | **no** (next phase) |
| JWT / token values in doc | **not recorded** |

---

## 15. Next

```txt
recommendedNextPhase: G-20u37b-gosaki-public-readiness-manual-browser-qa
```

Execute operator browser checklist from [G-20u37 planning](./gosaki-public-readiness-qa-planning.md) §7 against live STG URLs.
