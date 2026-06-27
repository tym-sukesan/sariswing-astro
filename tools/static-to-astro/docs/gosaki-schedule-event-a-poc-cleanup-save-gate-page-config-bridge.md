# G-13d1e — Gosaki Event A PoC cleanup Save gate page config bridge

**Phase:** `G-13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `55a6da5`  
**Prior:** G-13d1d Save gate disabled investigation

## Summary

G-13c1 Save gate relied on client `import.meta.env` only; G-9k had SSR→DOM bridge but G-13c1 did not. Added `gosaki-schedule-event-a-poc-cleanup-page-config.ts` and DOM injection in `AdminGosakiStagingScheduleOperatorPage.astro`. `getG13c1EventAPocCleanupConfig()` merges page config like G-9k. Preview shows Save gate failure reason when `ready_but_save_disabled`.

---

## 1. Problem (G-13d1d)

Preview OK but `saveReadiness: ready_but_save_disabled` — `saveEnabled=false` on client despite execution env.

Root cause: G-13c1 `PUBLIC_*` / `ENABLE_*` arms not reliably visible in browser bundle; G-9k pattern (SSR data attrs) was missing.

---

## 2. Implementation

### New module

`src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-page-config.ts`

| Function | Role |
|----------|------|
| `resolveG13c1EventAPocCleanupPageServerConfig` | SSR read server env |
| `readG13c1EventAPocCleanupPageConfigFromDom` | Client read `#g13c1-event-a-poc-cleanup-page-config` |
| `applyG13c1EventAPocCleanupPageConfigToEnv` | Merge into config env |
| `isG13c1EventAPocCleanupPageConfigValid` | approval_id check |

### DOM attributes (SSR)

| Attribute | Source env |
|-----------|------------|
| `data-g13c1-save-compile-gate-enabled` | `PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED` |
| `data-g13c1-staging-shell-enabled` | `ENABLE_ADMIN_STAGING_SHELL` |
| `data-g13c1-staging-write-enabled` | `ENABLE_ADMIN_STAGING_WRITE` |
| `data-g13c1-env-arm-armed` | `PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED` |
| `data-g13c1-write-dry-run-disabled` | `PUBLIC_ADMIN_WRITE_DRY_RUN=false` |
| `data-g13c1-write-provider` | `PUBLIC_ADMIN_WRITE_PROVIDER` |
| `data-g13c1-write-module` | `PUBLIC_ADMIN_WRITE_MODULE` |
| `data-g13c1-write-approval-id` | `PUBLIC_ADMIN_WRITE_APPROVAL_ID` |

### Config merge

`getG13c1EventAPocCleanupConfig()`:

```txt
mergeStagingShellEnv(env)
  → readG13c1EventAPocCleanupPageConfigFromDom()
  → applyG13c1EventAPocCleanupPageConfigToEnv()
  → existing armed / saveEnabled logic (unchanged)
```

### UI

When `saveReadiness === ready_but_save_disabled`, Preview panel shows `Save gate: …` with `armFailureReason` or compile gate hint.

---

## 3. Save / approval gates (unchanged)

- `saveEnabled = compileGate && armed`
- approval_id: `G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run`
- routine dev: compile gate off → Save disabled

---

## 4. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupSaveGatePageConfigBridgeComplete` | **true** |
| `readyForG13d1EventAPocCleanupExecutionRetry` | **true** |
| `cursorSaveExecuted` | **false** |
| `eventBTouched` | **false** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge.mjs
```

---

## 6. Next

`G-13d1-event-a-poc-cleanup-execution-retry` — operator execution env → Preview (`ready_to_save`) → Save once.

---

## 7. References

- [gosaki-schedule-event-a-poc-cleanup-save-gate-disabled-investigation](G-13d1d — chat / prior investigation)
- `gosaki-schedule-save-button-page-config.ts` (G-9k pattern)
- [gosaki-staging-shell-server-gate-injection.md](./gosaki-staging-shell-server-gate-injection.md) (G-13d1c)
