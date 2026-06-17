Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview (implementation complete — uncommitted)
Latest commit: 51051c2 (G-9g3 planning)
```

## Summary

G-9g3a adds host hard gate + multi-field dry-run preview before G-9g3b–d non-dry-run slices.

- **Title:** `[CMS Kit staging] G-9g2 title PoC` — keep; no restore
- **Host gate:** `kmjqppxjdnwwrtaeqjta.supabase.co` required; `vsbvndwuajjhnzpohghh.supabase.co` → DANGER
- **UI:** venue, open_time, start_time, price, description + title inputs; Preview dry-run only
- **No Save / no DB write** in G-9g3a

**Doc:** `tools/static-to-astro/docs/staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md`

## Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsDryRunPreviewComplete: true
stagingShellScheduleHostHardGateImplemented: true
stagingShellScheduleMultiFieldDryRunPreviewImplemented: true
stagingShellScheduleG9g3aNoSaveUi: true
readyForG9g3bVenueDescriptionPoc: true
readyForAnyDbWrite: false
```

## Next

- Commit G-9g3a implementation
- G-9g3b venue + description non-dry-run PoC
