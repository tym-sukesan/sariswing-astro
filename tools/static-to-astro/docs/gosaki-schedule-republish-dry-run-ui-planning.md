# G-22h2 — Gosaki Schedule republish dry-run module + UI planning

**Phase:** `G-22h2-gosaki-schedule-republish-dry-run-ui-planning`  
**Status:** **complete** — dry-run module / UI / save target panel / approvalId design only; **no implementation / Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `f399add`  
**Prior:** [gosaki-schedule-republish-planning.md](./gosaki-schedule-republish-planning.md) (G-22h1) · G-22f unpublish chain closed · G-22g P0 UX chain closed

| Check | Status |
| --- | --- |
| Dry-run module design | **yes** |
| UI flow design | **yes** |
| Save target panel design | **yes** |
| approvalId / env arm design | **yes** |
| Implementation | **not started** |
| Save / DB write | **not executed** |
| GRANT / REVOKE / RLS | **not changed** |
| package regen / FTP / public reflection | **not executed** |

---

## Gates

```txt
gosakiScheduleRepublishDryRunUiPlanningComplete: true
phase: G-22h2-gosaki-schedule-republish-dry-run-ui-planning
dryRunApprovalId: G-22h-gosaki-schedule-republish-dry-run
nonDryRunApprovalId: G-22h-gosaki-schedule-republish-update-non-dry-run-slice
envArm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED
readyForG22h3RepublishDryRunImplementation: true
implementationExecuted: false
saveExecuted: false
dbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
publicReflectionExecuted: false
ftpUploadExecuted: false
productionApplyExecuted: false
physicalDeleteImplemented: false
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Concrete design for Gosaki Schedule **republish** dry-run module, operator UI flow, save target panel, approvalId registry entries, and verifier scope — **before** G-22h3 implementation.

Republish = `published=false → published=true` UPDATE only (not INSERT, not physical DELETE). Content fields unchanged. Public site reflection is a **separate high-risk gate**.

**This phase:** read G-22f unpublish structure, specify republish mirror design, list implementation candidate files, refine future slices. **No code changes, no Save, no SQL mutation.**

---

## 2. Existing unpublish structure (read-only inventory)

### 2.1 Module map — reuse vs dedicate

| Layer | Unpublish (G-22f — exists) | Republish (G-22h — to implement) |
| --- | --- | --- |
| Dry-run module | `gosaki-schedule-unpublish-dry-run.ts` | **new** `gosaki-schedule-republish-dry-run.ts` |
| Dry-run adapter | `buildScheduleUnpublishDryRunResult()` | **new** `buildScheduleRepublishDryRunResult()` |
| Dry-run types | `ScheduleDryRunOperation` += `"unpublish"` | += `"republish"` |
| Draft mode | `GosakiScheduleEditDraftMode` += `"unpublish"` | += `"republish"` |
| Update config | `gosaki-schedule-unpublish-update-config.ts` | **new** `gosaki-schedule-republish-update-config.ts` (G-22h3 stub; Save disabled until G-22h6) |
| Guards | `gosaki-schedule-unpublish-update-guards.ts` | **new** `gosaki-schedule-republish-update-guards.ts` |
| Save module | `gosaki-schedule-unpublish-update-save.ts` | **new** `gosaki-schedule-republish-update-save.ts` (G-22h3 skeleton disabled; active G-22h6) |
| Write adapter | `updateScheduleWrite()` in `schedule-write-adapter.ts` | **reuse as-is** |
| Optimistic lock | `buildScheduleLockedWriteRequest()` | **reuse as-is** |
| approvalId registry | `schedule-write-types.ts` | **add** G-22h constants + union entry |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` | **extend** — republish draft mode + dry-run render |
| Template | `AdminGosakiStagingScheduleOperatorPage.astro` | **extend** — republish button + banner + procedure card |
| CSS | `admin.css` | **extend** — republish accent classes |
| Verifier (impl) | `verify-g22f-gosaki-schedule-unpublish-dry-run-ui-implementation.mjs` | **new** `verify-g22h3-...` in G-22h3 |

### 2.2 Unpublish patterns to mirror (inverted)

| Pattern | Unpublish | Republish mirror |
| --- | --- | --- |
| Target eligibility | `published === true` | `published === false` |
| Draft builder | `buildGosakiScheduleUnpublishDraft()` | `buildGosakiScheduleRepublishDraft()` |
| Dry-run executor | `executeG22fScheduleUnpublishDryRun()` | `executeG22hScheduleRepublishDryRun()` |
| Target validator | `validateG22fUnpublishDryRunTarget()` | `validateG22hRepublishDryRunTarget()` |
| Payload | `{ published: false }` | `{ published: true }` |
| before / after | `true → false` | `false → true` |
| UI button | `#gosaki-schedule-unpublish-btn` | `#gosaki-schedule-republish-btn` (proposed) |
| Save button label | 「非公開化を保存」 | 「再公開を保存」 |
| Save enabled | G-22f3+ when armed | **G-22h6 only** — disabled in G-22h3 dry-run impl |
| Operation kind | `"unpublish"` | `"republish"` |
| Save operation | `"unpublish-update"` | `"republish-update"` |

### 2.3 Shared UI helpers (reuse unchanged)

| Helper | File | Republish use |
| --- | --- | --- |
| `renderPreviewBadge()` | operator-ui.ts | Shows `actualWrite=false` |
| `renderTargetIdentitySection()` | operator-ui.ts | id / legacy_id / date / title / published before→after |
| `renderPreviewSafetySection()` | operator-ui.ts | operation / dryRun / actualWrite / expectedBeforeUpdatedAt |
| `renderWorkflowStepIndicator()` | operator-ui.ts | 3-step flow |
| `renderOperationProcedureDetail()` | operator-ui.ts | New kind `"republish"` |
| `updateSaveTargetPanel()` | operator-ui.ts | New republish branch |
| Authenticated admin read | G-22g1f | Lists unpublished rows for selection |

### 2.4 approvalId registry (current + proposed)

| ID | Purpose | Phase |
| --- | --- | --- |
| `G-22f-gosaki-schedule-unpublish-dry-run` | unpublish dry-run preview | G-22f (exists) |
| `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice` | unpublish Save | G-22f3 (exists) |
| `G-22h-gosaki-schedule-republish-dry-run` | republish dry-run preview | **G-22h3** |
| `G-22h-gosaki-schedule-republish-update-non-dry-run-slice` | republish Save | **G-22h6** |

Registry location: `src/lib/admin/staging-write/schedule-write-types.ts` (`SCHEDULE_WRITE_APPROVAL_IDS` union).

---

## 3. Republish dry-run module design

**Proposed file:** `src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts`  
**Phase constant:** `G22H_PHASE = "G-22h3-gosaki-schedule-republish-dry-run-ui-implementation"` (implementation phase id; designed here in G-22h2)

### 3.1 Input

```typescript
executeG22hScheduleRepublishDryRun(input: {
  target: ScheduleRecord;           // full row snapshot from admin read
  expectedBeforeUpdatedAt?: string | null;  // optimistic lock baseline (from target.updated_at at draft creation)
  signedIn?: boolean;
  supabaseUrl?: string;
}): G22hScheduleRepublishDryRunResult
```

| Field | Requirement |
| --- | --- |
| `target.id` | Required |
| `target.legacy_id` | Required |
| `target.site_slug` | Must be `gosaki-piano` |
| `target.published` | Must be **`false`** |
| `expectedBeforeUpdatedAt` | When provided, must match `target.updated_at` (stale preview block) |
| `signedIn` | Must be `true` for preview (mirror G-22f) |
| `supabaseUrl` | When provided, must pass staging host gate |

### 3.2 Output shape

```typescript
type G22hScheduleRepublishDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G22H_PHASE;
  approvalId: "G-22h-gosaki-schedule-republish-dry-run";
  operation: "republish";              // dry-run operation id
  saveOperation: "republish-update";    // future Save path operation id
  wouldUpdate: boolean;
  wouldDelete: false;
  wouldWrite: boolean;
  actualWrite: false;
  saveAllowed: false;                  // always false in dry-run module
  physicalDelete: false;
  contentFieldsChanged: false;        // explicit — title/date/etc unchanged
  publicReflectionPending: true;       // static site not updated by this slice
  target: { id; legacy_id; site_slug; title; date };
  before: { published: false };
  after: { published: true };
  expectedBeforeUpdatedAt: string | null;
  payloadKeys: ["published"];
  payload: { published: true };
  validation: { ok; errors; warnings };
  guardErrors: string[];
  message: string;                     // JP operator copy
  rollbackHint: string;
  safety: {
    supabaseWriteCalled: false;
    writeAdapterUsed: false;
    scheduleMonthsTouched: false;
    serviceRoleUsed: false;
    actualWrite: false;
    physicalDelete: false;
  };
  adapterResult: ScheduleDryRunResult; // from buildScheduleRepublishDryRunResult()
};
```

### 3.3 Adapter (`schedule-dry-run-adapter.ts`)

**New function:** `buildScheduleRepublishDryRunResult({ source, approvalId? })`

```txt
module: schedule
operation: republish
targetTable: schedules
targetId: source.id
dryRun: true
wouldWrite: true (when validation ok)
actualWrite: false
payload: { published: true }
beforeSnapshot: full source snapshot (content fields preserved in snapshot)
rollbackHint: "If this were a real republish update, rollback would restore published=false on this row by id. No row was updated in dry-run."
```

Extend `buildScheduleDryRunSelectionError()` operation union to include `"republish"`.

### 3.4 Validation errors

| Error code (message intent) | Condition |
| --- | --- |
| Target missing | No selected row / empty `id` |
| Missing legacy_id | `legacy_id` empty |
| Already published | `target.published !== false` |
| site_slug mismatch | `site_slug !== gosaki-piano` |
| updated_at mismatch | `expectedBeforeUpdatedAt` provided and ≠ `target.updated_at` |
| Staging host mismatch | `assertStaticToAstroCmsStagingSupabaseProject` fails |
| Auth required | `signedIn === false` |
| Non-dry-run arm check (UI gate only) | Save button: env arm missing — surfaced via `evaluateG22hRepublishUpdateUiGate`, not dry-run module |

Dry-run module itself **never** sets `actualWrite=true`.

### 3.5 Draft state

```typescript
type GosakiScheduleRepublishDraftState = {
  mode: "republish";
  targetId: string;
  targetLegacyId: string | null;
  expectedBeforeUpdatedAt: string | null;  // captured at draft creation from source.updated_at
  source: ScheduleRecord;
};

buildGosakiScheduleRepublishDraft(source: ScheduleRecord): GosakiScheduleRepublishDraftState
```

---

## 4. UI flow design

### 4.1 Operator steps

| Step | Action | DB effect |
| --- | --- | --- |
| 0 | Login → admin read loads unpublished rows | none |
| 1 | Filter「非公開のみ」+ optional `legacy_id` keyword | none |
| 2 | Select row (`published=false`) | none |
| 3 | Click **「再公開案を作成」** | none — enters `editDraftMode=republish` |
| 4 | Click **「変更を確認」** | none — runs `executeG22hScheduleRepublishDryRun()` |
| 5 | Review dry-run result + save target panel | none — `actualWrite=false` |
| 6 | **「再公開を保存」** | **disabled until G-22h6** (G-22h3: alert-only stub like early G-22f) |
| 7 | After future Save: refresh list / banner | G-22h6 only |

### 4.2 Button eligibility

| Control | Enabled when | Disabled when |
| --- | --- | --- |
| `#gosaki-schedule-republish-btn` | Row selected + `published=false` + signed in | No selection / `published=true` / wrong site_slug |
| `#gosaki-schedule-unpublish-btn` | Row selected + `published=true` | `published=false` (inverse — unchanged) |
| `#gosaki-schedule-edit-dry-run-btn` | Republish draft active | Other draft modes (mutual exclusion) |
| `#gosaki-schedule-update-btn` (Save) | **G-22h6+** when republish armed + dry-run ok | **G-22h3: always disabled in republish mode** |

### 4.3 Draft mode behavior

```txt
editDraftMode: "republish"
republishDraftState: { targetId, targetLegacyId, expectedBeforeUpdatedAt, source }
republishTargetSnapshot: ScheduleRecord (read-only)
```

- Form fields **read-only** (`setEditFormFieldsReadOnly(true)`)
- Banner: **再公開案** / まだ保存されていません / published を true に戻す予定 / 行は削除しません / **公開サイトへの反映は別フェーズ** / 保存は現在無効（G-22h3）
- Mutually exclusive with `existing` / `duplicate` / `new` / `unpublish` (confirm on switch)
- Switching away clears `lastRepublishDryRunResult`

### 4.4 Workflow step labels (new kind)

```typescript
WORKFLOW_STEP_LABELS.republish = [
  "再公開案を作成",
  "変更を確認",
  "再公開を保存",
];
OPERATION_KIND_LABELS.republish = "公演を再公開する";
```

### 4.5 Procedure hints card (template)

New static card in `AdminGosakiStagingScheduleOperatorPage.astro`:

```html
<article data-gosaki-procedure-hint="republish">
  <h3>再公開</h3>
  <ol>
    <li>非公開行を選ぶ</li>
    <li>「再公開案を作成」</li>
    <li>「変更を確認」→ 保存前プレビュー</li>
    <li>「再公開を保存」（書き込み許可がオンのときのみ — G-22h6以降）</li>
  </ol>
  <p>「再公開案を作成」= 行は削除しません。「再公開を保存」= published を true にします。公開サイトへの反映は別フェーズです。</p>
</article>
```

Dynamic procedure detail (operator-ui.ts) mirrors unpublish pattern with republish copy.

### 4.6 Public reflection notice (required in UI)

Display in dry-run result, save target panel, and republish banner:

```txt
公開サイトへの反映は別フェーズ（静的ページ再生成・アップロード）です。
DB で published=true になっても、次回 public reflection / package / FTP まで公開サイトには表示されません。
```

---

## 5. Save target panel design

**Panel id:** `#gosaki-schedule-save-target-panel` (existing — add republish branch)

When `isRepublishDraftMode() && republishTargetSnapshot`:

| Field | Display |
| --- | --- |
| Workflow steps | `renderWorkflowStepIndicator("republish", step)` |
| Operation header | `公演を再公開する` / `republish` |
| legacy_id | monospace code |
| id | monospace code |
| 日付 | from snapshot |
| タイトル | from snapshot |
| published | `false → true` |
| expectedBeforeUpdatedAt | from draft state (`republishDraftState.expectedBeforeUpdatedAt`) |
| actualWrite | **`false`** (until G-22h6 Save) |
| publicReflectionPending | **`true`** — badge or note row |
| saveEnabled | **`false`** (G-22h3) |
| saveAllowed | **`false`** (dry-run phase) |

Dry-run result panel (`#gosaki-schedule-edit-dry-run-result`) reuses:

- `renderPreviewBadge()` — `actualWrite=false`
- `renderTargetIdentitySection({ publishedBefore: "false", publishedAfter: "true" })`
- `renderPreviewSafetySection({ operation: "republish", dryRun: true, actualWrite: false, wouldUpdate: true, expectedBeforeUpdatedAt })`
- `renderOptimisticLockExplanation()`
- Dev `<details>` block (mirror `renderUnpublishDryRunDevDetails` → `renderRepublishDryRunDevDetails`)

CSS class: `gosaki-schedule-edit-dry-run--republish`

---

## 6. approvalId / env arm design

### 6.1 Dry-run (no env arm required)

| Item | Value |
| --- | --- |
| approvalId | `G-22h-gosaki-schedule-republish-dry-run` |
| Env arm | **none** — dry-run works in routine dev (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`) |
| actualWrite | always `false` |

### 6.2 Non-dry-run Save (G-22h6 — design only here)

| Item | Value |
| --- | --- |
| approvalId | `G-22h-gosaki-schedule-republish-update-non-dry-run-slice` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true` |
| Gate stack | Same class as G-22f unpublish Save |

Required env stack (G-22h6):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_WRITE=true
ENABLE_ADMIN_STAGING_AUTH=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22h-gosaki-schedule-republish-update-non-dry-run-slice
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true
(all other write arms false)
```

### 6.3 Mutual exclusion (all config modules)

When G-22h arm is true, these must be **off**:

- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED`
- G-9k existing-update arm
- G-13c / other schedule write arms

Update **each** existing config's `collectArmFailures` to reject G-22h arm when their arm is evaluated (mirror G-22f ↔ G-22d pattern).

---

## 7. Target candidates

Planning does not fix G-22h6 final target. Dry-run QA may use any `published=false` row.

| Candidate | id | legacy_id | updated_at (baseline) | Dry-run QA | First actual Save (G-22h6) |
| --- | --- | --- | --- | --- | --- |
| **008** | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | `schedule-2026-07-008` | `2026-07-06T13:58:41.425402+00:00` | **yes** | **recommended** — reverses G-22f unpublish; operator approval required |
| **014** | `434e4051-86c3-473e-9ad0-39d2e5042fb8` | `schedule-2026-03-014` | re-fetch before Save | **yes** | Alternative — duplicate test row becomes public-eligible |
| **001** | `18b48259-9a9a-4b00-b136-6c0c4ff3b2f3` | `schedule-2026-09-001` | re-fetch before Save | **yes** | Alternative — new-event test row becomes public-eligible |

**Protected row policy (republish vs unpublish):**

- G-22f **blocked** 014/001 from unpublish (already unpublished).
- Republish **allows** 014/001 as dry-run targets (they are valid `published=false` rows).
- No republish-specific block on 008 (G-22f7 forbids re-unpublish Save, not republish).

---

## 8. Safety gates

| Gate | G-22h2 planning | G-22h3 impl | G-22h4 QA | G-22h6 Save |
| --- | --- | --- | --- | --- |
| published=false only | design | enforce | verify | enforce |
| id + legacy_id + updated_at lock | design | preview | verify | enforce |
| dry-run first | design | enforce | verify | enforce |
| actualWrite=false | **yes** | **yes** | **yes** | false until Save |
| Save once | design | disabled | n/a | operator once |
| optimistic lock | design | display | verify | enforce |
| rollback auto | **never** | **never** | **never** | **never** |
| public reflection | separate gate | note in UI | note in UI | note after Save |
| FTP / package | separate gate | — | — | — |
| RLS / GRANT / service_role | unchanged | unchanged | unchanged | unchanged |

### 8.1 Payload guard (G-22h3 guards module)

```txt
assertG22hRepublishUpdatePayloadOnly:
  allowed keys: published only
  value: published: true
  forbidden: title, date, venue, times, price, description, updated_at in patch
```

### 8.2 Failure handling

| Failure | Behavior |
| --- | --- |
| Already published | Dry-run error — no Save path |
| updated_at stale | Dry-run or Save blocked — re-fetch row |
| Guard errors | Save disabled; show guardReasons |
| Ambiguous write | Stop; record incident; no auto-retry |
| Rollback | Document SQL only — operator manual; **no auto rollback** |

Example rollback SQL template (staging — **not executed in planning**):

```sql
-- Rollback republish on schedule-YYYY-MM-NNN (staging only)
-- UPDATE public.schedules SET published = false
-- WHERE id = '<uuid>' AND site_slug = 'gosaki-piano' AND legacy_id = '<legacy_id>';
```

---

## 9. Implementation candidate files (G-22h3 — not touched in G-22h2)

### 9.1 New files

| File | G-22h3 scope |
| --- | --- |
| `src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts` | Dry-run module |
| `src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts` | Config stub; `saveEnabled=false` |
| `src/lib/admin/staging-write/gosaki-schedule-republish-update-guards.ts` | Payload guards (used by dry-run validation + future Save) |
| `src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts` | Skeleton only; disabled until G-22h6 |

### 9.2 Modified files

| File | Changes |
| --- | --- |
| `src/lib/admin/staging-write/schedule-dry-run-adapter.ts` | `buildScheduleRepublishDryRunResult()` |
| `src/lib/admin/staging-write/schedule-dry-run-types.ts` | `"republish"` operation + draft mode |
| `src/lib/admin/staging-write/schedule-write-types.ts` | G-22h approvalId constants + registry |
| `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` | Republish draft/dry-run/save-target/panel wiring |
| `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` | Button, banner, procedure card |
| `tools/static-to-astro/templates/admin-cms/styles/admin.css` | Republish visual accent |
| `gosaki-schedule-unpublish-update-config.ts` | Add G-22h arm to mutual exclusion |
| `gosaki-schedule-duplicate-insert-config.ts` | Add G-22h arm to mutual exclusion |
| `gosaki-schedule-new-event-insert-config.ts` | Add G-22h arm to mutual exclusion |
| `gosaki-schedule-existing-event-save-button-config.ts` | Add G-22h arm to mutual exclusion |

### 9.3 Verifier / docs (G-22h3)

| File | Phase |
| --- | --- |
| `tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-ui-implementation.md` | G-22h3 |
| `tools/static-to-astro/scripts/verify-g22h3-gosaki-schedule-republish-dry-run-ui-implementation.mjs` | G-22h3 |

### 9.4 Unchanged in G-22h3

| File | Reason |
| --- | --- |
| `schedule-write-adapter.ts` | Reused as-is for G-22h6 Save |
| `schedule-general-update-trigger.ts` | Reused as-is |
| RLS policies | No change |
| `/admin` production routes | Out of scope |

---

## 10. Future implementation slices (refined)

| Phase | Focus | Save / DB | Deliverables |
| --- | --- | --- | --- |
| **G-22h1** | Policy planning | **no** | ✅ `gosaki-schedule-republish-planning.md` |
| **G-22h2** | Dry-run + UI design | **no** | ✅ this doc |
| **G-22h3** | Dry-run module + UI wiring; Save **disabled** | **no** | new modules, template, CSS, impl doc, verifier |
| **G-22h4** | Read-only / dry-run QA | **no** | HTTP 200, HTML markers, module smoke, optional QA runner |
| **G-22h5** | Target selection / preflight | **no** | beforeSnapshot, afterVerification SQL templates, dev arm doc |
| **G-22h6** | Actual republish UPDATE | **yes — once** | enable Save path; operator manual Save |
| **G-22h7** | Result closure | **no** | afterVerification, re-Save forbidden, chain doc |

**Separate tracks (not G-22h):**

- Public reflection planning / execution
- package regen + manual FTP upload (G-7f apply still suspended)
- physical DELETE planning

---

## 11. Safety — this planning phase

| Item | Status |
| --- | --- |
| Implementation files changed | **false** |
| Save executed | **false** |
| DB write | **false** |
| SQL INSERT/UPDATE/DELETE/UPSERT | **false** |
| rollback SQL executed | **false** |
| GRANT / REVOKE | **false** |
| RLS policy change | **false** |
| service_role | **not used** |
| package regen | **false** |
| FTP / upload / deploy | **false** |
| public reflection | **false** |
| production apply | **false** |
| actualWrite | **false** (design only) |

---

## 12. Next phase

**G-22h3** — republish dry-run module + UI implementation (Save disabled by default; no DB write).

Optional parallel: public reflection planning.

---

## 13. Reference docs

| Doc | Phase |
| --- | --- |
| `gosaki-schedule-republish-planning.md` | G-22h1 |
| `gosaki-schedule-unpublish-dry-run-ui-implementation.md` | G-22f pattern |
| `gosaki-schedule-unpublish-update-implementation.md` | G-22f3 Save pattern |
| `gosaki-schedule-p0-ux-summary.md` | G-22g2b operator UX baseline |
| `gosaki-schedule-operator-procedure-hints.md` | G-22g2 hints pattern |
