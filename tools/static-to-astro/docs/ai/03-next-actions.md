Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f6-schedule-safe-fields-non-dry-run-final-preflight`

Final preflight doc: beforeSnapshot SQL, dev server command, UI checklist, abort conditions, afterVerification / rollback SQL. No DB writes, no Run click.

**Doc:** `tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-final-preflight.md`

**Recommended next phase:** `G-6-f6-schedule-safe-fields-non-dry-run-execution` (user manual Run click exactly once)

## 2. Operator steps before execution

1. Confirm Supabase project is `static-to-astro-cms-staging`
2. Run beforeSnapshot SQL from final-preflight doc — abort if mismatch
3. Start dev server with G-6-f6 arm env (see doc §3)
4. Open `/__admin-staging-shell/musician-basic/#schedule`
5. Sign in as staging admin
6. Complete UI checklist — confirm Run enables after typing approval ID
7. **Do not click Run until execution phase**

## 3. Dry-run default (day-to-day dev)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

## 4. G-6-f6 execution arm env (execution phase only)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-f6-schedule-safe-fields-non-dry-run-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Do **not** use `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` for G-6-f6.

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f6 Implementation | **DONE** |
| G-6-f6 Final preflight | **DONE** |
| G-6-f6 Execution (manual 1 click) | **Next** |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
