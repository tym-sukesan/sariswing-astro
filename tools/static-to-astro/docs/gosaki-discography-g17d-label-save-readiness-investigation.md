# G-17d — Gosaki Discography label Save readiness investigation (`ready_but_save_disabled`)

**Phase:** `G-17d-gosaki-discography-label-save-readiness-investigation`  
**Status:** **root cause identified — fix applied; Save NOT executed**  
**Date:** 2026-06-29  
**Base commit:** `0fadd54`  
**Prior:** G-17d Save path enablement (`gosaki-discography-g17d-label-save-path-enablement.md`)

---

## Gates

```txt
gosakiDiscographyG17dLabelSaveReadinessInvestigationComplete: true
gosakiDiscographyG17dLabelSaveReadinessFixApplied: true
readyForG17dDiscographyLabelSaveExecution: true
cursorSaveExecuted: false
cursorDbWriteExecuted: false
```

---

## 1. Symptom (operator)

Armed non-dry-run dev stack; dry-run Preview on `discography-004` / `label` twice:

| Field | Expected | Actual |
| --- | --- | --- |
| `ok` | `true` | `true` |
| `wouldWrite` | `true` | `true` |
| `saveReadiness` | `ready_to_save` | **`ready_but_save_disabled`** |
| `saveAllowed` | `true` | **`false`** |
| `guardErrors` | none | none |
| `hostGatePassed` | `true` | `true` |

Payload / changedFields / stale — all correct.

---

## 2. Root cause

**Missing G-17c server→DOM Save page-config bridge** for non-`PUBLIC_` env vars.

G-17d wired generic `executeDiscographyScalarSliceDryRun()` → `getDiscographyScalarSliceSaveConfig(entry)` using **raw `import.meta.env`** in the browser.

Astro/Vite exposes only `PUBLIC_*` vars to client bundles. These **do not** reach client `import.meta.env`:

| Env | Client-visible without bridge? |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN=false` | **yes** |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-17c-…` | **yes** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED=true` | **yes** |
| `G17C_DISCOGRAPHY_SAVE_ENABLED=true` | **no** |
| `ENABLE_ADMIN_STAGING_SHELL=true` | **no** (needs `mergeStagingShellEnv` + server gates) |

`getDiscographyScalarSliceSaveConfig()` computes:

```txt
compileSaveEnabled = env[G17C_DISCOGRAPHY_SAVE_ENABLED] === "true"  → false on client
saveEnabled = compileSaveEnabled && armFailures.length === 0
```

With `compileSaveEnabled === false` (and often `armFailures` for `ENABLE_*`), `saveEnabled` stays **false** → dry-run returns `ready_but_save_disabled`.

**G-15b / G-15d / G-16a** already solved this with per-slice **save-page-config** (SSR reads process env → hidden DOM `data-*` → client `apply*SavePageConfigToEnv`). G-17c was the first registry-native slice and **skipped this bridge** in G-17d implementation.

**Not the cause:** wrong dry-run approvalId, wrong target row, or guard failure (all passed).

---

## 3. Fix (minimal)

| Component | Change |
| --- | --- |
| `gosaki-discography-g17c-label-save-page-config.ts` | **new** — SSR resolve + DOM read + `applyG17cDiscographySavePageConfigToEnv` |
| `gosaki-discography-g17c-label-save-config.ts` | `resolveG17cDiscographyLabelMergedEnv()` merges server gates + G-17c page config |
| `discography-scalar-field-dry-run.ts` | `g17c-label` → `getG17cDiscographyLabelSaveConfig()` |
| `discography-scalar-field-save.ts` | `g17c-label` → `getG17cDiscographyLabelSaveConfig()` |
| `gosaki-staging-discography-admin-ui.ts` | G-17c Save gate/config uses G-17c wrappers |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | Inject `#g17c-discography-save-page-config` hidden div |

**Closed chains (G-15b/G-15d/G-16a):** dedicated save executors + existing page-config divs **unchanged**.

---

## 4. Operator re-Preview procedure

1. **Restart dev** after pulling fix (SSR must re-render page config div).
2. Use **same** env stack as before:

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=discography \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-17c-gosaki-discography-existing-release-label-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED=true \
G17C_DISCOGRAPHY_SAVE_ENABLED=true \
npm run dev
```

3. Open `/__admin-staging-shell/musician-basic/admin/discography/`
4. Sign in to staging admin
5. Select **Ja-Jaaaaan!** (`discography-004`)
6. Set **label** → `Mardi Gras JAPAN Records`
7. Click **`変更を確認`** once

### Expected after fix

| Check | Expected |
| --- | --- |
| `saveReadiness` | `ready_to_save` |
| `saveAllowed` | `true` |
| Save button | **enabled** (when signed in) |
| `changedFields` | `label` |
| `payload` | `{"label":"Mardi Gras JAPAN Records"}` |

8. Proceed to **G-17d-execution** — operator Save once (not in this phase).

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-readiness-investigation.mjs
```

---

## 6. Safety

| Operation | Executed? |
| --- | --- |
| Save / DB write | **no** |
| FTP / reflection | **no** |
| `.env` change | **no** |
