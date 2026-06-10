# Staging Auth Session Display Investigation

## 1. Purpose

**Phase:** `G-6-d-auth-session-display-investigation`

During G-6-d manual non-dry-run prep, the staging shell did not show the real Supabase Auth user. This phase investigates root causes, documents required env gates, and adds staging-shell-only diagnostics so the user can confirm auth session and write gates before any non-dry-run update.

This phase investigates why the staging shell does not show the real Supabase Auth user.
No non-dry-run update is executed.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

## 2. Incident summary

```txt
During G-6-d manual non-dry-run prep, the staging shell did not show the user's real staging login email.
The UI appeared to show mock/example users such as mock-admin@example.com.
Write actions remained disabled.
The first non-dry-run update was aborted.
PUBLIC_ADMIN_WRITE_DRY_RUN was restored to true.
```

Do not commit the user's real email to git. Confirm identity locally via the debug panel or Supabase Table Editor.

## 3. Expected state before non-dry-run

```txt
Before one manual non-dry-run update:
- staging shell must show the real logged-in email
- email must match public.admin_users.email
- role must be admin or editor
- write gate must show the exact mode
- Profile update PoC must clearly target public.profile
- Save must only be enabled when all gates pass
```

## 4. Current blocker

```txt
authSessionVisible: false (until user enables real Supabase Auth env at repo root)
realUserEmailVisible: false (mock preview shown when auth gate off)
writeGateReady: false (when ENABLE_ADMIN_STAGING_WRITE or Supabase PUBLIC_ vars missing)
nonDryRunExecutionAllowed: false
nonDryRunAborted: true
```

## 5. Investigation findings

### Auth provider currently used

`getStagingAuthConfig()` (`src/lib/admin/staging-auth/staging-auth-config.ts`):

- Default: `PUBLIC_ADMIN_AUTH_PROVIDER=mock` (from `.env.example`)
- Real Supabase Auth requires **all** of:
  - `import.meta.env.DEV === true`
  - `ENABLE_ADMIN_STAGING_SHELL=true`
  - `ENABLE_ADMIN_STAGING_AUTH=true`
  - `PUBLIC_ADMIN_AUTH_PROVIDER=supabase`
  - `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` set

When any condition fails, `authMode` is `mock` and the UI shows **mock preview**, not a real session.

### Mock auth still used when

`staging-auth-ui.ts` previously displayed `mock-admin@example.com` when real auth was disabled — this looked like a signed-in user. **Fixed:** mock mode now shows `— (mock preview — not signed in)` and lists env blockers.

### Env file location

Astro reads env from the **repo root** (`.env`, `.env.local`), not `tools/static-to-astro/.env.local`. Staging Supabase values in `tools/static-to-astro/.env.local` alone do **not** enable the staging shell unless copied to repo-root env or passed inline to `npm run dev`.

### Session fetch

When Supabase Auth is enabled, `getStagingAuthSessionDetails()` reads `client.auth.getSession()` and exposes:

- real email from `session.user.email`
- shortened `user.id`

### Role resolver gap

`staging-role-resolver.ts` resolves roles from an **in-memory mock allowlist only**. It does **not** query `public.admin_users`. Even with a real Supabase session, a staging admin email not in the mock allowlist shows `denied (mock allowlist only — admin_users not queried)`. **RLS write still depends on `admin_users` at DB level**, but the UI cannot confirm `admin_users` match yet.

### Write gate

`getStagingWriteConfig()` (`src/lib/admin/staging-write/staging-write-config.ts`) requires:

- `ENABLE_ADMIN_STAGING_WRITE=true` (not `ENABLE_ADMIN_STAGING_WRITE_POC`)
- `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
- `PUBLIC_ADMIN_WRITE_MODULE=profile`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc`
- `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY`

`canWrite: true` when all gates pass (dry-run or non-dry-run). Save is disabled when `canWrite` is false.

### G-6-c disabled write section

The **Disabled write actions** section (G-6-c) is intentionally always disabled — separate from G-6-d Profile update PoC. Users may confuse the two; the debug panel clarifies write PoC gate status.

### UI display gaps (addressed)

- Added **Auth Session / Write Gate Debug Panel** on staging shell only
- Auth adapter panel no longer SSR-renders `mock-admin@example.com` as if signed in
- User id field added to auth status panel
- Disabled reasons aggregated from auth + write gates

## 6. Required env gates

Real Supabase Auth session display (no non-dry-run required):

```bash
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_SUPABASE_URL=<staging project url>
PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
```

Read-only data + write PoC (dry-run default):

```bash
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_DATA_PROVIDER=supabase
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=profile
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Set at **repo root** `.env.local` or inline when starting dev:

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=profile \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="<staging url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=false must not be required for session display.
```

## 7. Proposed staging-only fix

Implemented on staging shell (`/__admin-staging-shell/musician-basic/` only):

**Auth Session / Write Gate Debug Panel** shows:

- Auth provider / mode / enabled
- Auth status (signed-in / signed-out / mock-preview)
- User email / shortened user id
- Admin role + role source (`mock-allowlist`; `admin_users` not queried)
- Dry-run mode / approval ID
- Write enabled / Save enabled
- Disabled reasons (auth blockers + write blockers)

Files:

- `src/lib/admin/staging-auth/staging-auth-gate-diagnostics.ts`
- `src/lib/admin/staging-auth/staging-auth-write-debug-ui.ts`
- `tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingAuthWriteDebugPanel.astro`

Future (not this phase): resolve role from `public.admin_users` read-only query when Supabase Auth session is signed in.

## 8. Write gate diagnostics

Disabled reasons may include:

```txt
- not in DEV mode
- ENABLE_ADMIN_STAGING_SHELL is not true
- ENABLE_ADMIN_STAGING_AUTH is not true
- PUBLIC_ADMIN_AUTH_PROVIDER is "mock" (need "supabase")
- PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY missing
- real Supabase Auth disabled — showing mock preview state
- no Supabase Auth session — sign in via staging login form
- signed-in email is not in mock allowlist — admin_users role not resolved yet
- ENABLE_ADMIN_STAGING_WRITE is not true
- PUBLIC_ADMIN_WRITE_PROVIDER must be supabase
- PUBLIC_ADMIN_WRITE_APPROVAL_ID mismatch
- Write gate open in dry-run mode (Save simulates; no DB update)
```

G-6-c **Disabled write actions** section remains disabled by design — not a G-6-d gate failure.

## 9. Non-dry-run remains blocked

```txt
Non-dry-run remains blocked until:
- real auth email is visible in debug panel / auth status
- email matches admin_users.email (confirm in Supabase SQL Editor)
- role is admin/editor (admin_users; UI may still show mock allowlist until resolver extended)
- write gate reasons are clear and canWrite is true
- dry-run mode passes again after any env fix
- PUBLIC_ADMIN_WRITE_DRY_RUN stays true until user explicitly retries non-dry-run prep
```

## 10. Completion criteria

```txt
authSessionInvestigationComplete: true
realUserEmailVisible: false until user enables repo-root env + signs in
writeGateDiagnosticsVisible: true
nonDryRunAborted: true
nonDryRunExecuted: false
readyForManualNonDryRunExecution: false
readyForG6DResultReport: false
readyForG6E: false
```

## 11. Final safety statement

This investigation does not execute a non-dry-run update.
Cursor does not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

## Report

```bash
node tools/static-to-astro/scripts/report-staging-auth-session-display-investigation.mjs \
  --out-dir tools/static-to-astro/output/staging-auth-session-display-investigation/gosaki
```
