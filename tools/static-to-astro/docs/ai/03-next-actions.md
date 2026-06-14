Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f7-schedule-write-hardening-and-updated-at-planning`

Hardening design: write flow summary, `updated_at` (recommend DB trigger on staging first), optimistic lock, rollback/recovery, approval slices, field priority, PoC vs general UI boundaries. No DB writes.

**Doc:** `tools/static-to-astro/docs/schedule-write-hardening-and-updated-at-planning.md`

**Recommended next phase:** `G-6-f8-schedule-updated-at-staging-migration-preflight`

## 2. Key planning decisions

| Topic | Recommendation |
| --- | --- |
| `updated_at` | Option A — DB `BEFORE UPDATE` trigger on staging first |
| Optimistic lock | Enable `expectedBeforeUpdatedAt` after trigger verified |
| Next fields | title → open_time/start_time → price → visibility → date |
| PoC triggers | Keep code; disarmed; do not re-click |
| General UI | New section + new `G-6-g-*` approval IDs |

## 3. Dry-run default (routine dev)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

## 4. Do not re-click

- G-6-f6 Run button
- G-6-e5 hidden PoC Run

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f7 Hardening planning | **DONE** |
| G-6-f8 updated_at staging migration preflight | **Next** |
| G-6-g general edit UI planning | Planned |
| Per-field non-dry-run slices | After updated_at hardening |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
