# G-20u36e — Gosaki Discography controlled Save auth JWT feasibility preflight

**Phase:** `G-20u36e-controlled-save-auth-jwt-feasibility-preflight`  
**Status:** **complete** — preflight design only · **no execution**  
**Date:** 2026-07-14  
**Base commit:** `df93bdf`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-plan.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-plan.md) — **FEASIBLE**

| Check | Status |
| --- | --- |
| Auth JWT feasibility preflight design | **yes** (this file) |
| Preflight only | **yes** |
| SQL executed | **no** |
| Executable SQL blocks prepared | **no** — investigation items listed only |
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

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtFeasibilityPreflightReady: true
phase: G-20u36e-controlled-save-auth-jwt-feasibility-preflight
preflightOnly: true
sqlExecuted: false
executableSqlBlocksPrepared: false
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
selectedPermissionModel: OptionA_authenticatedUpdateTitle_restrictiveRls_operatorJwt
priorFeasibilityVerdict: FEASIBLE
feasibilityPreflightVerdict: NEEDS_SELECT_ONLY_AUTH_SNAPSHOT
readyForG20u36eAuthAdminRlsSelectPrep: true
readyForG20u36eAuthJwtToolsDraftPlanning: false
readyForG20u36ePermissionChangePreflightPlanning: false
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 0. Controlled Save target (unchanged)

| Field | Value |
| --- | --- |
| sliceId | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| table | `public.discography_tracks` |
| track_number | **1** |
| before title | `On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track count | **8 → 8** |
| track 7 | **`Like a Lover`** — unchanged |

**First controlled Save:** **still not executable**.

---

## 1. Operator JWT operational preflight (design — not executed)

**Purpose:** Confirm staging operator can supply a user JWT for Save-only calls without exposing tokens in logs or docs.

**Execution owner:** operator browser QA + optional future tools draft — **not Cursor in this phase**.

### 1.1 Preconditions

| # | Check | How to verify (future execution) |
| --- | --- | --- |
| O1 | Staging admin UI reachable | `/__admin-staging-shell/` or Gosaki read-only admin STG route |
| O2 | Supabase Auth configured at build | `PUBLIC_SUPABASE_URL` host contains `kmjqppxjdnwwrtaeqjta` only |
| O3 | Production ref absent | URL / env must **not** reference `vsbvndwuajjhnzpohghh` |
| O4 | Save still disabled | No Save button arm · no `operation=save` POST |

### 1.2 Session / token acquisition procedure (future)

| Step | Action | Expected |
| --- | --- | --- |
| 1 | Open staging read-only admin page | Auth UI visible (email/password or signed-in state) |
| 2 | Sign in with **staging operator account** (real Supabase Auth user — not mock-only preview) | Auth status shows signed-in email |
| 3 | DevTools → Application / Network — **do not copy token into chat or doc** | Session exists locally |
| 4 | Confirm `getSession()` path exists in page script | Same pattern as YouTube dry-run block in `GosakiStagingReadOnlyAdminPage.astro` |
| 5 | Record **boolean only**: `access_token_obtainable: true/false` | **Never** paste token value |

### 1.3 access_token non-display policy

| Rule | Detail |
| --- | --- |
| Doc / chat | Record `access_token_obtainable`, `user_id` (UUID ok), email domain — **not** JWT string |
| Verifier / logs | Assert presence flags only · reject docs containing `eyJ` JWT prefixes |
| UI sanitizer | Reuse G-20u36c pattern — block JWT-like strings in endpoint response display |
| Save call (future) | Attach `Authorization: Bearer <token>` in memory only · never persist to localStorage |

### 1.4 Discography Save header design (future — not wired)

| operation | Authorization | apikey |
| --- | --- | --- |
| `dryRun` | `Bearer <PUBLIC_SUPABASE_ANON_KEY>` | anon key |
| `save` | `Bearer <operator access_token>` | anon key |

**Confirm in future execution:**

| # | Question | Pass criterion |
| --- | --- | --- |
| O5 | dryRun unchanged with anon key? | Endpoint dry-run button works without login (current G-20u36c) |
| O6 | Save requires login? | Unsigned Save attempt → client-side `auth_required` before POST |
| O7 | Save sends user JWT? | Network tab shows Bearer ≠ anon key length/pattern (value not logged) |
| O8 | tokenless save rejectable? | Edge returns **401/403** when save lacks user JWT (after Edge draft deploy) |
| O9 | anon-only save rejectable? | Edge returns **401/403** when Bearer equals anon key on `operation=save` |

### 1.5 YouTube dry-run precedent (confirmed read-only)

Same page already implements operator JWT for YouTube dry-run:

- `client.auth.getSession()` → `access_token`
- `headers.Authorization = "Bearer " + token` + `apikey: supabaseAnonKey`
- Login gate before fetch

**Discography endpoint dry-run** intentionally uses anon key only (G-20u36c). Save can adopt YouTube pattern without new auth infrastructure.

### 1.6 Operator JWT preflight summary

| Area | Preflight design status |
| --- | --- |
| Session path | **designed** — reuse YouTube pattern |
| Token hygiene | **designed** — non-display policy documented |
| dryRun anon maintained | **yes** — separate header builder by operation |
| Execution | **deferred** — browser QA in tools-draft or select-prep result phase |

---

## 2. Edge-side preflight (design — not implemented)

**Purpose:** Define how deployed Edge Function will accept operator JWT for Save only while preserving dryRun behavior.

**Sources (read-only):** `supabase/functions/gosaki-discography-save-dry-run/index.ts`, `handler.ts`

### 2.1 Current baseline

| Item | Today |
| --- | --- |
| Incoming `Authorization` forwarded to handler | **no** |
| CORS allows `authorization` | **yes** |
| readBack | `SUPABASE_ANON_KEY` only |
| Write client | **none** |
| `operation=save` | **400 reject** |
| service_role | **`SUPABASE_SERVICE_ROLE_CONNECTED = false`** |

### 2.2 Planned `index.ts` Authorization header pass-through (future implementation)

**Design:** `index.ts` reads incoming **`Authorization` header** and passes `authorizationHeader` into the handler input envelope.

```
Deno.serve(req):
  authorizationHeader = req.headers.get("Authorization") ?? ""
  apikeyHeader = req.headers.get("apikey") ?? ""
  pass { method, contentType, body, authorizationHeader, apikeyHeader } to handler
```

| Check | Design |
| --- | --- |
| E1 | Header pass-through | `authorizationHeader` optional string on handler input |
| E2 | No secret logging | Never log header values |
| E3 | OPTIONS unchanged | CORS preflight only |

### 2.3 Planned handler auth split (future implementation)

| operation | JWT rule | readBack | PostgREST write |
| --- | --- | --- | --- |
| `dryRun` (default) | anon key OK · user JWT optional/ignored for write | anon SELECT adapter | **none** |
| `save` | **user JWT required** | optional post-write readBack via user or anon SELECT | user-scoped client |

### 2.4 User JWT Supabase client (future — no service_role)

| Item | Design |
| --- | --- |
| Client bootstrap | `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: Bearer userJwt }}})` |
| Role | Requests run as **authenticated** JWT subject |
| service_role | **forbidden** — same as today |
| UPDATE shape | `PATCH /rest/v1/discography_tracks?site_slug=eq.gosaki-piano&discography_legacy_id=eq.discography-002&track_number=eq.1` body `{ title: "..." }` |

### 2.5 Reject policy for `operation=save` (future)

| Condition | HTTP | Error category |
| --- | --- | --- |
| Missing `Authorization` | **401** | `auth_required` |
| Bearer equals anon key | **403** | `anon_token_not_allowed_for_save` |
| Malformed Bearer | **401** | `invalid_authorization` |
| JWT invalid / expired | **401** | `invalid_or_expired_jwt` |
| Valid JWT but identity check fails | **403** | `operator_not_authorized` |
| Valid JWT but server-side slice guard fails | **400** | existing guard errors |
| Valid JWT but RLS denies | **403** | `rls_denied` (after permission change) |

**dryRun path:** maintain current behavior — no JWT requirement · `operation=save` still rejected until Save arm phase.

### 2.6 Edge identity verification (future)

| Step | Method |
| --- | --- |
| 1 | Extract Bearer token from `authorizationHeader` |
| 2 | `supabase.auth.getUser(jwt)` using anon-key bootstrap client |
| 3 | Record `user.id` / email for audit log (not JWT) |
| 4 | Optional: probe `is_admin()` via user-scoped SELECT (after DB snapshot confirms function semantics) |
| 5 | Run slice guards before PATCH |

### 2.7 Edge preflight summary

| Area | Preflight design status |
| --- | --- |
| Header pass-through | **designed** |
| save-only JWT gate | **designed** |
| user JWT write client | **designed** — no service_role |
| Reject matrix | **designed** |
| Implementation | **deferred** — G-20u36e-auth-jwt-tools-draft-planning |

---

## 3. DB-side auth / `is_admin()` / RLS preflight (design — not executed)

**Purpose:** List SELECT-only investigations required **before** permission-change SQL or Edge Save deploy.  
**This phase:** item checklist only — **no executable SQL block** (deferred to `G-20u36e-controlled-save-auth-admin-rls-select-prep`).

### 3.1 Known from prior snapshots

| Item | G-20u36e permission snapshot (2026-07-14) |
| --- | --- |
| anon write grants | **0** |
| authenticated UPDATE grants | **0** |
| authenticated title column UPDATE | **0** |
| RLS enabled | **true** on `discography` + `discography_tracks` |
| Admin ALL policies | **2** — `discography_admin_all`, `discography_tracks_admin_all` |
| Policy qual | `is_admin()` (PERMISSIVE) |

**Gap:** `is_admin()` **function body** not recorded in G-20u36e chain. G-20u36a deep-dive noted design RISK when UPDATE grants existed; grants now **0** but policies remain.

### 3.2 SELECT-only investigation items (next phase prep)

| ID | Investigation | Why needed |
| --- | --- | --- |
| D1 | **`is_admin()` definition** — `pg_proc` / `information_schema.routines` | Confirm whether it uses `auth.uid()`, JWT claims, `admin_users`, `profiles`, or role table |
| D2 | **`admin_users` (or equivalent) inventory** | Map staging operator email → DB admin membership |
| D3 | **Operator test user admin probe** | For chosen operator UUID: does `SELECT is_admin()` return true under JWT context? (RLS-safe probe design in prep phase) |
| D4 | **`pg_policies` permissive flag** | Confirm admin ALL policies are PERMISSIVE · inventory any existing RESTRICTIVE policies on `discography_tracks` |
| D5 | **Permissive + restrictive composition model** | Document expected PostgreSQL semantics: permissive OR, restrictive AND |
| D6 | **Hypothetical slice restrictive policy shape** | qual: `site_slug`, `discography_legacy_id`, `track_number=1` · cmd: UPDATE · roles: `{authenticated}` |
| D7 | **Grant + policy interaction** | If authenticated UPDATE(title) added: does admin ALL alone allow all columns/rows for `is_admin()` users? |
| D8 | **Column grant vs RLS split** | GRANT limits **privilege type**; RLS limits **rows** — both required for least privilege |
| D9 | **Non-admin authenticated user** | Confirm restrictive policy can allow slice UPDATE **without** `is_admin()` if that is the chosen path |
| D10 | **Permission rollback / cleanup** | After controlled Save: REVOKE column grant? DROP restrictive policy? Document in permission-change preflight |

### 3.3 RLS composition planning questions (answer in select-prep result)

| # | Question | Desired outcome |
| --- | --- | --- |
| Q1 | Can restrictive UPDATE policy alone authorize G-20u36e1 slice without widening to other rows? | **yes** |
| Q2 | If operator satisfies `is_admin()`, does permissive admin ALL expand beyond slice? | **must not** for other rows/columns — restrictive must cap effective access |
| Q3 | Is new restrictive policy required in addition to admin ALL? | **yes** (Option A decision) |
| Q4 | Can column-level UPDATE(title) prevent admin ALL from updating other columns? | **verify** — ALL policy may still permit other columns if table UPDATE grant is broad; column grant + RLS preflight must confirm |

### 3.4 Staging shell vs DB admin (known gap)

| Layer | Behavior |
| --- | --- |
| Browser `mock-allowlist` | UI role only (`mock-admin@example.com` etc.) — **not** PostgreSQL `is_admin()` |
| Real Supabase Auth sign-in | Required for operator JWT — email may differ from mock allowlist |
| Edge Save | Must use **DB** `is_admin()` / restrictive RLS outcome — not mock-allowlist |

**Action:** Operator must designate **one staging Supabase Auth user** for controlled Save. SELECT-only prep must confirm that user's DB admin status.

### 3.5 Permission rollback / cleanup (planning note)

After First controlled Save verification:

| Option | Scope |
| --- | --- |
| A | REVOKE authenticated UPDATE(title) on `discography_tracks` |
| B | DROP restrictive slice policy |
| C | Keep staging-only until CMS Kit generalization |

Decision deferred to **permission-change preflight** after Save result — document necessity now, execute later.

### 3.6 DB preflight summary

| Area | Preflight design status |
| --- | --- |
| Investigation checklist | **complete** (this doc) |
| `is_admin()` definition | **unknown** — needs SELECT-only prep |
| Operator DB admin mapping | **unknown** — needs SELECT-only prep |
| RLS composition proof | **unknown** — needs SELECT-only prep |
| Executable SQL | **not in this phase** |

---

## 4. Feasibility preflight verdict

### **NEEDS_SELECT_ONLY_AUTH_SNAPSHOT**

| Track | Status | Rationale |
| --- | --- | --- |
| Operator JWT path | **design sufficient** | YouTube precedent + session API confirmed read-only |
| Edge JWT design | **design sufficient** | Header pass-through + save-only gate + user client documented |
| DB auth / `is_admin()` / RLS | **insufficient without SELECT** | Function body · operator mapping · permissive/restrictive composition **unverified** |

**Not READY_FOR_AUTH_JWT_TOOLS_DRAFT_PLANNING alone:** Edge/caller tools draft may proceed in parallel for **non-DB** code paths, but **permission change** and **Save deploy** must wait for auth-admin-rls SELECT result.

**Not STOP:** JWT path is FEASIBLE · blockers are **information gaps** resolved by SELECT-only prep, not architectural impossibility.

---

## 5. Recommended next phases

**Priority order** (per operator preference — **no permission change SQL first**):

| Order | Phase | Scope |
| --- | --- | --- |
| **1** | **`G-20u36e-controlled-save-auth-admin-rls-select-prep`** | Prepare SELECT-only SQL for D1–D10 · operator checklist · output column e.g. `g20u36e_auth_admin_rls_snapshot` |
| 2 | `G-20u36e-controlled-save-auth-admin-rls-select-execution` | Operator runs SELECT once on `kmjqppxjdnwwrtaeqjta` · record result |
| 3 | **`G-20u36e-controlled-save-auth-jwt-tools-draft-planning`** | Edge handler draft + caller Save header builder (tools only · may start after prep doc, deploy blocked until D1–D10 PASS) |
| 4 | `G-20u36e-controlled-save-permission-change-preflight-planning` | GRANT + restrictive policy SQL **plan** — **only after** auth-admin-rls snapshot PASS |

**Do not skip:** auth-admin-rls SELECT before permission-change preflight.

---

## 6. STOP conditions

Stop and ask operator if any become true:

| # | Condition |
| --- | --- |
| 1 | Operator JWT acquisition path missing on staging shell |
| 2 | `access_token` cannot be handled without exposing in logs/docs |
| 3 | Edge cannot pass `Authorization` header to handler (platform limitation) |
| 4 | User JWT cannot be passed to Supabase client for authenticated PATCH |
| 5 | **service_role** becomes necessary |
| 6 | **anon UPDATE** becomes necessary |
| 7 | **`is_admin()` definition** cannot be determined |
| 8 | Operator user DB admin status cannot be confirmed |
| 9 | Permissive / restrictive RLS composition cannot be determined |
| 10 | Effective RLS scope too broad for G-20u36e1 slice |
| 11 | **production ref** `vsbvndwuajjhnzpohghh` in target config |
| 12 | SQL execution required **in this preflight design phase** |
| 13 | DB write required **in this preflight design phase** |
| 14 | **operation=save** HTTP required **in this preflight design phase** |

**This phase:** none triggered.

---

## 7. Not executed in this phase

| Item | Status |
| --- | --- |
| Operator browser JWT QA | **not executed** |
| Edge code change | **not executed** |
| SQL execution | **not executed** |
| Executable SQL block in this doc | **not prepared** |
| GRANT / REVOKE | **not executed** |
| RLS change | **not executed** |
| DB write | **not executed** |
| operation=save POST | **not sent** |
| dryRun HTTP re-send | **not sent** |
| Admin UI change | **not executed** |
| FTP | **not executed** |
| service_role | **not used** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-preflight
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-plan
npm run verify:g20u36e-controlled-save-permission-model-decision
npm run verify:current-active-regression
```
