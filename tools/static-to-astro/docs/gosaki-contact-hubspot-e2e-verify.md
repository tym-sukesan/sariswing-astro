# G-20s2 — Gosaki Contact HubSpot E2E verify

**Phase:** `G-20s2-gosaki-contact-hubspot-e2e-verify`  
**Status:** **complete** — form render verified · operator manual submit procedure documented · **submit not executed by Cursor**  
**Date:** 2026-07-09  
**Verified at (UTC):** `2026-07-09T07:30:00Z` (approx.)  
**Base commit:** `a03fef9`  
**Target URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`  
**Prior:** [gosaki-mobile-device-qa.md](./gosaki-mobile-device-qa.md) (G-20s1)

| Check | Status |
| --- | --- |
| Contact page HTTP 200 | **yes** |
| HubSpot iframe renders | **yes** |
| Form fields visible | **yes** (4 fields + 送信) |
| Test payload documented | **yes** |
| Operator manual procedure | **yes** |
| Cursor / AI form submit | **no** |
| HubSpot inbox confirmed | **pending** (operator G-20s2b) |

---

## Gates

```txt
gosakiContactHubspotE2eVerifyPreflightComplete: true
phase: G-20s2-gosaki-contact-hubspot-e2e-verify
baseCommit: a03fef9
contactUrl: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/
hubspotPortalId: 21392032
hubspotFormId: 57909d0c-9b9f-470a-8a18-e176d1d1a459
hubspotRegion: na1
formRenderVerifyPass: true
cursorFormSubmitExecuted: false
operatorManualSubmitExecuted: false
readyForG20s2bOperatorManualSubmitClosure: true
clientPreviewVerdict: NOT_READY
clientPreviewBlockerP0: P0-C1-contact-hubspot-e2e-inbox-pending
ftpReExecutionForbidden: true
```

**Cursor / AI:** **must not** click 送信 · must not POST HubSpot form · must not trigger HubSpot API writes.

---

## 1. Purpose

Gosaki staging `/contact/` の HubSpot form が client preview 前に **使える状態か** を確認する。本フェーズは:

1. ページ表示・iframe・入力項目の **read-only 検証**（Cursor）
2. operator が **手動で1回だけ送信** するための手順・test payload の作成

**送信そのものは operator が G-20s2b で実行** — Cursor は submit しない。

---

## 2. HubSpot embed configuration

| Item | Value |
| --- | --- |
| **Provider** | HubSpot |
| **portalId** | `21392032` |
| **formId** | `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| **region** | `na1` |
| **scriptSrc** | `https://js.hsforms.net/forms/embed/21392032.js` |
| **Config** | `config/sites/gosaki-piano-contact-hubspot.json` |
| **Wrapper** | `#gosaki-contact-hubspot-embed` · `.hs-form-frame` |

---

## 3. Form render verification (read-only — Cursor)

**Method:** Playwright Chromium · viewports 390×844 (mobile) and 1280×900 (desktop) · **no submit click**

### 3.1 Page load

| Check | Mobile (390px) | Desktop (1280px) |
| --- | --- | --- |
| HTTP status | **200** | **200** |
| Page title | `Contact \| saki-goto` | same |
| JP intro text | **present** | **present** |
| HubSpot script loaded | **yes** | **yes** |
| `.hs-form-frame` / wrapper | **yes** | **yes** |
| HubSpot iframe | **1** · 350×591px | **1** · 560×500px |
| Wix legacy form | **absent** | **absent** |

### 3.2 Form fields (inside HubSpot iframe)

| # | Label (JP) | Input type | Required | HubSpot name |
| --- | --- | --- | --- | --- |
| 1 | 姓 | text | no | `0-1/lastname` |
| 2 | 名* | text | **yes** | `0-1/firstname` |
| 3 | Eメール* | email | **yes** | `0-1/email` |
| 4 | お問い合わせ内容 | textarea | no | `0-1/massage` † |
| 5 | 送信 | submit button | — | `.hs-button` · text `送信` |

† HubSpot internal field name `massage` (typo for message) — **cosmetic / P2** · does not block E2E.

**Form render verdict:** **PASS** — all fields visible · submit button present · JP labels OK.

### 3.3 Mobile layout (G-20s1 cross-check)

| Check | Result |
| --- | --- |
| iframe visible @390px | **yes** (350px wide) |
| No user horizontal scroll | **yes** |
| Fields reachable without desktop-only layout | **yes** |

---

## 4. Operator manual submit — test payload

**Use once only** in G-20s2b execution phase. Do not re-submit without new approval.

| Field | Test value |
| --- | --- |
| **姓** | `テスト` |
| **名*** | `太郎` |
| **Eメール*** | `<operator-confirmed-test-email>`（operator-owned test email · repo 非記載） |
| **お問い合わせ内容** | `Gosaki staging contact E2E test / 2026-07-09T16:30+09:00` |

**Notes:**

- `名*` と `Eメール*` は必須。空欄のままでは送信不可。
- **Eメールは戸山さんが受信確認できる operator-owned test email を使用** — 手動送信時に operator が指定・入力する。個人メールアドレスは **repo に記載しない**。
- HubSpot inbox / 通知でも submission を確認する。
- 本文に `E2E test` と日時を入れ、本番問い合わせと区別する。

---

## 5. Operator manual submit procedure (G-20s2b — **not this phase**)

**Executor:** 戸山さん · **browser manual only** · **×1**

### Preflight checklist

- [ ] URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`
- [ ] HubSpot iframe が表示されている
- [ ] テスト payload（§4）を手元に用意
- [ ] HubSpot portal（portalId `21392032`）にログインできる
- [ ] **Cursor / AI は submit しない** — operator のみ

### Steps

1. ブラウザ（PC またはスマホ）で staging Contact URL を開く
2. HubSpot form が読み込まれるまで待つ（iframe 内に 姓/名/Eメール/お問い合わせ内容）
3. §4 の test payload を **手動入力**
4. **送信** ボタンを **1回だけ** クリック
5. 結果を確認（§6）— 失敗時は盲目リトライせず停止

### Do NOT

- Cursor / Playwright / 自動化による submit
- 2回目以降の送信（別フェーズで承認後）
- production `gosaki-piano.com` での送信（staging のみ）
- FTP / deploy / package regen

---

## 6. Post-submit verification (G-20s2b — operator)

### 6.1 On-page success

| # | Check | Expected |
| --- | --- | --- |
| 1 | Thanks / success message | HubSpot 標準の送信完了表示（文言は portal 設定依存） |
| 2 | Form error | **none** — domain allowlist / CAPTCHA エラーが出ないこと |
| 3 | Page remains on staging URL | `yskcreate.weblike.jp/.../contact/` |

### 6.2 HubSpot inbox / CRM

| # | Check | Expected |
| --- | --- | --- |
| 1 | HubSpot Contacts / Form submissions | 新規 submission 1件 |
| 2 | 名 | `太郎`（姓 `テスト`） |
| 3 | Eメール | test payload と一致 |
| 4 | お問い合わせ内容 | `Gosaki staging contact E2E test / …` を含む |
| 5 | Source / page URL | staging contact URL からの送信であること |

### 6.3 Staging-domain risk

| Risk | Action if fail |
| --- | --- |
| HubSpot **domain allowlist** が staging host を拒否 | portal 設定で `yskcreate.weblike.jp` を許可 · または operator が既知の許可済みドメインで再テスト（別承認） |
| CAPTCHA / spam filter | inbox に届かない場合は HubSpot 側設定確認 · **stop** |

**Staging URL からの送信:** 本番 cutover 前の **意図したテスト** — inbox に test 行が1件残ることは許容。本番前に test 行の整理方針を operator が判断。

### 6.4 Failure criteria — STOP

| Symptom | Action |
| --- | --- |
| 送信後もエラー表示 | stop · HubSpot portal / domain 設定確認 |
| inbox に submission なし（5分以内） | stop · 再送信しない |
| 本番ドメイン誤操作 | stop · incident 記録 |

---

## 7. P0 / P1 status (post G-20s2 preflight)

| ID | Status | Notes |
| --- | --- | --- |
| ~~P0-M1~~ Mobile QA | **RESOLVED** (G-20s1) | — |
| **P0-C1** Contact HubSpot E2E | **PARTIAL** — form renders · **inbox confirm pending** (G-20s2b) |
| **P1-CT1** Contact disclaimer | **OPEN** — recommend before client share |

```txt
clientPreviewVerdict: NOT_READY
reason: HubSpot submit → inbox not yet confirmed by operator
```

---

## 8. Cursor / AI actions in this phase

| Operation | Executed |
| --- | --- |
| Contact page GET | **yes** (read-only) |
| Playwright form field inspect | **yes** |
| Form submit / 送信 click | **no** |
| HubSpot API / POST | **no** |
| FTP / deploy | **no** |
| DB write / SQL / Save | **no** |
| package regen | **no** |
| commit / push | **no** |

---

## 9. Next phase

| Phase | Scope |
| --- | --- |
| **G-20s2b-contact-hubspot-e2e-execution-closure** | Operator manual submit ×1 + inbox confirm + result doc |
| **G-20s3-client-preview-copy-patch** (optional) | disclaimer · JP title · legacy stub |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-contact-hubspot-e2e-verify.mjs
```
