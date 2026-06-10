# Private / Server-side Allowlist Plan

## 1. Purpose

G-5y-e-b defines how CMS Kit Admin will handle **real allowed emails and roles** safely after G-5y-e-a mock allowlist validation.

This phase answers: *where should trusted role decisions live, and what must never be shipped to the browser?*

**G-5y-e-b is planning only.**

- G-5y-e-a mock allowlist (`example.com` only) is complete and remains the runtime default.
- This document compares private env, server-side/Edge Function, and `admin_users` + RLS approaches.
- **No real allowlist is committed.**
- **No real customer or personal emails are committed.**
- **No Edge Function, DB, RLS, or `admin_users` implementation in G-5y-e-b.**

Related: [staging-role-allowlist-mock.md](./staging-role-allowlist-mock.md) (G-5y-e-a), [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md) (G-5y-d).

---

## 2. Current state

| Phase | Status |
| --- | --- |
| **G-5y-d** | Staging Supabase Auth connection exists (`getSession`, `signInWithPassword`, `signOut`) on staging shell only |
| **G-5y-e-a** | Mock role / allowlist implementation exists |

Current guarantees:

```txt
mock emails only (example.com)
role display works in staging shell
productionPublish is always false
admin_users table is not created
DB query/update is not performed
RLS is not configured
/admin route is not connected
browser allowlist is informational only — not a security boundary
```

---

## 3. Why public allowlists are risky

A **browser-exposed allowlist** (committed JSON, `PUBLIC_*` env, or bundled TypeScript) is not acceptable as a security control for real admin access.

| Risk | Why it matters |
| --- | --- |
| Real admin emails may be exposed | Attackers learn who can access admin |
| Customer privacy risk | Customer identities must not appear in git or client bundles |
| Role mapping can be inspected | Anyone can read which email maps to `admin` vs `viewer` |
| Attackers can learn target accounts | Phishing / credential-stuffing targets become obvious |
| Public env variables are not secrets | `PUBLIC_*` values are visible in built client output |
| Browser-side allowlist is not a security boundary | Client code can be modified; role must not be trusted from browser alone |

**Conclusion:**

- Committed files should contain **only mock / `example.com` emails**.
- Real allowlist data must **not** be shipped to the browser as a trusted security boundary.
- Browser role display remains **informational** until server-side or DB enforcement exists.

---

## 4. Requirements for real allowlist

A production-capable allowlist design should satisfy:

| Requirement | Notes |
| --- | --- |
| Real emails are private | Never in git, never in `PUBLIC_*`, never in client bundle |
| Role mapping is private | Same as above |
| Role decision is auditable | Log or table-backed changes with timestamps |
| Role decision is not trusted from browser alone | Server/Edge/DB must validate JWT/session |
| No service role in browser | Service role only on server/Edge if ever used |
| Staging first | Prove on staging project before production |
| Production disabled by default | Explicit approval per environment |
| Revocation is possible | Deactivate user without redeploying entire site |
| Lockout recovery is possible | Break-glass / owner recovery documented |

---

## 5. Option A: local/private env allowlist

### How it works

- Allowed emails stored in **private** env (e.g. `ADMIN_ALLOWED_EMAILS` in local `.env` only).
- Intended for **local/staging checklist** and operator-run scripts — not for browser-trusted guards.
- Astro static output cannot safely read private server env in the browser; any value used in client code is exposed.

### Where values live

| Location | Allowed in G-5y-e-b plan |
| --- | --- |
| Local `.env` (gitignored) | Yes — operator use only |
| `.env.example` | Placeholder only, no real emails |
| `PUBLIC_*` env | **No** for real allowlist |
| Committed JSON/TS | **No** for real emails |

### Pros

- Fast for initial staging validation
- No DB required
- Easy per-customer switch during local dev

### Cons

- Static Astro + browser Auth cannot use private env as a trusted guard
- Poor fit for browser-only auth flows
- Weak audit trail
- Insufficient for production multi-user admin

### Implementation boundary

- Checklist / runbook reference only in G-5y-e-b.
- **Not** a browser security boundary.

### When to use

- Local operator verification
- Dry-run scripts with explicit env on the machine
- Pre-Edge / pre-DB staging checklist

**Conclusion:** Useful for local/staging checklist, but **insufficient as a browser guard**.

---

## 6. Option B: server-side endpoint / Edge Function allowlist

### How it works

1. Browser obtains Supabase Auth session (JWT).
2. Browser calls a **server-side** endpoint (Supabase Edge Function or similar) with `Authorization: Bearer <access_token>`.
3. Server validates JWT, looks up allowlist from **private secret or DB**, returns role decision only.
4. Browser displays role result; **does not own** the trusted source.

### Required inputs

- Valid Supabase access token (JWT)
- Staging or production Supabase project URL (server-side config)
- Private allowlist store (env on Edge, or `admin_users` table later)

### Outputs

```json
{
  "email": "user@example.com",
  "role": "editor",
  "active": true,
  "canAccessAdminShell": true,
  "productionPublish": false,
  "source": "server-allowlist"
}
```

(Real emails only in server responses at runtime — never committed.)

### Pros

- Real emails stay off the client bundle
- Role decision on server
- Service role (if used) never in browser
- Revocation via server config or DB without client redeploy

### Cons

- Edge Function (or API route) implementation required
- CORS, auth header, JWT verification required
- Operational complexity (deploy, logs, versioning)

### Security requirements

- Verify JWT signature and expiry server-side
- Never return full allowlist to browser
- Rate-limit role endpoint
- No service role key in browser or `PUBLIC_*` env
- Staging project only until explicitly approved for production

### Failure modes

| Failure | Safe behavior |
| --- | --- |
| Invalid/expired JWT | Deny — `canAccessAdminShell: false` |
| Email not in allowlist | Deny |
| Edge unavailable | Deny or mock fallback on staging shell only (documented) |
| Misconfigured CORS | Fix before enabling real enforcement |

**Important:**

- **G-5y-e-b does not implement Edge Functions.**
- Service role in browser is **forbidden**.
- Edge Function implementation is a **separate phase** (candidate: G-5y-e-c dry-run scaffold).

---

## 7. Option C: admin_users table + RLS

### How it works

- `admin_users` (or equivalent) stores `user_id`, `email`, `role`, `active`.
- After Auth sign-in, server or RLS-backed query resolves role.
- RLS policies enforce **data access** on CMS tables — separate from UI role badges.

### Table design draft

```sql
-- DRAFT ONLY. DO NOT RUN IN G-5y-e-b.
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Role lookup strategy

1. Auth `user_id` from JWT `sub` claim.
2. Lookup `admin_users` where `user_id` matches and `active = true`.
3. Fallback: email match only if `user_id` not yet linked (migration period — document carefully).
4. Deny if no row or `active = false`.

### RLS requirements (future)

- `admin_users`: read own row or service-role-only management (TBD in RLS review phase).
- CMS tables: policies per role/module — **not** defined in G-5y-e-b.
- **RLS review required before real data access** (G-5z / G-6).

### Pros

- Production-oriented
- Easier ongoing role management per customer site
- Auditable (`created_at`, `updated_at`, future audit log)
- Fits multi-tenant CMS Kit generalization

### Cons

- Table design and migration discipline required
- RLS design is error-prone if rushed
- High accident risk if applied before read-only staging validation

**G-5y-e-b does not create this table or any RLS policies.**

---

## 8. Recommended path

### Phased roadmap (recommended)

```txt
G-5y-e-a: mock allowlist only — completed
G-5y-e-b: private/server-side allowlist plan — this phase (planning only)
G-5y-e-c: server-side allowlist dry-run scaffold (interface + mock server response, no deploy)
G-5z-a: read-only data integration plan — completed
G-5z-b: read-only staging data adapter scaffold (mock only)
G-6: admin_users table + RLS review before any write operations
```

### Safer sequencing principle

```txt
read-only data integration before real role enforcement (where possible)
real role enforcement before write operations
production publish remains disabled until much later
```

### Decision for G-5y-e-b

| Action | G-5y-e-b |
| --- | --- |
| Jump to `admin_users` + RLS now | **No** |
| Change RLS now | **No** |
| Next implementation step | **G-5y-e-c** (server-side allowlist dry-run scaffold) **or** **G-5z-a** (read-only data integration plan) |

Prefer **G-5z-a** if staging shell needs real read-only data preview before Edge scaffold; prefer **G-5y-e-c** if role endpoint contract should be frozen first. Both can proceed in plan-only form before code.

---

## 9. Role decision model

```txt
Browser:
  - displays auth status
  - displays role result (informational until enforcement)
  - never owns trusted role source
  - must not embed real allowlist in bundle

Server / Edge / DB:
  - validates session / JWT
  - checks allowlist or admin_users
  - returns role decision
  - logs denials (staging/production per policy)

RLS (later):
  - enforces data access on CMS tables
  - not a substitute for Auth sign-in
  - reviewed before G-5z read access and before any writes
```

---

## 10. Data integration boundary before G-5z

Before **G-5z read-only data integration**:

| Rule | Status |
| --- | --- |
| Read-only only | Required |
| No DB writes | Required |
| No Storage writes | Required |
| No Publish dispatch | Required |
| No production data unless explicitly approved | Required |
| RLS review required before real data access | Required |
| Staging project only (initially) | Required |
| Role status may be informational until server-side enforcement | Yes — current G-5y-e-a behavior |

Browser-side role from mock allowlist **must not** be treated as authorization for real data until server/RLS enforcement exists.

---

## 11. Approval gates

| Gate ID | Allowed (plan / scaffold) | Forbidden | Required evidence | Rollback / disable |
| --- | --- | --- | --- | --- |
| **private allowlist design approval** | Docs, local `.env` checklist | Commit real emails | This plan reviewed | Revert to mock-only |
| **server-side allowlist scaffold approval** | Interface, dry-run, mock response | Edge deploy, real allowlist in repo | G-5y-e-c report | `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |
| **Supabase project approval** | Staging project URL in local env | Production project in client | G-5y-d-prep checklist | Disable `ENABLE_ADMIN_STAGING_AUTH` |
| **admin_users table approval** | Draft SQL in docs only | `CREATE TABLE` in any env | G-6 plan + RLS draft | Do not run migration |
| **RLS policy approval** | Policy drafts in docs | `CREATE POLICY` in any env | Security review | Disable data routes |
| **read-only data access approval** | G-5z-a/b scaffold | Writes, Storage | RLS review sign-off | Remove data adapter |
| **write operation approval** | — | All CMS writes | G-6+ explicit gate | Freeze admin modules |
| **production Auth approval** | — | Production Supabase Auth changes | Separate production checklist | Disable production flags |
| **production publish approval** | — | `productionPublish: true` | Multi-gate (existing publish plan) | Kill switch env |

---

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Real emails committed | Only `example.com` in committed files; real emails local/private only |
| Browser-side role spoofing | Browser role is informational until server/DB enforcement |
| Service role leak | Service role never in browser, never in `PUBLIC_*` env or docs examples |
| RLS too permissive | Dedicated RLS review phase before data writes |
| User lockout | Mock fallback; documented admin recovery / break-glass |
| Confusing staging shell with production admin | Route stays `__admin-staging-shell`; `/admin` not connected |
| Edge Function misconfiguration | Staging-only deploy; dry-run scaffold first (G-5y-e-c) |
| Customer allowlist in git history | Pre-commit review; `git grep` for non-example.com emails |

---

## 13. Forbidden operations

The following remain **forbidden** in G-5y-e-b and until explicit later approval:

```txt
- committing real emails
- exposing private allowlist in browser bundle
- using service role in browser
- creating admin_users table
- changing RLS policies
- querying CMS data
- writing CMS data
- uploading Storage assets
- GitHub dispatch
- FTP deploy
- connecting /admin route
- touching production Auth
- enabling production publish
```

---

## 14. G-5y-e-c candidate

**G-5y-e-c: server-side allowlist dry-run scaffold**

| Item | G-5y-e-c scope |
| --- | --- |
| Edge/server allowlist interface | Type definitions + adapter scaffold only |
| Real Edge Function deploy | **No** |
| DB / `admin_users` | **No** |
| Service role | **No** |
| Mock server response | Yes — for CLI/report and UI preview |
| Deliverables | Docs + dry-run report + optional mock adapter |

Purpose: freeze the contract (`resolveRoleFromSession`) before real Edge or DB work.

---

## 15. G-5z readiness

**G-5z-a（完了）:** [read-only-data-integration-plan.md](./read-only-data-integration-plan.md) — read-only module/table mapping; no DB query; RLS review required before G-5z-c.

**G-5z-b（完了）:** [read-only-data-adapter-scaffold.md](./read-only-data-adapter-scaffold.md) — mock ReadOnlyDataAdapter on staging shell.

Proceed to **G-5z-c** (Supabase read-only adapter) only when:

```txt
- Auth mode can be displayed (G-5y-d)
- role/allowlist status can be displayed (G-5y-e-a)
- private/server-side allowlist plan documented (G-5y-e-b)
- productionPublish remains false
- no write operations exist
- read-only data boundary documented (this doc §10)
- RLS review path documented
- /admin remains disconnected
```

---

## 16. Final safety statement

**G-5y-e-b is a planning phase only.**

```txt
No real allowlist is committed.
No Edge Function is implemented.
No admin_users table is created.
No RLS policy is created or changed.
No database is queried or updated.
No storage upload is performed.
No GitHub dispatch is performed.
No FTP deploy is performed.
No /admin route is connected.
No production Auth is touched.
```

Config reference: [private-server-side-allowlist-plan.json](../config/admin/private-server-side-allowlist-plan.json).
