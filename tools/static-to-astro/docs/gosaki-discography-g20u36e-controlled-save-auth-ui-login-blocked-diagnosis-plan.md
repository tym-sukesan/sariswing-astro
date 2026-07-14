# G-20u36e — Gosaki Discography controlled Save auth UI login blocked diagnosis plan

**Phase:** `G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning`  
**Status:** **complete** — diagnosis planning only · **no UI fix** · **no package / FTP / browser / RPC**  
**Date:** 2026-07-14  
**Base commit:** `380677d`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result.md)

| Check | Status |
| --- | --- |
| Diagnosis planning only | **yes** |
| UI fix / source change | **no** (`uiFixExecuted: false`) |
| Package generation | **no** (`packageGenerated: false`) |
| output/manual-upload update | **no** (`outputManualUploadUpdated: false`) |
| FTP re-upload | **no** (`ftpReuploadExecuted: false`) |
| Browser operation | **no** (`browserOperationExecuted: false`) |
| Probe button clicked | **no** (`probeButtonClicked: false`) |
| RPC executed | **no** (`rpcExecuted: false`) |
| HTTP executed | **no** (`httpExecuted: false`) |
| SQL created | **no** (`sqlCreated: false`) |
| SQL executed | **no** (`sqlExecuted: false`) |
| DB write | **no** (`dbWriteExecuted: false`) |
| GRANT / REVOKE | **no** (`grantRevokeExecuted: false`) |
| RLS change | **no** (`rlsPolicyChangeExecuted: false`) |
| Edge implementation | **no** (`edgeImplementationExecuted: false`) |
| Edge deploy | **no** (`edgeDeployExecuted: false`) |
| operation=save | **not sent** (`operationSaveSent: false`) |
| Save enablement | **no** (`saveEnablementExecuted: false`) |
| service_role | **not used** (`serviceRoleUsed: false`) |
| JWT / access_token / refresh_token displayed | **no** (`jwtAccessTokenRefreshTokenDisplayed: false`) |
| user_id / email in probe result | **no** (`userIdEmailDisplayedInProbeResult: false`) |
| Production changed | **no** (`productionChanged: false`) · production未変更 |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthUiLoginBlockedDiagnosisPlanPrepared: true
phase: G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning
diagnosisPlanningOnly: true
uiFixExecuted: false
packageGenerated: false
outputManualUploadUpdated: false
ftpReuploadExecuted: false
browserOperationExecuted: false
probeButtonClicked: false
rpcExecuted: false
httpExecuted: false
sqlCreated: false
sqlExecuted: false
dbWriteExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
edgeImplementationExecuted: false
edgeDeployExecuted: false
operationSaveSent: false
saveEnablementExecuted: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
productionChanged: false
readyForStgReadonlyProbeExecution: false
recommendedNextPhase: G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.  
**STG package sourceCommit:** `a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe`  
**STG admin:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

---

## 1. Read-only investigation results

**Sources reviewed (no edits):**

- `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts` (probe helpers only; login UX is Astro inline)

### 1.1 DOM ids / acquisition

| Control | id | JS acquisition |
| --- | --- | --- |
| Login submit | `gra-auth-sign-in-btn` | `getElementById` in YouTube/auth **inline IIFE** |
| Email | `gra-auth-email` | same |
| Password | `gra-auth-password` | same |
| Logout | `gra-auth-sign-out-btn` | same · SSR starts **`disabled`** |
| Probe | `gra-admin-probe-btn` | **separate** module script `wireG20u36eAdminProbe` |
| YouTube dry-run | `gra-youtube-dry-run-btn` | same IIFE as auth · SSR **`disabled` hard-coded** |

**Id uniqueness (static):** single occurrence of each `gra-auth-*` / probe id — **no duplicate ids** found in template.

### 1.2 SSR vs runtime disabled

| Control | SSR |
| --- | --- |
| Login | `disabled={!supabaseAuthConfigured}` — if Auth **configured**, attribute **omitted** (enabled in HTML) |
| Probe | same as login |
| Logout | always **`disabled`** until signed-in |
| Config banner | same `supabaseAuthConfigured` → “configured” copy |

Screenshot: **Auth configured** + **未ログイン** + login/probe **look** disabled.  
If IIFE runs and `setAuthUiSignedOut()` runs, JS `updateLoginButton()` should set `login.disabled = false` when configured && !signedIn.

### 1.3 `updateLoginButton` / listeners / IIFE flow

```txt
inline IIFE:
  query YouTube dry-run + auth DOM
  if (!youtubeBtn || !youtubeInput || !youtubeResult || !body) return;  // EARLY EXIT
  updateLoginButton(): disable if !configured || signedIn; else enable
  input listeners: "input" only on email/password
  refreshAuthStatus() → waitForSupabaseClient → getSession → signedIn/out UI
  signInWithPassword on form submit
```

| Finding | Detail |
| --- | --- |
| `updateLoginButton` | **exists** · enable condition = `supabaseAuthConfigured && !signedIn` only (**does not** require filled email/password) |
| Input listeners | **`input` only** — no `change` / `keyup` |
| Autofill | Irrelevant to enable math (A low for *enable*), still worth hardening |
| `refreshAuthStatus` | calls `updateLoginButton` before wait; signed-out path calls it again |
| Early return | **Gates entire auth + YouTube wiring** on YouTube dry-run DOM presence |
| Probe script | Separate module · does **not** call auth `updateLoginButton` · unlikely to stop auth IIFE |

### 1.4 Critical CSS finding (false “disabled” appearance)

In `gosaki-staging-read-only-admin.css`:

```css
.gosaki-read-only-admin__btn {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
```

There is **no** `:not(:disabled)` (or `.btn--primary:not(:disabled)`) override restoring active look / `cursor: pointer`.

| Implication | Detail |
| --- | --- |
| Enabled login / probe | Can still **look** grey + **not-allowed cursor** |
| Operator report | “ログインボタンが disabled に見える” may be **visual**, not HTML `disabled` |
| Tools-draft priority | Add enabled-state CSS · keep `disabled` attribute logic for real disables |
| DevTools check (execution later) | Confirm whether `#gra-auth-sign-in-btn` has `disabled` attribute or only looks disabled |

### 1.5 getSession / signed-in sync

| Path | Behavior |
| --- | --- |
| Session present | `setAuthUiSignedIn(email)` — login form hidden · logout shown · **email may appear in auth status** (pre-existing; not probe result) |
| No session | `setAuthUiSignedOut()` → status “未ログイン …” · login form shown |
| Screenshot | Matches signed-out status copy · probe idle `not_run` |

### 1.6 Probe UI side effect

| Item | Assessment |
| --- | --- |
| Markup under `#gra-auth-panel` | Added below login form |
| Init failure isolation | Probe is separate script · early return only skips probe |
| Shared CDNs | Both use `window.supabase` · expected |
| Save coupling | Probe `saveEnabled: false` · does not arm Save |

### 1.7 Static recommended likelihood (planning judgment)

| Rank | Candidate | Likelihood |
| --- | --- | --- |
| 1 | **CSS false disabled look** (base `.btn` always muted / `not-allowed`) | **High** |
| 2 | Real `disabled` still set — verify next (F) | Medium — needs DevTools |
| 3 | Auth IIFE early return (D) if YouTube nodes missing | Low on full STG page (nodes present in template) |
| 4 | A autofill input events | Low for login **enable** (no fill gate) |
| 5 | G signed-in/out desync | Low given “未ログイン” + visible form |
| 6 | E id duplication | Low (static unique) |
| 7 | C dry-run mixed into login enable | Low (not in `updateLoginButton`) |
| 8 | H client ok but button not re-enabled | Medium-low if CSS is root |

---

## 2. Cause candidate classification (A–H)

| ID | Candidate | Static finding |
| --- | --- | --- |
| **A** | Autofill / prefilled value without `input` → `updateLoginButton` not run | Listeners are `input`-only; enable does **not** need values — **unlikely sole cause** of stuck disable |
| **B** | `updateLoginButton` defined but never called after init | Called from `refreshAuthStatus` / `setAuthUiSignedOut` **if IIFE runs** |
| **C** | Configured but enable mixes session / dry-run state | Login enable uses **configured \|\| signedIn only**; dry-run has separate `updateDryRunButton` |
| **D** | Probe UI / IIFE / null → auth init aborts | Probe separate; **YouTube null early return** can abort **all** auth wiring |
| **E** | Id duplicate / wrong element | **No** static duplicate `gra-auth-sign-in-btn` etc. |
| **F** | Real HTML `disabled` remains (not just CSS) | Possible; screenshot alone insufficient — **must confirm in DevTools** next |
| **G** | Signed-in / signed-out display sync broken | Status “未ログイン” + form visible suggests **signed-out path** ran |
| **H** | Supabase client ok but sign-in btn not re-enabled | Possible if `updateLoginButton` skipped (`authSignInBtn` null) or re-disabled after |

**Additional finding (map near F):** even when **not** `disabled`, CSS makes `.btn` look disabled (**primary tools-draft target**).

---

## 3. Low-risk fix directions (do **not** implement in this phase)

| # | Direction |
| --- | --- |
| 1 | CSS: `.btn:not(:disabled)` and `.btn--primary:not(:disabled)` → active colors + `cursor: pointer` |
| 2 | Call `updateLoginButton()` once after auth DOM ready (and after config read) |
| 3 | Add `change` / `keyup` (and optional autofill `setTimeout` 0/250/1000) for robustness |
| 4 | Keep enable rule simple: `authConfigured && !signedIn` (already) — document / don’t couple Save |
| 5 | Decouple auth IIFE from YouTube dry-run presence (guard YouTube separately; never early-return before auth wiring) |
| 6 | Isolate probe init from auth (already separate; keep try/guard) |
| 7 | Separate status text vs button disabled control (already mostly separate; avoid token/email in **probe** result) |
| 8 | Never show JWT / access_token / user_id in probe panel; do not arm Save / `operation=save` |

**Out of scope for tools-draft:** FTP re-upload · browser probe click · `src/**` · `supabase/functions/**`.

---

## 4. STOP conditions

| # | Condition |
| --- | --- |
| 1 | Diagnosis / fix requires displaying JWT / access_token |
| 2 | Need to put user_id / email in probe UI or docs as secrets dump |
| 3 | service_role required |
| 4 | DB write / GRANT / RLS required |
| 5 | Save enablement / `operation=save` required |
| 6 | Production ref / path involved |
| 7 | Must edit `src/**` / `public/**` for auth (prefer `tools/static-to-astro/templates/...`) |
| 8 | Must edit `supabase/functions/**` |
| 9 | FTP re-upload required **during planning** (upload is later explicit phase) |

**This phase:** none triggered as execution paths.

---

## 5. Recommended next phase

**`G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft`**

Minimal fix under `tools/static-to-astro/templates/site-extensions/gosaki-piano/**`:

1. Enabled-button CSS (highest priority)  
2. Auth IIFE independence from YouTube early return  
3. Optional input/change + post-init `updateLoginButton()` harden  

Still separate later: package regen · freshness · manual FTP · STG login verify · readonly probe click.

Still blocked: First controlled Save · permission SQL · Edge Save · operation=save.

---

## 6. Not executed in this phase

| Item | Status |
| --- | --- |
| UI / template / CSS edit | **no** |
| Package / output / FTP | **no** |
| Browser / probe / RPC / HTTP / SQL | **no** |
| DB write / GRANT / RLS / Edge | **no** |
| operation=save / Save enable | **no** |
| service_role / token display | **no** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight
```
