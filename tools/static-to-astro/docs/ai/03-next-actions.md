Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight` (preflight complete — uncommitted)

**Doc:**
- `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md` (**new**)

**Awaiting:** operator commit approval (`Document schedule title PoC preflight`)

### G-9g2 preflight summary

- beforeSnapshot / dry-run / Save / restore checklist
- Operator approval text documented
- Save **not** executed by Cursor

### Gates

```txt
stagingShellScheduleTitlePocPreflightComplete: true
readyForOperatorG9g2TitlePocSave: true
readyForAnyDbWrite: false
```

## 2. Next steps

1. Commit G-9g2 preflight docs
2. G-9g2-execution — operator approval + manual Save once (separate phase)

## 3. Do not

- Cursor click Save / DB writes until execution phase
- Modify `/admin` or G-6 frozen paths

## 4. Baseline

- Latest commit: `969822e` (G-9g2 implementation)
- G-9g2 preflight: complete, pending commit
