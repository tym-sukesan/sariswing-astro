# Staging Auth Status Denied Fix

## 1. Purpose

**Phase:** `G-6-d-auth-status-denied-fix`

This phase fixes staging auth diagnostics where a visible Supabase user email still showed Auth status as denied.

This phase fixes staging auth diagnostics where a visible Supabase user email still showed Auth status as denied.
It does not execute a profile update.
It does not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
It does not connect /admin.
It does not touch production Auth or production data.

## 2. Problem

```txt
Debug Panel showed user email and user id from Supabase Auth, but Auth status remained denied.
A clean staging shell URL still showed denied.
This blocked the manual non-dry-run profile update.
```

Observed state:

```txt
User email: ysktoyamax@gmail.com
User id: cf11e6fc…7d40
Auth status: denied
Dry-run mode: true
```

## 3. Root cause

```txt
mapSupabaseSession() converted a valid Supabase signed-in session to status "denied"
when the email was not in the in-memory mock allowlist (example.com only).
Auth status and mock role resolution were conflated.
Real staging users (e.g. ysktoyamax@gmail.com in Supabase Auth / admin_users)
were treated as auth-denied even though getSession() returned a valid session.
```

Recovery hash errors were a secondary concern; the primary bug was mock allowlist overriding auth session status.

## 4. Fix

```txt
- staging-auth-session.ts: keep Supabase session status as signed-in when session exists
- staging-auth-display-status.ts: new resolver with authenticated / unauthenticated / recovery-error / recovery-session / mock-preview / error
- Valid session.user.email always maps to Auth status authenticated
- Mock allowlist denial affects Admin role display only, not Auth status
- Stale recovery error hash cleared when authenticated session is detected
- Debug Panel adds Auth detail, Recovery hash present, Recovery error code, Session present
- Password reset gate checks session before treating hash error as blocking
```

Implementation:

- `src/lib/admin/staging-auth/staging-auth-display-status.ts`
- `src/lib/admin/staging-auth/staging-auth-session.ts`
- `src/lib/admin/staging-auth/staging-auth-write-debug-ui.ts`
- `src/lib/admin/staging-auth/staging-auth-ui.ts`
- `src/lib/admin/staging-auth/staging-password-reset-callback.ts`

## 5. Expected statuses

```txt
authenticated — Supabase session exists; session.user.email present
unauthenticated — Auth enabled; no session; no hash error
recovery-error — URL hash contains error / error_code; no valid session
recovery-session — URL hash indicates recovery flow; no session yet
mock-preview — Supabase auth disabled or provider is mock
error — unexpected config or session read failure
disabled — Auth gates off (non-mock)
```

Priority:

```txt
1. If valid session.user.email exists → authenticated
2. If no session and URL hash has error → recovery-error
3. Do not let stale recovery error override an active authenticated session
4. If URL hash error is consumed or cleared, status must not remain denied
```

## 6. Manual verification

```txt
1. Start dev server with staging auth env and PUBLIC_ADMIN_WRITE_DRY_RUN=true
2. Open /__admin-staging-shell/musician-basic/
3. Sign out if needed
4. Open clean URL without hash
5. Sign in with ysktoyamax@gmail.com
6. Confirm Auth status: authenticated
7. Confirm User email: ysktoyamax@gmail.com
8. Confirm Dry-run mode: true
9. Do not run non-dry-run
```

## 7. Safety notes

```txt
- Do not paste access_token or refresh_token into chat/docs
- Do not commit passwords
- Do not use service_role
- Do not touch production
- Do not run non-dry-run profile update in this phase
- PUBLIC_ADMIN_WRITE_DRY_RUN=true is maintained
```

## 8. Completion criteria

```txt
authStatusDeniedFixImplemented: true
validSessionPrioritized: true
staleRecoveryErrorDoesNotOverrideSession: true
profileUpdateExecuted: false
nonDryRunExecuted: false
readyForAuthLoginRetry: true
readyForManualNonDryRunExecution: false
readyForG6E: false
```

## 9. Follow-up result

**G-6-d-result-report（完了）:** [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md) — after this fix, user signed in and completed first manual staging non-dry-run profile update; `public.profile` bio updated; production not touched; `/admin` unconnected; `readyForG6E: false`.

## Report

```bash
node tools/static-to-astro/scripts/report-staging-auth-status-denied-fix.mjs \
  --out-dir tools/static-to-astro/output/staging-auth-status-denied-fix/gosaki
```
