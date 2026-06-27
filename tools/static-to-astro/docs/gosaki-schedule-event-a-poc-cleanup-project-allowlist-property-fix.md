# G-13d1g — Gosaki Event A PoC cleanup project allowlist property fix

**Phase:** `G-13d1g-gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `9a9c5a1`  
**Prior:** G-13d1f project allowlist investigation

## Summary

G-13c1 Save gate always reported `project allowlist failed` even when `PUBLIC_SUPABASE_URL` pointed at staging (`kmjqppxjdnwwrtaeqjta`). Root cause: `getG13c1EventAPocCleanupConfig()` read wrong property names from `evaluateStagingProjectAllowlist()` (`passed` / `failureReason` instead of `allowlistPassed` / `errorMessage`). Fixed to match G-9k save-button config.

---

## 1. Problem (G-13d1f)

After G-13d1e page config bridge, operator Preview succeeded:

- `dryRun: true` / `actualWrite: false`
- `changedFields`: 6 Event A fields
- `saveReadiness: ready_but_save_disabled`
- Save gate: `project allowlist failed`

`evaluateStagingProjectAllowlist()` returns `allowlistPassed` and `errorMessage`. G-13c1 used non-existent `.passed` (always `undefined` → falsy) so allowlist check always failed.

---

## 2. Fix

**File:** `src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts`

| Before (wrong) | After (G-9k aligned) |
|----------------|----------------------|
| `projectAllowlist.passed` | `projectAllowlist.allowlistPassed` |
| `projectAllowlist.failureReason` | `projectAllowlist.errorMessage` |

No change to allowlist definition, page config bridge, or `PUBLIC_SUPABASE_URL` wiring.

---

## 3. Scope

| In scope | Out of scope |
|----------|--------------|
| Event A G-13c1 Save gate config | Event B (`aa440e29…`) |
| Property name alignment with G-9k | Save execution |
| Verifier + doc | DB write / FTP / deploy |

---

## 4. Operator next step

Restart dev with G-13d1 Save env stack (unchanged). Preview should show `saveReadiness: ready_to_save` when all other gates pass. Save remains **operator manual once** in `G-13d1-event-a-poc-cleanup-execution-retry`.

---

## 5. Safety gates (this phase)

| Gate | Value |
|------|-------|
| cursorSaveExecuted | **false** |
| cursorPreviewExecuted | **false** |
| dbWriteExecuted | **false** |
| eventBTouched | **false** |
| commitInPhase | **false** (operator commits separately) |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1g-gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix.mjs
```
