# Staging Login UI Shell

**Phase:** G-5y-c — staging login UI shell with disabled real auth  
**Status:** UI only · real auth disabled · no Supabase connection

Related: [admin-auth-adapter-scaffold.md](./admin-auth-adapter-scaffold.md) · [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) · [supabase-auth-staging-connection-checklist.md](./supabase-auth-staging-connection-checklist.md)

---

## 1. Purpose

G-5y-c adds a **login UI shell** on the staging runtime shell so developers can preview email/password fields, forgot-password flow, and route-guard planning **before** Supabase Auth connection (G-5y-d).

This phase is **UI only**. Real auth remains disabled.

---

## 2. Scope

### In scope

| Item | Detail |
| --- | --- |
| Login UI shell | Email / password fields, disabled login button |
| Forgot password UI | Request + reset form previews |
| Mock login status | Static mock-admin@example.com / admin |
| Route guard planned notice | Future guard design display |
| Staging shell integration | Above dashboard on `/__admin-staging-shell/musician-basic/` |

### Out of scope

| Item | Status |
| --- | --- |
| Supabase Auth connection | **No** |
| Supabase client import | **No** |
| signInWithPassword | **No** |
| Password reset email | **No** |
| Session persistence | **No** |
| `admin_users` table | **No** |
| RLS | **No** |
| DB query / update | **No** |
| Storage / Publish / FTP | **No** |
| Production Auth | **Untouched** |
| `/admin/` route | **Not connected** |

---

## 3. Route

```txt
/__admin-staging-shell/musician-basic/
```

Section anchor: `#auth-login-shell`, `#login-ui-shell`, `#password-reset-shell`

---

## 4. Enable condition

Staging shell (required):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
import.meta.env.DEV === true
```

Auth connection (still disabled):

```txt
ENABLE_ADMIN_STAGING_AUTH=false
```

Login UI renders when staging shell is enabled. Real auth stays off until G-5y-d approval.

---

## 5. Components

```txt
tools/static-to-astro/templates/admin-cms/auth/components/
  AdminLoginShell.astro
  AdminPasswordResetShell.astro
  AdminAuthGuardPlannedNotice.astro
  AdminStagingLoginUiSection.astro   — combined section wrapper
```

Reuses (unchanged):

- `AdminLoginForm.astro`
- `AdminPasswordResetForm.astro`
- `AdminPermissionBadge.astro`

---

## 6. UI behavior

| Behavior | G-5y-c state |
| --- | --- |
| Login button | `type="button"`, **disabled** |
| Form submit | Blocked (`onsubmit="return false;"`, `method="dialog"`) |
| Credentials submitted | **No** |
| Session created | **No** |
| Password reset email sent | **No** |
| Route guard active | **No** (planned only) |
| localStorage / sessionStorage / cookies | **Not used** |
| fetch / Supabase | **Not called** |

Display notices (EN + JA):

- This login UI is a staging shell only.
- Real Supabase Auth is disabled in G-5y-c.
- No credentials are submitted. No session is created.
- Production Auth is not touched.

---

## 7. Dry-run CLI

```bash
node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs \
  --out-dir tools/static-to-astro/output/admin-auth-dry-runs/gosaki
```

Expected flags:

- `loginUiShellPresent: true`
- `realAuthDisabled: true`
- `credentialsSubmitted: false`
- `sessionCreated: false`
- `passwordResetEmailSent: false`
- `readyForG5yD: true`

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

## 9. G-5y-d connection (完了)

**G-5y-d（完了）:** [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md) — env-gated Supabase Auth on this shell only. Approval ID: `G-5y-d-staging-auth-connect`.

When env gate passes, the login form in this section becomes interactive (`signInWithPassword` / `signOut`). Mock fallback:

```env
ENABLE_ADMIN_STAGING_AUTH=false
# or
PUBLIC_ADMIN_AUTH_PROVIDER=mock
```

Still forbidden in G-5y-d: DB, RLS, Storage, Publish, `/admin/`, password reset email.

---

## 10. Next phase

| Phase | Focus |
| --- | --- |
| **G-5y-e-a（完了）** | [Staging role / allowlist mock](./staging-role-allowlist-mock.md) |
| **G-5y-e-b** | Private/server-side allowlist |

---

## Related

- [staging-supabase-auth-connection.md](./staging-supabase-auth-connection.md) — G-5y-d Auth connection
- [supabase-auth-staging-integration-plan.md](./supabase-auth-staging-integration-plan.md) — G-5y-a plan
- [admin-auth-adapter-scaffold.md](./admin-auth-adapter-scaffold.md) — G-5y-b adapter scaffold

---

*G-5y-c: login UI shell. G-5y-d: real Auth when env-gated on staging shell only.*
