# Staging shell schedule editor usability and field expansion planning (G-9g4)

**Phase:** `G-9g4-schedule-editor-usability-and-field-expansion-planning`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g3h3 CMS Kit generalization notes — commit `507f4b1`  
**Type:** planning only — **no implementation, no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [cms-kit-schedule-editor-generalization-notes.md](./cms-kit-schedule-editor-generalization-notes.md)
- [staging-shell-schedule-site-slug-operational-general-edit-planning.md](./staging-shell-schedule-site-slug-operational-general-edit-planning.md)
- [staging-shell-schedule-site-slug-general-edit-consolidation-planning.md](./staging-shell-schedule-site-slug-general-edit-consolidation-planning.md)
- [staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md](./staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1a / G-9g3h1c operational Save.**

---

## Gates

```txt
stagingShellScheduleEditorUsabilityAndFieldExpansionPlanningComplete: true
readyForG9g4aScheduleTextFieldsOperationalExpansionPlanning: true
operationalProvenField: description
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a-schedule-text-fields-operational-expansion-planning`

---

## 1. Current proven scope (through G-9g3h3)

### Operational path (content rows — `gosaki-piano`)

| Capability | Status | Evidence |
| --- | --- | --- |
| `site_slug` row picker | **proven** | G-9g3f row picker + G-9f binding |
| `description` operational Save | **proven** | G-9g3g4 execution on row `888c58f2-…` |
| Changed-fields-only Preview | **proven** | G-9g3g operational dry-run |
| Optimistic lock | **proven** | `expectedBeforeUpdatedAt` G-9g3g4 / G-9g3h1 |
| Host gate | **proven** | G-9g3a, G-9g3f3c |
| Approval ID + env arm | **proven** | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| Operator manual Save | **proven** | G-9g3g4, G-9g3h1a/c |
| Re-click prevention | **proven** | G-9g3h1 |
| Restore round-trip | **proven** | G-9g3g5c, G-9g3h1a→G-9g3h1c |
| Row-picker audit classification | **proven** | `[CMS Kit staging]` → audit-only |
| Restore exception registry | **proven** | G-9g3h2b; `activeRestoreExceptionsCount: 0` |

### PoC slice history (pilot row `aa440e29-…` — frozen, do not re-run)

| Phase | Fields | Status |
| --- | --- | --- |
| G-9g2 | `title` | executed — frozen |
| G-9g3b | `venue`, `description` | executed — frozen |
| G-9g3c | `open_time`, `start_time`, `price` | executed — frozen |
| G-9g3d | general multi-field dry-run | planning complete — Save frozen |

**Gap:** PoC proved per-field writes on **pilot row**; operational path proved **`description` only** on **content rows**. Field expansion must bridge PoC guards → operational general edit on selectable rows.

---

## 2. Field inventory

### Low-risk text fields

| Field | Type | In `SITE_SLUG_EDIT_SAFE_FIELDS` | Operational Save proven |
| --- | --- | --- | --- |
| `title` | text | yes | PoC only (G-9g2) |
| `venue` | text | yes | PoC only (G-9g3b) |
| `open_time` | text | yes | PoC only (G-9g3c) |
| `start_time` | text | yes | PoC only (G-9g3c) |
| `price` | text | yes | PoC only (G-9g3c) |
| `description` | text | yes | **operational yes** (G-9g3g4) |

### Structured / date fields

| Field | Type | Notes |
| --- | --- | --- |
| `date` | ISO date | Drives month hub / event card ordering |
| `year` | derived / stored | Must stay consistent with `date` |
| `month` | derived / stored | Gosaki route `/YYYY-MM/` |
| `source_route` | path | Static page URL; crawl-derived |
| `source_file` | path | Legacy static path reference |

### Visibility / publication fields

| Field | Type | Notes |
| --- | --- | --- |
| `published` | boolean | Hides row from public when false |
| `show_on_home` | boolean | Homepage schedule strip |
| `home_order` | integer | Homepage ordering |
| `sort_order` | integer | Within-month ordering |

### Image fields

| Field | Type | Notes |
| --- | --- | --- |
| `image_url` | URL | Event / card image |
| `home_image_url` | URL | Homepage-specific image |

### System fields — not directly editable

| Field | Policy |
| --- | --- |
| `id` | UUID — immutable |
| `legacy_id` | Stable slug key — immutable |
| `site_slug` | Tenant scope — read-only in editor |
| `created_at` | DB default — read-only |
| `updated_at` | Optimistic lock baseline — read-only (DB trigger) |

---

## 3. Field risk matrix

| Field | User importance | Validation | Route / month impact | Public page effect | Homepage effect | Restore complexity | Safe to edit | Recommended phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `description` | high | multiline text | low | body text | low | low (proven) | **now (done)** | G-9g3g4 ✓ |
| `venue` | high | trim; empty→null | low | card venue line | low | low | **now (operational)** | G-9g4a |
| `open_time` | high | time string | low | schedule display | low | low | **now (operational)** | G-9g4a |
| `start_time` | high | time string | low | schedule display | low | low | **now (operational)** | G-9g4a |
| `price` | medium | trim; empty→null | low | price line | low | low | **now (operational)** | G-9g4a |
| `title` | high | non-empty required | medium (SEO/title) | page title, cards | medium | medium | **later (operational)** | G-9g4a (last text slice) |
| `date` | high | ISO date valid | **high** | month page membership | medium | high | **later** | G-9g4b |
| `year` | medium | must match `date` | **high** | derived routing | low | high | **later** (with date) | G-9g4b |
| `month` | medium | `YYYY-MM` | **high** | hub links | low | high | **later** (with date) | G-9g4b |
| `source_route` | medium | path format | **high** | canonical URL | low | high | **later** | G-9g4b |
| `source_file` | low | path | medium | legacy refs | none | medium | **later** | G-9g4b |
| `published` | high | boolean | low | visibility gate | low | medium | **later** | G-9g4c |
| `show_on_home` | medium | boolean | low | none | **high** | medium | **later** | G-9g4c |
| `home_order` | medium | integer | low | none | **high** | medium | **later** | G-9g4c |
| `sort_order` | medium | integer | low | within-month order | low | medium | **later** | G-9g4c |
| `image_url` | medium | URL / storage | low | card image | medium | high (asset) | **later** | G-9g4d |
| `home_image_url` | low | URL / storage | low | none | **high** | high | **later** | G-9g4d |
| `id` | — | — | — | — | — | — | **never** | — |
| `legacy_id` | — | — | **high** | URL stability | — | — | **never** | — |
| `site_slug` | — | — | tenant | multi-site | — | — | **never** (editor) | — |
| `created_at` | — | — | — | — | — | — | **never** | — |
| `updated_at` | — | lock only | — | — | — | — | **never** (direct edit) | — |

---

## 4. Recommended field expansion order

| Order | Phase | Scope | Reason |
| --- | --- | --- | --- |
| 1 | **G-9g4a** | Text fields operational expansion: `venue` → `open_time`+`start_time` → `price` → `title` (one slice per approval ID) | PoC already validated guards per field; lowest blast radius; no route/month change |
| 2 | **G-9g4b** | `date` / `year` / `month` / `source_route` planning | Month hub routing (Gosaki `/YYYY-MM/`); requires consistency rules + static rebuild awareness |
| 3 | **G-9g4c** | `published`, `show_on_home`, `home_order`, `sort_order` | Visibility / homepage — client-facing impact; separate publish workflow later |
| 4 | **G-9g4d** | `image_url`, `home_image_url` | Storage policy, URL validation, optional Supabase Storage (deferred — no Storage writes without approval) |
| 5 | **G-9g4e** | Client-facing editor UX | Hide dev panels; Japanese labels; simplified Save/Preview copy — after field slices stable |

### G-9g4a slice recommendation (first implementation planning)

| Slice | Fields | Rationale |
| --- | --- | --- |
| G-9g4a1 | `venue` only | Single field; G-9g3b PoC guard exists; high client value |
| G-9g4a2 | `open_time` + `start_time` | Pair slice; G-9g3c PoC pattern |
| G-9g4a3 | `price` only | Single field; G-9g3c PoC |
| G-9g4a4 | `title` only | Non-empty validation; SEO sensitivity — last text field |

Each slice: new approval ID, env arm, preflight, implementation, operator execution, result doc, verifier — same pattern as G-9g3g4 / G-9g3h1.

**Recommended next phase:** `G-9g4a-schedule-text-fields-operational-expansion-planning`

---

## 5. UI/UX planning

Goal: staging shell → client-facing CMS for Gosaki and future Kit sites.

### Operator vs client copy

| Surface | Today | Target |
| --- | --- | --- |
| Section headers | Phase IDs (G-9g3g, approval IDs) | Client: 「スケジュールを編集」; dev details in collapsible panel |
| Gate panel | Env arm names, host gate debug | Client: plain 「保存の準備ができていません」+ short reason |
| Preview result JSON | Full dry-run payload | Client: 「変更内容の確認」summary; JSON in developer mode |
| Save button | `#site-slug-edit-g9g3g-operational-save-btn` | Client: 「保存する」; disabled state explained in Japanese |
| PoC audit banner | Visible | Developer mode only (G-9g4e) |

### Layout and interaction

| Item | Plan |
| --- | --- |
| Debug panels | Collapse under `<details>` or `developerMode` flag |
| Dangerous controls | Restore/smoke sections hidden unless `PUBLIC_ADMIN_DEVELOPER_MODE=true` |
| Field labels | Japanese for client (`会場`, `開場`, `開演`, `料金`, `説明`, `タイトル`) |
| Row search/filter | Exists (G-9g3f1); add client-friendly empty states |
| Mobile | Sticky selected-row summary; full-width Save; touch targets ≥44px |
| Validation messages | Inline under field; map guard errors to Japanese |
| Preview / Save / publish | **No publish in editor** — Save = staging DB only; publish = separate deploy phase |
| Success state | Executed-state banner (G-9g3h1) — client copy: 「保存しました。再度保存するには変更後にプレビューを実行してください。」 |

### UX phases

| Phase | Focus |
| --- | --- |
| G-9g4e | Client-facing shell copy + developer mode gate |
| Post-G-9g4 | Field-group UI (group venue/time/price visually) |
| Future | `/admin` productization — not before staging shell field expansion complete |

---

## 6. Safety requirements for future field expansion

Every field slice **must** include:

| Requirement | Detail |
| --- | --- |
| Dry-run Preview first | `actualWrite=false`; operator reads `changedFields` |
| Changed-fields-only payload | Guard asserts slice fields only |
| Optimistic lock | `expectedBeforeUpdatedAt` on Save |
| Fresh Preview required | After success or candidate change (G-9g3h1) |
| Save one-time only | Re-click blocked; `rowsAffected=1` |
| Re-click prevention | Consumed preview identity |
| Restore plan | Preflight + optional marker round-trip for smokes |
| Result doc | Preflight → execution → post-execution if needed |
| Verifier | Phase-specific `verify-g9g4*.mjs` + pipeline update |
| Production deploy separated | CMS Save ≠ FTP / workflow_dispatch |
| `service_role` forbidden | Anon + authenticated session only |
| Staging shell only | Not `/admin` until explicit product phase |
| PoC rows frozen | No re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d Save |
| Non-PoC row only | Operational slices on selectable content rows |
| `schedule_months` | Read-only — no Kit writes |
| Host gate | Staging host only |

---

## 7. CMS Kit generalization impact

| Area | G-9g4 planning impact |
| --- | --- |
| Field slice template | Reusable pattern: approval ID + env arm + guard + preflight + execution doc per slice |
| Per-site config | `SITE_SLUG_EDIT_SAFE_FIELDS` remains source; site config may subset fields |
| Route conventions | G-9g4b must parameterize Gosaki `/YYYY-MM/` vs Sariswing `/schedule/YYYY-MM/` |
| Verifier | Each slice adds pipeline assertions |
| Client UX | G-9g4e strings externalized for i18n / per-site branding |
| Onboarding time | G-9g4a text fields unlock daily editing without date/route risk |
| Storage | G-9g4d deferred — Kit policy: no Storage writes without explicit phase |

---

## 8. Remaining gaps (post-G-9g4 planning)

| Gap | Addressed by |
| --- | --- |
| Operational text fields beyond description | G-9g4a |
| Date/route editing | G-9g4b |
| Publication / homepage flags | G-9g4c |
| Images | G-9g4d |
| Client UX | G-9g4e |
| `schedule_months` derivation on date change | G-9g4b implementation |
| Multi-field operational Save (not slice) | Deferred — slice-only until G-9g4 complete |
| Publish workflow | Future — separate from Save |

---

## 9. Recommended next phase

**Recommended:** `G-9g4a-schedule-text-fields-operational-expansion-planning`

**Reason:**

1. Operational path proven for `description` only — text fields are next lowest risk.
2. PoC guards exist for `venue`, time, `price`, `title` — adapt to operational content rows.
3. No `date` / route change — avoids month hub / static rebuild coupling in first expansion.
4. High client value (venue, times, price) before visibility or images.

| Alternative | When |
| --- | --- |
| G-9g4e client UX | if client preview feedback urgent before more fields |
| G-9g4b date planning | if month-page editing is blocking |

---

## 10. Safety flags (this phase)

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "markerRemainsInStagingDb": false,
  "activeRestoreExceptionsCount": 0
}
```

| Item | G-9g4 |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
