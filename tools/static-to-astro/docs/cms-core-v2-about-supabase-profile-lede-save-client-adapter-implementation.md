# CMS Core v2 — About Supabase profile.lede Save client adapter implementation

**Phase:** `cms-core-v2-about-supabase-profile-lede-save-client-adapter-implementation`
**Status:** **COMPLETE (local only)** — no arm · no Save · no package · no FTP · no Edge deploy
**Date:** 2026-07-28
**Baseline planning:** [Save roundtrip planning](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.md)
**Verifier:** `scripts/verify-cms-core-v2-about-supabase-save-client-adapter.mjs`

```txt
ABOUT_SUPABASE_PROFILE_LEDE_SAVE_CLIENT_ADAPTER_IMPLEMENTATION_COMPLETE: true
IMPLEMENTATION_EXECUTED: true
readyForAboutSupabaseProfileLedeSaveArmedPackageGenerate: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
DB_WRITE_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
EDGE_DEPLOY_EXECUTED: false
PUBLIC_ABOUT_JSON_SOT: true
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

---

## What changed

| Area | Change |
| --- | --- |
| `sanitizeAboutSupabaseDryRunEndpointDisplay` | New — ok when fingerprint + `before.updatedAt` / `expectedBeforeUpdatedAt`; **no** `currentFileSha` |
| `sanitizeAboutSupabaseSaveEndpointDisplay` | New — ok when `didWrite`+`dbWrite`+`after.valueText`+`after.updatedAt`; **no** `commitSha` |
| Contents sanitizers | **Unchanged** (`sanitizeAboutDryRunEndpointDisplay` / `sanitizeAboutSaveEndpointDisplay`) |
| `evaluateAboutOperationalSaveGate` | Accepts `ABOUT_SUPABASE_SAVE_APPROVAL_ID` **or** G-12a |
| `gosaki-staging-about-operational-edit.ts` | Supabase: dry-run lock via `dryRunExpectedBeforeUpdatedAt`; Save match without fileSha; success overlays lede only |
| `GosakiStagingReadOnlyAdminPage.astro` | Wires supabase sanitizers when `writeBackend=supabase` |
| Error UI | Maps `stale_optimistic_lock` / `update_failed`; raw snake_case still hidden |

---

## dry-run → Save handoff

1. dry-run response → sanitize → `fingerprint` + `expectedBeforeUpdatedAt`
2. Edit stores `dryRunExpectedBeforeUpdatedAt` and stamps `expectedBefore.updatedAt`
3. Save builder sends `expectedBeforeUpdatedAt` + `operation:"save"` + supabase approval ID
4. Stale lock → 409 / `stale_optimistic_lock` → conflict UI (no raw code)

---

## Next

Armed package generate is **allowed as next operator phase** (Save UI env true · remote arm still unset until Save execution).
Do **not** arm remote or click Save without explicit approval.

Order remains: armed package → FTP → arm ON → forward → SELECT → restore → arm OFF → disarm package → FTP.
