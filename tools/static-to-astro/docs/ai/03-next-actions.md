Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation`

Implementation scaffold for safe-fields non-dry-run PoC: G-6-f6 config, UI section, write flow, SQL templates in docs. No DB writes, no Run click.

**Doc:** `tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-poc-implementation.md`

**Recommended next phase:** `G-6-f6-schedule-safe-fields-non-dry-run-final-preflight`

## 2. Dry-run default (day-to-day dev)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Do **not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` or arm gates without a documented phase.

## 3. G-6-f6 arm env (execution phases only — not for routine dev)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_WRITE=true \
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

## 4. G-6-f6 non-dry-run summary

- **Target row:** `aa440e29-5be8-402e-9190-0d81c48434c0` (reuse G-6-e5 row)
- **Payload:** `venue` + `description` only
- **Approval ID:** `G-6-f6-schedule-safe-fields-non-dry-run-poc` (not G-6-e5)
- **updated_at:** record in beforeSnapshot; not in payload; no optimistic lock

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f4 Safe fields dry-run | **DONE** |
| G-6-f5 Non-dry-run preflight | **DONE** |
| G-6-f6 Implementation | **DONE** |
| G-6-f6 Final preflight | **Next** |
| G-6-f6 Execution (manual) | Planned |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
