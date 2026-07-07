# G-23c — Static-to-Astro onboarding config validator result

**Phase:** `G-23c-static-to-astro-onboarding-config-validator`  
**Status:** **complete** — local validator + verifier only; **no crawl / DB write / package / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `9b43d55`  
**Prior:** [static-to-astro-onboarding-config-schema-planning.md](./static-to-astro-onboarding-config-schema-planning.md) (G-23b)

| Artifact | Path |
| --- | --- |
| Validator | `scripts/validate-onboarding-config.mjs` |
| Gosaki sample (PASS target) | `config/onboarding.gosaki-piano.example.json` |
| Schema draft (NOT validation target) | `config/onboarding.schema.example.json` |
| Verifier | `scripts/verify-g23c-static-to-astro-onboarding-config-validator.mjs` |

| Check | Status |
| --- | --- |
| Validator implemented | **yes** |
| Gosaki example PASS | **yes** |
| Bad config FAIL cases | **yes** |
| Safety gates enforced | **yes** |
| Production ref guard | **yes** |
| Crawl / DB / package / FTP | **not executed** |

---

## Gates

```txt
staticToAstroOnboardingConfigValidatorComplete: true
phase: G-23c-static-to-astro-onboarding-config-validator
readyForG23dSampleSiteDryRunFixtureOnly: true
readyForG23eOnboardingOrchestratorPlanning: true
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
crawlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
productionDeployExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase staging:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh` as an active target.

**G-23c = local validator only.** No network, no DB, no package regen, no FTP.

---

## 1. Purpose

G-23b で設計した onboarding config JSON を、パイプライン実行前にローカルで検証する。

| Goal | How |
| --- | --- |
| 危険な設定の早期検出 | safety gates · FTP · production ref · secrets |
| 30分フロー前のゲート | INTAKE (0–3 min) で config を PASS してから次工程へ |
| オペレーター可読 | 人間向けエラー一覧 + `--json` 機械可読 |

---

## 2. Validator target

| File | Role |
| --- | --- |
| `config/onboarding.gosaki-piano.example.json` | **PASS** — executable onboarding config example |
| `config/onboarding.schema.example.json` | **NOT a validation target** — JSON Schema 構造説明用。必須フィールドを持たないため validator は **FAIL**（意図どおり） |
| Operator-created `*.onboarding.json` | Future pipeline input |

---

## 3. Run commands

```bash
# Human-readable
node tools/static-to-astro/scripts/validate-onboarding-config.mjs \
  tools/static-to-astro/config/onboarding.gosaki-piano.example.json

# Machine-readable
node tools/static-to-astro/scripts/validate-onboarding-config.mjs \
  tools/static-to-astro/config/onboarding.gosaki-piano.example.json \
  --json

# Phase verifier
node tools/static-to-astro/scripts/verify-g23c-static-to-astro-onboarding-config-validator.mjs
```

---

## 4. PASS conditions

All of the following:

| # | Check |
| --- | --- |
| 1 | Valid JSON object |
| 2 | Required top-level / nested fields present |
| 3 | `siteSlug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` |
| 4 | `sourceUrl` / `stagingDomain` are valid `http:` or `https:` URLs |
| 5 | `sourcePlatform` · `siteType` · `cmsPreset` in allowed enums |
| 6 | `cms.modules[]` structure valid (required fields per module) |
| 7 | `safetyGates` complete with safe defaults (see §7) |
| 8 | `ftp.enabled === false` · `ftp.autoApply === false` |
| 9 | `supabase.environment === "staging"` |
| 10 | `supabase.forbiddenProjectRefs` includes `vsbvndwuajjhnzpohghh` |
| 11 | `supabase.projectRef` is **not** production ref |
| 12 | No `service_role` keys · no secret/token-like values in config |
| 13 | `output.astroOut` · `staticPublicOut` · `manualUploadOut` · `reportsOut` resolve under `tools/static-to-astro/output/` |

---

## 5. FAIL conditions

Validator returns **FAIL** when any of:

| Category | Examples |
| --- | --- |
| Parse | Invalid JSON syntax |
| Required fields | Missing `siteSlug`, `safetyGates`, `cms.modules`, etc. |
| Format | Bad `siteSlug`, bad `sourceUrl` |
| Enum | Unknown `sourcePlatform` / `cmsPreset` |
| Safety gates | `allowDbWrite=true`, `allowFtpUpload=true`, `forbidServiceRole=false`, etc. |
| FTP | `ftp.enabled=true` or `autoApply=true` |
| Production ref | `projectRef=vsbvndwuajjhnzpohghh` or prod ref outside `forbiddenProjectRefs` |
| Secrets | JWT-like values, `service_role` key, password/token fields with values |
| Output paths | Artifact paths outside `tools/static-to-astro/output/` |

---

## 6. Gosaki example config validation result

```bash
node tools/static-to-astro/scripts/validate-onboarding-config.mjs \
  tools/static-to-astro/config/onboarding.gosaki-piano.example.json
```

**Result: PASS**

| Field | Value |
| --- | --- |
| `siteSlug` | `gosaki-piano` |
| `sourcePlatform` | `wix` |
| `cmsPreset` | `musician-basic` |
| `schedule.enabled` | **true** |
| `supabase.projectRef` | `kmjqppxjdnwwrtaeqjta` (staging — allowed) |
| `safetyGates.allowDbWrite` | `false` |
| `ftp.enabled` | `false` |

---

## 7. Safety gates validation

Required safe defaults enforced:

| Gate | Required value |
| --- | --- |
| `allowDbWrite` | `false` |
| `allowPackageBuild` | `false` |
| `allowFtpUpload` | `false` |
| `allowProductionDeploy` | `false` |
| `forbidMirrorDelete` | `true` |
| `forbidServiceRole` | `true` |
| `manualCommitPush` | `true` |
| `stagingOnly` | `true` |

---

## 8. Production ref contamination prevention

| Rule | Behavior |
| --- | --- |
| Staging ref `kmjqppxjdnwwrtaeqjta` | **Allowed** as `supabase.projectRef` |
| Production ref `vsbvndwuajjhnzpohghh` | **Required** in `forbiddenProjectRefs` |
| Production ref as active target | **FAIL** — e.g. `projectRef=vsbvndwuajjhnzpohghh` |

---

## 9. service_role contamination prevention

- Config tree must not contain keys matching `service_role` / `serviceRole`
- Validator does not use `service_role` at runtime

---

## 10. Secrets / token contamination prevention

Blocked patterns:

- Secret-like key names (`password`, `secret`, `token`, `apiKey`, `anonKey`, …) with non-empty string values
- JWT-like strings (`eyJ...`)
- Inline API keys in config file (secrets belong in env, not JSON)

---

## 11. Operations NOT executed (G-23c)

| Item | Status |
| --- | --- |
| DB write / SQL mutation | **no** |
| Save click | **no** |
| Crawl | **no** |
| Package regen | **no** |
| FTP / upload / deploy | **no** |
| `workflow_dispatch` | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| Network connections | **no** |
| dev server | **not started** |

---

## 12. Bad config verification (verifier-generated)

Temporary configs derived from Gosaki example — all **FAIL** as expected:

| Case | Trigger |
| --- | --- |
| `allowFtpUpload=true` | safety gate violation |
| `allowProductionDeploy=true` | safety gate violation |
| `forbidServiceRole=false` | safety gate violation |
| `forbiddenProjectRefs=[]` | missing production ref in deny list |
| `sourceUrl=not-a-valid-url` | URL format |
| `siteSlug=INVALID SLUG!` | slug pattern |
| missing `siteSlug` | required field |
| JSON parse error | `{ not json` |
| `projectRef=vsbvndwuajjhnzpohghh` | production ref as active target |
| `service_role` key in config | forbidden key |

---

## 13. Recommended next phases

| Phase | Scope |
| --- | --- |
| **G-23d** | Sample site dry-run (fixture-only, no live crawl) |
| **G-23e** | Onboarding orchestrator planning |
| **G-23f** | CMS preset registry implementation |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23c-static-to-astro-onboarding-config-validator.mjs
```

Expected: all checks PASS · port 4321 LISTEN none.
