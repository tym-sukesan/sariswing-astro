# G-20u39a1 — Gosaki staging P1 Contact HubSpot submit E2E preflight

**Phase:** `G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight`  
**Status:** **complete** — read-only preflight  
**Date:** 2026-07-15  
**Preflight HEAD:** `27be4f6` (= `origin/main`)  
**Prior:** [G-20u39a E2E planning](./gosaki-staging-p1-contact-hubspot-submit-e2e-planning.md)  
**Historical (not current pass):** [G-20s2 verify](./gosaki-contact-hubspot-e2e-verify.md) · [G-20s2b closure](./gosaki-contact-hubspot-e2e-execution-closure.md)  
**STG deployed package sourceCommit:** `e3616a3` (on STG — unchanged since G-20u37 QA)

| Check | Status |
| --- | --- |
| Read-only preflight | **yes** |
| Read-only staging page load (HTTP GET) | **yes** — embed shell verified |
| HubSpot iframe field DOM inspection | **no** — fields loaded by HubSpot JS at runtime |
| Form input / submit | **no** |
| HubSpot record creation | **no** |
| Implementation changes | **no** |
| service_role used | **not used** |

---

## Gates

```txt
gosakiStagingP1ContactHubspotSubmitE2ePreflightPrepared: true
phase: G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight
preflightHead: 27be4f6
originMain: 27be4f6
priorPhase: G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning
stgPackageSourceCommit: e3616a3ab0fbda280d75278b0a6275205ae74763

CONTACT_HUBSPOT_SUBMIT_E2E_PREFLIGHT_PREPARED: true
CONTACT_SUBMISSION_EXECUTED: false
CONTACT_E2E_PASSED: false
CONTACT_E2E_STATUS: PREFLIGHT_ONLY_NOT_EXECUTED
CONTACT_E2E_EXECUTION_READY: false

PUBLIC_READY: CONDITIONAL
PRODUCTION_UPLOAD_READY: false
HOSTING_READY: false
GO_LIVE_READY: false
productionFtpPreparation: paused
replacementHosting: not_contracted

browserReadOnlyInspectionExecuted: true
browserFormInteractionExecuted: false

implementationExecuted: false
formInputExecuted: false
contactSubmissionExecuted: false
httpSubmissionExecuted: false
httpPostExecuted: false
hubspotRecordCreatedByThisPhase: false
hubspotApiExecuted: false
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

recommendedNextPhase: G-20u39a1b-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight-gap-resolution
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```

---

## 1. Historical evidence handling

```txt
Historical G-20s2b E2E:
PASS on an older STG package (2026-07-09)

Current STG package E2E:
not executed (package e3616a3)

Historical evidence may inform:
field label expectations
success UI candidates
HubSpot notification flow expectations
domain allowlist previously OK on yskcreate.weblike.jp

Historical evidence does not prove:
current package submit success
current HubSpot record creation
current notification behavior
current duplicate behavior
current consent/CAPTCHA state
```

**Rule:** G-20s2b PASS is **not** current P1-CON1 closure.

---

## 2. Target lock

| Item | Value | Verification source |
| --- | --- | --- |
| **Target environment** | **Staging** (CMS Kit Lolipop path) | QA docs · live GET |
| **Target URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/` | G-20u37 planning · **HTTP GET 200** (this preflight) |
| **Expected base path** | `/cms-kit-staging/gosaki-piano/` | Config · QA docs |
| **portalId** | `21392032` | Config · static artifact · **live HTML match** |
| **formId** | `57909d0c-9b9f-470a-8a18-e176d1d1a459` | Config · static artifact · **live HTML match** |
| **region** | `na1` | Config · **live HTML match** |
| **Container ID** | `#gosaki-contact-hubspot-embed` | Embed hook · static · **live HTML present** |
| **HubSpot frame class** | `.hs-form-frame` | Embed hook · **live HTML present** |
| **HubSpot script** | `https://js.hsforms.net/forms/embed/21392032.js` | Config · **live HTML present** |
| **Current live production** | **Wix** | G-20u38d |
| **Production URL** | `https://www.gosaki-piano.com/` | — |
| **Wix production Contact** | **NOT a test target** | STOP if opened |

**Identity check (this preflight):** portalId · formId · region on live staging HTML **match** repo config. **No mismatch — no STOP.**

---

## 3. Read-only inspection summary

### 3.1 Live staging HTTP GET (read-only)

| Check | Result |
| --- | --- |
| HTTP status | **200** |
| Page title | `Contact \| saki-goto` |
| `#gosaki-contact-hubspot-embed` | **present** |
| `.hs-form-frame` | **present** |
| `data-portal-id="21392032"` | **present** |
| `data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459"` | **present** |
| `data-region="na1"` | **present** |
| HubSpot embed script | **present** |
| Wix legacy form wrapper `#comp-jqbwo704` | **replaced** (embed injected) |

**Limitation:** HubSpot form fields render inside a **cross-origin iframe** after JS load. This preflight did **not** interact with the iframe DOM. Field inventory below combines **unchanged formId** + **historical G-20s2** + **G-20u37b visual PASS**.

### 3.2 Static repo config

| File | Role |
| --- | --- |
| `config/sites/gosaki-piano-contact-hubspot.json` | portalId · formId · region · scriptSrc |
| `scripts/lib/gosaki-contact-hubspot-embed.mjs` | Inject `#gosaki-contact-hubspot-embed` on `/contact/` |

---

## 4. Form field inventory

| Field | Observed label | Internal name (if known) | Required / optional / unknown | Input type | Source of evidence | Execution value | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Last name | 姓 | `0-1/lastname` | **optional** | text | G-20s2 historical · unchanged formId | `CMS Kit` | **expected** — re-verify at G-20u39a2 step 3 |
| First name | 名* | `0-1/firstname` | **required** | text | G-20s2 historical · unchanged formId | `Staging Test` | **expected** — re-verify at step 3 |
| Email | Eメール* | `0-1/email` | **required** | email | G-20s2 historical · unchanged formId | `OPERATOR_CONTROLLED_TEST_EMAIL` | **locked placeholder** |
| Message | お問い合わせ内容 | `0-1/massage` † | **optional** | textarea | G-20s2 historical · unchanged formId | See §6 message template | **expected** — re-verify at step 3 |
| Submit | 送信 | — | — | submit | G-20s2 historical | Click **once** manually | **expected** — re-verify label at step 3 |
| Phone | — | — | **not present** | — | G-20s2 historical (no phone field) | **blank** | **confirmed absent** (historical) |
| Address | — | — | **not present** | — | G-20s2 historical | **n/a** | **confirmed absent** (historical) |

† HubSpot internal typo `massage` — cosmetic only.

**No phone or address fields** — do not add to payload.

---

## 5. Consent / CAPTCHA / privacy

| Item | Status | Evidence |
| --- | --- | --- |
| **Consent checkbox** | **absent** (expected) | G-20s2 iframe inspection — no consent field reported |
| **Privacy text** | **unknown** | Not confirmed in iframe this preflight · HubSpot may show footer links inside iframe |
| **CAPTCHA** | **unknown** | G-20s2 did not report CAPTCHA · **re-check at G-20u39a2 step 3** |
| **Cookie dependency** | **required** (HubSpot embed) | Third-party HubSpot script loads form |
| **Cross-origin iframe** | **yes** | HubSpot `hs-form-frame` loads iframe at runtime |

**Execution rule:** If CAPTCHA or consent appears at step 3, operator handles manually per visible UI — **do not automate**. If handling unclear → **STOP**.

---

## 6. Locked test payload

**Lock ID:** `G-20u39a1-contact-e2e-payload-v1`  
**Do not change during G-20u39a2 execution.**

| Form field | Locked value |
| --- | --- |
| **姓** | `CMS Kit` |
| **名*** | `Staging Test` |
| **Eメール*** | `OPERATOR_CONTROLLED_TEST_EMAIL` |
| **お問い合わせ内容** | See message block below |
| **Phone** | *(blank — field absent)* |

**Message template (locked):**

```txt
[Gosaki CMS Kit staging Contact E2E test]
Phase: G-20u39a2
This is a one-time staging verification submission.
No response is required.
```

### Payload rules

- Do **not** use 後藤沙紀さん's email as submitter
- Do **not** use third-party personal emails
- Use operator-managed receivable test email at execution time
- No real phone numbers or addresses
- No secrets / tokens / passwords in body
- Record exact email used in G-20u39a3 result doc (not in git)

---

## 7. Browser success criteria

### 7.1 Pass conditions (any one sufficient)

```txt
HubSpot success message appears
Thank-you state appears
Configured redirect occurs (if HubSpot portal sets one)
Form is replaced by completion state
HubSpot-defined success state is visibly reached
```

### 7.2 Fail / ambiguous (not pass alone)

```txt
Submit button disabled only
Form disappears without clear success copy
Page freeze / spinner with no completion message
Network error with no confirmation
```

### 7.3 Historical success UI candidates (G-20s2b — expected, not locked)

| Stage | Historical candidate text |
| --- | --- |
| Submit button | `送信` |
| Intermediate | `フォームの送信` |
| Success message | `ありがとうございました。後ほどご連絡差し上げます。` |

**G-20u39a2 operator:** Record **actual** observed text. If differs from historical but clearly indicates success → pass with note. If ambiguous → **STOP**.

---

## 8. HubSpot-side success criteria

### 8.1 Required

```txt
Exactly one submission associated with OPERATOR_CONTROLLED_TEST_EMAIL
Submission timestamp within documented execution window
Submitted values match locked payload (§6)
Form identity matches portalId 21392032 / formId 57909d0c-9b9f-470a-8a18-e176d1d1a459 where visible
Source/page corresponds to Gosaki staging Contact where visible
No unintended duplicate submission from this test
```

**Do not assert** submission vs contact record merge behavior without operator observation.

### 8.2 Optional (only if operator confirms relevance)

| Check | Default |
| --- | --- |
| Notification email | **optional** — not required for pass unless operator sets required |
| Auto reply | **optional** — observe only |
| Workflow | **unknown** — observe only |
| Owner assignment | **optional** |
| Lifecycle stage | **optional** |
| Analytics | **out of scope** |
| Spam classification | **observe only** — not pass/fail (G-20s2b precedent) |

---

## 9. Operator input lock

| Item | Classification | Notes |
| --- | --- | --- |
| `OPERATOR_CONTROLLED_TEST_EMAIL` | **required before execution** | Placeholder locked · real address at G-20u39a2 only |
| HubSpot確認担当者 | **required before execution** | Operator with portal access |
| HubSpot確認画面 (submissions/contacts) | **required before execution** | Path documented by operator at execution |
| 通知メール確認を必須とするか | **optional** | Default: **not required** for pass |
| client通知が発生する可能性 | **unknown** | Confirm with portal owner before execution |
| auto replyの可能性 | **unknown** | Observe at execution |
| workflow発火の可能性 | **unknown** | Observe at execution |
| execution日時 | **required before execution** | Operator schedules G-20u39a2 |
| recordを残すか後処理するか | **optional** | Default: retain with identifiable test body · delete decision deferred |
| Staging URL | **locked** | §2 target URL |
| portalId / formId | **locked** | §2 — verified match |
| Test payload | **locked** | §6 |
| Browser success criteria | **locked** | §7 |
| HubSpot success criteria | **locked** | §8 |
| Duplicate prevention | **locked** | §11 |
| STOP conditions | **locked** | §12 |

---

## 10. G-20u39a2 execution checklist (not executed this phase)

**Executor:** operator human only · **Cursor / ChatGPT must not input, click submit, or POST.**

1. Confirm correct staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`
2. Confirm **not** on Wix `https://www.gosaki-piano.com/`
3. Confirm portalId `21392032` · formId `57909d0c-9b9f-470a-8a18-e176d1d1a459` in page source or HubSpot UI
4. Wait for HubSpot iframe · confirm fields: 姓 · 名* · Eメール* · お問い合わせ内容 · 送信
5. Re-check consent / CAPTCHA — if present and unclear → **STOP**
6. Operator prepares `OPERATOR_CONTROLLED_TEST_EMAIL`
7. Confirm locked payload §6 · client notification / workflow risk acceptable
8. Manual input only — no autofill from AI
9. Re-read all field values before submit
10. Click **送信** exactly **once** — no double click · no Enter shortcut
11. Observe browser success per §7
12. If ambiguous → **STOP** · do not resubmit · check HubSpot first
13. Open HubSpot · find submission by test email + time window
14. Confirm exactly **one** submission
15. Confirm payload field match
16. Apply post-processing decision (retain / label / delete per operator)
17. Record in **G-20u39a3** — no additional submission

---

## 11. Duplicate submission prevention

```txt
Manual human submission only
Submit button click exactly once
No Playwright / Chromium automation
No retry after ambiguous result
No reload-and-resubmit
No double click
No Enter key plus button click
No alternate HTTP POST
No HubSpot API submit from CMS Kit tooling
```

**Ambiguity protocol:**

```txt
STOP
Do not submit again
Check HubSpot side first
Record the ambiguity
```

---

## 12. STOP conditions

| STOP | Detail |
| --- | --- |
| Wrong environment | Wix production Contact opened |
| Target URL mismatch | Not `yskcreate.weblike.jp/.../gosaki-piano/contact/` |
| portalId mismatch | Not `21392032` |
| formId mismatch | Not `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| Form not displayed | HubSpot iframe fails to load |
| Required fields unknown | Cannot confirm 名* / Eメール* at execution |
| Consent / CAPTCHA unknown | Cannot complete required interaction |
| Operator email unavailable | No managed test inbox |
| Client notification risk | Unacceptable and unconfirmed |
| Workflow / auto reply risk | Unacceptable and unconfirmed |
| Browser success undefined | No observable completion state |
| HubSpot verifier absent | No portal access |
| Duplicate test suspected | Prior G-20u39a2 submit may exist |
| Payload not locked | Changed from §6 without approval |
| Submit result ambiguous | Freeze · error · unclear UI |
| Network error after submit | Check HubSpot before any retry |
| Automatic retry proposed | Forbidden |
| Second submission proposed | Forbidden without new approval |
| HTTP POST / HubSpot API | Forbidden from Cursor |
| Secret / private token requested | Forbidden |

---

## 13. Execution readiness

```txt
CONTACT_HUBSPOT_SUBMIT_E2E_PREFLIGHT_PREPARED: true
CONTACT_E2E_EXECUTION_READY: false
```

### Rationale for EXECUTION_READY: false

| Criterion | Status |
| --- | --- |
| STG URL locked and HTTP 200 verified | **yes** |
| portalId / formId / region match live HTML | **yes** |
| Form field map documented (historical + unchanged identity) | **yes** |
| Required fields identified (名* · Eメール*) | **yes** (historical — iframe not re-verified this phase) |
| Payload locked | **yes** |
| Duplicate prevention defined | **yes** |
| STOP conditions defined | **yes** |

### Unresolved blockers (execution readiness false)

| Gap | Status | Blocks execution? |
| --- | --- | --- |
| iframe内 CAPTCHA の有無 | **unknown** | **yes** |
| HubSpot確認担当者 | **unknown** | **yes** |
| HubSpot確認画面・確認場所 | **unknown** | **yes** |
| client通知の有無と影響許容 | **unknown** | **yes** |
| workflow / auto reply の有無と影響許容 | **unknown** | **yes** |
| 現在のSTGで実際に表示される browser success 状態 | **unknown** (G-20s2b候補のみ · not current-package verified) | **yes** |

**Note:** `OPERATOR_CONTROLLED_TEST_EMAIL` remains placeholder — required at G-20u39a2 but **not** the sole blocker listed above.

**Next slice:** **G-20u39a1b** — resolve gaps above before manual execution.

---

## 14. What was NOT done

| Item | Status |
| --- | --- |
| Form input | **no** |
| Contact submission | **no** |
| HTTP POST | **no** |
| HubSpot API | **no** |
| HubSpot record creation | **no** |
| Browser form interaction | **no** |
| Implementation / CSS | **no** |
| Build / package / FTP | **no** |
| Production / Wix change | **no** |
| SQL / DB write / Save / Edge | **no** |
| service_role | **not used** |

---

## 15. Summary

Read-only preflight **locks** staging Contact E2E target · embed identity · payload · success criteria · execution checklist. Live staging HTML confirms portalId/formId/region/container. **CONTACT_E2E_EXECUTION_READY: false** — CAPTCHA · HubSpot確認 · 通知/workflow影響 · current browser success UI remain unresolved. **Do not proceed to manual submit** until **G-20u39a1b** gap resolution.

```txt
recommendedNextPhase: G-20u39a1b-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight-gap-resolution
alternateNextPhase: G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish
```
