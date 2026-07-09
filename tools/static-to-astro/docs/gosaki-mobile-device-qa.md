# G-20s1 — Gosaki mobile device QA

**Phase:** `G-20s1-gosaki-mobile-device-qa`  
**Status:** **complete** — read-only mobile QA recorded · **no fixes implemented**  
**Date:** 2026-07-09  
**Verified at (UTC):** `2026-07-09T07:15:00Z` (approx.)  
**Base commit:** `db15e57`  
**Viewport:** 390×844 (iPhone-class · Playwright Chromium mobile UA)  
**Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`  
**Prior:** [gosaki-schedule-manual-upload-execution-closure.md](./gosaki-schedule-manual-upload-execution-closure.md) (G-20r4e) · [gosaki-whole-site-product-quality-audit.md](./gosaki-whole-site-product-quality-audit.md) (G-20s)

| Check | Status |
| --- | --- |
| Mobile QA recorded | **yes** |
| All 7 routes HTTP 200 | **yes** |
| MENU toggle functional | **yes** |
| Schedule August mobile layout | **PASS** |
| Visible horizontal scroll | **none** (clipped) |
| Major layout breakage | **none** |
| Fix implementation | **no** |
| FTP / deploy | **no** |

---

## Gates

```txt
gosakiMobileDeviceQaComplete: true
phase: G-20s1-gosaki-mobile-device-qa
baseCommit: db15e57
viewport: 390x844
qaMethod: playwright-chromium-mobile-ua
allRoutesHttp200: true
menuToggleFunctional: true
scheduleAugustMobilePass: true
visibleHorizontalScroll: false
majorLayoutBreakage: false
clientPreviewVerdict: NOT_READY
clientPreviewBlockerP0: P0-C1-contact-hubspot-e2e
readyForG20s2ContactHubspotE2e: true
readyForClientPreview: false
fixImplementationInPhase: false
ftpReExecutionForbidden: true
formSubmitExecuted: false
```

**Note:** Playwright mobile emulation ≠ physical device. Real iPhone spot-check remains optional P2.

---

## 1. Purpose

Gosaki staging preview の **スマホ表示**（≤390px）を確認し、クライアント preview 前の **P0/P1/P2** を整理する。本フェーズは **QA 記録のみ** — CSS/HTML 修正は行わない。

---

## 2. QA method

| Item | Value |
| --- | --- |
| Tool | Playwright Chromium · headless |
| Viewport | **390 × 844** |
| User-Agent | iPhone Safari 17 class |
| Network | staging public GET only |
| Form submit | **not executed** |
| FTP | **not executed** |

---

## 3. Routes checked

| # | URL | HTTP | Overflow (user-visible) | CSS |
| --- | --- | --- | --- | --- |
| 1 | `/` | **200** | **none** (`overflow-x: clip/hidden`) | `index.YcHrHZH4.css` ✓ |
| 2 | `/schedule/` | **200** | **none** | ✓ |
| 3 | `/schedule/2026-08/` | **200** | **none** | ✓ |
| 4 | `/about/` | **200** | **none** (clipped) | ✓ |
| 5 | `/discography/` | **200** | **none** (clipped) | ✓ |
| 6 | `/contact/` | **200** | **none** (clipped) | ✓ |
| 7 | `/link/` | **200** | **none** (clipped) | ✓ |

**Viewport meta:** `width=device-width, initial-scale=1.0` on all pages.

---

## 4. Area-by-area results

### 4.1 Header / Nav / MENU

| Check | Result |
| --- | --- |
| `#SITE_HEADER` present | **PASS** |
| Header background | beige `rgb(234, 215, 189)` — not yellow regression |
| Header height @390px | ~68px — compact |
| `.nav-toggle` "MENU" | **PASS** |
| Toggle opens `.global-nav` | **PASS** |
| Nav links after open | **6** — Home · About · Schedule · Discography · Contact · Link |
| Schedule in nav | **PASS** |

**Verdict:** **PASS** — mobile MENU functional since G-8g1/G-8g2 fixes.

### 4.2 Horizontal scroll

| Check | Result |
| --- | --- |
| User can scroll horizontally | **no** on all 7 routes |
| `html` overflow-x | `clip` |
| `body` overflow-x | `hidden` |
| Internal Wix page width | `980px` on Home/About/Discography/Contact/Link (`.wixui-page`) |
| Schedule pages internal width | **390px** — fits viewport |

**Verdict:** **PASS** for user experience — no visible horizontal scroll.  
**Note (P2):** Wix root still `980px` wide on non-schedule pages; clipped by CSS baseline (G-8b). Not a client-facing blocker.

### 4.3 Home

| Check | Result |
| --- | --- |
| Hero / KV renders | **PASS** |
| Footer overlay on hero | **no** — footer at document bottom |
| YouTube embed iframe | **present** |
| Page title | `Goto Saki Official Web Site` (English — **P1**) |
| Footer SNS + copyright | **PASS** |

### 4.4 Schedule hub

| Check | Result |
| --- | --- |
| `.gosaki-schedule-hub` | **present** |
| 2026.08 month link | **PASS** — `href="…/schedule/2026-08/"` · text `2026.08` |
| Layout @390px | clean · no overflow |

### 4.5 Schedule 2026-08

| Check | Result |
| --- | --- |
| Event cards | **14** |
| Card width | **358px** each (16px gutter) |
| Layout | single column (`flex-direction: column`) |
| Same-day 8/16 (2 events) | **PASS** — Quartet @ Our Delight + 新谷健介オノマトペ @ キンのツボ |
| `scheduleDataSource=supabase` | **yes** |
| Exclusions 007/009/013/008/018 | **absent** |

**Verdict:** **PASS** — August mobile schedule is client-previewable.

### 4.6 Discography

| Check | Result |
| --- | --- |
| Album section `#comp-llexymel` | **present** |
| Track List / Personnel headings | **present** |
| Track List underline regression (G-8g8) | **fixed** — `text-decoration: none` |
| Album images visible | **4** |
| Card layout @390px | acceptable · no user scroll |

**Verdict:** **PASS**

### 4.7 About

| Check | Result |
| --- | --- |
| Wix About content | **renders** |
| Bands / Projects section | **present** |
| Band headings (5) | ごさきりかこTrio · 新谷健介オノマトペ · ケアレスホーネッツ · 紀々音 · カリビアンファンクション |
| Band images visible | **5** (~280–311px wide) |
| Layout @390px | stacked · readable |

**Verdict:** **PASS**

### 4.8 Contact

| Check | Result |
| --- | --- |
| Page heading / intro JP text | **present** |
| HubSpot iframe | **present** · 350×591px @390px viewport |
| Wix legacy form | **absent** |
| Visible form inputs (in page DOM) | **0** (fields inside iframe) |
| Form submit E2E | **not tested** (forbidden this phase) |

**Verdict:** **embed renders on mobile** · **P0-C1 remains** — submit → inbox E2E unverified (`G-20s2`).

### 4.9 Link

| Check | Result |
| --- | --- |
| External links | **11** |
| Layout @390px | acceptable |
| Footer | **PASS** |

### 4.10 Footer / SNS

| Check | Result |
| --- | --- |
| `#SITE_FOOTER` on all routes | **yes** |
| Facebook / X / Instagram text links | **PASS** (G-8g1 fallback) |
| Copyright | **PASS** |
| SNS/copyright overlap | **none** observed |

---

## 5. P0 / P1 / P2 classification (post G-20s1)

### P0 — client preview blockers

| ID | Area | Issue | G-20s1 result | Next |
| --- | --- | --- | --- | --- |
| ~~**P0-S1**~~ | Schedule | 2026-08 not on staging | **RESOLVED** (G-20r4e) | — |
| ~~**P0-M1**~~ | Mobile | MENU / schedule / footer unverified | **RESOLVED** — Playwright 390px PASS | optional real-device spot-check (P2) |
| **P0-C1** | Contact | HubSpot submit E2E unverified | **STILL OPEN** — iframe renders · submit not tested | **G-20s2** |

### P1 — preview possible · quality improvement

| ID | Area | Issue | G-20s1 notes |
| --- | --- | --- | --- |
| **P1-H1** | Home | English title / OGP | `Goto Saki Official Web Site` |
| **P1-S1** | Schedule | `<>` angle-bracket titles | Wix parity · visible on August cards |
| **P1-L1** | Legacy stubs | English redirect copy | not re-tested this phase |
| **P1-CT1** | Contact | Preview disclaimer before client share | recommend with G-20s2 |
| **P1-A1** | About | Nav label "About" English | unchanged |

### P2 — defer

| ID | Area | Issue |
| --- | --- | --- |
| **P2-M1** | Mobile | Real iPhone / Android spot-check (Playwright ≠ device) |
| **P2-W1** | Layout | Wix `980px` inner page clipped on non-schedule routes |
| **P2-S1** | Schedule | `#014` description typo · beer fest empty time/price |
| **P2-SEO1** | sitemap | `/admin/` ghost URL |

---

## 6. Client preview judgment

```txt
clientPreviewVerdict: NOT_READY
reason: P0-C1 Contact HubSpot E2E unverified
mobileQaVerdict: PASS_WITH_NOTES
scheduleAugustMobile: READY
```

| Ready for client preview? | **No** — Contact submit path must be verified first |
| Shareable now? | Schedule August mobile · Discography · About · Link — **yes with disclaimer on Contact** |
| Next required phase | **G-20s2-contact-hubspot-e2e-verify** |

---

## 7. Fixes needed (record only — not implemented)

| Priority | Area | Fix | Phase |
| --- | --- | --- | --- |
| **P0** | Contact | HubSpot form submit E2E on staging + inbox confirm | G-20s2 |
| **P1** | Contact | Add preview disclaimer ("送信テスト未完了") | G-20s2/G-20s3 |
| **P1** | Home | JP title / OGP copy | G-20s3 |
| **P1** | Schedule | `<>` titles client sign-off | G-20r2c optional |
| **P2** | Layout | Reduce Wix 980px clip dependency | future CSS slice |
| **P2** | Mobile | Operator real-device spot-check | optional |

---

## 8. 今回（G-20s1）実行していないこと

| Operation | Executed |
| --- | --- |
| CSS/HTML fix | **no** |
| FTP / deploy | **no** |
| Form submit / HubSpot send | **no** |
| DB write / SQL / Save | **no** |
| package regen | **no** |
| production change | **no** |
| commit / push | **no** |

---

## 9. Next phase

| Phase | Scope |
| --- | --- |
| **G-20s2-contact-hubspot-e2e-verify** | Staging form submit ×1 + inbox · disclaimer |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-mobile-device-qa.mjs
```
