# G-20u39a — Gosaki staging P1 Contact HubSpot submit E2E planning

**Phase:** `G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning`  
**Status:** **complete** — planning / read-only review only  
**Date:** 2026-07-15  
**Planning HEAD:** `619f1ed` (= `origin/main`)  
**Prior:** [G-20u39 staging P1 review planning](./gosaki-staging-p1-review-planning.md)  
**Historical reference (not current E2E pass):** [G-20s2 verify](./gosaki-contact-hubspot-e2e-verify.md) · [G-20s2b closure](./gosaki-contact-hubspot-e2e-execution-closure.md)

| Check | Status |
| --- | --- |
| E2E planning document | **yes** |
| Static embed configuration review | **yes** (read-only) |
| Form input / submit | **no** |
| Browser launch | **no** |
| HTTP request to staging | **no** |
| HubSpot API call | **no** |
| HubSpot record creation | **no** |
| Implementation changes | **no** |
| Build / package / FTP | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiStagingP1ContactHubspotSubmitE2ePlanned: true
phase: G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning
planningHead: 619f1ed
originMain: 619f1ed
priorPhase: G-20u39-gosaki-staging-p1-review-planning
priorCommit: 619f1ed
p1Item: P1-CON1
p1Priority: high

CONTACT_HUBSPOT_SUBMIT_E2E_PLANNED: true
CONTACT_SUBMISSION_EXECUTED: false
CONTACT_E2E_PASSED: false
CONTACT_E2E_STATUS: PLANNED_NOT_EXECUTED

PUBLIC_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false
productionFtpPreparation: paused
replacementHosting: not_contracted

implementationExecuted: false
browserExecuted: false
formInputExecuted: false
contactSubmissionExecuted: false
httpSubmissionExecuted: false
hubspotRecordCreatedByThisPhase: false
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

recommendedNextPhase: G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```

**`CONTACT_E2E_PASSED: false`** means **PLANNED_NOT_EXECUTED** — not a test failure.

---

## 1. Current evidence

### 1.1 Confirmed (static / prior QA)

| Item | Status | Source |
| --- | --- | --- |
| Contact public page display | **PASS** | G-20u37b browser QA |
| HubSpot form region display | **PASS** | G-20u37b browser QA |
| HubSpot embed in static artifact | **PASS** | G-20u37a static inspection (`e3616a3` package) |
| Staging P0 blocker | **false** | G-20u37c final P0 review |
| P1-CON1 priority | **high** | G-20u39 P1 backlog |
| Embed config present in repo | **yes** | `config/sites/gosaki-piano-contact-hubspot.json` |
| Convert hook present | **yes** | `scripts/lib/gosaki-contact-hubspot-embed.mjs` |

### 1.2 Not yet verified (current STG package `e3616a3`)

| Item | Status |
| --- | --- |
| Form field input | **not verified** |
| Submit action | **not executed** |
| Browser success message | **not verified** |
| HubSpot record / submission creation | **not verified** |
| Submitted field values in HubSpot | **not verified** |
| Notification email | **not verified** |
| Duplicate behavior | **not verified** |
| Error path | **not verified** |
| Test record cleanup | **not decided** |

**Do not describe unverified items as FAIL.** They are **open P1 verification gaps**.

### 1.3 Historical note (stale for current P1 closure)

G-20s2 / G-20s2b (2026-07-09) recorded a **successful** operator manual submit on an **older** staging package. G-20u37a explicitly notes prior G-20s2b may be **stale vs `e3616a3`**. **P1-CON1 remains open** until a one-shot E2E is executed and recorded against the **current** STG deployment.

---

## 2. Static embed configuration (read-only)

Identified from repo config and convert hook — **public embed identifiers only** (not secrets).

| Item | Value |
| --- | --- |
| **Provider** | HubSpot |
| **Config file** | `tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json` |
| **Convert hook** | `tools/static-to-astro/scripts/lib/gosaki-contact-hubspot-embed.mjs` |
| **Page** | `contact` (`src/pages/contact/index.astro` after convert) |
| **Wix replacement target** | `#comp-jqbwo704` → `#gosaki-contact-hubspot-embed` |
| **Container** | `#gosaki-contact-hubspot-embed` · `.hs-form-frame` |
| **region** | `na1` |
| **portalId** | `21392032` |
| **formId** | `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| **scriptSrc** | `https://js.hsforms.net/forms/embed/21392032.js` |
| **STG base path** | `/cms-kit-staging/gosaki-piano/` |
| **STG Contact path** | `/cms-kit-staging/gosaki-piano/contact/` |
| **STG Contact URL (historical)** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/` — **operator must re-confirm in G-20u39a1** |

### 2.1 Expected form fields (from G-20s2 render verify — confirm in preflight)

| # | Label (JP) | Required | Notes |
| --- | --- | --- | --- |
| 1 | 姓 | no | last name |
| 2 | 名 | **yes** | first name |
| 3 | Eメール | **yes** | email |
| 4 | お問い合わせ内容 | no | textarea |
| 5 | 送信 | — | submit button |

Field names inside HubSpot iframe may differ from labels — **confirm in G-20u39a1 preflight**.

### 2.2 Findings (no fix this phase)

| Finding | Severity | Action |
| --- | --- | --- |
| HubSpot internal field `massage` typo (message) | cosmetic / P2 | Record only |
| G-20s2b spam classification possible on test submit | operational note | Not a P0 blocker |
| Historical success messages may differ on current package | unknown until preflight | TBD in G-20u39a1 |

---

## 3. E2E scope

### 3.1 Required core checks (execution phase G-20u39a2)

1. Open staging Contact page (not Wix production)
2. HubSpot form displays
3. Enter locked test payload into required fields
4. Operator clicks submit **exactly once**
5. Confirm browser success state
6. Confirm **exactly one** HubSpot submission/contact associated with test email
7. Confirm submitted values match locked payload
8. Confirm no unintended duplicate submission
9. Apply agreed post-processing policy

### 3.2 Optional checks (include only if operator confirms relevance)

| Check | Default in success criteria? | Notes |
| --- | --- | --- |
| HubSpot notification email | **no** — operator decides in G-20u39a1 | G-20s2b received notification; not assumed for current run |
| Owner assignment | **no** | Unknown workflow |
| Workflow trigger | **no** | Unknown |
| Auto reply to submitter | **no** | Unknown |
| Spam classification | **no** (observe only) | May occur on test data |
| Analytics attribution | **no** | Out of scope |
| Cookie / tracking consent | **no** — confirm in preflight if present | TBD |

---

## 4. Test data specification

**Policy:** No real client or third-party personal data. Operator-controlled test email only.

### 4.1 Locked payload template (placeholders — finalize in G-20u39a1)

| Field | Planned value |
| --- | --- |
| **姓** | `CMS Kit Staging Test` (or split: 姓=`CMS Kit` · 名=`Staging Test` — **preflight decides field mapping**) |
| **名*** | `Staging Test` |
| **Eメール*** | `operator-controlled test address — TBD before execution` |
| **Phone** | blank unless preflight finds required phone field |
| **お問い合わせ内容** | See message template below |

**Message template:**

```txt
[Gosaki CMS Kit staging Contact E2E test]
Phase: G-20u39a2
This is a one-time staging verification submission.
No response is required.
```

### 4.2 Mandatory rules

- Do **not** use 後藤沙紀さん's personal email as submitter
- Do **not** use third-party personal emails
- Do **not** use obviously non-deliverable fake domains without operator approval
- Use an email the **operator can receive and manage**
- Leave phone blank unless required
- Do **not** use real postal addresses
- Include `staging test` and `no response required` in body
- Lock payload before execution; record exact values in G-20u39a3 result doc
- Do **not** put secrets, tokens, or JWTs in the message body

---

## 5. Operator input required (before execution)

| # | Item | Status |
| --- | --- | --- |
| 1 | Test email address | **TBD** |
| 2 | HubSpot admin access holder | **TBD** |
| 3 | Submission confirmation location (HubSpot UI path) | **TBD** |
| 4 | Contact record confirmation location | **TBD** |
| 5 | Notification email required for pass? | **TBD** |
| 6 | Delete test record vs retain? | **TBD** (see §8) |
| 7 | Client notification risk acceptable? | **TBD** |
| 8 | Auto reply / workflow fire risk? | **TBD** |
| 9 | Execution date/time window | **TBD** |
| 10 | Staging URL (full HTTPS) | **TBD** — confirm not Wix |

**Do not guess unset items.**

---

## 6. Success criteria

### 6.1 Browser success

**Planning-time status:**

```txt
Browser success UI:
TBD in G-20u39a1 preflight by read-only inspection or operator observation
```

**Candidate patterns** (from G-20s2b historical run — **not locked until preflight confirms on current package):

| Pattern | Historical candidate (G-20s2b) |
| --- | --- |
| Intermediate state | 「フォームの送信」 |
| Success message | 「ありがとうございました。後ほどご連絡差し上げます。」 |
| Alternative patterns | thank-you block · redirect · form reset · HubSpot default completion |

**Pass rule (execution):** Operator documents **which observed UI state** matched the preflight-locked success criteria. Ambiguous UI → **STOP** · no resubmit.

### 6.2 HubSpot success

Minimum criteria for G-20u39a2 pass:

```txt
Exactly one submission associated with the locked test email
Submitted timestamp within the documented execution window
Submitted field values match the locked test payload
Source/page context indicates Gosaki staging Contact where HubSpot exposes it
No unintended duplicate contact/submission from this test
```

**Do not assert** submission-vs-contact internal HubSpot relationship without operator observation in G-20u39a2.

### 6.3 Notification email

**Not required for pass** unless operator sets item #5 to required in G-20u39a1.

---

## 7. Staging-only submission conditions

Submit **only when all** are true:

| # | Condition |
| --- | --- |
| 1 | URL is staging Contact — **not** `https://www.gosaki-piano.com/` Wix form |
| 2 | `portalId` = `21392032` and `formId` = `57909d0c-9b9f-470a-8a18-e176d1d1a459` (or preflight-documented equivalent) |
| 3 | HubSpot form visible and interactive |
| 4 | Locked test payload approved |
| 5 | Operator test email confirmed |
| 6 | HubSpot verifier present |
| 7 | Success criteria locked in preflight |
| 8 | Post-processing policy decided |
| 9 | No prior G-20u39a2 submit in same window |
| 10 | G-20u39a1 preflight **complete** |

---

## 8. Test record post-processing

### Option A — Retain record

| Pros | Cons |
| --- | --- |
| Audit trail of E2E | Test contact remains in CRM |
| Easy re-check | May affect searches/reports |

### Option B — Delete test contact

| Pros | Cons |
| --- | --- |
| Cleaner CRM | Deletion scope/risk · may remove wanted history |
| | Risk of deleting wrong contact |

### Option C — Label / property (if HubSpot supports)

| Pros | Cons |
| --- | --- |
| Identifiable test data | Requires confirmed HubSpot feature + operator setup |

### Planning recommendation

```txt
First E2E: do not assume immediate deletion.
Use unique staging test name + body for identification.
Confirm HubSpot behavior and operator judgment before delete/label.
Cursor / ChatGPT must NOT delete HubSpot records.
```

---

## 9. Duplicate submission prevention

```txt
Manual human submission only
Submit button click exactly once
No Playwright
No Chromium automation
No retry after ambiguous result
No reload-and-resubmit
No double click
No Enter key plus button click
No alternate HTTP request
No HubSpot API submit from CMS Kit tooling
```

**If result is ambiguous** (frozen UI · unclear success · network error):

```txt
STOP
Do not submit again
Check HubSpot side first
Record the ambiguity
Escalate to human before any second attempt
```

---

## 10. STOP conditions (execution phases)

Stop immediately if:

| STOP | Detail |
| --- | --- |
| Wix production form open | Live site is Wix — wrong target |
| Staging URL unknown or wrong host/path | |
| portalId / formId mismatch vs preflight lock | |
| Form not displayed | |
| Only non-operator-controlled email available | |
| Client/third-party notification risk unacceptable and unknown | |
| Cannot review payload before submit | |
| CAPTCHA / consent handling unclear | |
| Success criteria undefined | |
| No HubSpot verifier available | |
| Test record identification undecided | |
| Possible prior duplicate test submit | |
| Ambiguous submit result | |
| Production / Wix / DNS change required | |
| Access token / private app token required | |
| Automation required | |
| Multiple submits requested | |

---

## 11. Phase split

### 11.1 Recommended next — G-20u39a1 preflight

**Phase:** `G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight`

| Allowed | Forbidden |
| --- | --- |
| Read-only staging URL check | Form input |
| Read-only field / required inspection | Submit click |
| Success UI candidate observation (no submit) | HTTP POST / HubSpot API |
| Lock test payload | Record creation |
| Confirm operator inputs | Package / FTP / build |

### 11.2 Following — G-20u39a2 manual execution

**Phase:** `G-20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-manual-execution`

| Allowed | Forbidden |
| --- | --- |
| Operator manual browser input | Cursor / ChatGPT click submit |
| Operator single submit | Automation |
| Browser + HubSpot verification | Retry on ambiguity |
| | Second submit without new approval |

### 11.3 Result record — G-20u39a3

**Phase:** `G-20u39a3-gosaki-staging-p1-contact-hubspot-submit-e2e-result-record`

- Document execution outcome
- P1-CON1 resolution judgment
- Post-processing decision
- PUBLIC_READY re-evaluation input
- **No additional submission**

---

## 12. Manual execution procedure outline (G-20u39a2)

1. Confirm G-20u39a1 preflight **complete** and payload locked
2. Open locked staging Contact URL in browser (private window optional)
3. Verify URL is staging · not Wix production
4. Wait for HubSpot form iframe to load
5. Verify portalId/formId markers if visible in page source (optional)
6. Enter locked test values field by field
7. Re-read all fields before submit
8. Click **送信** once — no double click
9. Observe browser success per locked criteria · screenshot optional
10. Open HubSpot · find submission/contact by test email + time window
11. Verify field values · duplicate count = 1
12. Apply post-processing per G-20u39a1 decision
13. Record results in G-20u39a3 — **no second submit**

---

## 13. Production / hosting context (unchanged)

| Item | Value |
| --- | --- |
| Current live production | **Wix** — `https://www.gosaki-piano.com/` |
| Replacement hosting | **not contracted** |
| Production FTP preparation | **paused** |
| **PRODUCTION_UPLOAD_READY** | **false** |
| **HOSTING_READY** | **false** |
| **GO_LIVE_READY** | **false** |
| **PUBLIC_READY** | **CONDITIONAL** |

Contact E2E on **staging** does not change production gates.

---

## 14. What was NOT done

| Item | Status |
| --- | --- |
| Browser launch | **no** |
| Form input | **no** |
| Contact submission | **no** |
| HTTP request | **no** |
| HubSpot API | **no** |
| HubSpot record creation | **no** |
| Implementation / CSS | **no** |
| Build / package / FTP | **no** |
| Production / Wix change | **no** |
| SQL / DB write / Save / Edge | **no** |
| service_role | **not used** |
| Client contact | **no** |

---

## 15. Summary

P1-CON1 Contact HubSpot submit E2E is **planned but not executed** on current STG package `e3616a3`. Static embed configuration is confirmed in repo. Future work: **G-20u39a1 preflight** (no submit) → **G-20u39a2 operator manual execution** (one click) → **G-20u39a3 result record**.

```txt
recommendedNextPhase: G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```
