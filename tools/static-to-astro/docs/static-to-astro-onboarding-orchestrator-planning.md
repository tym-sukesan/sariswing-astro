# G-23e — Static-to-Astro onboarding orchestrator planning

**Phase:** `G-23e-static-to-astro-onboarding-orchestrator-planning`  
**Status:** **complete** — orchestrator design only; **no implementation / live crawl / DB / package / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `72951ee`  
**Prior:** [static-to-astro-onboarding-sample-site-dry-run-result.md](./static-to-astro-onboarding-sample-site-dry-run-result.md) (G-23d) · [static-to-astro-30-minute-onboarding-flow-planning.md](./static-to-astro-30-minute-onboarding-flow-planning.md) (G-23a)

| Check | Status |
| --- | --- |
| Orchestrator purpose defined | **yes** |
| CLI modes planned | **yes** |
| Step design (0–9) | **yes** |
| Safety gate matrix | **yes** |
| Failure policy | **yes** |
| Output report design | **yes** |
| 30-min flow mapping | **yes** |
| G-23d relationship documented | **yes** |
| Implementation / crawl / deploy | **not executed** |

---

## Gates

```txt
staticToAstroOnboardingOrchestratorPlanningComplete: true
phase: G-23e-static-to-astro-onboarding-orchestrator-planning
readyForG23fCmsPresetRegistryImplementation: true
readyForG23gSeedExtractorStandardization: true
readyForG23hOrchestratorSkeletonImplementation: false
orchestratorImplementationExecuted: false
liveCrawlExecuted: false
networkAccess: false
dbConnectionAttempted: false
dbWriteExecuted: false
packageBuildExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
productionDeployExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
```

**Supabase staging:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh` as an active target.

**G-23e = planning only.** No orchestrator implementation, no live crawl, no DB write, no package regen, no FTP.

---

## 1. Orchestrator purpose

The **onboarding orchestrator** is the future single entry point that coordinates the entire 30-minute site-build pipeline from one onboarding config.

| Goal | How orchestrator achieves it |
| --- | --- |
| **Unify G-23 parts** | config schema · validator · crawl · classifier · seed extractor · package · diff report |
| **Stage-gated execution** | each step checks safety gates before proceeding |
| **Fail-fast** | validation / forbidden ref / secret detection → stop immediately |
| **Human-in-the-loop** | destructive steps require explicit approval IDs and gate flips |
| **CLI + UI ready** | same step engine callable from terminal or future web UI |

### Existing building blocks (G-23a–G-23d)

| Component | Artifact | Role in orchestrator |
| --- | --- | --- |
| 30-min flow | G-23a planning doc | Timeline + success criteria |
| Config schema | G-23b `onboarding.schema.example.json` | Input contract |
| Config validator | G-23c `validate-onboarding-config.mjs` | Step 0 gate |
| Sample config | G-23d `onboarding.sample-musician-fixture.example.json` | Fixture mode input |
| Fixture dry-run | G-23d `run-onboarding-fixture-dry-run.mjs` | Prototype for fixture mode |
| URL-to-staging pipeline | G-7b `url-to-staging-pipeline.mjs` | Partial predecessor (crawl/convert/build) |

### Orchestrator responsibilities

1. Load and validate onboarding config
2. Select execution mode (`fixture-dry-run`, `full-dry-run`, etc.)
3. Run steps 0–9 in order; skip or plan-only when gates block writes
4. Emit unified report (human + `--json`)
5. Never bypass safety gates or approval IDs

---

## 2. Planned CLI (not implemented in G-23e)

**Future script:** `tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs`

### Example invocation

```bash
node tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs \
  --config tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json \
  --mode fixture-dry-run
```

### Planned modes

| Mode | Network | DB write | Package | FTP | Description |
| --- | --- | --- | --- | --- | --- |
| `validate-only` | no | no | no | no | Config validation only (G-23c) |
| `fixture-dry-run` | no | no | no | no | Fixture crawl + classify + seed plan (G-23d scope) |
| `crawl-dry-run` | yes* | no | no | no | Live crawl to fixture; operator approval required |
| `seed-dry-run` | no | no | no | no | Extract seed candidates; no INSERT |
| `package-dry-run` | no | no | plan | no | Regen plan + diff scope; no build unless gate |
| `full-dry-run` | mode-dependent | no | plan | no | All steps through handoff report |
| `apply-staging-db` | yes* | yes* | no | no | Seed INSERT — separate approval ID + gate |
| `prepare-upload-plan` | no | no | plan | plan | Upload file list + diff review checklist |

\* Requires explicit operator approval and env/gate arming — never default in onboarding.

### Common flags (planned)

| Flag | Purpose |
| --- | --- |
| `--config <path>` | Onboarding config JSON (required) |
| `--mode <mode>` | Execution mode |
| `--fixture <path>` | Fixture crawl result (for fixture-dry-run) |
| `--json` | Machine-readable report |
| `--stop-on-warn` | Treat WARN as stop (optional strict mode) |
| `--approval-id <id>` | Required for destructive modes |

---

## 3. Step design (Steps 0–9)

Each step returns `{ status: PASS | WARN | FAIL | SKIP, summary, artifacts }`. **FAIL → orchestrator stops.**

### Step 0 — Load & validate config

| Action | Module |
| --- | --- |
| Parse onboarding config JSON | orchestrator |
| Run `validateOnboardingConfig` | G-23c validator |
| Verify safety gates present and safe defaults | G-23c validator |
| Check `forbiddenProjectRefs` includes production ref | G-23c validator |
| Reject `service_role` / secrets in config | G-23c validator |

**Gate:** FAIL on any validation error → **stop**.

### Step 1 — Intake summary

| Output | Source |
| --- | --- |
| `siteSlug`, `cmsPreset`, `sourceUrl`, `sourcePlatform` | config identity |
| Enabled CMS modules list | `config.cms.modules[]` |
| Output path candidates (resolved, not created) | `config.output.*` |
| Staging domain / deploy base | config |

**Gate:** WARN if `siteSlug` mismatch with fixture (fixture mode).

### Step 2 — Crawl source selection

| Mode | Behavior |
| --- | --- |
| `fixture-dry-run` | Load `--fixture` JSON; `fixtureOnly: true` required |
| `crawl-dry-run` / live | Future: `crawl-static-site.mjs` — **not in G-23e** |
| `validate-only` | SKIP |

**G-23e rule:** **no live crawl.** Fixture path only in planning.

### Step 3 — Page classifier

| Input | Output |
| --- | --- |
| Crawl pages or fixture pages | `home` · `profile` · `schedule` · `news` · `discography` · `video` · `contact` · `other` |

Reuse logic from G-23d `buildPageClassification`.

### Step 4 — CMS module planner

| Check | Result |
| --- | --- |
| Enabled module ↔ detected page route | PASS / WARN |
| Enabled module with no page | **WARN** (e.g. news without `/news/`) |
| Detected page with no enabled module | WARN |
| Unsupported module for preset | **FAIL** or WARN per registry (G-23f) |

### Step 5 — Seed extractor plan

| Module | Plan output (no DB write) |
| --- | --- |
| schedule | candidate rows + count |
| news | candidate items + count |
| profile | bio/headline block |
| discography | release candidates |
| video | embed candidates |
| contact | static form metadata |

**Gate:** `allowDbWrite=false` → plan only; no SQL.

### Step 6 — Staging DB plan

| `allowDbWrite` | Behavior |
| --- | --- |
| `false` (default) | Plan only: target ref, table list, row counts, rollback template reference |
| `true` | Future: requires `approvals.dbWriteApprovalId` + operator explicit approval — **separate phase** |

**No DB connection in dry-run modes.**

### Step 7 — Package plan

| `allowPackageBuild` | Behavior |
| --- | --- |
| `false` (default) | Plan only: `astroOut`, `staticPublicOut`, `manualUploadOut` paths; estimated file scope |
| `true` | Future: invoke `build-*-staging-admin-package.mjs` — separate approval |

### Step 8 — Diff / QA report

| Output | When |
| --- | --- |
| Local vs staging diff scope | `requireOutputDiffReview=true` |
| Upload candidate file list | `requireUploadFileList=true` |
| Human review checklist | always in dry-run |
| `safeForStaticFtp` style checks | package-dry-run+ only |

**Gate:** `allowFtpUpload=false` → upload candidates listed only; no FTP.

### Step 9 — Handoff / release note

| Output | Content |
| --- | --- |
| Executive summary | PASS/WARN/FAIL per step |
| Next recommended command | e.g. `G-23f` preset registry work |
| Risk summary | unmapped modules, missing seeds, gate blocks |
| Client-facing draft | optional template from G-22j2 pattern |

---

## 4. Safety gate matrix

| Gate | Default | Step impact when false/off | Step impact when true (future) |
| --- | --- | --- | --- |
| `allowDbWrite` | `false` | Step 6 plan only | Step 6 may execute seed INSERT (approval required) |
| `allowPackageBuild` | `false` | Step 7 plan only | Step 7 may run package build |
| `allowFtpUpload` | `false` | Step 8 upload list only | Step 8 may emit FTP preflight (not auto-apply) |
| `allowProductionDeploy` | `false` | production paths blocked | **blocked in onboarding** — never true in v1 |
| `forbidMirrorDelete` | `true` | any `mirror --delete` → **FAIL** | unchanged |
| `forbidServiceRole` | `true` | `service_role` in config/env → **FAIL** | unchanged |
| `requireOutputDiffReview` | `true` | upload plan requires diff section | enforced before upload |
| `requireUploadFileList` | `true` | upload plan must list files | enforced before upload |
| `requireRollbackPlanForDbWrite` | `true` | DB plan must include rollback template | required before apply-staging-db |
| `manualCommitPush` | `true` | orchestrator never git push | operator commits manually |
| `stagingOnly` | `true` | non-staging supabase ref → WARN/FAIL | — |
| `ftp.enabled` | `false` | FTP steps plan-only | future manual upload path only |

---

## 5. Failure policy

| Condition | Action |
| --- | --- |
| Config validation FAIL | **Stop immediately** — exit code 1 |
| Forbidden production ref `vsbvndwuajjhnzpohghh` as active target | **Stop immediately** |
| `service_role` key / token / secret in config | **Stop immediately** |
| Live crawl mode without approval ID | **Stop immediately** |
| `allowDbWrite=false` | DB step **plan only** — never connect/write |
| `allowPackageBuild=false` | Package step **plan only** — no regen |
| `allowFtpUpload=false` | Upload step **candidates only** — no FTP |
| `forbidMirrorDelete=true` and plan includes `--delete` | **FAIL** step |
| Unexpected diff / failed static-public verify | Do not advance to upload plan |
| Step FAIL | Stop; subsequent steps **SKIP** |
| Step WARN | Continue by default; `--stop-on-warn` optional |

### Incident behavior (aligned with G-7f1)

If a destructive step hangs or outcome is unclear: **stop immediately**, do not retry, do not cleanup, ask human.

---

## 6. Output report design

Future orchestrator writes to `output/onboarding-reports/{siteSlug}/` (gitignored).

### Report sections

| # | Section | Source steps |
| --- | --- | --- |
| 1 | **config summary** | Step 0–1 |
| 2 | **validation result** | Step 0 (G-23c) |
| 3 | **safety gates** | Step 0 |
| 4 | **page classification** | Step 3 |
| 5 | **CMS module mapping** | Step 4 |
| 6 | **seed candidate counts** | Step 5 |
| 7 | **output path candidates** | Step 1, 7 |
| 8 | **package plan** | Step 7 |
| 9 | **diff review requirement** | Step 8 |
| 10 | **upload candidate list** | Step 8 |
| 11 | **human review checklist** | Step 8–9 |
| 12 | **next recommended command** | Step 9 |
| 13 | **risk summary** | aggregated WARN/FAIL |

### Formats

| Format | Path pattern |
| --- | --- |
| Human markdown | `onboarding-report-{siteSlug}-{timestamp}.md` |
| Machine JSON | `onboarding-report-{siteSlug}-{timestamp}.json` |
| Handoff snippet | `handoff-{siteSlug}.md` (optional) |

**G-23e:** report templates designed only — no files written.

---

## 7. 30-minute flow mapping (G-23a ↔ orchestrator)

| G-23a window | G-23a step | Orchestrator steps | Mode: fixture-dry-run |
| --- | --- | --- | --- |
| **0–3 min** | INTAKE | Step 0–1 | validate config + intake summary |
| **3–8 min** | CRAWL | Step 2 | load fixture (no network) |
| **8–12 min** | CLASSIFY + LAYOUT | Step 3–4 | page classify + module plan |
| **12–17 min** | CMS EXTRACT | Step 5 | seed extractor plan |
| **17–22 min** | STAGING SETUP | Step 6 | staging DB plan (no connection) |
| **22–26 min** | PACKAGE BUILD | Step 7 | package plan (no build) |
| **26–30 min** | REPORT + HANDOFF | Step 8–9 | diff/QA + handoff report |

---

## 8. Relationship to G-23d fixture dry-run

| Aspect | G-23d today | G-23e orchestrator (future) |
| --- | --- | --- |
| Script | `run-onboarding-fixture-dry-run.mjs` | `run-onboarding-orchestrator.mjs --mode fixture-dry-run` |
| Scope | Steps 0–7 subset in one script | Full step 0–9 framework |
| Validator | inline `validateOnboardingConfig` | Step 0 module call |
| Classification | `buildPageClassification` | Step 3 shared module |
| Report | stdout / `--json` | stdout + optional file report |

### Migration policy

1. **Do not replace G-23d script in G-23e** — keep as working prototype
2. G-23f/G-23g add preset registry + seed extractor interfaces
3. G-23h implements orchestrator skeleton (validate-only + fixture-dry-run modes first)
4. G-23i integrates fixture mode by delegating to or extracting G-23d logic
5. G-23j runs first non-network full dry-run through orchestrator

---

## 9. Recommended next phases

| Phase | Scope | Depends on |
| --- | --- | --- |
| **G-23f** | CMS preset registry implementation | G-23e |
| **G-23g** | Seed extractor standardization | G-23f |
| **G-23h** | Orchestrator skeleton implementation | G-23e, G-23f |
| **G-23i** | Fixture mode orchestrator integration | G-23h, G-23d |
| **G-23j** | First non-network sample full dry-run | G-23i |

---

## 10. Explicitly out of scope (G-23e)

| Item | Status |
| --- | --- |
| Orchestrator script implementation | **deferred** — G-23h |
| Live URL crawl | **forbidden** in G-23e |
| DB connection / write | **forbidden** |
| Package build / regen | **forbidden** |
| FTP / upload / deploy | **forbidden** |
| `workflow_dispatch` | **forbidden** |
| Secrets / env changes | **forbidden** |
| Production deploy | **forbidden** |
| Customer site application | **forbidden** |
| Replacing G-23d script | **not yet** |

---

## 11. Safety (G-23e phase)

| Item | Status |
| --- | --- |
| Orchestrator implementation | **no** |
| Live crawl / network | **no** |
| Save / DB write / SQL mutation | **no** |
| Package regen | **no** |
| FTP / deploy | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| dev server | **not started** |
| commit / push (G-23e) | per operator instruction |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23e-static-to-astro-onboarding-orchestrator-planning.mjs
```
