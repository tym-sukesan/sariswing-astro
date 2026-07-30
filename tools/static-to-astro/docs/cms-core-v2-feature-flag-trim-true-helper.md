# CMS Core v2 — feature-flag trim-true helper

- **Phase:** `cms-core-v2-trim-true-feature-flag-helper`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **SoT:** `scripts/lib/feature-flag-trim-true-utils.mjs` — `isFeatureFlagTrimTrue`
- **Not Save arm:** `isSaveArmExactTrue` (`save-arm-utils.mjs`) remains exact `"true"` (no trim)
- **Package / FTP / DB / Edge / Admin UI:** none (Admin PATH helpers left inline)

---

## Gates

```txt
phase: cms-core-v2-trim-true-feature-flag-helper
CMS_CORE_V2_TRIM_TRUE_FEATURE_FLAG_HELPER_COMPLETE: true
RUNTIME_BEHAVIOR_CHANGED: false
SAVE_ARM_PARSER_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Contract

| Input | `isFeatureFlagTrimTrue` | `isSaveArmExactTrue` |
| --- | --- | --- |
| `"true"` | true | true |
| `" true "` | true | false |
| `undefined` / `null` / `""` / junk | false | false |
| `"True"` / `"TRUE"` | false | false |
| boolean `true` | true (legacy `String` coerce) | false |
| boolean `false` | false | false |

Never throws. Rejecting boolean coerce would be a **future** contract change — not this phase.

---

## Consumers (this phase)

| Module | Flags |
| --- | --- |
| `site-cms-features.mjs` | `CMS_KIT_SITE_EMBEDS_BUILD_READ` · `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` |
| `package-run-marker.mjs` | About `PATH_ENABLED` · `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` (Save UI arm stays exact) |
| `cms-core-v2-youtube-supabase-contract.mjs` | `isExactTrue` → delegates to Core |
| `cms-core-v2-offline-supabase-env-fixture.mjs` | `CMS_CORE_V2_VERIFIER_LIVE_SOFT` |

**Not wired:** Gosaki Admin TS PATH helpers (keep inline trim · no Admin UI change) · historical Save-enabled verify scripts · Edge

---

## Verify

```bash
npm run verify:cms-core-v2-feature-flag-trim-true
npm run verify:cms-core-v2-safety-suite
```
