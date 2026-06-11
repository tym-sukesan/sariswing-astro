# Staging Password Reset Callback

## 1. Purpose

**Phase:** `G-6-d-staging-password-reset-callback`

This phase implements a staging-only password reset callback / update password flow so a staging admin user can set a new password after Supabase Dashboard sends a recovery email.

This phase implements a staging-only password reset callback/update password flow.
It does not execute a profile update.
It does not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
It does not connect /admin.
It does not touch production Auth or production data.

## 2. Problem

```txt
Supabase Dashboard password recovery email returned to localhost with recovery tokens in the URL hash.
The existing staging reset UI was preview/disabled (resetPasswordForEmail not called; update password disabled).
The user could not set a new password from the recovery link.
```

## 3. Implemented flow

```txt
1. User sends password recovery from Supabase Dashboard (not from this app)
2. User clicks the recovery link in email
3. Browser returns to localhost with #access_token / refresh_token / type=recovery (or hash error)
4. User opens /__admin-staging-shell/musician-basic/ (keep hash if redirected to root)
5. Staging shell detects recovery hash via detectSessionInUrl + onAuthStateChange
6. User enters new password + confirmation (min 8 chars)
7. supabase.auth.updateUser({ password }) via anon client
8. Success message shown; user signed out for clean login retry
9. User signs in with new password; Debug Panel shows authenticated email
```

Implementation:

- `src/lib/admin/staging-auth/staging-password-reset-callback.ts`
- `src/lib/admin/staging-auth/staging-password-reset-ui.ts`
- `tools/static-to-astro/templates/admin-cms/auth/components/AdminStagingPasswordResetCallback.astro`

No `resetPasswordForEmail` from this app (Dashboard sends email).

## 4. Required Supabase settings

Authentication → URL Configuration (staging project only):

```txt
Site URL:
http://localhost:4321

Redirect URLs:
http://localhost:4321/**
http://localhost:4321/__admin-staging-shell/musician-basic/**
```

Use port `4322` if Astro dev server uses that port.

## 5. Manual test procedure

```txt
1. Start dev server with staging auth env (ENABLE_* + PUBLIC_* gates)
2. Confirm PUBLIC_ADMIN_WRITE_DRY_RUN=true
3. In Supabase Dashboard, send password recovery to the staging user
4. Click the newest recovery email link
5. If redirected to root with #access_token, navigate to /__admin-staging-shell/musician-basic/ keeping the hash
6. Confirm Callback status becomes recovery-ready
7. Enter new password and confirmation (8+ chars)
8. Click Update password
9. Confirm success message
10. Click Back to login or Sign out
11. Sign in with the new password
12. Confirm Debug Panel shows authenticated and user email
```

## 6. Safety notes

```txt
- Do not paste access_token or refresh_token into chat/docs
- Do not commit passwords
- Do not use service_role
- Do not touch production
- Do not run non-dry-run profile update in this phase
- PUBLIC_ADMIN_WRITE_DRY_RUN=true is maintained
- Tokens are not displayed or console.logged
- Passwords are not logged
```

## 7. Completion criteria

```txt
passwordResetCallbackImplemented: true
passwordUpdateButtonEnabledInStagingOnly: true
profileUpdateExecuted: false
nonDryRunExecuted: false
readyForAuthLoginRetry: true
readyForManualNonDryRunExecution: false
readyForG6E: false
```

**G-6-d-auth-status-denied-fix（完了）:** [staging-auth-status-denied-fix.md](./staging-auth-status-denied-fix.md) — Auth status denied issue fixed; valid session now takes precedence over stale recovery error.

**G-6-d-result-report（完了）:** [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md) — password reset + auth fixes enabled first manual non-dry-run profile update; production not touched.

## Report

```bash
node tools/static-to-astro/scripts/report-staging-password-reset-callback.mjs \
  --out-dir tools/static-to-astro/output/staging-password-reset-callback/gosaki
```
