# Gosaki production build env resolution

- **Phase:** `gosaki-production-build-env-resolution`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `7cc2f72447622fa0eafed0238110acbe34324857` (docs-only vs package `b3ad1ebd`)
- **Status:** **READ-ONLY PASS**
- **Rebuild this phase:** **not executed**

**Forbidden this phase (honored):** code change · Secrets · DB write · Edge deploy · FTP · commit · push · key values printed.

---

## 0. Gates

```txt
BUILD_ENV_RESOLUTION_RESULT: PASS
ENV_SOURCE: worktree tools/static-to-astro/.env.local (PUBLIC_* keys only)
LOADER_READS: worktree REPO_ROOT/.env then REPO_ROOT/.env.local then process.env
WORKTREE_ROOT_ENV_FILES: absent
CWD_CHANGES_FILE_LOADING: false
EXISTING_PACKAGE_INTACT: true
READY_TO_REBUILD: true
REBUILD_EXECUTED: false
```

---

## 1. Why preflight STOP’d

`createGosakiResolveBuildEnv` → `loadGosakiStagingAdminPublicEnv()` (`scripts/lib/gosaki-staging-admin-public-env.mjs`).

Load order (CWD-independent):

1. `<git-root>/.env`
2. `<git-root>/.env.local`
3. `process.env`

Anon key = `PUBLIC_SUPABASE_ANON_KEY` or fallback `SUPABASE_ANON_KEY`. No default.

`PUBLIC_SUPABASE_URL` **does** default to hardcoded kmjq (`STAGING_SUPABASE_URL`). That is why the STOP was **anon key missing**, not URL missing.

Live loader in this worktree (tools CWD, no extra env):

| Key | Presence |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | SET (hardcoded kmjq fallback) |
| `PUBLIC_SUPABASE_ANON_KEY` | **UNSET** |
| YouTube dry-run endpoint | SET (hardcoded default) |

Worktree git-root `.env` / `.env.local`: **absent** (worktree does not inherit untracked root env files).

---

## 2. Where the previous successful generate got the key

Official package at `2026-09-22T07:25:32.287Z` (`sourceCommit=b3ad1ebd`) ran from Cursor Shell with inherited `process.env`.

This loader **never** reads `tools/static-to-astro/.env.local`.

Most likely prior supply:

- Cursor workspace includes original `~/sariswing-astro`
- original `~/sariswing-astro/.env.local` has `PUBLIC_SUPABASE_ANON_KEY` and URL host **kmjq**
- that process.env satisfied the worktree loader even with empty worktree root env files

Do **not** reuse original `~/sariswing-astro/.env` — URL host is **vsbvnd** (production STOP). `.env.local` overrides `.env` when both are loaded; `.env` alone would fail closed.

This session’s `process.env` does **not** have the anon key (so a bare `npm run build:gosaki:production` would STOP the same way).

---

## 3. Canonical env source for this worktree

| Role | Path | Notes |
| --- | --- | --- |
| Loader intended files | worktree `<git-root>/.env` then `.env.local` | **missing** |
| Operator file that actually has the keys | `tools/static-to-astro/.env.local` | kmjq URL · `PUBLIC_SUPABASE_ANON_KEY` present · **not auto-loaded** |
| npm script | `tools/static-to-astro/package.json` → `build:gosaki:production` | no dotenv |
| Wrapper | none | |

URL host in worktree `tools/static-to-astro/.env.local`: `kmjqppxjdnwwrtaeqjta.supabase.co` (not vsbvnd). Anon key is not `service_role`.

That file also contains `SUPABASE_SERVICE_ROLE_KEY`. **Do not `source` the whole file.** Export only the two public keys.

---

## 4. CWD: repo root vs `tools/static-to-astro`

| Effect | Changes with CWD? |
| --- | --- |
| Which `.env` files the package preflight reads | **No** (absolute `REPO_ROOT`) |
| Whether `tools/.../.env.local` is loaded | **No** (never) |
| Whether `npm run build:gosaki:production` exists | **Yes** — script is only in `tools/static-to-astro`. Repo-root `package.json` has no such script |

Run the npm script from `tools/static-to-astro`. Still export public keys first.

---

## 5. Existing package integrity

Preflight throws **before** git-clean, mutex, and stale relocate. A missing-anon STOP cannot rewrite `public-dist/`.

| Check | Result |
| --- | --- |
| `generatedAt` / mtime | `2026-09-22T07:25:32.287Z` (unchanged) |
| `sourceCommit` | `b3ad1ebd97ebc85b5893a46ad301372021415788` |
| `fileCount` | **53** |
| Schedule Save arm in baked HTML | `data-gosaki-schedule-save-armed="false"` |
| Other module arms | all `"false"` |
| New stale backup from this failure | **none** (last stale is the successful generate relocate `2026-09-22T07-24-48-614Z-b3ad1eb`) |

**EXISTING_PACKAGE_INTACT: true**

---

## 6. Exact safe command (UI arm kept · rebuild not run here)

Git is currently clean at `7cc2f724` (docs-only vs `b3ad1ebd`). Mutex: Schedule flag only.

```bash
cd /Users/toyamayusuke/sariswing-astro-gosaki-prestage/tools/static-to-astro

# Export public keys only — do not source the whole .env.local
while IFS= read -r line; do
  case "$line" in
    PUBLIC_SUPABASE_URL=*|PUBLIC_SUPABASE_ANON_KEY=*) export "$line" ;;
  esac
done < .env.local

PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=true npm run build:gosaki:production
```

Do **not**:

- `source .env.local` (would inject `SUPABASE_SERVICE_ROLE_KEY`)
- copy original `~/sariswing-astro/.env` into the worktree (vsbvnd)
- arm Discography / YouTube / About
- omit `--` other modules
- run FTP `--apply`

After generate: confirm mutex `armedCount=1` / `gosaki-schedule` only, then FileZilla `public-dist/` contents. Edge Secret is a **separate** step.

---

## 7. READY_TO_REBUILD

```txt
READY_TO_REBUILD: true
reason: anon key exists in worktree tools .env.local (kmjq) · git clean · package intact
not_executed: this phase read-only
```
