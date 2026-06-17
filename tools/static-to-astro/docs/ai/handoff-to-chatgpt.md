Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight (implementation + preflight complete — uncommitted)
Latest commit: 54380a0 (G-9g3a host gate + multi-field dry-run)
```

## Summary

G-9g3a smoke test passed (host gate, venue+description dry-run). G-9g3b adds gated Save for venue + description only.

- **Title:** `[CMS Kit staging] G-9g2 title PoC` — keep; no restore
- **G-9g3b payload:** venue + description PoC values only
- **Approval ID:** `G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc`
- **Not executed:** Save / DB write in this phase

**Docs:**
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-preflight.md`
- `staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation.md`
- `staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test-result.md`

## Gates

```txt
stagingShellScheduleVenueDescriptionPocPreflightComplete: true
stagingShellScheduleVenueDescriptionPocNotExecuted: true
readyForG9g3bExecution: true
readyForAnyDbWrite: false
```

## Next

- Commit G-9g3b
- G-9g3b-execution (operator manual Save once)
