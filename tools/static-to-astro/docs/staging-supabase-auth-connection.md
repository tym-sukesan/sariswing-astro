# Staging Supabase Auth Connection

## 1. Purpose

G-5y-d adds a **staging-only** Supabase Auth connection for the CMS Kit Admin staging runtime shell. It is the first phase that permits `@supabase/supabase-js`, `createClient`, `getSession`, `signInWithPassword`, and `signOut` — **only** on the staging shell route.

See also: [supabase-auth-staging-connection-checklist.md](./supabase-auth-staging-connection-checklist.md) (G-5y-d-prep).

## 2. Scope

**In scope:**

- Staging shell only (`/__admin-staging-shell/musician-basic/`)
- Env-gated Supabase Auth client (`src/lib/admin/staging-auth/`)
- `getSession`, `signInWithPassword`, `signOut`
- Login UI shell wired for real sign-in when enabled
- Auth status panel (mock / supabase-staging / disabled)
- Mock fallback via env flags

**Out of scope:**

- `/admin` route
- Production Auth
- `admin_users` table
- RLS policy create/change
- DB query / update
- Storage upload
- Publish / GitHub dispatch
- FTP deploy
- Password reset email (`resetPasswordForEmail`)

## 3. Approval

Approval ID:

```txt
G-5y-d-staging-auth-connect
```

Enable only after G-5y-d-prep Section 12 preflight checklist is complete.

## 4. Enable condition

All of the following must be true for real Auth:

```env
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

Plus `import.meta.env.DEV === true`.

Do **not** commit real Supabase URL or anon key values.

## 5. Route

```txt
/__admin-staging-shell/musician-basic/
```

Not `/admin/`. Not production Sariswing admin.

## 6. Local usage

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_SUPABASE_URL=... \
PUBLIC_SUPABASE_ANON_KEY=... \
npm run dev
```

Open:

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/
```

## 7. Mock fallback

Revert to mock/disabled immediately with either:

```env
ENABLE_ADMIN_STAGING_AUTH=false
```

or:

```env
PUBLIC_ADMIN_AUTH_PROVIDER=mock
```

In mock mode:

- No Supabase client is created
- Login button stays disabled / mock-only
- Auth status panel shows `mock` or `disabled`

## 8. Safety

- **No service role in browser** — anon key only
- **No `/admin` connection**
- **No DB query or update**
- **No RLS changes**
- **No Storage upload**
- **No GitHub dispatch**
- **No FTP deploy**
- **Production Auth not touched**
- **`productionReady: false` always**
- **Role defaults to `viewer`** — no `admin_users` lookup in G-5y-d

## 9. Troubleshooting

| Issue | What to check |
| --- | --- |
| Config missing | `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` set locally |
| Invalid redirect URL | Supabase Auth URL allowlist includes `http://localhost:4321/**` |
| Wrong Supabase project | Use staging project only, not production |
| Login failed | Credentials, email confirmation, Auth user exists in staging |
| Email not confirmed | Confirm user in Supabase dashboard or disable confirm for staging |
| Mock fallback | Set `ENABLE_ADMIN_STAGING_AUTH=false` or `PUBLIC_ADMIN_AUTH_PROVIDER=mock` |

## 10. Next phase

- **G-5y-e-a（完了）:** [Staging role / allowlist mock](./staging-role-allowlist-mock.md) — mock allowlist only, no `admin_users`
- **G-5y-e-b（完了）:** [Private / server-side allowlist plan](./private-server-side-allowlist-plan.md) — planning only; no Edge/DB/RLS
- **G-5y-e-c:** server-side allowlist dry-run scaffold (candidate)
- **G-5z-a（完了）:** [Read-only data integration plan](./read-only-data-integration-plan.md) — no DB query in G-5z-a
- **G-5z-b（完了）:** [Read-only data adapter scaffold](./read-only-data-adapter-scaffold.md)
- **G-5z-c-prep（完了）:** [Schema mapping / RLS review](./schema-mapping-rls-read-policy-review.md)
- **G-5z-c（完了）:** [Supabase read-only data adapter](./supabase-read-only-data-adapter.md) (`G-5z-c-staging-read-only-data-connect`)
- **G-5z-d（完了）:** [Staging read-only module display QA](./staging-read-only-module-display-qa.md)
- **G-5z-e:** read-only QA / RLS review report

## 11. Files

| Path | Role |
| --- | --- |
| `src/lib/admin/staging-auth/staging-auth-config.ts` | Env gate |
| `src/lib/admin/staging-auth/supabase-staging-auth-client.ts` | Anon `createClient` |
| `src/lib/admin/staging-auth/staging-auth-session.ts` | Session / sign-in / sign-out |
| `src/lib/admin/staging-auth/staging-auth-ui.ts` | Browser UI wiring |
| `tools/static-to-astro/templates/admin-cms/auth/adapters/supabase-auth-adapter.ts` | Adapter bridge |
| `tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingLoginUiSection.astro` | Login section |

Dry-run:

```bash
node tools/static-to-astro/scripts/inspect-admin-auth-adapter.mjs \
  --out-dir tools/static-to-astro/output/admin-auth-dry-runs/gosaki
```
