# Staging Profile Update PoC Implementation

## 1. Purpose

**G-6-d implements the first limited staging write PoC.**

```txt
G-6-d implements the first limited staging write PoC.
It is restricted to profile / single existing row / update-only / text-only.
It is disabled by default.
It requires explicit approval ID and env gate.
It does not connect /admin.
It does not touch production data.
```

Follows [staging-profile-update-poc-approval-plan.md](./staging-profile-update-poc-approval-plan.md) (G-6-d-prep).

Code:

- `src/lib/admin/staging-write/staging-write-config.ts`
- `src/lib/admin/staging-write/profile-update-poc-adapter.ts`
- `src/lib/admin/staging-write/staging-profile-update-ui.ts`

## 2. Approval

```txt
Approval ID: G-6-d-staging-profile-update-poc
```

Must match `PUBLIC_ADMIN_WRITE_APPROVAL_ID` when write gates are enabled.

## 3. Scope

**Allowed (when gates pass):**

- staging project only
- `profile` table only
- one existing row (`limit 1`)
- `update` only on `name`, `bio` columns (logical: `display_name`, `bio`)
- profile Save action only in staging shell

**Forbidden:**

- create, delete, restore, duplicate, reorder
- publish toggle, image upload, storage
- public site update, `/admin` route, production write
- service role key
- SQL execution, RLS policy changes from this kit

## 4. Environment gates

Defaults in `.env.example` (all disabled):

```env
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_PROVIDER=disabled
PUBLIC_ADMIN_WRITE_MODULE=profile
PUBLIC_ADMIN_WRITE_APPROVAL_ID=
PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

Also required when enabling write:

- `import.meta.env.DEV === true`
- `ENABLE_ADMIN_STAGING_SHELL=true`
- `PUBLIC_ADMIN_WRITE_PROVIDER=supabase`
- `PUBLIC_ADMIN_WRITE_MODULE=profile`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc`
- `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (staging project only)
- `ADMIN_AUTH_ENV` must not be `production`

## 5. Dry-run behavior

`PUBLIC_ADMIN_WRITE_DRY_RUN=true` (default):

```txt
- update payload is generated
- before snapshot is read from staging
- no Supabase update is called
- rollback instruction is shown
- Save button enabled when other gates pass
```

## 6. Non-dry-run behavior

`PUBLIC_ADMIN_WRITE_DRY_RUN=false` — **only after staging project / RLS / rollback verified manually:**

```txt
- staging only
- approval ID required
- profile only
- update only
- before snapshot
- update via anon client + RLS
- after snapshot
- rollback instruction
```

**Do not run non-dry-run against production.** Cursor/automation must not execute non-dry-run without explicit user confirmation.

**G-6-d-verify（完了）:** [staging-profile-update-poc-verification-checklist.md](./staging-profile-update-poc-verification-checklist.md) — verification / execution planning only; `nonDryRunExecuted: false`; `readyForManualNonDryRunDecision: true`; column mapping confirmation required; Cursor must not execute non-dry-run automatically.

**G-6-d-blocker（完了）:** [profile-schema-alignment-plan.md](./profile-schema-alignment-plan.md) — `public.profile` missing on staging; actual tables documented; recommended `public.profile`; DRAFT ONLY SQL; `readyForSchemaApplyApproval: true`; `readyForG6DNonDryRun: false`; non-dry-run stopped.

**G-6-d-schema-apply-prep（完了）:** [profile-schema-apply-prep.md](./profile-schema-apply-prep.md) — `sql/staging/profile-schema-apply.sql`; RLS without `is_active`; manual apply only; `readyForManualSchemaApply: true`.

**G-6-d-schema-apply（ユーザー手動・完了）:** `public.profile` on staging; seed row; RLS policies applied. Cursor did not execute SQL.

**G-6-d-dry-run-retry-after-schema-apply（完了）:** [staging-profile-schema-apply-verification-and-dry-run-qa.md](./staging-profile-schema-apply-verification-and-dry-run-qa.md) — `dryRunPassed: true`; `readyForManualNonDryRunDecision: true`.

**G-6-d-manual-non-dry-run-prep（完了）:** [staging-profile-manual-non-dry-run-prep.md](./staging-profile-manual-non-dry-run-prep.md) — manual non-dry-run aborted before execution.

**G-6-d-auth-session-display-investigation（完了）:** [staging-auth-session-display-investigation.md](./staging-auth-session-display-investigation.md) — auth session / write gate debug panel; non-dry-run remains blocked.

### Manual non-dry-run example (staging only)

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
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_SUPABASE_URL="<staging project url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

## 7. Rollback

Before non-dry-run write:

1. Capture before snapshot (shown in PoC result panel)
2. Note target row `id`
3. After write, verify after snapshot
4. Use rollback instruction from result panel (manual SQL on staging copy)

Rollback confirmation:

```txt
[ ] before snapshot saved
[ ] after snapshot saved
[ ] rollback steps documented
[ ] read-only preview shows expected values after rollback
```

## 8. RLS expectations

```txt
RLS must allow only intended authenticated admin/editor update.
Viewer must fail.
Anon must fail.
No service role.
```

Kit does not create or change RLS policies in G-6-d.

## 9. Test scenarios

```txt
disabled mode — ENABLE_ADMIN_STAGING_WRITE=false → Save disabled, no write
dry-run mode — all gates + DRY_RUN=true → payload, no update call
approved staging write mode — DRY_RUN=false + staging RLS → single row update
viewer denied — RLS / role blocks update
wrong approval ID denied — Save disabled
wrong module denied — PUBLIC_ADMIN_WRITE_MODULE≠profile → disabled
production env denied — ADMIN_AUTH_ENV=production or PROD → disabled
```

## 10. Final safety statement

```txt
G-6-d is limited to a staging profile update PoC.
No create/delete/publish/storage/admin route/production write is implemented.
```

## Completion report

```bash
node tools/static-to-astro/scripts/report-staging-profile-update-poc-implementation.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-update-poc-implementation/gosaki
```
