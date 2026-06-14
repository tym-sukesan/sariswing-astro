Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f5-schedule-safe-fields-non-dry-run-preflight`

Preflight doc for safe-fields non-dry-run: target row, payload, rollback SQL, beforeSnapshot, approval ID, updated_at policy. No DB writes.

**Doc:** `tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-preflight.md`

**Recommended next phase:** `G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation`

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

Do **not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` or `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true` without a documented phase.

## 3. G-6-f6 non-dry-run preflight summary

- **Target row:** `aa440e29-5be8-402e-9190-0d81c48434c0` (reuse G-6-e5 row)
- **First payload (recommended):** `venue` + `description` append (not all 6 fields)
- **Approval ID:** `G-6-f6-schedule-safe-fields-non-dry-run-poc` (not G-6-e5)
- **updated_at:** record in beforeSnapshot; do not include in payload; no optimistic lock on first run

## 4. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f4 Safe fields dry-run | **DONE** |
| G-6-f5 Non-dry-run preflight | **DONE** |
| G-6-f6 Implementation | **Next** |
| G-6-f6 Final preflight | Planned |
| G-6-f6 Execution (manual) | Planned |

## 5. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
