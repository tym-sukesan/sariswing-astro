# Gosaki production verifier false-fail fix

- **Phase:** `gosaki-production-verifier-false-fail-fix`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `078fa734` (uncommitted; includes prior Save-completion diffs)
- **Status:** **COMPLETE / PASS**

**Forbidden this phase (honored):** DB write · Secrets · Edge deploy · FTP · commit · push · production CMS implementation besides G-20i3 verifier · Save arm stays **false**.

---

## 0. Gates

```txt
VERIFIER_FALSE_FAIL_FIX_RESULT: PASS
G20I3: 113 passed, 0 failed
VERIFY_GOSAKI_PRODUCTION_CMS_SAVE_COMPLETION: 42 passed, 0 failed
BUILD_GOSAKI_PRODUCTION_DRY_RUN: PASS
SAVE_ARM: false
CMS_IMPLEMENTATION_UNCHANGED: true
DB_WRITE_EXECUTED: false
FTP_EXECUTED: false
COMMIT_EXECUTED: false
```

---

## 1. Cause

G-20i3 `FAIL admin uses kit supabase ref` searched `walkRelativeFiles(packageAbs).join("\n")` (relative **path names**). Kit ref `kmjqppxjdnwwrtaeqjta` lives in admin HTML bodies, not filenames.

## 2. Fix

`scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs`:

- Read the five admin HTML files (`ADMIN_ROUTES`)
- Assert `kmjqppxjdnwwrtaeqjta` and `https://kmjqppxjdnwwrtaeqjta.supabase.co` in each body
- Assert `https://vsbvndwuajjhnzpohghh.supabase.co` is **not** used as backend URL
- Keep filename-join check that `vsbvndwuajjhnzpohghh` is absent from package paths
- Named assert `admin uses kit supabase ref` now inspects HTML bodies

## 3. Not changed

- Production CMS templates / Edge / Save arms
- Official production package (not regenerated)
- Original repo `~/sariswing-astro`

## 4. Next

Operator commit (Save-completion + this verifier fix) → official `build:gosaki:production` at git-clean HEAD.
