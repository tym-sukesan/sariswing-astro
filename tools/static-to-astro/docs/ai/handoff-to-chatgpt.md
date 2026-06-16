Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9c2c-gosaki-existing-schedule-rows-operator-manual-sql-execution (complete — uncommitted)
Latest commit: 479347a (G-9c2b checklist)
```

## Summary

G-9c2c: Operator manually executed existing 60 rows UPDATE migration on `static-to-astro-cms-staging`.

- **60 rows** `site_slug=gosaki-piano`
- **Canonical** `source_route` `/schedule/YYYY-MM/`
- **PoC row** `schedule-2026-07-010` restored (no rename)
- **3 rows** `show_on_home`/`home_order` corrected (2026-03-011/012/013)
- **Rollback:** not executed

**Cursor/AI:** did NOT execute SQL.

**Result doc:** `tools/static-to-astro/docs/gosaki-existing-schedule-rows-manual-sql-execution-result.md`

## Gates

```txt
gosakiExistingRowsOperatorManualSqlExecutionComplete: true
gosakiScheduleSeedRowsVerified: true
readyForG9dAstroSupabaseScheduleRead: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- Staging only — not production
- No Cursor/CI SQL execution

## Next

G-9d — Astro Supabase schedule read + static fallback
