Last updated: 2026-06-14
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-6-f6-schedule-safe-fields-non-dry-run-execution`

G-6-f6 safe-fields non-dry-run succeeded: `venue` + `description` UPDATE on staging row. User manual Run once. No Cursor/Playwright click.

**Doc:** `tools/static-to-astro/docs/schedule-safe-fields-non-dry-run-execution-result.md`

**Recommended next:** Plan remaining safe fields (`title`, `open_time`, `start_time`, `price`) as separate approval slices, or Schedule general UI / `updated_at` hardening.

## 2. Dry-run default (restore after execution)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Do **not** keep `PUBLIC_ADMIN_WRITE_DRY_RUN=false` or G-6-f6 arm gates for routine dev.

## 3. Staging row state (post G-6-f6)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
rollbackNeeded: false
```

## 4. Do not re-click

- G-6-f6 Run button
- G-6-e5 hidden PoC Run (without EXPLICIT_RERUN)

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-6-f6 Execution | **DONE** |
| title / time / price non-dry-run slices | Planned (separate approvals) |
| Schedule general UI | Ready for planning |
| updated_at hardening | Optional |

## 6. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
