Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-execution (execution complete — uncommitted)
Latest commit: 29b8426 (G-9g2 preflight)
```

## Summary

G-9g2 title non-dry-run PoC **succeeded** (operator manual Save once).

- **Target:** `aa440e29-5be8-402e-9190-0d81c48434c0` / `schedule-2026-07-010` / `gosaki-piano`
- **Host:** `kmjqppxjdnwwrtaeqjta.supabase.co` (staging)
- **Result:** `title=[CMS Kit staging] G-9g2 title PoC`; `updated_at=2026-06-17T06:12:13.105898+00:00`
- **Cursor did not click Save**

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-title-non-dry-run-poc-execution-result.md`

## Gates

```txt
stagingShellScheduleTitlePocExecutionSucceeded: true
operatorG9g2TitlePocSaveExecuted: true
readyForG9g2Restore: true
readyForAnyDbWrite: false
```

## Next

- Commit execution result doc
- Optional G-9g2-restore or next site_slug slice planning
- Routine dev: dry-run default; do not re-click G-9g2 Save
