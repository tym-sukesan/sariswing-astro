# CMS Kit Schedule editor generalization notes (G-9g3h3)

**Phase:** `G-9g3h3-cms-kit-generalization-notes`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g3h2b row-picker exception lifecycle cleanup — commit `7a4dc0d`  
**Type:** generalization documentation only — **no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs (Gosaki proof chain):

- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md)
- [staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md](./staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md)
- [staging-shell-schedule-site-slug-row-picker-exception-lifecycle-cleanup.md](./staging-shell-schedule-site-slug-row-picker-exception-lifecycle-cleanup.md)
- URL-to-staging pipeline docs (G-7a–G-7e, G-8)

**Audience:** future CMS Kit / Musician CMS Kit sites — not Gosaki-only runbook.

---

## Gates

```txt
cmsKitScheduleEditorGeneralizationNotesComplete: true
gosakiScheduleSafetyRoundTripGeneralized: true
activeRestoreExceptionsCount: 0
markerRemainsInStagingDb: false
readyForG9g4ScheduleEditorUsabilityAndFieldExpansionPlanning: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4-schedule-editor-usability-and-field-expansion-planning`

---

## 1. What was proven in Gosaki (Schedule CMS)

Gosaki (`site_slug: gosaki-piano`) on staging shell `/__admin-staging-shell/musician-basic/#schedule` validated the following end-to-end.

| Capability | Gosaki phase / evidence | Kit takeaway |
| --- | --- | --- |
| Schedule row selection by `site_slug` | G-9f, G-9g3f row picker | Multi-tenant row scope is mandatory |
| Changed-fields-only dry-run Preview | G-9g3g operational path | Minimize write blast radius |
| Optimistic lock (`expectedBeforeUpdatedAt`) | G-9g3g4, G-9g3h1a/c | Stale Save blocked client + server |
| Host gate (staging host only) | G-9g3a, G-9g3f3c | Production host hard-block |
| Approval ID per write scope | `SCHEDULE_WRITE_APPROVAL_IDS` | Phase-scoped write registration |
| Env arm (non-dry-run gated) | `PUBLIC_ADMIN_*_ARMED` | Routine dev stays dry-run |
| Operator manual Save | G-9g3g4, G-9g3h1a/c | **Never** Cursor/AI Save |
| Save success re-click prevention | G-9g3h1 | One Save per preview identity |
| Smoke marker add / restore round-trip | G-9g3h1a → G-9g3h1c | Test write + UI restore without SQL |
| Row-picker audit classification | `[CMS Kit staging]` marker | PoC rows not selectable by default |
| Narrow restore exception | G-9g3h1b1 | Time-boxed escape for restore-only rows |
| Restore exception lifecycle registry | G-9g3h2b | `active` → restore → `completed` |
| Result docs (operator-reported) | G-9g3g4–G-9g3h1c execution results | Source of truth for post-write state |
| Verifier scripts | `verify-g9g3*.mjs`, pipeline verifier | Repo-enforced gates without DB |
| AI handoff docs | `00-current-state`, `03-next-actions`, `handoff-to-chatgpt` | Chat-independent continuity |

**Static site path (Gosaki):** URL crawl → Astro convert → static staging preview (G-7) proved separately; Schedule CMS attaches after seed exists.

---

## 2. Generalized safety architecture

CMS Kit common safety components — reuse on every new artist site.

### Layer A — Environment and host

| Component | Rule |
| --- | --- |
| Staging-only host gate | `PUBLIC_SUPABASE_URL` must match staging project host |
| Production block | Production host → STOP immediately |
| `service_role` | **Forbidden** in Kit write paths |
| `ENABLE_ADMIN_STAGING_WRITE` | `false` in routine dev |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `true` default |
| Non-dry-run arms | all `off` / unset in routine dev |

### Layer B — Write path

| Component | Rule |
| --- | --- |
| Dry-run first | Preview shows `actualWrite=false`, `wouldWrite`, `changedFields` |
| Changed-fields-only payload | Guards assert single-field or declared slice only |
| Optimistic lock | `expectedBeforeUpdatedAt` required on non-dry-run Save |
| Approval ID | Registered in `SCHEDULE_WRITE_APPROVAL_IDS` per phase |
| Env arm | Explicit `PUBLIC_ADMIN_*_ARMED=true` for non-dry-run only |
| Manual operator confirmation | Operator clicks Preview once → Save once |
| One-time Save | Re-click blocked after `rowsAffected=1` |
| Re-click prevention | Consumed `previewIdentity`; fresh Preview required |

### Layer C — Data hygiene and audit

| Component | Rule |
| --- | --- |
| `site_slug` required | Row scope for multi-site staging |
| Audit row classification | Generic `[CMS Kit staging]` → read-only in picker |
| Restore exception registry | `STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY`; only `active` bypasses audit |
| Marker lifecycle | Temporary test markers → restore → `completed` registry entry |
| `schedule_months` | Read-only / derived — no direct Kit writes |
| PoC pilot rows | Hard-coded audit until generalization |

### Layer D — Verification and continuity

| Component | Rule |
| --- | --- |
| Result docs | Preflight → execution result → post-execution hardening |
| Verifier scripts | Phase gates in CI / local `node verify-*.mjs` |
| AI handoff | Update `00-current-state`, `03-next-actions`, `handoff-to-chatgpt` every phase |
| No live DB in doc phases | Operator-reported snapshots; Cursor does not query production |

### Layer E — Deploy separation

| Component | Rule |
| --- | --- |
| CMS write verification | Staging Supabase + staging shell only |
| Static FTP / workflow_dispatch | Separate phase; explicit operator approval |
| Production deploy | Never coupled to CMS Save success |

---

## 3. Reusable pipeline model

Generalized per-site onboarding pipeline:

```txt
URL / source site
  → static crawl
  → static HTML reconstruction
  → Astro conversion
  → content model detection
  → CMS schema mapping
  → seed generation
  → staging Supabase import
  → staging shell editor generation
  → dry-run Preview
  → operator Save
  → smoke marker / restore round-trip
  → verifier
  → production readiness checklist
  → production deploy (separate phase — never auto from CMS Save)
```

**Parallel tracks:**

- **Track A (static preview):** URL → staging static site — client visual sign-off without CMS.
- **Track B (CMS):** seed → staging shell → Schedule editor — content updates after migration.

---

## 4. Per-site time reduction plan

### Already reusable

| Item | Asset |
| --- | --- |
| URL → crawl → convert → build | `url-to-staging-pipeline.mjs`, site config JSON |
| Wix static export CSS baseline | `wix-static-export-baseline-overrides.mjs` |
| Staging shell route | `/__admin-staging-shell/musician-basic/` |
| Schedule write guards | `schedule-write-guards.ts`, approval IDs |
| Row picker + audit + restore registry | G-9g3h2b |
| Re-click prevention | G-9g3h1 |
| Verifier + AI context pattern | `verify-g9*.mjs`, handoff docs |

### Needs template extraction

Per-site crawl config, CSS overrides, band profiles JSON, schedule route conventions, staging shell copy.

### Needs automation (with verifier gates)

Schema extraction, seed SQL generation, smoke/restore runbook stubs, verifier scaffolds.

### Must remain manual approval

First non-dry-run Save, restore Save, staging SQL migration, FTP/production deploy, `workflow_dispatch`, re-arming non-dry-run env.

### Should never be automated

| Item | Why |
| --- | --- |
| Cursor / AI / Playwright Save or Preview click | Operator manual only |
| `service_role` writes | Forbidden |
| Production Supabase writes | Staging Kit scope only |
| FTP `--apply` / `mirror --delete` without approval | G-7f hardening |
| Rollback / restore SQL by Cursor | UI restore preferred |
| `/admin` before explicit product phase | Staging shell only |

### Who decides what

| Category | Actor |
| --- | --- |
| Verifier pass/fail | Script |
| Preview output review | Operator |
| Go/no-go for Save | Operator |
| Go/no-go for deploy | Operator + client |
| Content quality | Client + operator |

---

## 5. Kit defaults (standard for every new site)

| Default | Value |
| --- | --- |
| `site_slug` on schedule rows | **required** |
| First editor | staging shell only |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |
| Non-dry-run arms | all off |
| Preview before Save | **required** |
| Save after success | disabled until fresh Preview |
| Restore exceptions | registry with lifecycle |
| Phase completion | result doc + verifier + AI context |
| PoC audit marker | `[CMS Kit staging]` |
| Production deploy | separated from CMS verification |

---

## 6. Remaining gaps before fast repeatable kit

| Gap | Priority |
| --- | --- |
| Schema extraction automation | high |
| Seed generation automation | high |
| Per-site mapping config | high |
| Field expansion beyond `description` | high |
| Production readiness checklist | high |
| Content type registry | medium |
| Admin UI generator | medium |
| Client-facing simplified editor UX | medium |
| Verifier / runbook generators | low |

---

## 7. Recommended next phase

**Recommended:** `G-9g4-schedule-editor-usability-and-field-expansion-planning`

**Reason:** Gosaki proved description-only Save; clients need venue, date, published, image. Plan field slices with same approval ID + env arm + verifier pattern before template extraction or production checklist.

| Alternative | When |
| --- | --- |
| `G-9g4c-cms-kit-template-extraction-planning` | second site onboarding imminent |
| `G-9g4d-production-readiness-checklist-planning` | before production cutover |

---

## 8. Safety flags (this phase)

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "markerRemainsInStagingDb": false,
  "activeRestoreExceptionsCount": 0
}
```

| Item | G-9g3h3 |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

---

## 9. Quick reference — Gosaki commits (Schedule CMS safety chain)

```txt
G-9g3g4 operational Save success        a58f5f9
G-9g3g5c restore success                ca1f721
G-9g3h1 re-click prevention             8780f84
G-9g3h1a smoke test                     03cbbbe
G-9g3h1c restore success                e6b3ece
G-9g3h1d post-execution hardening     a01fbf4
G-9g3h2b registry lifecycle cleanup     7a4dc0d
G-9g3h3 generalization notes (this)     uncommitted
```
