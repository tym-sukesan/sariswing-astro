# G-20u36e — Gosaki Discography controlled Save auth JWT admin probe UI plan

**Phase:** `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning`  
**Status:** **complete** — UI probe planning only · **no UI / RPC / HTTP / SQL execution**  
**Date:** 2026-07-14  
**Base commit:** `a1fabb1`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-plan.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-plan.md) — Option C recommended

| Check | Status |
| --- | --- |
| UI probe planning | **yes** (this file) |
| Planning only | **yes** |
| UI implementation | **no** |
| RPC executed | **no** |
| HTTP executed | **no** |
| SQL created | **no** |
| SQL executed | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| JWT / access_token displayed | **no** |
| user_id / email displayed (probe result) | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPlanPrepared: true
phase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning
planningOnly: true
uiImplementationExecuted: false
rpcExecuted: false
httpExecuted: false
sqlCreated: false
sqlExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
dbWriteExecuted: false
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpResent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
jwtAccessTokenDisplayed: false
userIdEmailDisplayedInProbeResult: false
recommendedNextPhase: G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft
readyForFirstControlledSaveExecution: false
saveArmDecoupledFromProbe: true
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. UI probe purpose

Operator uses **staging read-only admin UI** while signed in:

1. Use existing Supabase JS client session (`getSession()` — no token copy).
2. Call **`rpc('is_admin')`** read-only under authenticated JWT context.
3. Confirm DB `is_admin()` is **true** for that operator.
4. Record / display only: `adminProbeStatus` · `isAdmin` · `reasonCode`.
5. **Never display:** access_token · refresh_token · user_id · email (in probe result) · service_role.

`is_admin()` DB meaning (confirmed prior): row in `public.admin_users` with `user_id = auth.uid()` and `role = 'admin'`.

---

## 2. Existing UI / auth findings (read-only)

**Sources reviewed:**

- `tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- Prior feasibility / probe plan docs

### 2.1 Session / client

| Finding | Detail |
| --- | --- |
| Supabase client | `getSupabaseClient()` — `createClient(supabaseUrl, supabaseAnonKey)` · persistSession · autoRefreshToken |
| Config | `data-gosaki-supabase-anon-key` · `data-gosaki-supabase-auth-configured` at build |
| Session API | `client.auth.getSession()` · `signInWithPassword` · `signOut` |
| Staging Auth section | `#gra-auth` — “Staging Auth（YouTube dry-run 用）” |
| `signedIn` flag | Gates YouTube dry-run button |

### 2.2 YouTube dry-run JWT precedent

| Step | Behavior |
| --- | --- |
| Gate | Requires `signedIn` |
| Token | `getSession()` → `access_token` in memory |
| Headers | `Authorization: Bearer ${token}` + `apikey: anonKey` |
| Logging | Result sanitizes body fields · **no intentional token log** |
| Note | Token appears in browser Network tab (unavoidable) — **must not paste to chat/doc** |

### 2.3 Discography UI placement

| Finding | Detail |
| --- | --- |
| Discography editor | `#gra-discography-editor` · local + endpoint dry-run buttons |
| Endpoint dry-run auth | **anon Bearer only** (not operator JWT) |
| Save | still disabled |
| Probe fit | New **manual diagnostic** block near `#gra-auth` **or** below discography editor meta — prefer **Auth section** (same session as YouTube) |

### 2.4 Mock allowlist vs DB `is_admin()`

| Layer | Role |
| --- | --- |
| Gosaki read-only admin page | Real Supabase Auth — **not** mock-allowlist |
| `src/.../staging-role-resolver` mock-allowlist | Separate `__admin-staging-shell` path — **must not** be used as DB admin proof |
| Probe copy | Explicit: “DB `is_admin()` via `admin_users` — not mock allowlist / UI role label” |

### 2.5 Email display caveat

Existing `#gra-auth-status` shows signed-in **email** for UX. That is **pre-existing**.  
**Probe result panel must not add user_id / email / tokens.** Do not expand probe output with PII. Optional later: redact email from auth status (out of scope for this planning; not required for probe PASS).

### 2.6 Staging-only guards already present

| Guard | Location |
| --- | --- |
| Staging ref | `G11C4A_STAGING_PROJECT_REF = kmjqppxjdnwwrtaeqjta` |
| Production STOP | `G20U36C_PRODUCTION_PROJECT_REF_STOP = vsbvndwuajjhnzpohghh` |
| Endpoint safety | `assertG20u36cDiscographyDryRunEndpointSafe` |

Probe tools draft must reuse staging URL/ref checks · refuse production host.

---

## 3. UI probe design (future implementation — not this phase)

### 3.1 UX shape

| Choice | Decision |
| --- | --- |
| Control | **Manual button** — e.g. “DB admin probe (read-only)” |
| Auto-run on load | **avoid** — no automatic RPC |
| Visibility | Visible diagnostic on staging read-only admin · copy: not Save · not grant · JWT not shown |
| Placement | **Preferred:** `#gra-auth` panel after login form / signed-in actions |
| Alternate | Discography editor footer diagnostic (same client) |

### 3.2 Display model

| Field | Values |
| --- | --- |
| `adminProbeStatus` | `not_run` · `running` · `pass` · `fail` · `error` |
| `isAdmin` | `true` · `false` · omit when not_run / error |
| `reasonCode` | see below |

**reasonCode enum:**

| Code | Meaning |
| --- | --- |
| `session_missing` | No authenticated session |
| `rpc_success_true` | `rpc('is_admin')` returned true |
| `rpc_success_false` | returned false — likely missing `admin_users` row |
| `rpc_error` | RPC failed (permission / schema / network) |
| `unexpected` | Malformed / unknown response |
| `production_ref_blocked` | Host/ref is production STOP |

### 3.3 Must not display

| Forbidden in probe UI / result / console.log |
| --- |
| access_token · refresh_token |
| user_id / UUID |
| email (probe result) |
| service_role · anon key (beyond existing build wiring) |
| Raw RPC error stacks with secrets |

### 3.4 Client call sketch (design only)

```
client = getSupabaseClient()
session = await client.auth.getSession()
if (!session?.access_token) → session_missing / fail
assert staging supabaseUrl includes kmjqppxjdnwwrtaeqjta
assert not vsbvndwuajjhnzpohghh
{ data, error } = await client.rpc('is_admin')
map data boolean → rpc_success_true | rpc_success_false
map error → rpc_error
```

No `Authorization` header hand-assembly required — session already on client (safer than Option B paste).

### 3.5 Decouple from Save / permission change

| Rule | Required |
| --- | --- |
| Probe PASS | **does not** enable Save buttons |
| Probe PASS | **does not** run GRANT / RLS SQL |
| Probe PASS | **does not** set env arms for G-20u36e Save |
| Separate doc record | Operator pastes boolean / reasonCode only to ChatGPT for result phase |
| Copy in UI | “Diagnostic only · First controlled Save remains disabled” |

### 3.6 Staging-only / production

| Rule | Required |
| --- | --- |
| Build host gate | `PUBLIC_SUPABASE_URL` / hardcoded staging URL must include staging ref |
| Runtime pre-check | Abort with `production_ref_blocked` if production ref detected |
| Prefer hide probe on production builds | If PROD or wrong host — button hidden/disabled |

---

## 4. Success conditions

| # | Condition |
| --- | --- |
| 1 | Logged-in session exists |
| 2 | `rpc('is_admin')` returns **true** |
| 3 | No token / user_id / email in probe result display |
| 4 | No DB write · no Save · no permission change |
| 5 | Result recorded as boolean + reasonCode only |
| 6 | Staging ref only |

**PASS does not authorize:** First controlled Save · Edge Save · GRANT execution.

---

## 5. Failure handling

| reasonCode | Handling |
| --- | --- |
| `session_missing` | Operator signs in via `#gra-auth` · retry |
| `rpc_success_false` | Operator likely not in `admin_users` with `role='admin'` · **enrollment planning separate** · **no registration SQL in UI / this plan** |
| `rpc_error` | EXECUTE / PostgREST exposure / client schema — follow with **`G-20u36e-controlled-save-auth-jwt-admin-probe-rpc-preflight`** |
| `production_ref_blocked` | **STOP** |
| Need to display JWT to debug | **STOP** — redesign |

---

## 6. Recommended next phase

| Order | Phase | Why |
| --- | --- | --- |
| **1** | **`G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft`** | Draft probe helper + UI wiring plan/code under `tools/static-to-astro/**` · still no STG package push until explicit |
| 2 | `G-20u36e-controlled-save-auth-jwt-admin-probe-ui-preflight` | Operator checklist before clicking probe on STG |
| 3 | `G-20u36e-controlled-save-auth-jwt-admin-probe-rpc-preflight` | Only if tools draft / local check suggests EXECUTE missing |

**This planning phase:** no tools draft code yet — next phase builds it.

**Still blocked:** permission-change SQL · operation=save · Edge Save write.

---

## 7. STOP conditions

| # | Condition |
| --- | --- |
| 1 | Design requires displaying JWT / access_token |
| 2 | Design requires displaying user_id / email in probe result |
| 3 | service_role required |
| 4 | DB write required for probe |
| 5 | Probe coupled to Save enablement |
| 6 | Probe PASS auto-arms Save |
| 7 | Production ref in target |
| 8 | Planning requires editing `src/**` / `public/**` now |
| 9 | Planning requires RPC / HTTP / SQL execution now |

**This phase:** none triggered.

---

## 8. Not executed in this phase

| Item | Status |
| --- | --- |
| UI implementation / admin UI change | **no** |
| RPC / HTTP / SQL | **no** |
| GRANT / RLS / DB write | **no** |
| Edge / deploy | **no** |
| operation=save / dryRun HTTP | **no** |
| FTP | **no** |
| service_role / JWT display | **no** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-plan
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-result
npm run verify:current-active-regression
```
