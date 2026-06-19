# Staging shell schedule single-text-field operational commonization planning (G-9g4a2)

**Phase:** `G-9g4a2-framework-single-text-field-operational-commonization-planning`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a2a open_time-only restore-and-closure — commit `105c6b1`; AI context sync — commit `849ac6f`  
**Type:** planning only — **no implementation, no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Row picker clicked (Cursor/AI) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [staging-shell-schedule-venue-only-operational-restore-result-finalization.md](./staging-shell-schedule-venue-only-operational-restore-result-finalization.md) (G-9g4a1e — commit `3b807c8`)
- [staging-shell-schedule-open-time-only-operational-restore-and-closure.md](./staging-shell-schedule-open-time-only-operational-restore-and-closure.md) (G-9g4a2a — commit `105c6b1`)
- [staging-shell-schedule-open-time-only-operational-expansion-implementation.md](./staging-shell-schedule-open-time-only-operational-expansion-implementation.md) (G-9g4a2a — commit `8ae0d1e`)
- [staging-shell-schedule-venue-only-operational-expansion-implementation.md](./staging-shell-schedule-venue-only-operational-expansion-implementation.md) (G-9g4a1 — commit `49986c1`)
- [staging-shell-schedule-text-fields-operational-expansion-planning.md](./staging-shell-schedule-text-fields-operational-expansion-planning.md) (G-9g4a2 — commit `0d80d7d`)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 / G-9g4a1 venue-only / G-9g4a2a open_time-only Save.**

---

## Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationPlanningComplete: true
readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true
g9g4a1VenueOnlyRoundTripComplete: true
stagingShellScheduleOpenTimeOnlyOperationalRoundTripComplete: true
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
restoreRequired: false
noFurtherSaveOrRestoreNeeded: true
singleFieldFrameworkPolicy: true
perFieldManualRoundTripPolicy: do not repeat for start_time/price config-only slices
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a2-framework-single-text-field-operational-commonization-implementation`

---

## 1. Background

### G-9g4a1 venue-only round-trip — complete

| Step | Phase | Commit |
| --- | --- | --- |
| Implementation | G-9g4a1 | `49986c1` |
| Save gate sync | G-9g4a1 | `78888f5` |
| Smoke execution | G-9g4a1b1 | `11368be` |
| Restore | G-9g4a1d | `82e1aaa` |
| Closure | G-9g4a1e | `3b807c8` |

**Proven row:** `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` / `schedule-2026-03-003` / `gosaki-piano`

### G-9g4a2a open_time-only round-trip — complete

| Step | Phase | Commit |
| --- | --- | --- |
| Implementation | G-9g4a2a | `8ae0d1e` |
| Preflight | G-9g4a2a1 | `8d57b1b` |
| Smoke execution | G-9g4a2a2 | `54623a1` |
| Restore + closure | G-9g4a2a | `105c6b1` |

**Final `open_time`:** `11:30` — marker removed; **no further Save / restore needed** on this row.

### Pattern established (both slices)

```txt
field-specific approval ID
field-specific env arm
payload guard (exactly one key)
changedFields exact check (length === 1)
optimistic lock (expectedBeforeUpdatedAt)
re-click prevention (preview identity consumed)
mutual exclusion vs other arms
same-path UI restore (not G-9g3g5)
host gate (staging only)
```

---

## 2. Problem

G-9g4a1 (`venue`) and G-9g4a2a (`open_time`) each required **~6 dedicated source files** plus guards, verifiers, and a **full operator manual Save → restore round-trip** to prove operational safety.

If `start_time` and `price` repeat the same per-field copy-paste + manual round-trip pattern (as originally sketched in G-9g4a2 as G-9g4a2b / G-9g4a2c), gosaki schedule CMS practical use is delayed by weeks of operator cycles with diminishing safety value.

| Cost | Per-field clone (rejected) | Config-driven framework (chosen) |
| --- | --- | --- |
| New source modules per field | ~6 files × 2 fields | 1 registry + shared modules |
| Manual non-dry-run round-trips | 2+ full cycles | **1** cycle when new common logic lands (optional) |
| Verifier / doc phases | 4+ per field | Static registry + guard verifier |
| Time to gosaki client CMS | Slow | **Minimal delay** |

---

## 3. Decision

Move remaining schedule **single-text-field** operational paths to a **config-driven single-text-field operational framework**.

| Principle | Detail |
| --- | --- |
| Do **not** repeat per-field manual round-trips for `start_time` / `price` | Config-only field additions verified statically |
| Manual non-dry-run round-trip | Reserved for **new common logic** introduction only |
| Verification for config-only fields | Static verifiers, guard tests, dry-run Preview, type checks |
| Abstraction level | **Minimal** — gosaki schedule CMS practical use is the goal; no generic CMS framework |
| Next step | **Common framework implementation** — **not** `start_time`-only manual execution slice |

---

## 4. Target fields

| Field | Framework registry | Notes |
| --- | --- | --- |
| `open_time` | **yes** | G-9g4a2a dedicated path exists — migrate to registry in implementation (thin delegate OK) |
| `start_time` | **yes** | Config-only addition after framework lands |
| `price` | **yes** | Config-only addition after framework lands |

All three share: nullable text string, single payload key, non-empty trimmed value, no route/date/publication mutation.

---

## 5. Excluded / deferred fields

| Field | Status | Reason |
| --- | --- | --- |
| `venue` | **proven separately (G-9g4a1)** | Not in `open_time \| start_time \| price` registry; keep dedicated path unless later optional merge |
| `description` | **operational (G-9g3g4)** | Different path — general operational edit; do not re-prove |
| `title` | **out of scope** | SEO / non-empty sensitivity — defer to G-9g4a4+ |
| `date`, `year`, `month` | **forbidden** | Route / calendar integrity |
| `source_route`, `source_file` | **forbidden** | Canonical route model |
| `published`, `show_on_home`, `home_order`, `sort_order` | **forbidden** | Publication metadata |
| `image_url`, `home_image_url` | **forbidden** | Asset fields |
| `id`, `legacy_id`, `site_slug`, `created_at`, `updated_at` | **forbidden** | Identity / audit |

---

## 6. Proposed common architecture

### 6.1 Layer diagram

```txt
AdminStagingScheduleSiteSlugEditSection.astro
  └── staging-schedule-site-slug-edit-ui.ts (init wiring)
        └── staging-schedule-single-text-field-operational-edit-ui.ts (generic UI gate)
              └── SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY[fieldKey]
        └── staging-schedule-single-text-field-operational-save.ts (generic Save)
              └── schedule-write-guards (parameterized single-field guards)
              └── executeScheduleGeneralUpdateWrite (optimistic lock — unchanged)
        └── staging-schedule-single-text-field-operational-config.ts (generic arm eval)
              └── mutual exclusion vs all other arms
```

### 6.2 What stays field-specific (config only)

```txt
approvalId
envArm
uiIdPrefix
phasePrefix
label
fieldName
validate()
smokeCandidateSuffix (execution docs only — not in implementation phase DB)
reclickMode key
```

### 6.3 What is shared (one implementation)

```txt
arm evaluation logic (host gate, dry-run, mutual exclusion)
changedFields === [fieldName] guard
payload === { [fieldName]: nonEmptyString } guard
forbidden metadata mutation guard
writable row guard
Preview → Save gate sync
optimistic lock wiring
re-click prevention (preview identity)
Save executor flow (auth, adapter, lock baseline)
dry-run preview diff binding
verifier: registry uniqueness + guard smoke
```

### 6.4 Gosaki minimal commonization (do not over-abstract)

| Do | Do not |
| --- | --- |
| One registry file for 3 fields | Generic plugin system for all CMS modules |
| Parameterize existing G-9g4a2a / G-9g4a1 patterns | Rewrite G-9g3g operational general edit |
| Thin wrappers during migration if safer | Big-bang delete of G-9g4a2a files before parity verifier passes |
| Static verifiers for config additions | Per-field operator Save/restore for `start_time` / `price` |
| Keep venue-only path stable | Merge venue into framework in same slice |

---

## 7. Config schema proposal

```ts
/** G-9g4a2 framework — staging shell gosaki schedule single-text-field operational registry */
export type SingleTextFieldOperationalFieldName = "open_time" | "start_time" | "price";

export type SingleTextFieldOperationalField = {
  /** DB column / payload key */
  fieldName: SingleTextFieldOperationalFieldName;
  /** e.g. G-9g4a2a, G-9g4a2b — doc / phase labeling only */
  phasePrefix: string;
  /** UI label */
  label: string;
  /** Registered in SCHEDULE_WRITE_APPROVAL_IDS */
  approvalId: string;
  /** e.g. PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED */
  envArm: string;
  /** e.g. site-slug-edit-g9g4a2b-start-time-only */
  uiIdPrefix: string;
  /** operational-save-reclick mode key */
  reclickMode: string;
  /** optional — execution doc smoke suffix only */
  smokeCandidateSuffix?: string;
  /** conservative non-empty trim check; field-specific rules stay minimal */
  validate: (value: string) => boolean;
};
```

### 7.1 Registry entries (proposed — implementation phase)

| fieldName | phasePrefix | approvalId (proposed) | envArm (proposed) | reclickMode |
| --- | --- | --- | --- | --- |
| `open_time` | G-9g4a2a | `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run` *(existing)* | `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED` *(existing)* | `open-time-only` *(existing)* |
| `start_time` | G-9g4a2b | `G-9g4a2b-schedule-site-slug-start-time-only-non-dry-run` | `PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED` | `start-time-only` |
| `price` | G-9g4a2c | `G-9g4a2c-schedule-site-slug-price-only-non-dry-run` | `PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED` | `price-only` |

**Registry invariants (verifier-enforced):**

```txt
unique fieldName
unique approvalId
unique envArm
unique uiIdPrefix
unique reclickMode
validate("") === false for all entries
```

### 7.2 Default validate

```ts
function nonEmptyTrimmed(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
```

No regex time format enforcement in framework v1 — gosaki displays free-form time/price strings today.

---

## 8. Guard strategy

Replace per-field `assertG9G4a2aOpenTimeOnly*` / future `assertG9G4a2b*` with **parameterized factories**:

| Guard | Behavior |
| --- | --- |
| `assertSingleTextFieldChangedFieldsOnly(fieldName, changedFields)` | `changedFields` exactly `[fieldName]` |
| `assertSingleTextFieldPayloadOnly(fieldName, payload, validate)` | payload keys === `[fieldName]`; value passes `validate` |
| `assertSingleTextFieldNoRouteDatePublicationImageMutation(payload)` | blocks venue, title, description, other text fields, date, routes, publication, images, ids |
| `assertSingleTextFieldApproval(fieldName, approvalId, registry)` | approvalId matches registry entry |
| `assertSingleTextFieldWritableRow(row)` | content row; blocks PoC audit row |
| `buildSingleTextFieldPayload(fieldName, raw, validate)` | trim + validate |

**Keep existing G-9g4a2a guards** as thin delegates during migration; delete only after parity verifier passes.

**Forbidden in same Save:** any key not in `{ [fieldName]: string }` plus all metadata fields listed in §5.

---

## 9. UI strategy

### 9.1 Generic UI module

One module: `staging-schedule-single-text-field-operational-edit-ui.ts`

| Element | id pattern |
| --- | --- |
| Preview button | `#${uiIdPrefix}-dry-run-preview-btn` |
| Preview result | `#${uiIdPrefix}-dry-run-result` |
| Save gate panel | `#${uiIdPrefix}-save-gate-panel` |
| Save button | `#${uiIdPrefix}-save-btn` |
| Save result | `#${uiIdPrefix}-save-result` |

### 9.2 Rendering

- **Option A (recommended):** one generic panel per armed field in registry (only when that field's env arm is on)
- **Option B:** single panel with field selector — **rejected** (adds UX complexity; violates single-field-at-a-time safety)

### 9.3 Save gate sync

Reuse G-9g4a1b1 / G-9g4a2a pattern: refresh Save gate panel **after** `previewValid=true`.

### 9.4 Row picker

Reuse existing hydrate — no row picker changes in framework slice.

---

## 10. Save strategy

Generic executor: `executeSingleTextFieldOperationalNonDryRunSave(fieldKey, ...)`

Flow (unchanged from G-9g4a1 / G-9g4a2a):

```txt
getSingleTextFieldOperationalConfig(fieldKey)
assert armed + host gate + not dry-run
assert preview identity + not consumed + target match
buildSingleTextFieldPayload(fieldName, raw)
assertSingleTextFieldPayloadOnly
assert writable row + site_slug scope
buildScheduleLockedWriteRequest(expectedBeforeUpdatedAt)
updateScheduleWrite via anon staging client (no service_role)
record re-click success
```

---

## 11. Verifier strategy

### 11.1 Planning verifier (this phase)

`verify-g9g4a2-single-text-field-operational-commonization-planning.mjs` — doc presence, gates, policies, next phase.

### 11.2 Implementation verifiers (next phase)

| Verifier | Scope |
| --- | --- |
| Registry static | uniqueness, approval IDs registered, env arm constants exported |
| Guard static | factory rejects multi-key payload, forbidden fields, empty string |
| Config static | mutual exclusion lists include all registry env arms |
| Parity (optional) | G-9g4a2a open_time path behavior unchanged after delegate |
| UI id static | template references match registry uiIdPrefix |

### 11.3 What verifiers do **not** do

- No live DB writes
- No browser Preview / Save clicks
- No modification of production implementation behavior beyond static string checks

---

## 12. Manual test reduction policy

| Scenario | Manual non-dry-run round-trip |
| --- | --- |
| G-9g4a1 venue-only | **Done** — do not repeat |
| G-9g4a2a open_time-only | **Done** — do not repeat |
| Framework implementation (new common logic) | **At most one** optional smoke + restore on **one** field to prove generic executor — operator manual only |
| `start_time` config-only enablement | **No** dedicated round-trip — dry-run Preview + static verifiers |
| `price` config-only enablement | **No** dedicated round-trip — dry-run Preview + static verifiers |
| Regression of `open_time` after delegate | Dry-run + parity verifier — **no** Save unless parity fails |

**Explicitly rejected:** G-9g4a2a3 / G-9g4a2a4 / G-9g4a2a5 style per-field execution chains.

---

## 13. Restore policy

| Rule | Detail |
| --- | --- |
| Restore path | Same single-text-field UI for that `fieldName` — **not** G-9g3g5 |
| Smoke markers | Execution docs only; suffix per `phasePrefix` |
| After framework lands | No standing restore exceptions expected for `start_time` / `price` |
| Emergency rollback | Document-only SQL in preflight docs — Cursor/AI never executes |
| Current row state | `markerRemainsInStagingDb: false`; `activeRestoreExceptionsCount: 0` |

---

## 14. Optimistic lock policy

**Reuse unchanged:**

```txt
expectedBeforeUpdatedAt from loaded row at Preview
stale check blocks Save enablement
Save passes lock baseline via buildScheduleLockedWriteRequest
re-run Preview required when updated_at changes
```

Framework does not alter lock semantics.

---

## 15. Re-click prevention policy

**Reuse** `staging-schedule-site-slug-operational-save-reclick.ts`:

- Extend `OperationalSaveMode` with registry `reclickMode` values (`start-time-only`, `price-only`)
- One Save per preview identity
- After success: Preview consumed message; Save disabled
- `G9G3H1_PREVIEW_CONSUMED_MSG` unchanged

---

## 16. Mutual exclusion policy

When **any** registry field env arm is `true`:

```txt
all other registry field arms: off
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED: off
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED: off
G-6 / G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC arms: off
```

Generic config evaluator iterates `SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY` for peer arm checks.

---

## 17. Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset (implementation phase)
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset (implementation phase)
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- Staging host only: `kmjqppxjdnwwrtaeqjta.supabase.co`
- Production blocked: `vsbvndwuajjhnzpohghh.supabase.co`
- Route: `/__admin-staging-shell/musician-basic/#schedule`
- Do **not** write arms to `.env` / `.env.local`

---

## 18. Forbidden operations (this phase)

| Operation | Status |
| --- | --- |
| Implementation / source changes | **no** |
| Cursor/AI row picker click | **no** |
| Cursor/AI Preview click | **no** |
| Cursor/AI Save click | **no** |
| DB write / SQL mutation | **no** |
| Rollback / restore execution | **no** |
| FTP / workflow_dispatch / deploy | **no** |
| service_role | **no** |
| `/admin` / production | **no** |

---

## 19. Implementation phase outline (not executed here)

**Phase:** `G-9g4a2-framework-single-text-field-operational-commonization-implementation`

Suggested order:

```txt
1. Registry + types + constants (3 fields)
2. Parameterized guards + buildPayload factory
3. Generic config evaluator + mutual exclusion
4. Generic Save executor
5. Generic UI gate module + Astro template wiring
6. Delegate G-9g4a2a open_time to registry (parity verifier)
7. Enable start_time + price in registry (arms off by default)
8. Static verifiers — no manual non-dry-run unless operator approves optional framework smoke
```

**Not in implementation v1:** venue merge, title slice, multi-field Save, `/admin` connection.

---

## 20. Recommended next phase

**`G-9g4a2-framework-single-text-field-operational-commonization-implementation`**

Implementation only — registry, shared modules, G-9g4a2a delegate, static verifiers. **Not** `start_time`-only manual execution as the next slice.

Optional sub-phases (implementation doc will detail):

```txt
G-9g4a2-framework-...-implementation
  → G-9g4a2-framework-...-implementation-verification (static verifiers pass)
  → (optional) G-9g4a2-framework-...-manual-smoke-once (operator approval only)
```
