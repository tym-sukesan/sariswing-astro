# G-20u36e — Gosaki Discography controlled Save auth JWT feasibility plan

**Phase:** `G-20u36e-controlled-save-auth-jwt-feasibility-planning`  
**Status:** **complete** — feasibility planning only · **no Edge / SQL / Save**  
**Date:** 2026-07-14  
**Base commit:** `457c579`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-model-decision.md](./gosaki-discography-g20u36e-controlled-save-permission-model-decision.md) — Option A selected

| Check | Status |
| --- | --- |
| Feasibility planning | **yes** (this file) |
| Planning only | **yes** |
| SQL created | **no** |
| Executable SQL blocks | **no** |
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

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthJwtFeasibilityPlanned: true
phase: G-20u36e-controlled-save-auth-jwt-feasibility-planning
planningOnly: true
sqlCreated: false
executableSqlBlocksCreated: false
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
selectedPermissionModel: OptionA_authenticatedUpdateTitle_restrictiveRls_operatorJwt
feasibilityVerdict: FEASIBLE
readyForG20u36eAuthJwtFeasibilityPreflight: true
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
| release scalars | unchanged |

**First controlled Save:** **still not executable** — permission change + Edge Save draft + deploy required after preflight phases.

---

## 1. Current Edge Function auth / client findings (read-only)

**Sources reviewed (read-only):**

- `supabase/functions/gosaki-discography-save-dry-run/index.ts`
- `supabase/functions/gosaki-discography-save-dry-run/handler.ts`

### 1.1 Incoming HTTP headers

| Item | Finding |
| --- | --- |
| `Authorization` header read from request | **no** — `index.ts` `Deno.serve` parses method, content-type, JSON body only; **does not forward** incoming headers to handler |
| `apikey` header read from request | **no** — not parsed |
| CORS allows `authorization` | **yes** — `Access-Control-Allow-Headers` includes `authorization, x-client-info, apikey, content-type` |
| User JWT forwarding to handler | **not implemented today** — **design gap only**; HTTP layer can pass `req.headers.get("Authorization")` in a future implementation phase |

### 1.2 Supabase client creation

| Item | Finding |
| --- | --- |
| readBack adapter | `createDefaultAnonSelectReadBackAdapter` — env `SUPABASE_ANON_KEY` only |
| readBack HTTP headers | `apikey: anonKey` + `Authorization: Bearer ${anonKey}` |
| Write Supabase client | **none** — dryRun simulation only; `operation=save` **400 reject** |
| service_role | **`SUPABASE_SERVICE_ROLE_CONNECTED = false`** — constant only; **no service_role env read, no service_role client** |
| Payload guard | rejects serialized payloads containing `service_role` string |

### 1.3 readBack auth model

**Confirmed:** readBack uses **anon/public key only** (`SUPABASE_ANON_KEY` from Edge env). Incoming caller `Authorization` is **not** used for readBack SELECT. This matches G-20u36d live verify (verifier scripts use `PUBLIC_SUPABASE_ANON_KEY` as Bearer + apikey).

### 1.4 operation=save today

| Item | Finding |
| --- | --- |
| `operation=save` | **rejected** — `errors: ['operation "save" is rejected by dry-run endpoint — use dryRun only']`, status **400** |
| JWT requirement for save | **none today** — save path not implemented |

### 1.5 Edge feasibility (design, not implementation)

| Capability | Feasible? | Notes |
| --- | --- | --- |
| Accept `Authorization: Bearer <user access token>` on save | **yes** | CORS already allows; `index.ts` can pass header into handler |
| Reject save when Bearer missing / anon key only | **yes** | Distinguish anon JWT (same as apikey) vs user JWT in implementation phase |
| Create write client with user JWT (not service_role) | **yes** | Standard Supabase pattern: `createClient(url, anonKey, { global: { headers: { Authorization: Bearer userJwt }}})` or `@supabase/supabase-js` with user session |
| Keep dryRun readBack on anon key | **yes** | No change required for dryRun path |
| Server-side admin / identity check before PATCH | **yes** | Edge can call `auth.getUser(jwt)` or decode JWT claims + optional `is_admin()` probe via user-scoped SELECT |

**Edge verdict:** **design feasible** — current code is anon-only by choice, not a platform limitation.

---

## 2. Current caller / admin UI auth findings (read-only)

**Sources reviewed (read-only):**

- `tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts`
- `tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-fetch-post-wiring.md`
- `src/lib/admin/staging-auth/supabase-staging-auth-client.ts`
- `src/lib/admin/staging-auth/staging-auth-session.ts`
- `src/lib/admin/staging-data/gosaki-staging-about-content-admin-ui.ts` (JWT fetch precedent)
- `src/lib/admin/invoke-admin-edge.ts` (production `/admin` pattern — **not** staging discography path)

### 2.1 Staging shell Supabase Auth session

| Item | Finding |
| --- | --- |
| Supabase Auth on staging read-only admin page | **yes** — `signInWithPassword`, `getSession`, `signOut`, auth status UI |
| Operator can obtain `access_token` | **yes** — `client.auth.getSession()` → `session.access_token` |
| Auth client | `getStagingSupabaseClient(url, anonKey)` — **anon key only** for client bootstrap; session JWT stored by Supabase JS |
| Staging UI role display | **mock-allowlist** (`staging-role-resolver.ts`) — **does not query `admin_users` / `is_admin()`** in browser |

### 2.2 Discography endpoint dry-run (G-20u36c) — current auth

| Item | Finding |
| --- | --- |
| Endpoint | `…/functions/v1/gosaki-discography-save-dry-run` @ `kmjqppxjdnwwrtaeqjta` |
| Auth headers | `Authorization: Bearer <PUBLIC_SUPABASE_ANON_KEY>` + `apikey: anonKey` |
| Operator JWT | **not used** for discography endpoint dry-run |
| Login required for discography endpoint dry-run | **no** — unlike YouTube dry-run on same page |
| operation | **`dryRun` only** — Save buttons disabled |

### 2.3 Precedent: YouTube dry-run on same page (operator JWT)

Same `GosakiStagingReadOnlyAdminPage.astro` already implements operator JWT for YouTube Edge dry-run:

1. Require signed-in session (`signedIn` gate).
2. `client.auth.getSession()` → `access_token`.
3. `headers.Authorization = "Bearer " + token` + `apikey: supabaseAnonKey`.
4. `fetch(endpoint, { method: "POST", headers, body })`.

**Implication:** Discography **Save** can reuse this pattern without new auth infrastructure. Discography **dryRun** can remain anon-key-only.

### 2.4 Live verify scripts (tools)

| Item | Finding |
| --- | --- |
| G-20u36e dryRun live verify | `Authorization: Bearer ${anonKey}` + `apikey` — **operator JWT not used** |
| Direct HTTP verify pattern | intentional for CI/operator scripts; Save arm would add separate JWT-required path |

### 2.5 Caller feasibility (design, not implementation)

| Capability | Feasible? | Notes |
| --- | --- | --- |
| Save requires login + user JWT | **yes** — mirror YouTube dry-run gate |
| dryRun stays anon/public key | **yes** — current G-20u36c wiring unchanged |
| Pass Bearer user JWT only on `operation=save` | **yes** — conditional header builder in future UI/tools phase |
| `/admin` `invokeAdminEdgeFunction` | separate path — uses `supabaseAdmin.auth.getSession()`; staging discography uses read-only admin template |

**Caller verdict:** **design feasible** — session + JWT path **already exists** on staging shell; discography currently uses anon key **by design**, not due to missing auth.

---

## 3. Feasible design (Option A + operator JWT)

Planning target — **not implemented in this phase**.

### 3.1 Operation split

| operation | Auth | Edge behavior |
| --- | --- | --- |
| `dryRun` | **anon/public key OK** (current) | Schema validation + optional anon readBack — **no DB write** |
| `save` | **operator JWT required** | Reject if `Authorization` missing, anon-only, or invalid user JWT |

### 3.2 Edge save path (future implementation sketch)

1. Parse `Authorization: Bearer <token>` from incoming request.
2. If missing or token equals anon key → **401/403** with clear error (save only).
3. Validate user identity (`auth.getUser` or equivalent) — staging operator account.
4. Optional: verify admin eligibility (see §4 — `is_admin()` vs restrictive policy).
5. Run **server-side guards** (unchanged from edge-save-path plan):
   - sliceId / approvalId
   - siteSlug=`gosaki-piano`, legacyId=`discography-002`, track_number=1
   - old title=`On a Clear Day`, new title=`On a Clear Day [CMS Kit staging G-20u36e]`
   - fingerprint / diff — track count 8→8, track 7 unchanged
6. Create Supabase client with **user JWT** (authenticated role) — **not service_role**.
7. Execute **one-row UPDATE** on `discography_tracks.title` only.
8. Return sanitized response (no secrets, no service_role).

### 3.3 Caller save path (future UI/tools sketch)

1. Operator logs in on staging read-only admin (existing auth UI).
2. Preview dryRun (anon key OK) — unchanged.
3. Save button (future, gated, approval-armed):
   - `getSession()` → require `access_token`
   - POST with `operation=save`, save approvalId, controlled payload
   - Headers: `Authorization: Bearer <access_token>`, `apikey: anonKey`
4. Direct HTTP one-shot Save (operator script) — same JWT requirement; anon-only script **must not** arm save.

### 3.4 Defense in depth

| Layer | Role |
| --- | --- |
| Edge HTTP gate | save requires user JWT |
| Edge server-side guard | slice / titles / fingerprint / diff |
| PostgreSQL GRANT | authenticated UPDATE on `title` column only (future approved phase) |
| RLS | restrictive policy — single row / column minimization (future approved phase) |
| Post-save | permission cleanup or staging-only retention — **separate phase decision** |

### 3.5 Explicit non-goals (unchanged)

- **no service_role**
- **no anon UPDATE**
- **no delete/rebuild track list**
- **no production ref**

---

## 4. `is_admin()` policy and restrictive RLS considerations

**From permission snapshot (G-20u36e-controlled-save-permission-snapshot-select-result):**

| Item | Recorded |
| --- | --- |
| `discography_admin_all` | ALL · `{authenticated}` · `is_admin()` |
| `discography_tracks_admin_all` | ALL · `{authenticated}` · `is_admin()` |
| authenticated UPDATE grants | **0** (blocked at grant layer today) |
| RLS enabled | **true** on both tables |

### 4.1 Grant + existing admin ALL interaction

If **authenticated UPDATE(title)** grant is added **without** new restrictive policy:

- Existing **`discography_tracks_admin_all`** (ALL + `is_admin()`) would allow any authenticated user satisfying **`is_admin()`** to UPDATE **any column / any row** on `discography_tracks` — **too broad** for First controlled Save documentation.
- Option A decision already rejected relying on admin ALL alone.

### 4.2 Restrictive RLS policy (planned, not created here)

Recommended next-phase approach:

- Add **new restrictive UPDATE policy** scoped to:
  - `site_slug = 'gosaki-piano'`
  - `discography_legacy_id = 'discography-002'`
  - `track_number = 1`
  - column: **`title` only** (via column grant + policy qual)
- Purpose: minimize blast radius even if admin ALL exists.

### 4.3 Permissive vs restrictive policy composition (preflight required)

PostgreSQL RLS semantics (to verify on staging in **preflight**, not this phase):

| Policy type | Combination |
| --- | --- |
| **PERMISSIVE** (default) | OR — any matching policy allows access |
| **RESTRICTIVE** | AND — all permissive matches must also pass restrictive policies |

**Planning questions for next preflight:**

1. If operator JWT user **does not** satisfy `is_admin()`, can **restrictive-only** policy alone authorize the one-row title UPDATE?
2. If operator **does** satisfy `is_admin()`, does permissive admin ALL **expand** write scope beyond the slice unless restrictive policy blocks other rows/columns?
3. Should admin ALL be temporarily narrowed, or rely on restrictive + column grant to cap effective access?
4. Which staging operator account will be used — does it appear in `admin_users` / satisfy `is_admin()`?

### 4.4 Staging shell vs DB `is_admin()`

| Layer | Finding |
| --- | --- |
| Browser mock-allowlist | UI role only — **not** PostgreSQL `is_admin()` |
| Edge save auth | must validate against **DB** `is_admin()` and/or restrictive policy using **user JWT**, not mock-allowlist |
| Gap | **preflight must confirm** test operator JWT maps to expected DB role / `is_admin()` outcome |

**This phase:** no RLS/GRANT change · no `is_admin()` SQL probe · document risk only.

---

## 5. Feasibility verdict

### **FEASIBLE**

| Criterion | Result |
| --- | --- |
| Edge can accept operator JWT | **yes** — CORS + HTTP header pass-through feasible; no service_role required |
| Caller can obtain operator JWT | **yes** — staging shell Supabase Auth + YouTube precedent on same page |
| dryRun can stay anon | **yes** — independent code path |
| save can require JWT only | **yes** — operation-split design |
| Write via authenticated role + RLS | **yes** — aligns with Option A (pending grant/RLS preflight) |
| Blockers | **none at design level** |

**Not PARTIAL:** caller session path is **confirmed** (not merely hypothetical).

**Not STOP:** anon-only today is implementation choice; JWT path exists on staging shell.

---

## 6. STOP conditions (this phase and future)

Stop and ask operator if any of the following become true:

| # | Condition |
| --- | --- |
| 1 | Edge cannot accept `Authorization: Bearer` user JWT |
| 2 | Caller cannot obtain operator JWT (no auth session on staging shell) |
| 3 | Admin UI has no authentication session for Save operator |
| 4 | Design cannot move off anon-key-only for save path |
| 5 | **service_role** becomes necessary for write |
| 6 | **anon UPDATE** becomes necessary |
| 7 | **`is_admin()` target users unknown** — cannot pick test operator |
| 8 | RLS composition allows **broader UPDATE** than G-20u36e1 slice |
| 9 | SQL creation / execution required **in this planning phase** |
| 10 | DB write required **in this planning phase** |
| 11 | **operation=save** HTTP must be sent **in this planning phase** |
| 12 | **production ref** `vsbvndwuajjhnzpohghh` appears in target config |

**This phase:** none triggered.

---

## 7. Recommended next phases

**Priority order** (permission change SQL **after** JWT + RLS preflight):

| Order | Phase | Purpose |
| --- | --- | --- |
| 1 | **`G-20u36e-controlled-save-auth-jwt-feasibility-preflight`** | Confirm operator JWT user vs `is_admin()` · RLS permissive/restrictive composition on staging (SELECT-only probes · **no GRANT change in preflight planning**) |
| 2 | **`G-20u36e-controlled-save-auth-jwt-tools-draft-planning`** | Edge handler draft + caller Save header builder (tools only · no deploy) |
| 3 | `G-20u36e-controlled-save-permission-change-preflight-planning` | Grant + restrictive policy SQL **plan** (still no execution until operator approval) |
| 4 | Operator permission change → Edge Save root placement → deploy → one-shot controlled Save |

**Do not skip:** user JWT design confirmation + admin/RLS composition preflight **before** permission change SQL.

---

## 8. Not executed in this phase

| Item | Status |
| --- | --- |
| Edge implementation | **not executed** |
| supabase/functions edit | **not executed** |
| Edge deploy | **not executed** |
| SQL / executable SQL | **not created** |
| SQL execution | **not executed** |
| GRANT / REVOKE | **not executed** |
| RLS CREATE/ALTER/DROP | **not executed** |
| DB write | **not executed** |
| operation=save POST | **not sent** |
| dryRun HTTP re-send | **not sent** |
| Admin UI change | **not executed** |
| FTP / upload | **not executed** |
| service_role | **not used** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-plan
npm run verify:g20u36e-controlled-save-permission-model-decision
npm run verify:g20u36e-controlled-save-permission-snapshot-select-result
npm run verify:current-active-regression
```
