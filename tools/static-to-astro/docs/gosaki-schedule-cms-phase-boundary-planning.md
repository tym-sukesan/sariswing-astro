# G-12d — Gosaki Schedule CMS Phase 1 / Phase 2 boundary planning

**Phase:** `G-12d-gosaki-schedule-cms-phase-boundary-planning`  
**Status:** planning complete  
**Base commit:** `892f86f`  
**Prior:** G-11c8→c15 YouTube chain; G-12b schedule read; G-12c client preview planning  
**Type:** planning / documentation only — **no implementation, no DB write, no FTP**

## Summary

Documents the boundary between **Phase 1** (read, display, feedback — largely complete) and **Phase 2** (gated Schedule CMS writes + rebuild/re-upload). Consolidates G-9h practicalization sequence with post-G-12 state.

**No DB write / Save / FTP / deploy in this phase.**

---

## 1. Phase 1 — completed (or operator-pending)

### 1.1 Public read path ✅

| Item | Status | Reference |
|------|--------|-----------|
| Wix → Astro convert + staging deploy | ✅ | G-7e–G-8g, G-10h5-2a |
| 60-row seed `site_slug=gosaki-piano` | ✅ | G-9b–G-9c2c |
| Supabase anon read + static fallback | ✅ | G-9d |
| Canonical routes `/schedule/YYYY-MM/` | ✅ | G-9c0a/b |
| Live staging `scheduleDataSource=supabase` | ✅ | **G-12b** |
| Event counts 13/10/12/11/14 | ✅ | **G-12b** |
| Legacy stub `/YYYY-MM/` + canonical | ✅ | G-9c0b, **G-12b** |

### 1.2 Staging shell read ✅

| Item | Status | Reference |
|------|--------|-----------|
| `site_slug=gosaki-piano` row binding | ✅ | G-9f |
| Row picker + list UI | ✅ | G-9g3f3 |
| Read-only CMS admin package on staging | ✅ | G-11b |

### 1.3 YouTube (parallel track) ✅

| Item | Status | Reference |
|------|--------|-----------|
| Home YouTube CMS + staging public | ✅ | G-10c→G-11c15 |
| JSON `embedCode` workflow save | ✅ | G-11c10c |

### 1.4 Write foundation (code exists; broad use gated)

| Item | Status | Reference |
|------|--------|-----------|
| G-9g4a2 single-text-field framework | ✅ implemented | `open_time` / `start_time` / `price` |
| G-9k6 existing-event 6-field slices | ✅ **closed** | real Gosaki rows — do not re-Save |
| G-6 staging shell title/time slices | ✅ G-6-g1, G-6-g2 | PoC row — frozen approvals |
| Optimistic lock + `updated_at` trigger | ✅ | G-6-f8, G-6-f10 |

### 1.5 Phase 1 operator-pending ⏳

| Item | Status | Reference |
|------|--------|-----------|
| Client preview feedback collection | **pending** | G-12c checklist |
| Formal client sign-off | **pending** | G-12c-result |
| A-class display fixes from feedback | **pending** | after G-12c-result |

---

## 2. Phase 2 — scope definition

**Goal:** Operator/client can edit schedule on staging shell → rebuild → manual re-upload → public staging reflects change.

**In scope (with per-slice gates):**

- Staging shell dry-run Preview (operator manual)
- Limited non-dry-run Save slices (new approval ID each)
- G-9g4a2 framework reuse for Gosaki `site_slug` rows
- Public convert + manual-upload package + operator FTP (scoped path)
- PoC marker cleanup on rows visible to public (if client requests)

**Out of scope (Phase 2):**

- Production `gosaki-piano.com` cutover
- `/admin` (repo root Sariswing admin)
- `schedule_months` writes
- INSERT / DELETE (new events, logical delete)
- FTP auto-apply / `mirror --delete`
- `service_role`
- Bands/Projects CMS, Discography CMS, Contact HubSpot
- Per-field manual round-trip for `start_time` / `price` (G-9g4a2 policy)

---

## 3. Why DB write / Save does not proceed yet

| Reason | Detail |
|--------|--------|
| **Client feedback not closed** | `gosakiClientPreviewFeedbackClosureComplete: false` — priority/scope unset |
| **Global gate** | `readyForAnyDbWrite: false` until per-slice preflight + explicit approval |
| **Phase boundary** | This doc (`gosakiScheduleCmsPhaseBoundaryDocumented`) completes planning only |
| **Public PoC markers** | July 2026 card shows staging test text — cleanup needs deliberate slice, not ad-hoc Save |
| **Policy** | No broad non-dry-run arms ON in routine dev (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`) |
| **Frozen Saves** | G-9k6, G-6-g1/g2, G-9g4a1, G-9g4a2a — re-click forbidden |

---

## 4. Phase 2 entry conditions

```txt
gosakiPublicScheduleReadVerificationComplete: true     ← G-12b ✅
gosakiScheduleCmsPhaseBoundaryDocumented: true        ← G-12d ✅ (this doc)
gosakiClientPreviewFeedbackClosureComplete: true        ← G-12c-result ⏳
readyForAnyDbWrite: false                               ← per-slice only
readyForFtpAutoApply: false                             ← G-7f1
```

**Per-slice additional requirements:**

1. Dedicated preflight doc (beforeSnapshot / rollback SQL)
2. New `approval_id` registered in allowlist
3. Dry-run Preview PASS before non-dry-run Save
4. Operator explicit approval (project approval form)
5. Staging shell route only: `/__admin-staging-shell/musician-basic/#schedule`
6. Single-arm env (one slice armed at a time)

---

## 5. Next safe write slice candidates

Ordered by **safety first**. Implementation phase names are proposals.

### Tier 0 — No write (recommended first after G-12d)

| ID | Phase (proposed) | Action | Risk | Approval |
|----|------------------|--------|------|----------|
| **W0** | `G-13a-gosaki-schedule-operational-dry-run-preview` | Operator dry-run Preview on G-9g4a2 `start_time` / `price` panels | **None** | Optional operator checklist |

### Tier 1 — Low risk writes

| ID | Phase (proposed) | Fields / scope | Track | Risk | Notes |
|----|------------------|----------------|-------|------|-------|
| **W1** | `G-13b-gosaki-schedule-poc-marker-cleanup-slice` | Fix public-visible PoC text on one July row | Gosaki row | Low | Client may flag in G-12c-result; 1 field or small bundle |
| **W2** | `G-6-g3-schedule-price-non-dry-run-slice` | `price` only on G-6 PoC row | Staging shell G-6 | Low | Deferred since G-7; preflight needed; null→text |
| **W3** | `G-9g4a2-framework-smoke-save` | One framework proof Save (not per-field round-trip) | Gosaki operational | Low | Policy: max once for new common logic |

### Tier 2 — Medium risk (after Tier 1)

| ID | Phase (proposed) | Fields / scope | Track | Risk | Notes |
|----|------------------|----------------|-------|------|-------|
| **W4** | `G-6-g4-schedule-venue-description-slice` | `venue` + `description` | G-6 | Medium | G-6-f6 PoC overlap; new approval ID |
| **W5** | `G-9g4a2-bundled-safe-text-save` | Operational edit via picker (multi safe field) | Gosaki | Medium | Reuse G-9g3g pattern with new approval |

### Tier 3 — Defer

| ID | Scope | Why defer |
|----|-------|-----------|
| **W6** | `published` / `show_on_home` | Visibility impact on public site |
| **W7** | `date` change | Routing / month bucket risk |
| **W8** | INSERT new event | New RLS/grant scope |
| **W9** | DELETE / restore | High rollback complexity |
| **W10** | `start_time-only` per-field manual round-trip | **Forbidden** by G-9g4a2 policy |

### Recommended sequence after G-12c-result

```txt
1. G-12c-result — record client feedback + A/B/C classification
2. G-13a — optional dry-run Preview (no Save)
3. W1 or A-class display fixes (if client lists must-fix items)
4. W2 (G-6-g3) OR W3 (framework smoke) — first explicit write slice
5. Rebuild + manual re-upload — verify public reflection (G-12b pattern)
```

---

## 6. Approval gates (Phase 2)

### Standard non-dry-run approval (per slice)

```txt
承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。
```

Slice-specific `approval_id` must match preflight doc.

### Manual upload (after rebuild)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

### Forbidden without separate approval stack

- production Supabase / Sariswing production
- `service_role`
- FTP `mirror --delete` / remote root delete
- `workflow_dispatch` for deploy
- Re-click frozen PoC Saves (G-9k6, G-6-g1/g2, G-9g4a1, G-9g4a2a)
- `/admin` modifications

---

## 7. Phase 2 — absolutely avoid

| Operation | Why |
|-----------|-----|
| `mirror --delete` on FTP | G-7f incident |
| Upload to server root `/` | Scope escape |
| `schedule_months` INSERT/UPDATE | Derived / read-only |
| Broad `readyForAnyDbWrite: true` globally | Bypasses slice discipline |
| Cursor auto-click Save / Preview | Project safety rules |
| Multiple arms ON simultaneously | Single-arm policy |
| Production `gosaki-piano.com` DNS/FTP | Separate cutover phase |
| RLS policy changes | Out of slice scope |

---

## 8. Routine dev defaults (unchanged)

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
ENABLE_ADMIN_STAGING_WRITE=false (unless explicit test arm)
All *_NON_DRY_RUN_ARMED=false or unset
```

Staging admin: `/__admin-staging-shell/musician-basic/` only.

---

## 9. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleCmsPhaseBoundaryDocumented` | **true** |
| `gosakiPublicScheduleReadVerificationComplete` | **true** |
| `gosakiClientPreviewFeedbackClosureComplete` | **false** |
| `readyForAnyDbWrite` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `productionTouched` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g12d-gosaki-schedule-cms-phase-boundary-planning.mjs
```

---

## 11. Next phases (proposed)

| Order | Phase | Type |
|-------|-------|------|
| 1 | **G-12c-result** | Client feedback recording |
| 2 | **G-13a** | Operational dry-run Preview (optional) |
| 3 | **G-13b** or **G-6-g3** | First gated write slice (after G-12c-result) |

---

## 12. References

- [gosaki-schedule-cms-practicalization-planning.md](./gosaki-schedule-cms-practicalization-planning.md) (G-9h)
- [gosaki-client-preview-feedback-closure-planning.md](./gosaki-client-preview-feedback-closure-planning.md) (G-12c)
- [gosaki-public-schedule-read-verification.md](./gosaki-public-schedule-read-verification.md) (G-12b)
- [schedule-general-edit-next-slice-planning.md](./schedule-general-edit-next-slice-planning.md) (G-6-g2/g3)
- [staging-shell-schedule-single-text-field-operational-commonization-implementation.md](./staging-shell-schedule-single-text-field-operational-commonization-implementation.md) (G-9g4a2)
