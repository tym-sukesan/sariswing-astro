# G-20u39 — Gosaki staging P1 review planning

**Phase:** `G-20u39-gosaki-staging-p1-review-planning`  
**Status:** **complete** — planning / review only  
**Date:** 2026-07-15  
**Planning HEAD:** `5957d8d` (= `origin/main`)  
**Prior:** [G-20u38d hosting not ready record](./gosaki-production-hosting-not-ready-and-return-to-staging-p1-record.md) · [G-20u37c final P0 review](./gosaki-public-readiness-final-p0-review.md)

| Check | Status |
| --- | --- |
| P1 backlog review | **yes** |
| Implementation changes | **no** |
| Contact form submission | **no** |
| CSS / Astro component changes | **no** |
| Browser E2E execution | **no** |
| Build execution | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Production / Wix change | **no** |
| Remote path confirmation | **no** (blocked) |
| Save / SQL / DB write | **no** |
| Edge deploy | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiStagingP1ReviewPlanned: true
phase: G-20u39-gosaki-staging-p1-review-planning
planningHead: 5957d8d
originMain: 5957d8d
currentActiveRegression: 23/23 PASS
stagingP0Blockers: false
stagingP1ReviewPlanned: true

STAGING_P1_REVIEW_PLANNED: true

current live production: wix
current live production URL: https://www.gosaki-piano.com/
replacement hosting: not_contracted
production FTP remote path: not_available
production FTP preparation: paused
HOSTING_READY: false
PRODUCTION_UPLOAD_READY: false
GO_LIVE_READY: false
PUBLIC_READY: CONDITIONAL

implementationExecuted: false
browserE2eExecuted: false
contactSubmissionExecuted: false
packageGenerationExecuted: false
buildExecuted: false
ftpUploadExecuted: false
productionChanged: false
wixProductionChanged: false
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false

recommendedNextPhase: G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```

---

## 1. Current state

| Item | Value |
| --- | --- |
| Current live production | **Wix** |
| Current live production URL | `https://www.gosaki-piano.com/` |
| Replacement hosting (Lolipop etc.) | **not contracted** |
| Production FTP remote path | **not available** |
| Production FTP preparation | **paused** |
| Remote path confirmation | **blocked** — do not request or guess |
| Staging P0 blockers | **false** / cleared |
| STG deployed package sourceCommit | `e3616a3` (on STG — regen required before any future upload) |
| G-20u38b2 local production package verify | useful prep only · **stale** · **not upload-ready** |
| Current active regression | **23/23 PASS** |

| Verdict | Value |
| --- | --- |
| **PUBLIC_READY** | **CONDITIONAL** |
| **HOSTING_READY** | **false** |
| **PRODUCTION_UPLOAD_READY** | **false** |
| **GO_LIVE_READY** | **false** |

**Historical note:** G-20u38c recorded `intendedRemotePath: TBD_G-20i` as a future operator step. **G-20u38d supersedes this** — replacement hosting is not contracted; remote path is **not available** (not TBD). Do not treat `TBD_G-20i` as the current remote path.

---

## 2. Scope

### 2.1 This phase (done)

- P1 backlog review and classification
- Confirmed active P1 vs review candidate vs supporting readiness work
- Priority ordering by user impact, evidence, risk, dependencies
- Dependency mapping and risk classification
- Next slice recommendations with safety gates
- Planning document · verifier · AI context update

### 2.2 This phase (not done)

| Forbidden | Reason |
| --- | --- |
| Contact form actual submission | P1-CON1 submit E2E deferred to G-20u39a planning then operator execution |
| CSS / public UI / admin UI fixes | Implementation slices only |
| Browser E2E execution | Read-only planning |
| Build / package generation | No artifact changes |
| FTP / STG or production upload | Hosting paused · STG package regen not requested |
| Production / Wix / DNS change | Live production is Wix |
| Remote path confirmation or guess | Hosting not contracted |
| Hosting contract | Client action |
| SQL / DB write / Save / Edge deploy | Out of scope |
| service_role / token / JWT display | Safety |
| Playwright / Chromium auto-click on submit or Save | Safety |

---

## 3. P1 classification rules

| Class | Definition | Examples in this backlog |
| --- | --- | --- |
| **A. Confirmed active P1** | Existing QA found an open item or confirmed defect | P1-CON1 (submit not tested) · P1-ADM-MOB1 (left-align confirmed) |
| **B. Review candidate** | Not confirmed broken; needs read-only or manual review | Public mobile / visual P1 · Production SEO static review |
| **C. Supporting readiness work** | Not a staging defect; useful before client review or hosting contract | Hosting requirement checklist · Client staging review checklist |

**Rule:** Do not conflate “unverified” with “confirmed broken.” Review candidates stay **B** until evidence upgrades them.

---

## 4. P1 backlog — detailed items

### 4.1 P1-CON1 — Contact HubSpot submit E2E

| Field | Value |
| --- | --- |
| **Classification** | **A. Confirmed active P1** |
| **Priority** | **high** |
| **Evidence** | Contact page **PASS** · HubSpot embed **PASS** · static artifact embed **PASS** |
| **Not confirmed** | Form fill · submit · success message · HubSpot record · notification · test record cleanup |
| **User impact** | High — primary conversion path for client inquiries |
| **Blocking** | Blocks confident client review of Contact · blocks final PUBLIC_READY upgrade |
| **Risk (next slice)** | Medium when submit executed — creates real HubSpot record |
| **Dependencies** | Operator manual submit once · HubSpot portal access for record check |

**This phase:** no submission · no form input · no browser automation.

**Next slice:** `G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning` — planning only; still **no submit**.

**G-20u39a planning must decide:**

- Test display name (no real personal data)
- Test email address (dedicated test alias)
- Test message body
- Rule: no real client personal information
- Portal / inbox verification method
- Success UI criteria on STG
- HubSpot record confirmation criteria
- Whether to delete or retain test record
- Double-submit prevention
- Human submits exactly once
- Auto-click forbidden
- STOP on unexpected behavior — no retry without new approval

### 4.2 P1-ADM-MOB1 — Admin mobile left-align polish

| Field | Value |
| --- | --- |
| **Classification** | **A. Confirmed active P1** |
| **Priority** | **medium** |
| **Evidence** | G-20u37b: iPhone SE — cards/blocks slightly left-aligned · readable · not inoperable |
| **Scope** | Staging admin only — production package excludes `/admin/` |
| **User impact** | Low–medium — admin UX polish; not visible on public site |
| **Blocking** | Does not block client public review |
| **Risk (next slice)** | Low — CSS-only · staging admin |
| **Dependencies** | None for planning; package regen + manual STG upload only after CSS slice |

**This phase:** no CSS · no Astro components · no package · no STG upload.

**Next slice:** `G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish` — identify targets · expected margins · viewports · impact · local verify method before small CSS change.

### 4.3 Public mobile / visual P1 review

| Field | Value |
| --- | --- |
| **Classification** | **B. Review candidate** |
| **Priority** | **medium** |
| **Evidence** | G-20u37b: no P0-level public mobile collapse — **do not assert defects exist** |
| **Review scope** | Home · About · Schedule · Discography · Contact · Link · YouTube · nav · images · horizontal scroll · viewport padding · long text · schedule cards · discography track list · contact form region |
| **User impact** | Medium if issues found — client-visible |
| **Blocking** | Informs client checklist; does not block G-20u39a planning |
| **Risk (next slice)** | Low — read-only manual review |
| **Dependencies** | Operator browser time on STG |

**Next slice:** `G-20u39c-gosaki-staging-public-mobile-visual-p1-review` — read-only; findings recorded as confirmed P1 / P2 / no issue.

### 4.4 Production SEO / robots / canonical final review

| Field | Value |
| --- | --- |
| **Classification** | **B. Review candidate / future production readiness** |
| **Priority** | **low at present** |
| **Evidence** | G-20u38b2 local production verify: robots · sitemap · production URL · `/admin/` exclusion **PASS** — **do not promote to confirmed P1** |
| **Review scope (static spec)** | canonical · OGP · page title · meta description · sitemap · robots · production base URL · `/admin/` exclusion · staging URL leak prevention · cutover final checklist |
| **P2-SEO1 alignment** | Existing P2-SEO1 = fine-tuning beyond MVP · production flip at cutover — keep **P2** unless new evidence |
| **User impact** | High at go-live; low while hosting not contracted |
| **Blocking** | Does not block staging P1 work |
| **Risk** | Low — document review only |
| **Dependencies** | Hosting contract for live server verification |

**Not in scope now:** production server check · upload · DNS.

### 4.5 Hosting requirement checklist

| Field | Value |
| --- | --- |
| **Classification** | **C. Supporting readiness work** |
| **Priority** | **medium** |
| **Not a staging defect** | Documents what Gosaki needs before Lolipop (or similar) contract |
| **Candidate items** | Static HTML/CSS/JS hosting · FTP or SFTP · custom domain · SSL · document root · DNS cutover · Wix disconnect timing · no PHP/Node required · Supabase external · no server DB · backup · rollback · staging/production separation · no FTP mirror/sync/delete · FileZilla manual upload · remote path confirmed by human **after** contract · **no path guess before contract** |
| **User impact** | Enables future go-live — not visitor-facing today |
| **Blocking** | Does not block staging quality work |
| **Risk** | Low — documentation |
| **Dependencies** | Client hosting decision |

**Next slice:** `G-20u39d-gosaki-hosting-requirement-checklist`

### 4.6 Client staging review checklist

| Field | Value |
| --- | --- |
| **Classification** | **C. Supporting readiness work** |
| **Priority** | **medium** (after core P1 arrangement) |
| **Candidate items** | STG URL · PC/mobile focus areas · Home/About/Schedule/Discography/Contact/Link/YouTube · copy · images · schedule/discography content · inquiry path · feedback collection method · whether CMS demo included · hosting/Wix cutover **out of scope** for client message |
| **User impact** | High when sent — shapes client feedback |
| **Blocking** | Should follow P1-CON1 planning and major P1 decisions |
| **Risk** | Low — documentation; **no client contact in this phase** |
| **Dependencies** | Operator decision on CMS scope in client message |

**Next slice:** `G-20u39e-gosaki-client-staging-review-checklist` — **do not send to client in planning phases**

---

## 5. P1 backlog table

| ID | Item | Classification | Evidence | User impact | Risk | Dependencies | Allowed in next slice | Forbidden in next slice | Priority | Recommended order | Exit criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1-CON1 | Contact HubSpot submit E2E | A · Confirmed active P1 | Visual/static PASS · submit **not tested** | High | Med (real record) | HubSpot portal · operator once | G-20u39a: plan test data · success criteria · STOP rules | Auto-submit · double send · PII · service_role | **high** | **1** | Planning doc approved · then operator manual submit once PASS |
| P1-ADM-MOB1 | Admin mobile left-align | A · Confirmed active P1 | G-20u37b confirmed slight left-align | Low–med (admin only) | Low | None for plan | G-20u39b: scope · viewport · margin spec · local verify plan | Prod package · public CSS · FTP until slice says so | **medium** | **2** | CSS slice merged · STG admin visually centered per spec |
| PUB-MOB-P1 | Public mobile / visual review | B · Review candidate | No P0 collapse · not proven defective | Med if findings | Low | Operator STG browser | G-20u39c: read-only route checklist · record findings | Implementation in review phase · auto-click | **medium** | **3** | Review doc with per-route verdicts |
| CLIENT-CHK | Client staging review checklist | C · Supporting | N/A | High when sent | Low | P1 direction settled | G-20u39e: checklist draft | Send to client · hosting promises | **medium** | **4** | Checklist ready for operator send (later) |
| HOST-CHK | Hosting requirement checklist | C · Supporting | Hosting not contracted | Future go-live | Low | Client contract | G-20u39d: requirements doc | Remote path guess · FTP apply | **medium** | **5** | Checklist shared with client before contract |
| PROD-SEO | Production SEO static review | B · Future readiness | G-20u38b2 local verify PASS | Low now · high at cutover | Low | Hosting for live check | Static spec review doc | Upload · DNS · promote to P1 without evidence | **low** | **6** | Cutover checklist attached to prod package prep |

---

## 6. Recommended work order

| Order | Phase | Rationale |
| --- | --- | --- |
| 1 | **G-20u39a** Contact HubSpot submit E2E **planning** | Contact is the client conversion path; largest unverified user-facing gap |
| 2 | **G-20u39b** Admin mobile left-align polish | Limited scope · low risk · quick win while Contact planning/execution proceeds |
| 3 | **G-20u39c** Public mobile / visual P1 review | Read-only; do not assume defects; whole-site coverage |
| 4 | **G-20u39e** Client staging review checklist | After core P1 direction is clear |
| 5 | **G-20u39d** Hosting requirement checklist | Useful but must not block staging quality work |
| 6 | Production SEO / canonical static review | Local verification already PASS; lowest urgency now |

**Why Contact first:** Unverified submit is the highest-impact gap on a client-facing conversion path. **Start with planning, not submission** — G-20u39a defines safe one-shot operator procedure.

**Why Admin second:** Confirmed cosmetic issue · staging-only · reversible CSS.

**Why public mobile review third:** Broad surface · evidence-free until review · must not block Contact.

**Why client checklist fourth:** Needs stable P1 list before asking 後藤沙紀さん to review.

**Why hosting checklist fifth:** Blocked on client contract anyway.

**Why production SEO last:** G-20u38b2 already passed local checks; P2-SEO1 remains appropriate for MVP fine-tuning.

```txt
recommendedNextPhase: G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```

G-20u39a performs **planning only** — no form submission.

---

## 7. Conditions before client staging review

| # | Condition | Status |
| --- | --- | --- |
| 1 | Staging P0 blockers cleared | **met** (G-20u37c) |
| 2 | P1 backlog prioritized (this phase) | **met** |
| 3 | Contact submit E2E planned (G-20u39a) | **pending** |
| 4 | Contact submit E2E executed (operator, post-plan) | **pending** |
| 5 | Public mobile review (G-20u39c) or explicit defer recorded | **pending** |
| 6 | Client checklist drafted (G-20u39e) | **pending** |
| 7 | Operator confirms STG URL still valid (`e3616a3` or regen noted) | **pending** |
| 8 | Message clarifies hosting / Wix cutover not in scope | **pending** (G-20u39e) |
| 9 | CMS admin demo in client review — operator choice | **undecided** |

**Minimum recommended before first client outreach:** items 1–3 complete; item 4 strongly recommended; items 5–8 complete or explicitly deferred in writing.

---

## 8. Safety gates and STOP conditions

### 8.1 Gates (this phase)

```txt
STAGING_P1_REVIEW_PLANNED: true
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false
PUBLIC_READY: CONDITIONAL
```

### 8.2 STOP — halt immediately if

| STOP | Detail |
| --- | --- |
| Contact form submission attempted in G-20u39 | Planning only — no submit |
| CSS or Astro component edit attempted | Implementation slices only |
| Package generation attempted | No artifact changes |
| FTP to STG or production attempted | Upload paused / not requested |
| Remote path confirmation or guess | Hosting not contracted |
| Wix production change | Live site is Wix |
| Treating hosting as contracted | **HOSTING_READY: false** |
| SQL / DB write / Save / Edge deploy | Forbidden |
| service_role usage | Forbidden |
| JWT / token / password / secret display | Forbidden |
| Playwright / Chromium auto-click submit or Save | Forbidden |

### 8.3 Historical state protection

| Check | Required state |
| --- | --- |
| `TBD_G-20i` as **current** remote path | **must not appear** in G-20u39 current sections |
| G-20u38c old next (FTP remote path confirmation) as **current** next | **must not be revived** |
| Hosting contracted | **false** |
| PRODUCTION_UPLOAD_READY | **false** |
| GO_LIVE_READY | **false** |
| Stale production package uploadable | **false** — stale · regen at HEAD before any future upload |

---

## 9. Findings (implementation not changed this phase)

| Finding | Action |
| --- | --- |
| On-disk production package stale vs HEAD | Record only — do not regen in G-20u39 |
| G-20u38b2 local verify sound | Retained as future prep when hosting exists |
| P2-SEO1 vs production SEO review | Keep P2 unless cutover review finds new blocker |
| STG package `e3616a3` | Valid for current STG QA; regen before any upload |

---

## 10. What was NOT done

| Item | Status |
| --- | --- |
| Implementation | **no** |
| Contact submission | **no** |
| Browser E2E | **no** |
| CSS modification | **no** |
| Build | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| Production change | **no** |
| Wix change | **no** |
| Remote path confirmation | **no** |
| SQL / DB write / Save | **no** |
| Edge deploy | **no** |
| service_role | **not used** |
| Client contact | **no** |

---

## 11. Summary

Staging **P0 is clear**. Production FTP track remains **paused** — live production is **Wix**, replacement hosting **not contracted**, remote path **not available**. This phase classified staging **P1 backlog**, set priority order, defined slice safety gates, and recommended **G-20u39a** (Contact HubSpot E2E planning, no submit) as next with **G-20u39b** (admin mobile polish) as alternate.
