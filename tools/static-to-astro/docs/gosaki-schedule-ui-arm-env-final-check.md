# Gosaki Schedule UI arm env final check

- **Phase:** `gosaki-schedule-ui-arm-env-final-check`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `7cc2f724` + 4 uncommitted docs (git-clean STOP)
- **Status:** **READ-ONLY PASS**
- **Rebuild this phase:** **not executed**

**Forbidden this phase (honored):** code change · Secrets · DB write · Edge deploy · FTP · commit · push.

---

## 0. Gates

```txt
SCHEDULE_UI_ARM_ENV_CHECK_RESULT: PASS
CORRECT_ENV: PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED
VALUE: exact "true" (raw === "true")
HARDCODED_PRODUCTION_LOG: Save arms: not set (must remain false)
THAT_LOG_MEANS_UNARMED: false
EXISTING_PACKAGE_INTACT: true
READY_TO_REBUILD: true (after docs commit · git-clean)
REBUILD_EXECUTED: false
```

---

## 1. Exact env name

| Surface | Name | Parse |
| --- | --- | --- |
| Client bake / mutex | **`PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED`** | `isSaveArmExactTrue` → `raw === "true"` only |
| Constant | `G20U45_SCHEDULE_SAVE_UI_ARMED_ENV` | same string |
| Inventory `featureId` | `gosaki-schedule` | mutex id |
| HTML | `data-gosaki-schedule-save-armed` | `"true"` / `"false"` |
| Edge Secret (not this rebuild) | `GOSAKI_SCHEDULE_SAVE_ARMED` | server only |

**`PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` is the correct client flag.** Not `PUBLIC_ADMIN_*`, not `TRUE`, not `" true "`.

---

## 2. Where it is read

| Stage | Reads arm? | What happens |
| --- | --- | --- |
| `createGosakiResolveBuildEnv` | **No** | Production **always** logs `Save arms: not set (must remain false)`. Does **not** inject any Save arm into `buildEnv`. Spreads `...base` (`process.env`) so an operator-set flag **passes through**. |
| git-clean | No | Dirty tree STOP (current 4 docs). |
| mutex `beforeFirstFilesystemWrite` | **Yes** | `isSaveArmExactTrue(env.PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED)` · 0 or 1 armed allowed |
| convert / `astro build` | **Yes** | child env = `{...process.env, ...buildEnv}` |
| template | **Yes** | `isG20u45ScheduleOperationalSaveArmed(import.meta.env)` → `data-gosaki-schedule-save-armed` |

Verifier `verify-gosaki-production-cms-save-completion.mjs` asserts the **source** of the production adapter does not hardcode `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED: "true"`. That is why the adapter log is fixed. Operator env via `process.env` is the intended arm path.

---

## 3. Why this command logged `Save arms: not set`

The line is **unconditional** when `profileName === "production"`:

```js
if (isProductionProfile) {
  console.log("Save arms: not set (must remain false)");
}
```

It does **not** inspect `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED`. A correctly armed production generate will **still** print that line.

Authoritative arm evidence is later:

```txt
[save-arm-mutex] PASS · reason=single_operational_save_arm · armedCount=1 · armedFeatureIds=gosaki-schedule
```

If git-clean STOP happens next (dirty docs), mutex never runs. Current tree is dirty with 4 docs, so that is the likely STOP after the log. Relocate has **not** run.

---

## 4. Mutex armedCount = Schedule

`collectGosakiOperationalClientSaveUiMutexEntries` marks `gosaki-schedule` armed iff `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED === "true"`.

| armedCount | result |
| --- | --- |
| 0 | PASS `no_operational_save_arm` |
| 1 | PASS `single_operational_save_arm` (Schedule only if only that flag is exact true) |
| ≥2 | FAIL |

Do not also set Discography / YouTube / About client arms.

---

## 5. Docs commit then rebuild?

**Yes.** Official generate requires git-clean. Current dirty (before this file):

- `docs/ai/00-current-state.md`
- `docs/ai/03-next-actions.md`
- `docs/ai/handoff-to-chatgpt.md`
- `docs/gosaki-production-build-env-resolution.md`

This check adds more docs. Commit **all pending docs** (the 4 + this review), then rebuild. Do not commit `.env` / secrets.

---

## 6. Existing package integrity

`resolveBuildEnv` log is **before** git-clean, mutex, and stale relocate.

| Check | Result |
| --- | --- |
| `generatedAt` | `2026-09-22T07:25:32.287Z` (unchanged) |
| `sourceCommit` | `b3ad1ebd97ebc85b5893a46ad301372021415788` |
| `fileCount` | **53** |
| Baked Schedule arm | `"false"` |
| New stale from this attempt | **none** |

**EXISTING_PACKAGE_INTACT: true**

---

## 7. Exact safe rebuild command

After docs commit and `git status` clean:

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro

while IFS= read -r line; do
  case "$line" in
    PUBLIC_SUPABASE_URL=*|PUBLIC_SUPABASE_ANON_KEY=*) export "$line" ;;
  esac
done < .env.local

PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true npm run build:gosaki:production
```

Expect **both**:

1. `Save arms: not set (must remain false)` — ignore as production adapter log
2. `[save-arm-mutex] PASS · … armedCount=1 · armedFeatureIds=gosaki-schedule`

Then confirm admin HTML `data-gosaki-schedule-save-armed="true"` and other modules `"false"`.

Do not `source` whole `.env.local`. Do not arm other modules. No FTP `--apply`.
