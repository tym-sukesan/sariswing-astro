# Staging Role / Allowlist Mock

## 1. Purpose

G-5y-e-a adds a **mock-only** role and allowlist layer for the CMS Kit Admin staging shell. After G-5y-d Supabase Auth sign-in, the shell resolves roles from an in-memory mock allowlist — without `admin_users`, DB queries, or RLS.

## 2. Scope

**In scope:**

- Mock allowlist (`example.com` emails only)
- Role resolver scaffold (`resolveMockAdminRole`)
- Permission status display (aligned with G-5y-b `permission-checker.ts`)
- Denied-user UI for emails outside the mock allowlist
- Staging shell route only

**Out of scope:**

- Real customer emails in committed files
- `admin_users` table create/query
- DB query / update
- RLS policy changes
- Storage upload
- Publish / GitHub dispatch / FTP
- Production Auth changes
- `/admin` route connection

## 3. Mock allowlist

Committed example config:

```txt
tools/static-to-astro/templates/admin-cms/auth/allowlist/mock-admin-allowlist.example.json
```

Runtime mock entries (`src/lib/admin/staging-auth/mock-allowlist.ts`):

| Email | Role |
| --- | --- |
| `mock-admin@example.com` | admin |
| `mock-editor@example.com` | editor |
| `mock-viewer@example.com` | viewer |

**Do not commit real customer or personal emails.**

## 4. Role behavior

| Role | Mock allowlist | `canAccessAdminShell` | `productionPublish` |
| --- | --- | --- | --- |
| admin | matched | true | false |
| editor | matched | true | false |
| viewer | matched | true | false |
| denied | not in list | false | false |

Default when Auth is disabled (mock preview): `mock-admin@example.com` → admin.

## 5. Permission matrix

Modules: dashboard, profile, schedule, discography, links, news, media, publish, settings.

Displayed permissions: read, create, update, delete, upload, stagingPublish, productionPublish.

`productionPublish` is **always false** for every role (enforced in `permission-checker.ts` and staging UI).

## 6. Staging shell display

Route: `/__admin-staging-shell/musician-basic/`

Component: `AdminRoleAllowlistStatusPanel` (inside `AdminStagingLoginUiSection`).

Shows:

- Mode: mock-only
- Email (signed-in or mock preview)
- Role / denied status
- Allowlist source: mock allowlist
- admin_users: not used
- DB query: not performed
- RLS: not configured
- Production publish: disabled
- `/admin` route: not connected
- Permission matrix preview table

## 7. Denied behavior

When a signed-in Supabase email is **not** in the mock allowlist:

- Status: `mock-denied`
- Role display: `denied`
- `canAccessAdminShell: false`
- Banner: “This signed-in email is not included in the mock allowlist…”

The staging shell **remains visible** for testing. No real `/admin` guard is connected.

## 8. Safety

- No real emails committed
- No `admin_users` table
- No DB query or update
- No RLS changes
- No Storage upload
- No GitHub dispatch
- No FTP deploy
- Production Auth not touched
- No `/admin` connection
- `productionPublish` disabled

## 9. Next phase

- **G-5y-e-b:** private/server-side allowlist plan or implementation
- **G-5z:** read-only data integration (only after Auth/RLS review)

## 10. Files

| Path | Role |
| --- | --- |
| `src/lib/admin/staging-auth/mock-allowlist.ts` | In-memory mock entries |
| `src/lib/admin/staging-auth/staging-role-resolver.ts` | `resolveMockAdminRole` |
| `src/lib/admin/staging-auth/staging-permission-status.ts` | Permission matrix preview |
| `src/lib/admin/staging-auth/staging-role-allowlist-ui.ts` | Browser panel updates |
| `templates/admin-cms/auth/components/AdminRoleAllowlistStatusPanel.astro` | Status panel UI |

Dry-run:

```bash
node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs \
  --out-dir tools/static-to-astro/output/admin-auth-dry-runs/gosaki
```
