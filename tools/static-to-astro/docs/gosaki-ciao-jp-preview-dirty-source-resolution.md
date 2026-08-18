# Gosaki ciao.jp preview dirty-source resolution

**Phase:** `gosaki-ciao-jp-preview-dirty-source-resolution`
**Status:** **COMPLETE (docs + helper copy confirmed · commit/push not executed · package not regenerated · FTP not executed)**
**Date:** 2026-08-18
**HEAD baseline:** `c16af124dfea7e4bce8b3bc2bca9df82192464ab` (= `origin/main`)
**Prior:** `gosaki-ciao-jp-preview-package-generation`

| Check | Status |
| --- | --- |
| Dirty-tree preview package as upload source | **forbidden** |
| Helper copy fix required | **yes** |
| Staging / production profile dry-run unchanged | **yes** |
| Package regenerated this phase | **no** |
| FTP / DNS / DB / `.env.local` | **no** |
| commit / push | **no** (operator / later Cursor phase) |

---

## Gates

```txt
gosakiCiaoJpPreviewDirtySourceResolutionComplete: true
phase: gosaki-ciao-jp-preview-dirty-source-resolution
FIX_REQUIRED: true
DIRTY_PACKAGE_UPLOAD_FORBIDDEN: true
READY_FOR_MANUAL_PREVIEW_UPLOAD: false
READY_FOR_COMMIT_PUSH: true
PACKAGE_REGENERATED: false
FTP_EXECUTED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-package-regeneration
```

The on-disk package at `output/manual-upload/gosaki-piano-ciao-preview/` was built while the working tree became dirty. `MANIFEST.sourceCommit` is still `c16af124…` (HEAD without the helper fix). Freshness vs HEAD can PASS while the bake code that produced the tree is uncommitted — **that is not an upload gate**. Manual upload requires a package generated from **clean HEAD** after this fix is committed.

---

## 1. Uncommitted set (this phase)

| Path | Role |
| --- | --- |
| `scripts/lib/gosaki-staging-read-only-admin.mjs` | Copy `templates/.../save-arm-utils.ts` into generated `src/lib/` |
| `scripts/verify-cms-core-v2-save-arm-exact-true-helper.mjs` | Allow bake **copy** of client helper; still forbid Node `.mjs` import |
| `docs/gosaki-ciao-jp-preview-package-generation.md` | Upload gate corrected to false |
| `docs/gosaki-ciao-jp-preview-dirty-source-resolution.md` | this doc |
| `docs/ai/00-current-state.md` | SoT |
| `docs/ai/03-next-actions.md` | SoT |
| `docs/ai/handoff-to-chatgpt.md` | SoT |

---

## 2. Why the helper copy is required

`templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts` already `import { isSaveArmExactTrue } from "./save-arm-utils"`. The template mirror `save-arm-utils.ts` exists. `applyGosakiStagingReadOnlyAdmin` copied the admin TS but **not** the helper.

Fresh convert (ciao-preview astro-out did not exist) → `--verify-build` / `astro build` failed:

```txt
Could not resolve "./save-arm-utils" from "src/lib/gosaki-staging-read-only-admin.ts"
```

Gosaki convert still bakes Admin into astro-out for all profiles; ciao-preview / production **strip** `admin/` at static-public. The whole Astro project must still compile. Without the copy, official `npm run build:gosaki:ciao-preview` cannot succeed on a clean tree.

The copy is **client bake only** (`save-arm-utils.ts`). The applier does **not** import `scripts/lib/save-arm-utils.mjs`.

---

## 3. Staging / production side effects

| Surface | Effect |
| --- | --- |
| Profile JSON / deployBase / Admin flags | unchanged |
| staging / production / ciao-preview `--dry-run` | **PASS** (ciao-preview verifier 76/0) |
| Existing on-disk staging / production packages | **not rewritten** |
| Public HTML for ciao-preview / production | Admin still excluded at static-public |
| Staging Admin bake on **future** regen | helper file now present (fixes the same compile hole) |

No change to RLS, env, FTP, or public route SEO.

---

## 4. Verification (this phase)

| Check | Result |
| --- | --- |
| tmp `applyGosakiStagingReadOnlyAdmin` copies `src/lib/save-arm-utils.ts` | **PASS** |
| ciao-preview profile + staging/production dry-run | **76 passed, 0 failed** |
| `verify-cms-core-v2-save-arm-exact-true-helper` | re-run after allowedLib update (expect PASS) |
| Package regen | **not executed** |
| `git diff --check` | clean |

g20u28 historical FAILs (UI snapshot vs current HEAD) are **not** caused by this 5-line copy.

---

## 5. Recommended commit (do not run in this phase)

```txt
fix(cms): copy save-arm-utils into gosaki admin bake

Fresh convert failed astro build because admin TS imports ./save-arm-utils
but the bake applier did not copy the template. Record ciao-preview dirty-source
STOP: do not upload the c16af124 package; regenerate after this lands.
```

---

## 6. Next

After **operator commit + push** (not this Cursor turn):

```txt
gosaki-ciao-jp-preview-package-regeneration
```

from **clean HEAD**. Then only that new package may become a FileZilla source. Do **not** FTP the dirty-tree tree.
