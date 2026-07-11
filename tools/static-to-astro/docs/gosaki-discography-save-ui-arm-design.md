# G-20u34 — Gosaki Discography Save UI arm design

**Phase:** `G-20u34-gosaki-discography-save-ui-arm-design`  
**Status:** **complete** — Save UI arm gate design only · **Save remains disabled**  
**Date:** 2026-07-11  
**Base commit:** `533595e`  
**Prior:** G-20u33 dry-run endpoint draft · G-20u32 API schema · G-20u31 Save design · G-20u30b STG (`00c8888`)

| Check | Status |
| --- | --- |
| Save UI arm design doc | **yes** (this file) |
| Arm state module | **yes** — `scripts/lib/gosaki-discography-save-ui-arm-design.mjs` |
| Save UI enabled | **no** — buttons remain disabled |
| Discography fetch POST | **not added** |
| Edge Function call | **not added** |
| DB write | **not executed** |
| Production upload | **STOP** (G-20j) |

---

## Gates

```txt
gosakiDiscographySaveUiArmDesignComplete: true
phase: G-20u34-gosaki-discography-save-ui-arm-design
saveEnabled: false
executableSaveAllowed: false
saveButtonDisabled: true
dbWrite: false
networkWrite: false
allowedPhase: designOnly
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
```

---

## 1. Purpose

Define **when and how** the Discography Save UI may be armed in future phases — without enabling Save in G-20u34.

| Goal | G-20u34 |
| --- | --- |
| Gate naming (`PUBLIC_GOSAKI_*`) | **Documented** — env **not added** |
| UI state machine | **Designed** |
| Prerequisite checklist | **Module + doc** |
| Executable Save | **Forbidden** — `executableSaveAllowed: false` always |

---

## 2. Current phase behavior

| Behavior | Value |
| --- | --- |
| Save buttons | **disabled** |
| fetch POST (Discography) | **none** |
| Edge Function call | **none** |
| DB write | **none** |
| Production | **STOP** (G-20j) |
| Env changes | **none** |

Even if future env vars were hypothetically `true`, **G-20u34 module keeps `executableSaveAllowed: false`.**

---

## 3. Proposed PUBLIC_GOSAKI_* gate names

| Env gate | Purpose | Default (future) |
| --- | --- | --- |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | Master arm — show armed UI shell | `false` |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_ENDPOINT_ENABLED` | Allow server dry-run / Save endpoint calls | `false` |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_REQUIRE_DRY_RUN` | Require client + server dry-run before Save | `true` |
| `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_STAGING_ONLY` | Hard block non-staging targets | `true` |

**G-20u34:** these names are **design only** — no `.env` / secrets changes.

---

## 4. Required conditions before Save can ever be enabled

| # | Condition |
| --- | --- |
| 1 | **Staging only** — `site_slug=gosaki-piano` |
| 2 | Edge Function `gosaki-discography-save-dry-run` **deployed and verified** |
| 3 | Operator auth verified (Supabase session JWT) |
| 4 | Valid `approvalId` (registry) |
| 5 | Latest **client dry-run PASS** (G-20u30) |
| 6 | **Server dry-run PASS** — operator reviewed `wouldWrite` |
| 7 | No blocking warnings |
| 8 | `expectedBeforeUpdatedAt` / optimistic lock ready **or** explicitly deferred |
| 9 | Backup / rollback plan ready |
| 10 | One-album controlled Save plan approved (G-20u36) |

---

## 5. UI states

| State | Meaning |
| --- | --- |
| `disabled` | Default — G-20u34 |
| `design-only-armed-preview` | Future: env armed but still gated |
| `server-dry-run-required` | Client dry-run ok · server dry-run pending |
| `approval-required` | Dry-runs ok · approvalId / operator gate pending |
| `blocked` | Unmet required prerequisites |
| `future-executable` | All gates met — **separate phase only** (G-20u36+) |

**G-20u34 resolved state:** always `disabled` or `blocked` / `server-dry-run-required` etc. — never executable.

---

## 6. Button behavior

| Phase | Arm button | Save button |
| --- | --- | --- |
| **G-20u34** | **disabled** | **disabled** |
| Future arm phase | Separate explicit operator action | Still disabled until all gates |
| Future Save phase | Armed indicator | Enabled only after server dry-run + approval |

---

## 7. Safety copy (admin UI)

- **Save disabled**
- **Dry-run only**
- **No DB write**
- **No network write**
- **Production STOP** (G-20j)

Existing G-20u30 badges unchanged in G-20u34 (no admin UI change required).

---

## 8. Rollback / read-back requirements

| Requirement | When |
| --- | --- |
| `backupToken` or backup JSON | Before non-dry-run Save |
| Read-back verify (SELECT) | After Save success |
| Rollback approval | Separate operator form |

Dry-run phase: **no backupToken issued** (G-20u33).

---

## 9. Module API

| Function | Purpose |
| --- | --- |
| `resolveDiscographySaveUiArmState()` | Full arm state — `executableSaveAllowed: false` |
| `buildDiscographySaveUiGateChecklist()` | Prerequisite checklist |
| `validateDiscographySaveUiArmPrerequisites()` | Validation — never enables Save |

---

## 10. Not executed in G-20u34

- Save button enablement
- Discography fetch POST
- Edge Function deploy / call
- DB write / SQL
- Env / secrets changes
- Approval state persistence / localStorage
- Admin UI STG reflection

---

## 11. Next phases

| Phase | Scope |
| --- | --- |
| **G-20u35** | Staging DB write test plan + rollback drill |
| **G-20u36** | First controlled Save — one album |
| **Edge deploy** | Separate operator approval |

---

## 12. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u34-gosaki-discography-save-ui-arm-design
npm run verify:current-active-regression
```
