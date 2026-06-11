# Staging Env Gate Client Fix

## 1. Purpose

**Phase:** `G-6-d-staging-env-gate-client-fix`

After G-6-d-auth-session-display-investigation, the Auth Session / Write Gate Debug Panel showed `ENABLE_ADMIN_STAGING_SHELL is not true` even when those variables were set inline for `npm run dev`. This phase fixes client-side diagnostics by injecting server-read `ENABLE_*` gate booleans into the staging shell page.

This phase fixes staging shell diagnostics where non-PUBLIC env gates were not visible to client-side UI.
No non-dry-run update is executed.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

## 2. Incident summary

```txt
Debug Panel showed:
- Auth provider: supabase
- Auth enabled: false
- Auth status: mock-preview
- disabled reasons included ENABLE_ADMIN_STAGING_SHELL and ENABLE_ADMIN_STAGING_AUTH not true

However PUBLIC_ADMIN_* values were visible, suggesting that non-PUBLIC env gates were not available in client-side diagnostics.
```

## 3. Root cause

```txt
Client-side staging auth/write/read-only config and diagnostics read ENABLE_ADMIN_STAGING_* directly from import.meta.env.
Astro/Vite only exposes PUBLIC_ prefixed variables to browser-side code.
Therefore ENABLE_ADMIN_STAGING_SHELL / ENABLE_ADMIN_STAGING_AUTH / ENABLE_ADMIN_STAGING_WRITE / ENABLE_ADMIN_STAGING_DATA_READ were undefined on the client and treated as false.
PUBLIC_ADMIN_* variables were visible because they use the PUBLIC_ prefix.
Auth provider could show supabase while auth mode stayed disabled/mock-preview.
```

## 4. Fix strategy

**Option A (implemented):** Server-side Astro reads `ENABLE_*` gates and injects a safe JSON snapshot into the staging shell page.

```txt
Server-side Astro reads ENABLE_* gates and passes safe booleans to the staging shell debug UI.
No secrets are exposed.
Only staging shell receives these props.
```

Implementation:

- `src/lib/admin/staging-shell/staging-shell-server-gates.ts` — read server env
- `src/lib/admin/staging-shell/staging-shell-client-gates.ts` — merge into client `import.meta.env` for gate keys
- `musician-basic-admin-prototype.astro` — inject `<script id="staging-shell-server-gates" type="application/json">`
- `staging-auth-config.ts`, `staging-write-config.ts`, `read-only-data-config.ts` — call `mergeStagingShellEnv()` before reading gates

Debug Panel adds **Server gate injection: true/false**.

## 5. Updated local dry-run command

Unchanged — set `ENABLE_*` at repo root or inline (server reads them):

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

Open: `http://localhost:4321/__admin-staging-shell/musician-basic/`

## 6. Expected debug panel result

```txt
Expected after fix:
- Server gate injection: true
- Auth provider: supabase
- Auth mode: enabled
- Auth enabled: true
- Auth status: unauthenticated (before login) or authenticated (after login)
- User email: visible after login
- Dry-run mode: true
- Approval ID: G-6-d-staging-profile-update-poc
- Write enabled: true (when all write gates pass)
- Save enabled: true in dry-run (simulates payload only)
- Disabled reasons should not incorrectly claim ENABLE_ADMIN_STAGING_SHELL is missing when provided inline
```

Before login, disabled reasons may still include `no Supabase Auth session — sign in via staging login form` (informational). Dry-run Save can still be enabled when write gates pass.

## 7. Non-dry-run remains blocked

```txt
Even after this fix, non-dry-run remains blocked until:
- real auth email is visible
- email matches admin_users.email
- role is admin/editor in Supabase
- dry-run Save is confirmed after the fix
- user explicitly proceeds to one manual non-dry-run test
```

Keep `PUBLIC_ADMIN_WRITE_DRY_RUN=true` until then.

## 8. Completion criteria

```txt
envGateClientFixComplete: true
authEnabledDiagnosticAccurate: true
writeGateDiagnosticAccurate: true
nonDryRunExecuted: false
readyForManualNonDryRunExecution: false
readyForG6E: false
```

## 9. Final safety statement

This fix does not execute a non-dry-run update.
Cursor does not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

**G-6-d-staging-password-reset-callback（完了）:** [staging-password-reset-callback.md](./staging-password-reset-callback.md) — staging password reset callback implemented; `updateUser({ password })` is staging-only; no profile update executed; no non-dry-run profile update yet. Next: recovery email再送 → 新パスワード設定 → 通常ログイン → Debug Panel確認.

**G-6-d-auth-status-denied-fix（完了）:** [staging-auth-status-denied-fix.md](./staging-auth-status-denied-fix.md) — Auth status denied issue fixed; valid session prioritized; authenticated when session.user.email available.

**G-6-d-result-report（完了）:** [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md) — first manual staging non-dry-run profile update succeeded; production not touched; `/admin` unconnected.

## Report

```bash
node tools/static-to-astro/scripts/report-staging-env-gate-client-fix.mjs \
  --out-dir tools/static-to-astro/output/staging-env-gate-client-fix/gosaki
```
