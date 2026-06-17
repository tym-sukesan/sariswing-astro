Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation` (implementation complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation.md` (**new**)

**Awaiting:** operator commit approval (`Implement gated schedule title non-dry-run PoC`)

### G-9g2 summary

- Gated `Save title PoC` + `executeG9G2TitleNonDryRunSave`
- UPDATE: id + site_slug + legacy_id + updated_at
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true`
- Save **not** executed by Cursor

### Gates

```txt
stagingShellScheduleTitleNonDryRunPocImplementationComplete: true
readyForG9g2Preflight: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g2 implementation
2. G-9g2-preflight + operator manual Save (separate phase)

## 3. Do not

- Cursor click Save / DB writes until execution phase
- Modify `/admin` or G-6 frozen paths

## 4. Baseline

- Latest commit: `91f8b50` (G-9g2 planning)
- G-9g2 impl: complete, pending commit
