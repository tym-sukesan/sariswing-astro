# G-20u37 — Gosaki public-readiness QA planning

**Phase:** `G-20u37-gosaki-public-readiness-qa-planning`  
**Status:** **complete** — planning / checklist / static inspection prep only · **no implementation / Save / SQL / package / FTP / Edge**  
**Date:** 2026-07-15  
**Latest commit (planning baseline):** `d1e6652`  
**STG deployed package sourceCommit:** `e3616a3ab0fbda280d75278b0a6275205ae74763` (short: `e3616a3`)  
**Prior:** [G-20u36f slice complete](./gosaki-discography-g20u36f-marker-title-restore-slice-complete.md) · [G-20u36e slice complete](./gosaki-discography-g20u36e-controlled-save-slice-complete.md) · [G-20s whole-site audit](./gosaki-whole-site-product-quality-audit.md)

| Check | Status |
| --- | --- |
| Planning doc | **yes** |
| P0 / P1 / P2 checklist | **yes** |
| Static inspection plan | **yes** (read-only · not executed this phase) |
| Manual browser QA checklist | **yes** (operator · not executed this phase) |
| Implementation changes | **no** |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiPublicReadinessQaPlanned: true
phase: G-20u37-gosaki-public-readiness-qa-planning
publicReady: false
stagingQaReady: true
currentActiveRegression: 23/23 PASS
latestCommit: d1e6652
stgDeployedPackageSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763
currentHead: d1e6652
reUploadRequiresPackageRegeneration: true
implementationExecuted: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
edgeDeployExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u37a-gosaki-public-readiness-static-inspection
alternateNextPhase: G-20u37b-gosaki-public-readiness-manual-browser-qa
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use** · **unchanged**.

**Package note:** `e3616a3` is **already uploaded to STG** and matches restored Discography title. **OK for current STG QA.** Any **future re-upload** requires package regeneration at **current HEAD** (`d1e6652` or later), then freshness / preflight / verify:manual-upload PASS.

---

## 1. Purpose

Bring `gosaki-piano` STG closer to **public-launch quality** by defining:

1. Pre-launch QA priorities (P0 / P1 / P2)
2. Known baseline status after G-20u36e + G-20u36f
3. Read-only static artifact inspection plan (G-20u37a)
4. Operator manual browser QA checklist (G-20u37b)

This phase is **planning only**. No fixes, no Save, no package regen, no FTP.

---

## 2. STG URLs (QA targets)

| Route | URL |
| --- | --- |
| Home | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Admin | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| About | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/` |
| Schedule hub | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/` |
| Discography | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` |
| Contact | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/` |
| Link | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/link/` |
| Sitemap | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/sitemap-0.xml` |
| Robots | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/robots.txt` |

**Schedule monthly pages (2026-03〜2026-08):**

| Month | Hub route (data) | Legacy flat route (Wix crawl) |
| --- | --- | --- |
| 2026-03 | `/schedule/2026-03/` | `/2026-03/` |
| 2026-04 | `/schedule/2026-04/` | `/2026-04/` |
| 2026-05 | `/schedule/2026-05/` | `/2026-05/` |
| 2026-06 | `/schedule/2026-06/` | `/2026-06/` |
| 2026-07 | `/schedule/2026-07/` | `/2026-07/` |
| 2026-08 | `/schedule/2026-08/` | `/2026-08/` |

QA must verify **both** hub links and month page HTTP 200 + visible event cards where applicable.

---

## 3. QA priorities — P0 / P1 / P2

### P0 — Must fix before public launch

| ID | Area | Check | PASS criteria |
| --- | --- | --- | --- |
| P0-ENV1 | Environment | No production misconnection | No active config pointing at `vsbvndwuajjhnzpohghh` or Sariswing production paths |
| P0-ENV2 | Sariswing | Sariswing production untouched | No Gosaki QA/deploy touches Sariswing production |
| P0-URL1 | Routing | STG URL / base path consistency | All internal links, canonical, og:url use `/cms-kit-staging/gosaki-piano/` prefix on STG |
| P0-ADM1 | Admin safety | Dangerous Save paths | No exposed non-dry-run Save to production; staging-only / safe-state clearly indicated; controlled slices disarmed by default |
| P0-DIS1 | Discography | Marker string absent | `On a Clear Day [CMS Kit staging G-20u36e]` **not** in public-dist, Admin, or Public STG UI |
| P0-SCH1 | Schedule | Major pages render | Hub + 2026-03〜2026-08 month pages HTTP 200; event cards visible (not title-only blank) |
| P0-CON1 | Contact | HubSpot / form health | Form renders; submit works or **explicitly marked unverified** with blocker recorded |
| P0-LNK1 | Links | No fatal 404 / broken nav | Primary nav + hub month links return 200; no broken home→section navigation |
| P0-MOB1 | Mobile | No major layout collapse | Header, hero, schedule cards, discography, footer usable at ≤767px |
| P0-SEO1 | sitemap / robots | STG-appropriate | STG: noindex + robots Disallow OK; sitemap URLs use STG base; no `/admin/` ghost URLs in sitemap |
| P0-SEC1 | Secrets | No leak | No service_role, JWT, anon key, FTP creds, or tokens in HTML/JSON/CSS |
| P0-FTP1 | Deploy ops | Upload target clarity | Manual upload = `public-dist/` **contents** → `/cms-kit-staging/gosaki-piano/`; not repo root; no mirror --delete |

### P1 — Should fix before public launch if possible

| ID | Area | Check |
| --- | --- | --- |
| P1-VIS1 | Home / About / Discography / Schedule / Link | Visual polish — no obvious misalignment vs Wix reference |
| P1-FTR1 | Footer | SNS links visible, centered, all three platforms reachable |
| P1-IMG1 | Images | alt text present; broken images none on primary routes |
| P1-SEO1 | Meta | title / description / OGP reasonable per page |
| P1-SCH1 | Schedule | 2026-03〜2026-08 hub → month navigation works both route styles |
| P1-YT1 | YouTube | Home embed visible and playable |
| P1-CON1 | Contact | form action/method/HubSpot portalId/formId match expected staging config |
| P1-MOB1 | Mobile | nav toggle opens; header/footer stable on scroll |

### P2 — Acceptable post-launch

| ID | Area | Check |
| --- | --- | --- |
| P2-VIS1 | Visual | Minor spacing / typography tweaks |
| P2-COPY1 | Copy | Wording micro-edits |
| P2-SEO1 | SEO | Fine-tuning beyond MVP |
| P2-IMG1 | Performance | Image optimization / lazy-load polish |
| P2-ADM1 | Admin UX | Read-only admin polish, general edit UI |

---

## 4. Known baseline status (2026-07-15)

| Item | Status | Notes |
| --- | --- | --- |
| G-20u36e controlled Save full loop | **COMPLETE** | Marker applied then restored in G-20u36f |
| G-20u36f marker title restore full loop | **COMPLETE** | DB + STG UI = `On a Clear Day` |
| current-active-regression | **23/23 PASS** | at planning baseline |
| Latest commit | `d1e6652` | planning doc baseline |
| STG deployed package sourceCommit | `e3616a3` | matches restored title · already on STG |
| Build pages | **17** | per last package build record |
| Schedule events | **74** | Supabase read · dashboard snapshot |
| Schedule months | **2026-03〜2026-08** | 6 months · counts 13/10/12/11/14/14 |
| Discography releases | **4** | filtered `site_slug=gosaki-piano` |
| Discography tracks | **34** | filtered read |
| Admin included | **true** | hosted read-only admin at `/admin/` |
| Package fileCount | **31** | manual-upload package |
| safeForStaticFtp | **true** | last build verification |
| Contact | form present | HubSpot embed · **re-verify on current STG** (prior G-20s2b at older package) |
| External JS warnings | **present** | Wix parastorage / thunderbolt refs in CONVERSION_REPORT · monitor only unless broken |

---

## 5. Verdict (planning-time)

```txt
PUBLIC_READY: NO
STAGING_QA_READY: YES
```

| Verdict | Value | Rationale |
| --- | --- | --- |
| **PUBLIC_READY** | **NO** | Cross-cutting QA not yet executed under G-20u37; Contact/HubSpot re-verify pending on `e3616a3` package; mobile QA incomplete; Admin Save exposure policy for public launch not finalized |
| **STAGING_QA_READY** | **YES** | STG deployed · DB + static Discography restored · regression green · checklist + inspection plan ready · operator can begin G-20u37a/b immediately |

---

## 6. Static artifact inspection plan (G-20u37a · read-only)

**Allowed:** read-only grep / list / file read on existing artifacts.  
**Forbidden:** package regen, FTP, Save, SQL, DB write, network deploy.

**Artifact roots (read-only):**

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
tools/static-to-astro/output/gosaki-piano-astro/
tools/static-to-astro/output/static-public/gosaki-piano/
```

If `public-dist/` missing locally, note **artifact gap** — use STG curl read-only in G-20u37b instead. Do **not** regenerate package in G-20u37a without explicit approval.

### 6.1 Inspection commands (read-only)

```bash
cd ~/sariswing-astro/tools/static-to-astro

# P0-DIS1 — marker absent
rg -n "On a Clear Day \[CMS Kit staging G-20u36e\]" output/manual-upload/gosaki-piano/public-dist/ || true

# P0-SEC1 — secrets / service_role
rg -n "service_role|SUPABASE_SERVICE|eyJ[A-Za-z0-9_-]{20,}" output/manual-upload/gosaki-piano/public-dist/ || true

# P0-ENV1 — production ref STOP (should not be active target)
rg -n "vsbvndwuajjhnzpohghh" output/manual-upload/gosaki-piano/public-dist/ output/gosaki-piano-astro/ || true

# Staging ref (expected in admin JSON / meta when Supabase-connected)
rg -n "kmjqppxjdnwwrtaeqjta" output/manual-upload/gosaki-piano/public-dist/ output/gosaki-piano-astro/ || true

# P0-URL1 — deploy base
rg -n "/cms-kit-staging/gosaki-piano" output/manual-upload/gosaki-piano/public-dist/ | head

# Package inventory
find output/manual-upload/gosaki-piano/public-dist -type f | sort

# sitemap / robots local
cat output/manual-upload/gosaki-piano/public-dist/robots.txt
cat output/manual-upload/gosaki-piano/public-dist/sitemap-0.xml

# P0-ADM1 — Save UI strings in admin HTML
rg -n "saveEnabled|operation.*save|Save|dryRun|readOnly|productionUploadStop" output/manual-upload/gosaki-piano/public-dist/admin/index.html || true

# Discography restored title present
rg -n "On a Clear Day" output/manual-upload/gosaki-piano/public-dist/admin/index.html output/manual-upload/gosaki-piano/public-dist/discography/index.html

# Contact / HubSpot markers
rg -n "hubspot|hs-form|57909d0c-9b9f-470a-8a18-e176d1d1a459" output/manual-upload/gosaki-piano/public-dist/contact/index.html || true

# External JS warnings baseline
rg -n "parastorage|wix-thunderbolt" output/gosaki-piano-astro/CONVERSION_REPORT.md | head
```

### 6.2 Expected static PASS signals

| Check | Expected |
| --- | --- |
| Marker grep | **0 hits** in public-dist |
| service_role grep | **0 hits** in public-dist |
| production ref | **0 hits** as active Supabase URL target (STOP ref in guard text OK) |
| deploy base | canonical / hrefs use STG path |
| admin Save | `readOnly: true` / `saveEnabled: false` in embedded JSON or UI labels indicate staging read-only |
| sitemap | no `/admin/` URL |
| robots.txt | `Disallow: /` for STG |

---

## 7. Manual browser QA checklist (G-20u37b · operator)

**Instructions:** Open each URL · test **desktop (≥1024px)** and **mobile (≤767px)** · mark PASS / FAIL / SKIP · note failures in memo column.

### 7.1 Home

| Field | Value |
| --- | --- |
| URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Viewport | desktop · mobile |
| Look at | Hero/KV · header nav · footer · primary links |
| PASS if | HTTP 200 · layout OK · nav links work · no marker title · no obvious overlay bug |
| FAIL memo | |

### 7.2 About

| Field | Value |
| --- | --- |
| URL | `.../about/` |
| Viewport | desktop · mobile |
| Look at | About heading · Bands/Projects cards · images |
| PASS if | Content visible · cards stack OK on mobile · images load |
| FAIL memo | |

### 7.3 Schedule hub

| Field | Value |
| --- | --- |
| URL | `.../schedule/` |
| Viewport | desktop · mobile |
| Look at | Month list 2026-03〜2026-08 · link targets |
| PASS if | All 6 months linked · hub design OK · links return 200 |
| FAIL memo | |

### 7.4 Schedule monthly pages (×6)

| Month | URL (try both if linked) | Viewport | Look at | PASS if | FAIL memo |
| --- | --- | --- | --- | --- | --- |
| 2026-03 | `.../schedule/2026-03/` or `.../2026-03/` | desktop · mobile | Event cards · dates · venues | Cards visible · not empty title-only | |
| 2026-04 | same pattern | desktop · mobile | Event cards | Cards visible | |
| 2026-05 | same pattern | desktop · mobile | Event cards | Cards visible | |
| 2026-06 | same pattern | desktop · mobile | Event cards | Cards visible | |
| 2026-07 | same pattern | desktop · mobile | Event cards | Cards visible | |
| 2026-08 | same pattern | desktop · mobile | Event cards | Cards visible · Aug data present | |

### 7.5 Discography

| Field | Value |
| --- | --- |
| URL | `.../discography/` |
| Viewport | desktop · mobile |
| Look at | SKYLARK Track List · album images · track list |
| PASS if | First track = `On a Clear Day` · marker **absent** · `Like a Lover` present · layout OK |
| FAIL memo | |

### 7.6 YouTube (Home embed)

| Field | Value |
| --- | --- |
| URL | `.../` (home) |
| Viewport | desktop · mobile |
| Look at | YouTube iframe/embed section |
| PASS if | Embed visible · no broken placeholder · acceptable on mobile width |
| FAIL memo | |

### 7.7 Contact

| Field | Value |
| --- | --- |
| URL | `.../contact/` |
| Viewport | desktop · mobile |
| Look at | HubSpot form render · fields · submit button |
| PASS if | Form visible · fields usable · submit shows success (manual test OK) OR explicitly logged as blocker |
| FAIL memo | |

### 7.8 Link

| Field | Value |
| --- | --- |
| URL | `.../link/` |
| Viewport | desktop · mobile |
| Look at | External link list |
| PASS if | Links visible · open expected URLs · layout OK |
| FAIL memo | |

### 7.9 Admin

| Field | Value |
| --- | --- |
| URL | `.../admin/` |
| Viewport | desktop · mobile |
| Look at | Dashboard · Discography editor · Save buttons · env banner |
| PASS if | Read-only state clear · SKYLARK track 1 = `On a Clear Day` · no unexpected live Save to production · login/probe UX acceptable |
| FAIL memo | |

### 7.10 Footer / SNS

| Field | Value |
| --- | --- |
| URL | any primary page |
| Viewport | desktop · mobile |
| Look at | Footer SNS · copyright |
| PASS if | Facebook / X / Instagram links visible and centered · no overlap |
| FAIL memo | |

### 7.11 sitemap / robots

| Field | Value |
| --- | --- |
| URL | `.../sitemap-0.xml` · `.../robots.txt` |
| Viewport | n/a |
| Look at | URL list · Disallow rules |
| PASS if | STG URLs only · no `/admin/` in sitemap · robots blocks crawl on STG |
| FAIL memo | |

---

## 8. What was NOT done this phase

| Item | Status |
| --- | --- |
| Implementation / code fixes | **no** |
| Save / operation=save | **no** |
| SQL / GRANT / RLS | **no** |
| DB write | **no** |
| Edge deploy | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Static inspection execution | **no** (plan only) |
| Manual browser QA execution | **no** (checklist only) |
| service_role | **not used** |
| Production change | **no** |

---

## 9. Next

```txt
recommendedNextPhase: G-20u37a-gosaki-public-readiness-static-inspection
alternateNextPhase: G-20u37b-gosaki-public-readiness-manual-browser-qa
```

**Suggested order:** G-20u37a static inspection (read-only, fast) → G-20u37b operator browser QA → triage P0 failures → fix slices as separate approved phases → re-run QA until `PUBLIC_READY: YES`.
