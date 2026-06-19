# Gosaki schedule CMS practicalization planning (G-9h)

**Phase:** `G-9h-gosaki-schedule-cms-practicalization-planning`  
**Status:** **complete** (planning only — not committed until operator approves)  
**Date:** 2026-06-19  
**Prior:** G-9g4a2 framework implementation + AI context sync — commits `d66bae7`, `9a1d15d`; post-implementation static verification complete  
**Type:** planning / docs only — **no implementation, no DB write, no FTP, no Preview/Save by Cursor**

| Check | Status |
| --- | --- |
| Row picker clicked (Cursor/AI) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `/admin` modified | **no** |

Prior docs:

- [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) (G-9a)
- [gosaki-preview-review-and-next-implementation-planning.md](./gosaki-preview-review-and-next-implementation-planning.md) (G-9d3)
- [gosaki-astro-supabase-schedule-read-with-static-fallback.md](./gosaki-astro-supabase-schedule-read-with-static-fallback.md) (G-9d)
- [staging-shell-schedule-site-slug-read-binding.md](./staging-shell-schedule-site-slug-read-binding.md) (G-9f)
- [staging-shell-schedule-single-text-field-operational-commonization-implementation.md](./staging-shell-schedule-single-text-field-operational-commonization-implementation.md) (G-9g4a2)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 / G-9g4a1 venue-only / G-9g4a2a open_time-only Save.**

---

## Gates

```txt
gosakiScheduleCmsPracticalizationPlanningComplete: true
readyForG9h1GosakiClientPreviewFeedbackClosure: true
readyForAnyDbWrite: false
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
readyForProductionCutover: false
readyForFtpAutoApply: false
ftpAutoDeployStillDisabled: true
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9h1-gosaki-client-preview-feedback-closure`

---

## 1. Background

### 1.1 Gosaki Piano site migration goal

Migrate **gosaki-piano.com** (Wix) to the Musician CMS Kit: lightweight Astro + Supabase staging shell, operator-driven manual upload to Lolipop preview, eventual client self-service for schedule (and later YouTube embed). Production Sariswing and production Supabase remain untouched.

| Item | Value |
| --- | --- |
| **Staging preview URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Deploy** | Manual upload package only (`output/manual-upload/gosaki-piano/`, gitignored) |
| **FTP auto deploy** | Disabled (G-7f incident — `readyForFtpAutoApply: false`) |
| **site_slug** | `gosaki-piano` |
| **Schedule routes** | Hub `/schedule/`; months `/schedule/YYYY-MM/` (canonical); legacy stubs `/YYYY-MM/` |

### 1.2 Completed foundations (read path)

| Phase | Scope | Status |
| --- | --- | --- |
| **G-9a** | CMS MVP scope (Schedule #1, YouTube #2) | Planning complete |
| **G-9b–G-9c2c** | Wix extractor, 60-row seed, `site_slug=gosaki-piano` on staging DB | Complete (operator manual SQL) |
| **G-9d** | Public Astro convert/build: Supabase anon read + static fallback | Complete |
| **G-9d1–G-9d2** | Manual-upload package + operator live preview QA | Complete |
| **G-9d3** | Preview review + next implementation options | Complete |
| **G-9f** | Staging shell schedule read binding (`site_slug=gosaki-piano`) | Complete |

**Public read modules:** `supabase-schedule-read.mjs`, `gosaki-schedule-data-pages.mjs`, `GosakiScheduleList.astro`.

**Note:** Last G-9d1 package may show `scheduleDataSource=static-fallback` in HTML comments; content aligns with seeded DB. Optional rebuild with staging env can mark `scheduleDataSource=supabase`.

### 1.3 Completed foundations (staging shell write UI)

| Phase | Scope | Status |
| --- | --- | --- |
| **G-9g3f3** | Row picker + site_slug edit binding | Complete |
| **G-9g3g** | Operational general edit (safe fields, picker-driven) | Complete (one manual Save on PoC row — do not re-click) |
| **G-9g4a1** | Venue-only operational slice | Round-trip complete — do not re-execute |
| **G-9g4a2a** | open_time-only operational slice | Round-trip complete — do not re-execute |
| **G-9g4a2** | Single-text-field framework (`open_time` / `start_time` / `price`) | Implementation complete (C1–C4, commit `d66bae7`) |

**Staging shell route:** `/__admin-staging-shell/musician-basic/#schedule` only — **not** `/admin`.

### 1.4 G-9g4a2 framework outcome

- Registry + generic config/guards + generic Save + generic edit UI
- `open_time` delegates preserve existing exports, approvalId, envArm, DOM ids
- `start_time` / `price`: registry/config/save/UI/Astro panels wired; **no** per-field manual non-dry-run round-trip (by policy)
- Verifiers: C1 69 / C2 34 / C3 47 / implementation 43 / G-9g4a2a 83 / planning 39 — all passed at post-implementation sweep
- **`readyForAnyDbWrite: false`** remains in effect

### 1.5 Why practicalization planning now

Technical read + write **foundation** exists, but **client-facing practical use** requires:

1. Client agreement on staging preview quality
2. Public schedule display reliability (Supabase vs fallback clarity)
3. Clear Phase 1 / Phase 2 boundary before opening non-dry-run Save broadly
4. YouTube embed tracked separately (G-9a item 2)

---

## 2. Practicalization candidates

| ID | Candidate | Purpose | DB write | Preview | Save |
| --- | --- | --- | --- | --- | --- |
| **A** | Client preview feedback closure | Client/operator visual QA vs Wix; residual list | No | No | No |
| **B** | Public schedule read UX verification | Confirm hub/month pages match DB; `scheduleDataSource` marker | No | No | No |
| **C** | Public rebuild + manual re-upload | Refresh live staging HTML after convert with env | No | No | No |
| **D** | Schedule CMS practicalization | Connect public display + staging shell edit workflow | Phase 2 only | Phase 2 dry-run | Phase 2 gated |
| **E** | Operator dry-run Preview (start_time/price) | Validate G-9g4a2 panels without Save | No | Operator manual only | No |
| **F** | start_time / price policy | Maintain manual round-trip reduction | No | Optional dry-run | **No** per-field |
| **G** | Top YouTube embed | Home page CMS embed (G-9a #2) | Separate phase | Future | Future |
| **H** | Production cutover planning | gosaki-piano.com migration safety | No | No | No |

### 2.1 Client preview feedback closure (A)

**Goal:** Collect formal client/operator sign-off on staging URL; classify residuals (must-fix / nice-to-have / defer).

**Risks:** Scope creep into full redesign; each CSS fix needs manual re-upload.

**Dependencies:** None.

### 2.2 Public schedule read UX (B + C)

**Goal:** Verify `/schedule/`, `/schedule/YYYY-MM/`, legacy stubs, month event counts (13/10/12/11/14), canonical/og:url, noindex.

**Risks:** Supabase env build regression; fallback path breakage.

**Dependencies:** G-9d stable; 60 rows in staging DB.

### 2.3 Schedule CMS practicalization (D)

**Goal:** Document end-to-end flow: staging shell edit → (future) rebuild → manual re-upload → client sees update.

**Phase 1:** Read + feedback + re-upload planning only.  
**Phase 2:** Write slices with new Gosaki-specific approval IDs; reuse G-9g4a2 framework — **not** per-field round-trips for `start_time`/`price`.

**Risks:** Accidental non-dry-run Save; `/admin` touch; RLS expansion.

### 2.4 Operator dry-run Preview (E)

**Goal:** Optional validation that `start_time` / `price` operational panels produce correct dry-run output on a non-PoC row.

**Policy:** Explicit operator approval only; arms off in routine dev; **no Save**.

### 2.5 start_time / price (F)

**Status:** Framework wired; **do not** repeat per-field manual non-dry-run round-trips.

Manual non-dry-run reserved for **new common logic** proof only (max once, explicit approval).

**NOT next:** `start_time-only manual non-dry-run execution`.

### 2.6 Top YouTube embed (G)

**Goal:** CMS-managed YouTube on home page (`site_embeds` table per G-9a).

**Track:** Parallel to Schedule practicalization — **G-9i-gosaki-youtube-embed-planning**.

Schema migration / INSERT / write UI require separate approval gates.

### 2.7 Production cutover (H)

**Goal:** Document DNS, FTP path, rollback, client sign-off for `gosaki-piano.com`.

**Defer** until preview accepted + CMS read path proven on second convert cycle.

---

## 3. Recommended phase sequence

```txt
1. G-9h1-gosaki-client-preview-feedback-closure
   → Client/operator staging review; residual classification; no DB/write

2. G-9h2-gosaki-public-schedule-read-verification-and-reupload-planning
   → scheduleDataSource verification; manual re-upload checklist; no DB write

3. G-9h3-gosaki-schedule-cms-practicalization-phase-boundary
   → Phase 1 vs Phase 2 doc; write slice roadmap; approval ID policy

4. G-9i-gosaki-youtube-embed-planning
   → site_embeds schema + read integration plan (parallel track)

5. Optional: operator dry-run Preview for start_time/price
   → Explicit approval only; Preview only; no Save
```

**NOT in this sequence:**

- `start_time-only manual non-dry-run execution`
- Opening non-dry-run Save broadly (`readyForAnyDbWrite` stays false until explicit phase)
- Production cutover (H) — far future, separate approval stack

---

## 4. Phase 1 / Phase 2 boundary

### Phase 1 — Read, feedback, display reliability (no DB write)

| Item | Included |
| --- | --- |
| Client preview feedback on staging URL | Yes |
| Operator visual QA (SP menu, discography, schedule months) | Yes |
| Public schedule read UX spot-check | Yes |
| `scheduleDataSource` marker verification | Yes |
| Manual re-upload planning + operator execution (scoped path) | Yes |
| Residual list / priority classification | Yes |
| Staging shell read-only verification (G-9f) | Yes (already done; re-verify if needed) |
| DB INSERT/UPDATE/DELETE | **No** |
| Staging shell Preview / Save | **No** |
| non-dry-run arms ON | **No** |

### Phase 2 — Schedule CMS write practicalization (explicit gates)

| Item | Included |
| --- | --- |
| Staging shell dry-run Preview on picker rows | Operator manual only |
| Limited non-dry-run Save slices | New approval IDs per slice; explicit operator approval |
| G-9g4a2 framework reuse (`open_time` / `start_time` / `price`) | Yes — but **no** per-field manual round-trip for `start_time`/`price` |
| Public rebuild after edit | Operator convert + manual re-upload |
| Re-click G-9g4a1 / G-9g4a2a proven Saves | **No** |
| `readyForAnyDbWrite: true` | Only when dedicated phase doc + operator approval |

**Phase 2 entry conditions (proposed):**

```txt
gosakiClientPreviewFeedbackClosureComplete: true
gosakiPublicScheduleReadVerificationComplete: true
gosakiScheduleCmsPhaseBoundaryDocumented: true
readyForAnyDbWrite: false (until write slice preflight for each slice)
```

---

## 5. YouTube embed positioning

Per [gosaki-cms-scope-and-schedule-youtube-planning.md](./gosaki-cms-scope-and-schedule-youtube-planning.md) (G-9a):

| Priority | Module | MVP |
| --- | --- | --- |
| 1 | Schedule CMS | In practicalization track (this doc) |
| 2 | Top YouTube embed | **Separate track — G-9i** |
| 3 | Bands/Projects | Static JSON continues |

**Recommended YouTube phases:**

```txt
G-9i-gosaki-youtube-embed-planning
  → site_embeds schema migration doc (not executed)
  → URL normalize to youtube-nocookie.com/embed/{id}
  → read integration plan + fallback to Wix static iframe

G-9i1+ (future)
  → operator manual seed INSERT
  → staging shell write UI (dry-run default)
```

**Constraints:**

- No `service_role` (Kit write pattern: anon authenticated + RLS)
- No `/admin` changes
- DB schema / migration / write: **separate approval** from Schedule practicalization
- Can start planning after G-9h1 or in parallel with G-9h3 — **no hard dependency** on Schedule write slices

---

## 6. Safety gates

```txt
readyForAnyDbWrite: false
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
readyForProductionCutover: false
readyForFtpAutoApply: false
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
perFieldManualRoundTripPolicy: do not repeat for start_time/price
manualRoundTripReservedFor: new common logic only
markerRemainsInStagingDb: false (G-9g4a2a closure)
noFurtherSaveOrRestoreNeeded: true (G-9g4a1/G-9g4a2a proven rows)
```

### Routine dev safety (unchanged)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

---

## 7. Prohibited actions (all G-9h sub-phases until explicit approval)

```txt
DB write / SQL mutation (unless dedicated operator-approved slice phase)
Preview / Save by Cursor/AI (operator manual only when explicitly approved)
start_time / price per-field manual non-dry-run Save
G-9g4a2a open_time-only Save re-execution on proven row
G-9g4a1 venue-only Save re-execution on proven row
non-dry-run arms ON in routine dev
service_role
production Supabase project
gosaki-piano.com production host / cutover
/src/pages/admin changes
schedule_months writes
FTP auto-apply / mirror --delete
workflow_dispatch
.env / secrets commit
Playwright auto-click on write buttons
```

---

## 8. Next recommended phase

### G-9h1-gosaki-client-preview-feedback-closure

**Type:** operator/client review + documentation — **no implementation, no DB write, no Preview/Save by Cursor**

| Item | Detail |
| --- | --- |
| **URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Compare** | Wix production `gosaki-piano.com` (reference only — do not deploy there) |
| **Checklist** | Home, About, Discography, Contact, Link, `/schedule/`, each month page, SP menu |
| **Output** | Residual list: must-fix / nice-to-have / defer-to-Phase-2 |
| **DB write** | No |
| **Preview / Save** | No |
| **FTP** | No (unless operator separately approves scoped manual re-upload for CSS fixes) |

**Deliverables (G-9h1):**

1. `gosaki-client-preview-feedback-closure-result.md` (or equivalent)
2. Classified residual list
3. Gate: `gosakiClientPreviewFeedbackClosureComplete: true|false`
4. Recommendation for G-9h2 entry

---

## 9. References

| Doc | Phase |
| --- | --- |
| `gosaki-cms-scope-and-schedule-youtube-planning.md` | G-9a |
| `gosaki-preview-review-and-next-implementation-planning.md` | G-9d3 |
| `gosaki-manual-preview-upload-execution-result.md` | G-9d2 |
| `gosaki-astro-supabase-schedule-read-with-static-fallback.md` | G-9d |
| `staging-shell-schedule-site-slug-read-binding.md` | G-9f |
| `staging-shell-schedule-single-text-field-operational-commonization-implementation.md` | G-9g4a2 |
| `ftp-deploy-root-delete-incident-and-safety-hardening.md` | G-7f |

---

## 10. Planning phase checklist (G-9h)

| Check | Status |
| --- | --- |
| Background documented | Yes |
| Practicalization candidates listed | Yes |
| Recommended sequence G-9h1 → G-9h2 → G-9h3 → G-9i | Yes |
| Phase 1 / Phase 2 boundary defined | Yes |
| YouTube separate track (G-9i) | Yes |
| Safety gates documented | Yes |
| Prohibited actions documented | Yes |
| Next = G-9h1 client feedback closure | Yes |
| NOT next = start_time-only manual execution | Yes |
| DB write / Preview / Save (Cursor) | **no** |
