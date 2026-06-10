# Admin Auth Adapter Scaffold

**Phase:** G-5y-b — Auth adapter scaffold / dry-run only  
**Status:** mock provider only · no Supabase connection · no runtime Auth

Related: [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) · [`admin-auth-integration-plan.json`](../config/admin/admin-auth-integration-plan.json)

---

## 1. Purpose

G-5y-b adds **Auth adapter scaffold** building blocks for future Supabase Auth staging integration (G-5y-d+).

This phase provides:

- Auth adapter types and interfaces
- Mock auth provider (no network)
- Session / role / permission checker scaffolds
- Dry-run report generation
- Staging shell Auth mock status display

**No Supabase Auth connection.** No `@supabase/supabase-js` import. No login implementation.

---

## 2. Scope

### In scope

| Item | Detail |
| --- | --- |
| Auth adapter types | `auth-adapter.types.ts` |
| Mock auth adapter | `mock-auth-adapter.ts` |
| Session checker | `session-checker.ts` |
| Role checker | `role-checker.ts` |
| Permission checker | `permission-checker.ts` (G-5y-a matrix aligned) |
| Dry-run example | `dry-run/auth-adapter-dry-run.example.json` |
| Dry-run CLI | `inspect-admin-auth-adapter.mjs` |
| Staging shell display | `AdminAuthAdapterStatusPanel.astro` on G-5x route |

### Out of scope

| Item | Status |
| --- | --- |
| Supabase Auth connection | **No** |
| Supabase client import | **No** |
| Login / password reset implementation | **No** |
| `admin_users` table | **No** |
| RLS policy | **No** |
| DB query / update | **No** |
| Storage upload | **No** |
| Publish / GitHub dispatch | **No** |
| FTP deploy | **No** |
| Production Auth | **Untouched** |

---

## 3. Files

```txt
tools/static-to-astro/templates/admin-cms/auth/
  adapters/
    auth-adapter.types.ts
    mock-auth-adapter.ts
    permission-checker.ts
    role-checker.ts
    session-checker.ts
  dry-run/
    auth-adapter-dry-run.example.json

tools/static-to-astro/templates/admin-cms/components/
  AdminAuthAdapterStatusPanel.astro

tools/static-to-astro/scripts/
  inspect-admin-auth-adapter.mjs
  lib/admin-auth-adapter-dry-runner.mjs
```

---

## 4. Mock provider

`createMockAdminAuthAdapter()` returns:

| Field | Default |
| --- | --- |
| `provider` | `"mock"` |
| `status` | `"mock"` |
| `email` | `mock-admin@example.com` |
| `role` | `admin` |
| `connectedToRuntime` | `false` |
| `productionReady` | `false` |

Options allow switching mock role (`admin` / `editor` / `viewer`) for dry-run tests. No fetch. No Supabase.

---

## 5. Permission checker

Functions:

- `can(role, module, permission)` — matrix lookup
- `getPermissionsForRole(role, module)` — list permissions

**productionPublish:** Always `false` in G-5y-b (`PRODUCTION_PUBLISH_ENABLED_BY_DEFAULT: false`, `PRODUCTION_PUBLISH_REQUIRES_APPROVAL: true`).

Matrix aligned with [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) Section 6. Legacy draft: [`permissions.example.json`](../templates/admin-cms/auth/permissions.example.json).

---

## 6. Staging shell display

When `ENABLE_ADMIN_STAGING_SHELL=true` and dev mode, `/__admin-staging-shell/musician-basic/` shows `AdminAuthAdapterStatusPanel` (G-5y-d):

| Mode | When |
| --- | --- |
| **mock** | `ENABLE_ADMIN_STAGING_AUTH=false` or `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |
| **supabase-staging** | G-5y-d env gate + `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` |
| **disabled** | Auth flag on but Supabase config missing |

Always: `productionReady: false`, DB/RLS/Storage/Publish disabled, `/admin/` not connected. Approval ID: `G-5y-d-staging-auth-connect`.

See [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md).

---

## 7. Dry-run CLI

```bash
node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs \
  --out-dir tools/static-to-astro/output/admin-auth-dry-runs/gosaki
```

**Output (not committed):**

```txt
tools/static-to-astro/output/admin-auth-dry-runs/gosaki/
  ADMIN_AUTH_ADAPTER_DRY_RUN_REPORT.md
  admin-auth-adapter-dry-run.json
```

Expected flags (G-5y-d):

- `phase: G-5y-d`
- `approvalId: G-5y-d-staging-auth-connect`
- `supabaseAuthConnectionImplemented: true`
- `envGated: true`
- `mockFallbackAvailable: true`
- `serviceRoleUsed: false`
- `adminRouteConnected: false`
- `readyForG5yE: true`

---

## 8. Safety

| Item | Value |
| --- | --- |
| Supabase Auth connected | **false** |
| Supabase client imported | **false** |
| `admin_users` table created | **false** |
| RLS changes | **none** |
| DB query / update | **none** |
| Storage upload | **none** |
| GitHub dispatch | **none** |
| FTP deploy | **none** |
| Production Auth touched | **false** |
| `connectedToRuntime` | **false** |
| `productionReady` | **false** |
| Sariswing admin modified | **false** |
| Sariswing Auth modified | **false** |

---

## 9. Next phase

| Phase | Focus |
| --- | --- |
| **G-5y-c（完了）** | [Staging login UI shell](./staging-login-ui-shell.md) |
| **G-5y-d-prep（完了）** | [Connection checklist](./supabase-auth-staging-connection-checklist.md) |
| **G-5y-d（完了）** | [Staging Supabase Auth connection](./staging-supabase-auth-connection.md) |
| **G-5y-e** | Staging role check / allowlist |

---

## Related

- [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) — G-5x shell route
- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — G-5m-b Auth UI components

---

*G-5y-b: Auth adapter scaffold / dry-run only. No runtime Auth.*
