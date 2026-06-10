# Supabase Auth Staging Connection Checklist

**Phase:** G-5y-d-prep — Supabase Auth staging connection checklist  
**Status:** preflight only · no Auth connection · no Supabase client

Related config: [`supabase-auth-staging-connection-checklist.json`](../config/admin/supabase-auth-staging-connection-checklist.json)

---

## 1. Purpose

G-5y-d-prep prepares everything required **before** connecting Supabase Auth to the staging shell in **G-5y-d**.

This phase is **checklist / approval / rollback design only**. It does **not**:

- Connect Supabase Auth
- Import `@supabase/supabase-js` or call `createClient`
- Implement `signInWithPassword` or send password reset emails
- Persist sessions
- Create or query `admin_users` table
- Create or change RLS policies
- Query or update the database
- Modify production Auth or existing Sariswing admin/Auth code

Goals:

- Document Supabase project selection criteria
- Confirm staging / production environment separation
- Design redirect URLs and password reset callback URLs
- Define env variable names and placement
- Fix initial allowlist / role policy
- Define G-5y-d approval gate and rollback plan

---

## 2. Current state

| Phase | Status |
| --- | --- |
| **G-5x** | Staging runtime shell at `/__admin-staging-shell/musician-basic/` |
| **G-5y-a** | [Supabase Auth staging integration plan](./supabase-auth-staging-integration-plan.md) |
| **G-5y-b** | [Auth adapter scaffold](./admin-auth-adapter-scaffold.md) / mock provider |
| **G-5y-c** | [Staging login UI shell](./staging-login-ui-shell.md) |
| **readyForG5yD** | `true` (dry-run CLI) |

Current Auth state:

| Item | Value |
| --- | --- |
| Real Auth | **disabled** (`ENABLE_ADMIN_STAGING_AUTH=false`) |
| Supabase client import | **none** |
| Credentials submitted | **no** |
| Session created | **no** |
| DB / RLS changes | **none** |
| Production Auth | **untouched** |

---

## 3. Staging Auth connection principles

| Principle | Meaning |
| --- | --- |
| **staging first** | G-5y-d uses a dedicated staging/dev Supabase project only |
| **explicit approval required** | Approval ID required before any Auth connection code |
| **production Auth disabled** | Sariswing production Auth and prod Supabase project untouched |
| **no /admin connection yet** | Route stays under `__admin-staging-shell` |
| **no service role in browser** | Service role never in client bundle or `PUBLIC_*` env |
| **anon key only in browser** | `PUBLIC_SUPABASE_ANON_KEY` with RLS (future phases) |
| **no DB write** | G-5y-d: Auth only — no CMS data writes |
| **no RLS mutation** | No policy create/alter in G-5y-d |
| **no Storage upload** | Not in G-5y-d scope |
| **no Publish dispatch** | Not in G-5y-d scope |
| **reversible by env flag** | `ENABLE_ADMIN_STAGING_AUTH=false` + `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |

---

## 4. Supabase project selection checklist

All **required** items must pass before G-5y-d. Any production uncertainty = **blocker**.

| # | Check | Required |
| --- | --- | --- |
| 1 | This is a **staging/dev** Supabase project | Yes |
| 2 | This is **not** Sariswing production Supabase project | Yes |
| 3 | This is **not** a customer **production** project | Yes |
| 4 | Auth can be safely tested (test users allowed) | Yes |
| 5 | Test users can be created without affecting production | Yes |
| 6 | Redirect URLs can be configured in project dashboard | Yes |
| 7 | Email templates can be tested safely (staging only) | Yes |
| 8 | **DB/RLS changes are not required** for G-5y-d | Yes |
| 9 | Service role key will **not** be used in browser | Yes |
| 10 | Anon key is **environment-scoped** (staging project only) | Yes |

**Blockers:**

- Project ID/name matches production or is uncertain
- Shared credentials between staging and production
- Requirement to modify RLS or CMS tables for login in G-5y-d

**Record (local only, do not commit):** staging project ref, project name, org — in maintainer runbook, not in repo.

---

## 5. Environment separation checklist

| Item | Staging (G-5y-d target) | Production |
| --- | --- | --- |
| **Project** | Dedicated staging/dev project | Separate production project |
| **Auth enabled** | Yes, after G-5y-d approval | G-6e+ only |
| **Test users** | Staging test accounts only | Customer accounts |
| **Redirect URLs** | `localhost` + staging domain shell path | `/admin/` host — **not in G-5y-d** |
| **Password reset URLs** | Staging shell `?auth=reset` only | Production domain — **not in G-5y-d** |
| **Public anon key** | Staging project anon key in local `.env` | Prod key — **never in G-5y-d** |
| **Service role** | Server/CI only — **never browser** | Same rule |
| **DB access** | **None in G-5y-d** | Later phases |
| **RLS changes** | **None in G-5y-d** | G-5z+ with review |
| **Storage** | **None in G-5y-d** | G-6b+ |
| **Publish workflow** | **Disabled** | G-6c+ staging; G-6e prod |
| **Default enabled** | `ENABLE_ADMIN_STAGING_AUTH=false` | **false** |
| **Approval required** | **Yes** (`G-5y-d-staging-auth-connect`) | G-6e + customer OK |

**G-5y-d:** staging project only. Production Auth untouched. Production publish remains disabled.

---

## 6. Route and redirect URL plan

### Active route (G-5y-d)

```txt
/__admin-staging-shell/musician-basic/
```

### Future route (not G-5y-d)

```txt
/admin/
```

### Redirect URL candidates (Supabase Auth allowlist)

**Local dev:**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/
```

**Staging preview (when deployed to staging host):**

```txt
https://<staging-domain>/__admin-staging-shell/musician-basic/
```

### Password reset callback candidates

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/?auth=reset
https://<staging-domain>/__admin-staging-shell/musician-basic/?auth=reset
```

### Rules

- Do **not** use `/admin/` callback in G-5y-d
- Do **not** use production domain (e.g. `sariswing.com`)
- Do **not** use Sariswing production Supabase redirect settings
- Add **only** staging shell URLs to Supabase dashboard allowlist

---

## 7. Environment variables checklist

G-5y-d expected env names (empty in `.env.example`; real values **local only**):

```env
ENABLE_ADMIN_STAGING_AUTH=false
PUBLIC_ADMIN_AUTH_PROVIDER=mock
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
ADMIN_ALLOWED_EMAILS=
ADMIN_AUTH_ENV=staging
```

| Variable | G-5y-d-prep | G-5y-d usage | Browser-safe |
| --- | --- | --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | `false` | `true` locally when approved | Flag only |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `mock` | `supabase` when connecting | Yes |
| `PUBLIC_SUPABASE_URL` | empty | staging project URL | Yes (staging) |
| `PUBLIC_SUPABASE_ANON_KEY` | empty | staging anon key | Yes (with RLS later) |
| `ADMIN_ALLOWED_EMAILS` | empty | comma-separated allowlist | **Prefer private** — not committed |
| `ADMIN_AUTH_ENV` | `staging` | must be `staging` | Yes |

**Never add:**

- `SUPABASE_SERVICE_ROLE_KEY`
- GitHub tokens, FTP passwords

**G-5y-d-prep:** no real values in repo. Comments only in [`.env.example`](../../../.env.example).

---

## 8. Allowed email / role setup checklist

G-5y-d uses **initial allowlist** (see [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) Section 7).

| Item | Policy |
| --- | --- |
| **Allowed email source** | Local env `ADMIN_ALLOWED_EMAILS` or private config — not committed |
| **Initial role assignment** | First allowlisted user → `admin` for staging test |
| **admin / editor / viewer mapping** | Single role per email in allowlist; default `admin` for G-5y-d test |
| **Allowed emails private** | **Yes** — do not commit real customer emails |
| **Avoid committing real emails** | Use `example.com` in docs; real values in local `.env` only |
| **Test with mock** | UI still shows `mock-admin@example.com` when `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |
| **Unauthorized email** | Show Japanese error; no session; no DB lookup |

**Before production:** re-evaluate migration to `admin_users` table (not in G-5y-d).

Example allowlist (docs only):

```txt
mock-admin@example.com
test-editor@example.com
```

---

## 9. Auth UI behavior expected in G-5y-d

### Allowed in G-5y-d (with approval)

| Behavior | Detail |
| --- | --- |
| Supabase client import | `@supabase/supabase-js` in staging adapter only |
| `createClient` | Staging URL + anon key only |
| `signInWithPassword` | Staging project only |
| `signOut` | Clears Supabase session |
| `getSession` | Read session for UI status |
| Auth status display | Replace mock panel when connected |
| Env gate | `ENABLE_ADMIN_STAGING_AUTH=true` + `PUBLIC_ADMIN_AUTH_PROVIDER=supabase` |

### Still forbidden in G-5y-d

| Item | Status |
| --- | --- |
| DB query / update | **No** |
| `admin_users` table | **No** |
| RLS mutation | **No** |
| Storage upload | **No** |
| Publish dispatch | **No** |
| `/admin/` route | **No** |
| Production Auth | **No** |
| Password reset email | Optional sub-step only if **separately approved**; default disabled |

---

## 10. Rollback / disable plan

G-5y-d connection is reversible without DB/RLS rollback (no DB changes in G-5y-d).

| Step | Action |
| --- | --- |
| 1 | Set `ENABLE_ADMIN_STAGING_AUTH=false` |
| 2 | Set `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |
| 3 | Remove or clear local `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` |
| 4 | Remove local `ADMIN_ALLOWED_EMAILS` if set |
| 5 | Staging shell remains available with mock Auth UI (G-5y-c) |
| 6 | No production data affected — production untouched |
| 7 | No DB rollback — no DB changes in G-5y-d |
| 8 | No RLS rollback — no RLS changes in G-5y-d |

**Production rollback:** not needed — production Auth never modified in G-5y-d.

---

## 11. Approval gate for G-5y-d

**Approval ID example:** `G-5y-d-staging-auth-connect`

| Requirement | Evidence |
| --- | --- |
| G-5y-c `readyForG5yD: true` | Dry-run report |
| Staging Supabase project identified | Local runbook record (not committed) |
| Project is not production | Manual confirmation checklist Section 4 |
| Redirect URLs confirmed | Listed in Section 6; added in Supabase dashboard |
| Env values prepared locally | `.env` local only — not committed |
| Allowed email strategy confirmed | Allowlist plan Section 8 |
| No service role in browser | Code review + env scan |
| No DB/RLS changes planned | G-5y-d scope document Section 15 |
| Rollback by env disable understood | Section 10 |
| Explicit approval ID prepared | `G-5y-d-staging-auth-connect` |

**Reviewer:** maintainer + security review (same as [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json) `auth-integration` gate).

---

## 12. Preflight checklist

Complete immediately before G-5y-d implementation:

```txt
[ ] staging project selected
[ ] not production (Section 4 all required pass)
[ ] redirect URL added in Supabase dashboard (local + staging if applicable)
[ ] password reset URL added if reset approved for G-5y-d
[ ] local .env values prepared (URL, anon key, allowlist)
[ ] .env values NOT committed
[ ] allowed test email prepared (example.com or private local only)
[ ] service role NOT in .env or code
[ ] no DB/RLS migration planned for G-5y-d
[ ] rollback flags understood (Section 10)
[ ] approval id confirmed: G-5y-d-staging-auth-connect
[ ] ENABLE_ADMIN_STAGING_SHELL=true for local dev test
[ ] route remains /__admin-staging-shell/musician-basic/ (not /admin/)
```

---

## 13. Forbidden operations

Forbidden in G-5y-d-prep and G-5y-d until explicitly scoped otherwise:

- touching Sariswing production Auth
- using production Supabase project
- exposing service role key
- committing real Supabase URL/key unintentionally
- committing real customer emails
- creating `admin_users` table
- changing RLS policies
- querying CMS data
- writing CMS data
- uploading Storage assets
- GitHub dispatch
- FTP deploy
- connecting `/admin/` route
- enabling production publish

---

## 14. Risk list

| Risk | Mitigation |
| --- | --- |
| **Wrong Supabase project** | Project ID/name manually confirmed before G-5y-d; Section 4 blockers |
| **Redirect URL mismatch** | Local and staging callback URLs listed in Section 6 before implementation |
| **Service role leak** | Never add service role to `PUBLIC_*` env or browser code; scan before commit |
| **Real email committed** | `example.com` in docs; real emails in local `.env` only |
| **User lockout** | Disable back to mock mode via env flags |
| **/admin confusion** | Keep route under `__admin-staging-shell` only; banners remain |
| **Accidental prod deploy** | No Astro deploy in G-5y-d; local dev only initially |
| **Session in wrong environment** | `ADMIN_AUTH_ENV=staging` check in adapter |

---

## 15. G-5y-d implementation boundary

### G-5y-d allowed

- Staging-only Supabase Auth client (`createClient` with anon key)
- `getSession`, `signInWithPassword`, `signOut`
- Auth status display on staging shell
- Disabled password reset shell OR optional reset call **only if separately approved**
- Local env only (initially)
- `/__admin-staging-shell/musician-basic/` only

### G-5y-d forbidden

- DB read/write
- `admin_users` table create/query
- RLS create/alter
- Storage upload
- Publish / GitHub / FTP
- `/admin/` route protection or connection
- Production Auth / production Supabase project
- `resetPasswordForEmail` unless separate approval sub-step

---

## 16. Acceptance criteria

G-5y-d-prep is complete when:

- [x] This checklist doc exists
- [x] Project selection criteria documented (Section 4)
- [x] Redirect URL plan documented (Section 6)
- [x] Env checklist documented (Section 7)
- [x] Allowed email/role setup documented (Section 8)
- [x] Rollback plan documented (Section 10)
- [x] Approval gate documented (Section 11)
- [x] Forbidden operations documented (Section 13)
- [x] Docs / README updated
- [x] No Supabase client added
- [x] No Auth connection made
- [x] No DB/RLS change made

Proceed to **G-5y-d** only after preflight (Section 12) + approval ID.

**G-5y-d（完了）:** [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md) — staging shell Supabase Auth (`getSession`, `signInWithPassword`, `signOut`). Env-gated. Mock fallback available. Next: **G-5y-e** role check / allowlist.

---

## 17. Final safety statement

**G-5y-d-prep is a checklist and approval phase only.**

- No Supabase Auth is connected.
- No Supabase client is imported.
- No `signInWithPassword` is implemented.
- No password reset email is sent.
- No session is persisted.
- No `admin_users` table is created.
- No RLS policy is created or changed.
- No database is queried or updated.
- No storage upload is performed.
- No GitHub dispatch is performed.
- No FTP deploy is performed.
- No production Auth is touched.

---

## Related

- [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) — G-5y-a plan
- [staging-login-ui-shell.md](./staging-login-ui-shell.md) — G-5y-c login UI
- [admin-auth-adapter-scaffold.md](./admin-auth-adapter-scaffold.md) — G-5y-b adapter
- [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) — G-5x route

---

*G-5y-d-prep: checklist only. G-5y-d requires explicit approval.*
